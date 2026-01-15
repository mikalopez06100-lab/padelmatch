"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { formatDateLong, formatTimeShort } from "../../utils/date";
import { loadProfilsGlobaux, getProfilGlobalByPseudo } from "@/lib/data/profils-globaux";
import type { ProfilGlobal } from "@/lib/data/profils-globaux";
import { loadTerrains, type Terrain } from "@/lib/data/terrains";
import { loadGroupes, getGroupeById } from "@/lib/data/groupes";
import type { Groupe } from "@/lib/types";
import { showNotification } from "../../utils/notifications";
import { subscribeToParties, updatePartie as updatePartieFirestore, sendMessage as sendMessageFirestore, getMessages as getMessagesFirestore, subscribeToMessages } from "@/lib/firebase/firestore";

type Participant = {
  pseudo: string;
  role: "organisateur" | "joueur";
};

type Partie = {
  id: string;
  groupeId: string;
  groupeNom: string;
  zone: string;
  dateISO: string;
  format: "Amical" | "Compétitif" | "Mixte";
  placesTotal: number;
  terrainId?: string;
  organisateurPseudo: string;
  participants: Participant[];
  ouverteCommunaute: boolean;
  demandes: {
    pseudo: string;
    createdAt: number;
  }[];
  createdAt: number;
};

type Message = {
  id: string;
  partieId: string;
  pseudo: string;
  contenu: string;
  createdAt: number;
};

const PARTIES_KEY = "padelmatch_parties_v1";
const PROFIL_KEY = "padelmatch_profil_v1";
const MESSAGES_KEY = "padelmatch_messages_v1";

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getMonPseudo(): string {
  try {
    const raw = localStorage.getItem(PROFIL_KEY);
    if (!raw) return "Joueur";
    const parsed = JSON.parse(raw);
    const pseudo = String(parsed?.pseudo ?? "").trim();
    return pseudo.length >= 2 ? pseudo : "Joueur";
  } catch {
    return "Joueur";
  }
}

function loadMessages(partieId: string): Message[] {
  try {
    const raw = localStorage.getItem(MESSAGES_KEY);
    if (!raw) return [];
    const allMessages = JSON.parse(raw) as Record<string, Message[]>;
    return allMessages[partieId] ?? [];
  } catch {
    return [];
  }
}

function saveMessage(partieId: string, message: Message) {
  try {
    const raw = localStorage.getItem(MESSAGES_KEY);
    const allMessages: Record<string, Message[]> = raw ? JSON.parse(raw) : {};
    if (!allMessages[partieId]) {
      allMessages[partieId] = [];
    }
    allMessages[partieId] = [...allMessages[partieId], message];
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(allMessages));
  } catch {
    // Ignore errors
  }
}

function getInitials(pseudo: string): string {
  return pseudo
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getAvatarColor(pseudo: string): string {
  const colors = [
    "#10b981", // green
    "#3b82f6", // blue
    "#8b5cf6", // purple
    "#f59e0b", // amber
    "#ef4444", // red
    "#ec4899", // pink
    "#06b6d4", // cyan
    "#84cc16", // lime
  ];
  const hash = pseudo.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

export default function MatchPage() {
  const params = useParams();
  const router = useRouter();
  const matchId = params.id as string;

  const [partie, setPartie] = useState<Partie | null>(null);
  const [isParticipant, setIsParticipant] = useState(false);
  const [isOrganisateur, setIsOrganisateur] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState("");
  const [profilsGlobaux, setProfilsGlobaux] = useState<ProfilGlobal[]>([]);
  const [terrains, setTerrains] = useState<Terrain[]>([]);
  const [groupes, setGroupes] = useState<Groupe[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const partiePrecedenteRef = useRef<Partie | null>(null);

  useEffect(() => {
    const parties = load<Partie[]>(PARTIES_KEY, []);
    const found = parties.find((p) => p.id === matchId);

    if (!found) {
      return;
    }

    setPartie(found);
    partiePrecedenteRef.current = found;

    const monPseudo = getMonPseudo();
    const participant = found.participants.find((p) => p.pseudo === monPseudo);
    setIsParticipant(!!participant);
    setIsOrganisateur(participant?.role === "organisateur");

    // Charger les messages depuis Firestore en priorité
    async function loadMessagesFromFirestore() {
      try {
        const messagesFirestore = await getMessagesFirestore(matchId);
        if (messagesFirestore.length > 0) {
          setMessages(messagesFirestore);
          return;
        }
      } catch (error) {
        console.error("Erreur lors du chargement des messages depuis Firestore:", error);
      }
      // Fallback : charger depuis localStorage
      const loadedMessages = loadMessages(matchId);
      setMessages(loadedMessages);
    }
    loadMessagesFromFirestore();
  }, [matchId]);

  // Charger les profils globaux pour afficher les photos
  useEffect(() => {
    setProfilsGlobaux(loadProfilsGlobaux());
    // Recharger périodiquement pour avoir les dernières photos
    const interval = setInterval(() => {
      setProfilsGlobaux(loadProfilsGlobaux());
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Charger les terrains depuis Firestore
  useEffect(() => {
    async function loadTerrainsFromFirestore() {
      try {
        const terrainsData = await loadTerrains();
        setTerrains(terrainsData);
      } catch (error) {
        console.error("Erreur lors du chargement des terrains:", error);
      }
    }
    loadTerrainsFromFirestore();
  }, []);

  // Charger les groupes pour vérifier l'appartenance
  useEffect(() => {
    const groupesData = loadGroupes();
    setGroupes(groupesData);
  }, []);

  // S'abonner aux changements Firestore pour détecter les nouvelles participations
  useEffect(() => {
    const monPseudo = getMonPseudo();
    
    const unsubscribe = subscribeToParties((partiesFirestore) => {
      const partieFirestore = partiesFirestore.find((p: any) => p.id === matchId);
      if (!partieFirestore) return;

      const partiePrecedente = partiePrecedenteRef.current;
      if (!partiePrecedente) {
        // Première fois - initialiser la référence
        const partieMiseAJour: Partie = {
          id: matchId,
          groupeId: String(partieFirestore.groupeId ?? ""),
          groupeNom: String(partieFirestore.groupeNom ?? "Groupe"),
          zone: String(partieFirestore.zone ?? "Nice"),
          dateISO: String(partieFirestore.dateISO ?? ""),
          format: (partieFirestore.format === "Compétitif" || partieFirestore.format === "Mixte" ? partieFirestore.format : "Amical") as any,
          placesTotal: Number(partieFirestore.placesTotal ?? 4),
          terrainId: partieFirestore.terrainId ? String(partieFirestore.terrainId) : undefined,
          organisateurPseudo: String(partieFirestore.organisateurPseudo ?? "Organisateur"),
          participants: Array.isArray(partieFirestore.participants)
            ? partieFirestore.participants.map((x: any) => ({
                pseudo: String(x?.pseudo ?? "Joueur"),
                role: (x?.role === "organisateur" ? "organisateur" : "joueur") as Participant["role"],
              }))
            : [],
          ouverteCommunaute: Boolean(partieFirestore.ouverteCommunaute ?? false),
          demandes: Array.isArray(partieFirestore.demandes)
            ? partieFirestore.demandes.map((d: any) => ({
                pseudo: String(d?.pseudo ?? "Candidat"),
                createdAt: Number(d?.createdAt ?? Date.now()),
              }))
            : [],
          createdAt: typeof partieFirestore.createdAt === "number" ? partieFirestore.createdAt : Date.now(),
        };
        partiePrecedenteRef.current = partieMiseAJour;
        return;
      }

      const participantsFirestore: Participant[] = Array.isArray(partieFirestore.participants)
        ? partieFirestore.participants.map((x: any) => ({
            pseudo: String(x?.pseudo ?? "Joueur"),
            role: (x?.role === "organisateur" ? "organisateur" : "joueur") as Participant["role"],
          }))
        : [];

      // Vérifier si l'utilisateur a été ajouté comme participant
      const etaitParticipant = partiePrecedente.participants.some((pp) => pp.pseudo === monPseudo);
      const estMaintenantParticipant = participantsFirestore.some((pf) => pf.pseudo === monPseudo);

      if (!etaitParticipant && estMaintenantParticipant && String(partieFirestore.organisateurPseudo) !== monPseudo) {
        // L'utilisateur a été accepté - notifier le joueur
        showNotification("✅ Participation acceptée !", {
          body: `Vous avez été accepté dans ${String(partieFirestore.groupeNom ?? "la partie")}`,
          tag: `accepte-${matchId}-${monPseudo}`,
        });
      }
      
      // Mettre à jour la référence
      const partieMiseAJour: Partie = {
        ...partiePrecedente,
        participants: participantsFirestore,
        demandes: Array.isArray(partieFirestore.demandes)
          ? partieFirestore.demandes.map((d: any) => ({
              pseudo: String(d?.pseudo ?? "Candidat"),
              createdAt: Number(d?.createdAt ?? Date.now()),
            }))
          : [],
      };
      partiePrecedenteRef.current = partieMiseAJour;
      
      // Mettre à jour l'état si la partie est chargée
      if (partie) {
        setPartie(partieMiseAJour);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [matchId, partie]);

  // S'abonner aux messages en temps réel depuis Firestore
  useEffect(() => {
    if (!matchId) return;

    const unsubscribe = subscribeToMessages(matchId, (messagesFirestore) => {
      setMessages(messagesFirestore);
    });

    return () => {
      unsubscribe();
    };
  }, [matchId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function persistParties(updatedParties: Partie[]) {
    save(PARTIES_KEY, updatedParties);
    const found = updatedParties.find((p) => p.id === matchId);
    if (found) {
      setPartie(found);
    }
  }

  function annulerPartie() {
    if (!partie || !isOrganisateur) return;
    if (!confirm("Es-tu sûr de vouloir annuler cette partie ? Cette action est irréversible.")) {
      return;
    }

    const parties = load<Partie[]>(PARTIES_KEY, []);
    const updated = parties.filter((p) => p.id !== matchId);
    persistParties(updated);
    router.push("/parties");
  }

  function quitterPartie() {
    if (!partie || isOrganisateur) {
      alert("L'organisateur ne peut pas quitter la partie. Annule-la si nécessaire.");
      return;
    }

    if (!confirm("Es-tu sûr de vouloir quitter cette partie ?")) {
      return;
    }

    const monPseudo = getMonPseudo();
    const parties = load<Partie[]>(PARTIES_KEY, []);
    const updated = parties.map((p) => {
      if (p.id !== matchId) return p;
      return {
        ...p,
        participants: p.participants.filter((x) => x.pseudo !== monPseudo),
      };
    });
    persistParties(updated);
    router.push("/parties");
  }

  async function envoyerMessage() {
    if (!messageText.trim() || !partie) return;

    const monPseudo = getMonPseudo();
    const contenuMessage = messageText.trim();
    
    // Réinitialiser le champ immédiatement pour une meilleure UX
    setMessageText("");

    // Créer le message temporairement pour affichage optimiste
    const tempMessage: Message = {
      id: "temp-" + Date.now(),
      partieId: matchId,
      pseudo: monPseudo,
      contenu: contenuMessage,
      createdAt: Date.now(),
    };

    // Ajouter le message optimistiquement
    setMessages((prev) => [...prev, tempMessage]);

    try {
      // Sauvegarder dans Firestore
      const messageId = await sendMessageFirestore({
        partieId: matchId,
        pseudo: monPseudo,
        contenu: contenuMessage,
      });
      console.log("✅ Message envoyé dans Firestore avec l'ID:", messageId);
      
      // Le message sera automatiquement mis à jour par subscribeToMessages
      // Retirer le message temporaire si nécessaire
      setMessages((prev) => prev.filter((m) => m.id !== tempMessage.id));
    } catch (error: any) {
      console.error("❌ Erreur lors de l'envoi du message dans Firestore:", error);
      
      // Fallback : sauvegarder dans localStorage si Firestore échoue
      const fallbackMessage: Message = {
        id: crypto.randomUUID(),
        partieId: matchId,
        pseudo: monPseudo,
        contenu: contenuMessage,
        createdAt: Date.now(),
      };
      saveMessage(matchId, fallbackMessage);
      
      // Retirer le message temporaire et ajouter le message de fallback
      setMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== tempMessage.id);
        return [...filtered, fallbackMessage];
      });
      
      alert("Erreur lors de l'envoi du message. Le message a été sauvegardé localement.");
    }
  }

  async function acceptRequest(pseudo: string) {
    if (!partie) return;

    const monPseudo = getMonPseudo();
    const parties = load<Partie[]>(PARTIES_KEY, []);
    const updated = parties.map((p) => {
      if (p.id !== matchId) return p;
      if (p.participants.length >= p.placesTotal) return p;

      const demandes = p.demandes.filter((d) => d.pseudo !== pseudo);
      const participants = [...p.participants, { pseudo, role: "joueur" as const }];

      return { ...p, demandes, participants };
    });
    
    // Notifier le joueur que sa demande a été acceptée
    const partieModifiee = updated.find((p) => p.id === matchId);
    if (partieModifiee && pseudo === monPseudo) {
      // Le joueur accepté reçoit une notification
      showNotification("✅ Participation acceptée !", {
        body: `Vous avez été accepté dans ${partie.groupeNom}`,
        tag: `accepte-${matchId}-${pseudo}`,
      });
    } else if (partieModifiee) {
      // L'organisateur reçoit une confirmation
      showNotification("✅ Joueur accepté", {
        body: `${pseudo} a rejoint ${partie.groupeNom}`,
        tag: `accept-${matchId}-${pseudo}`,
      });
    }
    
    persistParties(updated);

    // Sauvegarder dans Firestore pour que subscribeToParties détecte le changement
    if (partieModifiee) {
      try {
        await updatePartieFirestore(matchId, {
          demandes: partieModifiee.demandes,
          participants: partieModifiee.participants,
        });
      } catch (error) {
        console.error("Erreur lors de la sauvegarde dans Firestore:", error);
      }
    }
  }

  function requestJoin() {
    if (!partie) return;

    const monPseudo = getMonPseudo();
    
    // Vérifier si l'utilisateur peut rejoindre :
    // 1. Si la partie est ouverte à la communauté
    // 2. OU si l'utilisateur fait partie du groupe du match
    const peutRejoindre = partie.ouverteCommunaute || (() => {
      const groupe = getGroupeById(partie.groupeId);
      return groupe?.membres?.includes(monPseudo) ?? false;
    })();

    if (!peutRejoindre) {
      alert("Vous ne pouvez pas rejoindre ce match. Vous devez faire partie du groupe ou le match doit être ouvert à la communauté.");
      return;
    }

    const parties = load<Partie[]>(PARTIES_KEY, []);
    const partieAvant = parties.find((p) => p.id === matchId);
    const avaitDejaDemande = partieAvant?.demandes.some((d) => d.pseudo === monPseudo);
    
    const updated = parties.map((p) => {
      if (p.id !== matchId) return p;
      if (p.participants.length >= p.placesTotal) return p;
      if (p.participants.some((x) => x.pseudo === monPseudo)) return p;
      if (p.demandes.some((d) => d.pseudo === monPseudo)) return p;

      return { ...p, demandes: [...p.demandes, { pseudo: monPseudo, createdAt: Date.now() }] };
    });
    
    // Vérifier si la demande a été ajoutée et afficher une confirmation
    const partieModifiee = updated.find((p) => p.id === matchId);
    const demandeAjoutee = partieModifiee && partieModifiee.demandes.some((d) => d.pseudo === monPseudo);
    
    if (demandeAjoutee && !avaitDejaDemande && partieModifiee) {
      alert("✅ Demande envoyée ! L'organisateur va valider votre participation.");
      // La notification à l'organisateur sera gérée par subscribeToParties dans parties/page.tsx
    }
    
    persistParties(updated);
  }

  if (!partie) {
    return (
      <div style={{ padding: 24, background: "transparent", minHeight: "100vh", color: "#fff" }}>
        <h1 style={{ fontSize: 22, marginBottom: 8 }}>🎾 Partie introuvable</h1>
        <p style={{ opacity: 0.7 }}>Cette partie n'existe pas ou a été supprimée.</p>
        <button
          onClick={() => router.push("/parties")}
          style={{
            marginTop: 16,
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid #333",
            background: "#10b981",
            color: "white",
          }}
        >
          Retour aux parties
        </button>
      </div>
    );
  }

  const monPseudo = getMonPseudo();
  const participant = partie.participants.find((p) => p.pseudo === monPseudo);
  const inscrits = partie.participants.length;
  const manque = Math.max(0, partie.placesTotal - inscrits);
  const complete = manque === 0;

  // Si la partie est complète, seuls les participants peuvent y accéder
  if (complete && !participant) {
    return (
      <div style={{ padding: 24, background: "transparent", minHeight: "100vh", color: "#fff" }}>
        <h1 style={{ fontSize: 22, marginBottom: 8 }}>🔒 Accès refusé</h1>
        <p style={{ opacity: 0.7 }}>
          Cette partie est complète. Seuls les joueurs inscrits peuvent y accéder.
        </p>
        <button
          onClick={() => router.push("/parties")}
          style={{
            marginTop: 16,
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid #333",
            background: "#10b981",
            color: "white",
          }}
        >
          Retour aux parties
        </button>
      </div>
    );
  }
  const slotsLibres = Array(manque).fill(null);
  const hasDemande = partie.demandes.some((d) => d.pseudo === monPseudo);

  // Niveau simplifié (à améliorer avec vraie logique)
  const niveauAffiche = "3.0";

  return (
    <div style={{ background: "transparent", minHeight: "100vh", color: "#fff", paddingBottom: 80 }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "16px",
          borderBottom: "1px solid #1f1f1f",
        }}
      >
        <button
          onClick={() => router.push("/parties")}
          style={{
            background: "transparent",
            border: "none",
            color: "#fff",
            fontSize: 24,
            cursor: "pointer",
            padding: 0,
            marginRight: 16,
          }}
        >
          ←
        </button>
        <h1 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>Match</h1>
      </div>

      {/* Carte de détails avec image de fond */}
      <div
        style={{
          position: "relative",
          margin: "20px",
          borderRadius: 16,
          overflow: "hidden",
          background: "linear-gradient(135deg, #1a5f3f 0%, #0d3d26 100%)",
          minHeight: 200,
        }}
      >
        {/* Placeholder image de fond floutée */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              "linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.5)), url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMGE0YTI1Ii8+PGxpbmUgeDE9IjEwMCIgeTE9IjEwMCIgeDI9IjMwMCIgeTI9IjIwMCIgc3Ryb2tlPSIjMzMzIiBzdHJva2Utd2lkdGg9IjIiLz48L3N2Zz4=') center/cover",
            filter: "blur(2px)",
            opacity: 0.6,
          }}
        />

        {/* Contenu de la carte */}
        <div style={{ position: "relative", zIndex: 1, padding: 20, color: "#fff" }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
              {partie.groupeNom} • {partie.zone}
            </div>
            <div style={{ fontSize: 14, opacity: 0.9, display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span>📅</span>
              <span>{formatDateLong(partie.dateISO)}</span>
            </div>
            {partie.terrainId && (() => {
              const terrain = terrains.find(t => t.id === partie.terrainId);
              return terrain ? (
                <div style={{ fontSize: 14, opacity: 0.9, display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span>🎾</span>
                  <span>{terrain.nom} — {terrain.ville}</span>
                </div>
              ) : null;
            })()}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12 }}>
              <div
                style={{
                  background: "#10b981",
                  color: "#fff",
                  padding: "4px 12px",
                  borderRadius: 12,
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {niveauAffiche}
              </div>
              <div style={{ fontSize: 14, opacity: 0.9 }}>
                {inscrits}/{partie.placesTotal} joueurs
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Slots de joueurs */}
      <div style={{ padding: "0 16px", marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8 }}>
          {partie.participants.map((p, index) => {
            const profilParticipant = getProfilGlobalByPseudo(p.pseudo);
            const photoUrl = profilParticipant?.photoUrl;
            return (
            <div key={index} style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, minWidth: 80 }}>
              <div
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: "50%",
                  overflow: "hidden",
                  background: photoUrl ? "transparent" : getAvatarColor(p.pseudo),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: 20,
                }}
              >
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt={`Photo de ${p.pseudo}`}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  getInitials(p.pseudo)
                )}
              </div>
              <div style={{ fontSize: 12, textAlign: "center" }}>
                <Link
                  href={`/joueurs/${encodeURIComponent(p.pseudo)}`}
                  style={{
                    fontWeight: 500,
                    color: "#10b981",
                    textDecoration: "none",
                    cursor: "pointer",
                    display: "inline-block",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.textDecoration = "underline";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.textDecoration = "none";
                  }}
                >
                  {p.pseudo}
                </Link>
                <div style={{ fontSize: 11, opacity: 0.7 }}>{niveauAffiche}</div>
              </div>
            </div>
          );
          })}
          {slotsLibres.map((_, index) => (
            <div key={`libre-${index}`} style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, minWidth: 80 }}>
              <div
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: "50%",
                  background: "#1f1f1f",
                  border: "2px dashed #444",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#666",
                  fontSize: 24,
                }}
              >
                +
              </div>
              <div style={{ fontSize: 12, textAlign: "center", color: "#999" }}>Libre</div>
            </div>
          ))}
        </div>
      </div>

      {/* Barre d'action */}
      {!complete && !hasDemande && !isParticipant && (() => {
        const monPseudo = getMonPseudo();
        const peutRejoindre = partie.ouverteCommunaute || (() => {
          const groupe = getGroupeById(partie.groupeId);
          return groupe?.membres?.includes(monPseudo) ?? false;
        })();

        if (!peutRejoindre) return null;

        return (
          <div style={{ padding: "0 16px", marginBottom: 20 }}>
            <div
              style={{
                background: "#1f1f1f",
                borderRadius: 12,
                padding: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span>🕐</span>
                <span style={{ fontSize: 14, opacity: 0.9 }}>En attente de confirmation</span>
              </div>
              <button
                onClick={requestJoin}
                style={{
                  background: "#10b981",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 16px",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Se proposer
              </button>
            </div>
          </div>
        );
      })()}

      {isParticipant && (
        <div style={{ padding: "0 16px", marginBottom: 20 }}>
          <div
            style={{
              background: "#1f1f1f",
              borderRadius: 12,
              padding: 12,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span>👤</span>
            <span style={{ fontSize: 14, opacity: 0.9 }}>Participant confirmé</span>
          </div>
        </div>
      )}

      {/* Section Organisateur (demandes en attente) */}
      {isOrganisateur && partie.demandes.length > 0 && (
        <div style={{ padding: "0 16px", marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Organisateur</h2>
          <div style={{ display: "grid", gap: 12 }}>
            {partie.demandes.map((demande, index) => {
              const profilDemande = getProfilGlobalByPseudo(demande.pseudo);
              const photoUrlDemande = profilDemande?.photoUrl;
              return (
              <div
                key={index}
                style={{
                  background: "#1f1f1f",
                  borderRadius: 12,
                  padding: 16,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: "50%",
                    overflow: "hidden",
                    background: photoUrlDemande ? "transparent" : getAvatarColor(demande.pseudo),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontWeight: 600,
                    fontSize: 18,
                  }}
                >
                  {photoUrlDemande ? (
                    <img
                      src={photoUrlDemande}
                      alt={`Photo de ${demande.pseudo}`}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    getInitials(demande.pseudo)
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <Link
                    href={`/joueurs/${encodeURIComponent(demande.pseudo)}`}
                    style={{
                      fontWeight: 600,
                      marginBottom: 4,
                      color: "#10b981",
                      textDecoration: "none",
                      cursor: "pointer",
                      display: "inline-block",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.textDecoration = "underline";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.textDecoration = "none";
                    }}
                  >
                    {demande.pseudo}
                  </Link>
                  <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 4 }}>{niveauAffiche}</div>
                  <div style={{ fontSize: 13, opacity: 0.7 }}>Fiabilité: 👍👍👍</div>
                </div>
                <button
                  onClick={() => acceptRequest(demande.pseudo)}
                  style={{
                    background: "#10b981",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    padding: "8px 16px",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Valider
                </button>
              </div>
            );
            })}
          </div>
        </div>
      )}

      {/* Chat - uniquement pour les participants */}
      {isParticipant && (
        <div style={{ padding: "0 16px", marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Chat du match</h2>
        <div
          style={{
            background: "#1f1f1f",
            borderRadius: 12,
            display: "flex",
            flexDirection: "column",
            height: 300,
          }}
        >
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: 16,
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {messages.length === 0 ? (
              <div style={{ textAlign: "center", opacity: 0.5, fontSize: 14, padding: 24 }}>
                Aucun message pour l'instant. Sois le premier à écrire !
              </div>
            ) : (
              messages.map((msg) => {
                const isMoi = msg.pseudo === monPseudo;
                return (
                  <div
                    key={msg.id}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: isMoi ? "flex-end" : "flex-start",
                      gap: 4,
                    }}
                  >
                    <div
                      style={{
                        maxWidth: "70%",
                        padding: "10px 14px",
                        borderRadius: 12,
                        background: isMoi ? "#10b981" : "#2a2a2a",
                        color: "#fff",
                      }}
                    >
                      {!isMoi && (
                        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, opacity: 0.8 }}>
                          <Link
                            href={`/joueurs/${encodeURIComponent(msg.pseudo)}`}
                            style={{
                              color: "#10b981",
                              textDecoration: "none",
                              cursor: "pointer",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.textDecoration = "underline";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.textDecoration = "none";
                            }}
                          >
                            {msg.pseudo}
                          </Link>
                        </div>
                      )}
                      <div style={{ fontSize: 14, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                        {msg.contenu}
                      </div>
                    </div>
                    <div style={{ fontSize: 11, opacity: 0.5, paddingLeft: isMoi ? 0 : 4, paddingRight: isMoi ? 4 : 0 }}>
                      {formatTimeShort(msg.createdAt)}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <div
            style={{
              padding: 12,
              borderTop: "1px solid #2a2a2a",
              display: "flex",
              gap: 8,
            }}
          >
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  envoyerMessage();
                }
              }}
              placeholder="Écrire un message..."
              style={{
                flex: 1,
                minWidth: 0,
                boxSizing: "border-box",
                padding: "10px 12px",
                borderRadius: 20,
                border: "1px solid #2a2a2a",
                background: "#141414",
                color: "#fff",
                fontSize: 14,
              }}
            />
            <button
              onClick={envoyerMessage}
              disabled={!messageText.trim()}
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                border: "none",
                background: messageText.trim() ? "#10b981" : "#2a2a2a",
                color: "#fff",
                cursor: messageText.trim() ? "pointer" : "not-allowed",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
              }}
            >
              ➤
            </button>
          </div>
        </div>
        </div>
      )}
    </div>
  );
}
