"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { logout as firebaseLogout, getCurrentUser, onAuthChange } from "@/lib/firebase/auth";

export function AuthButton() {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Vérifier l'état d'authentification Firebase
    const checkAuth = () => {
      const user = getCurrentUser();
      setIsLoggedIn(!!user);
    };

    // Vérifier immédiatement
    checkAuth();

    // Écouter les changements d'authentification
    const unsubscribe = onAuthChange((user) => {
      setIsLoggedIn(!!user);
    });

    return () => unsubscribe();
  }, []);

  async function handleLogout() {
    if (!confirm("Êtes-vous sûr de vouloir vous déconnecter ?")) {
      return;
    }

    try {
      // Déconnecter Firebase Auth
      await firebaseLogout();
      console.log("✅ Déconnexion Firebase réussie");
      setIsLoggedIn(false);
    } catch (error: any) {
      console.error("❌ Erreur lors de la déconnexion Firebase:", error);
    }
    
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
