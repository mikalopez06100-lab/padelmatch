"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// ⚠️ Cette page est obsolète - L'inscription se fait maintenant sur la page d'accueil (app/page.tsx)
export default function InscriptionPage() {
  const router = useRouter();

  useEffect(() => {
    // Rediriger vers la page d'accueil qui contient login/inscription
    router.push("/");
  }, [router]);

  // Affichage pendant la redirection
  return (
    <div style={{ background: "#000", color: "#fff", minHeight: "100vh", padding: "20px", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <p style={{ color: "#fff", fontSize: 16 }}>Redirection...</p>
      </div>
    </div>
  );
}
