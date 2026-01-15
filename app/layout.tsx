import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { PWARegister } from "./pwa-register";
import { AuthButton } from "./auth-button";
import { Header } from "./header";
import { BackgroundImage } from "./background-image";

export const metadata: Metadata = {
  title: "PadelMatch",
  description: "Nice & alentours",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body
        style={{
          margin: 0,
          fontFamily: "system-ui",
          background: "#000",
          position: "relative",
          minHeight: "100vh",
        }}
      >
        {/* Image de fond avec overlay - chargée depuis Firebase Storage */}
        <BackgroundImage />
        {/* Contenu */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <PWARegister />
          <Header />
          <div style={{ paddingTop: 56, paddingBottom: 72 }}>{children}</div>

          <nav
            style={{
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              height: 64,
              borderTop: "1px solid #1f1f1f",
              background: "rgba(0, 0, 0, 0.9)",
              backdropFilter: "blur(10px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-evenly",
              zIndex: 100,
              padding: "0 8px",
            }}
          >
          <Link
            href="/parties"
            style={{
              color: "#fff",
              textDecoration: "none",
              fontSize: 14,
              padding: "8px 12px",
              borderRadius: 8,
            }}
          >
            🎾 Parties
          </Link>
          <Link
            href="/groupes"
            style={{
              color: "#fff",
              textDecoration: "none",
              fontSize: 14,
              padding: "8px 12px",
              borderRadius: 8,
            }}
          >
            👥 Groupes
          </Link>
          <Link
            href="/joueurs"
            style={{
              color: "#fff",
              textDecoration: "none",
              fontSize: 14,
              padding: "8px 12px",
              borderRadius: 8,
            }}
          >
            🎯 Joueurs
          </Link>
          <Link
            href="/profil"
            style={{
              color: "#fff",
              textDecoration: "none",
              fontSize: 14,
              padding: "8px 12px",
              borderRadius: 8,
            }}
          >
            🙂 Profil
          </Link>
          </nav>
        </div>
      </body>
    </html>
  );
}
