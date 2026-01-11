"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

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

  function handleLogout() {
    if (confirm("Êtes-vous sûr de vouloir vous déconnecter ?")) {
      localStorage.removeItem(PROFIL_KEY);
      setIsLoggedIn(false);
      router.push("/");
      router.refresh();
    }
  }

  function handleLogin() {
    router.push("/");
  }

  // Ne pas afficher sur la page d'accueil
  if (pathname === "/") {
    return null;
  }

  if (isLoggedIn) {
    return (
      <button
        onClick={handleLogout}
        style={{
          padding: "8px 12px",
          borderRadius: 8,
          border: "1px solid #2a2a2a",
          background: "transparent",
          color: "#ef4444",
          fontSize: 13,
          cursor: "pointer",
          fontWeight: 500,
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
        padding: "8px 12px",
        borderRadius: 8,
        border: "1px solid #2a2a2a",
        background: "transparent",
        color: "#10b981",
        fontSize: 13,
        cursor: "pointer",
        fontWeight: 500,
      }}
    >
      🔑 Login
    </button>
  );
}
