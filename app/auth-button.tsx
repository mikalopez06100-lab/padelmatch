"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { logout as firebaseLogout } from "@/lib/firebase/auth";
import { STORAGE_KEYS, removeFromStorage } from "@/lib/data/storage";

const PROFIL_KEY = "padelmatch_profil_v1";

export function AuthButton() {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Vérifier si un profil est connecté
    const checkAuth = () => {
      try {
        const raw = localStorage.getItem(PROFIL_KEY);
        if (!raw) {
          setIsLoggedIn(false);
          return;
        }
        const parsed = JSON.parse(raw);
        setIsLoggedIn(!!parsed?.pseudo);
      } catch {
        setIsLoggedIn(false);
      }
    };

    checkAuth();

    // Re-vérifier périodiquement
    const interval = setInterval(checkAuth, 1000);
    return () => clearInterval(interval);
  }, []);

  async function handleLogout() {
    if (!confirm("Êtes-vous sûr de vouloir vous déconnecter ?")) {
      return;
    }

    try {
      // Déconnecter Firebase Auth
      await firebaseLogout();
      console.log("✅ Déconnexion Firebase réussie");
    } catch (error: any) {
      console.error("❌ Erreur lors de la déconnexion Firebase:", error);
      // Continuer quand même pour nettoyer le localStorage
    }

    // Nettoyer le localStorage
    removeFromStorage(STORAGE_KEYS.profil);
    localStorage.removeItem(PROFIL_KEY);
    setIsLoggedIn(false);
    
    // Rediriger vers la page d'accueil
    router.push("/");
    router.refresh();
  }

  function handleLogin() {
    router.push("/");
  }

  if (isLoggedIn) {
    return (
      <button
        onClick={handleLogout}
        style={{
          padding: "8px 16px",
          borderRadius: 8,
          border: "1px solid #2a2a2a",
          background: "transparent",
          color: "#ef4444",
          fontSize: 14,
          cursor: "pointer",
          fontWeight: 500,
          transition: "background 0.2s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "#1f1f1f";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
        }}
      >
        🚪 Logout
      </button>
    );
  }

  return (
    <button
      onClick={handleLogin}
      style={{
        padding: "8px 16px",
        borderRadius: 8,
        border: "1px solid #2a2a2a",
        background: "transparent",
        color: "#10b981",
        fontSize: 14,
        cursor: "pointer",
        fontWeight: 500,
        transition: "background 0.2s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "#1f1f1f";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
      }}
    >
      🔑 Login
    </button>
  );
}
