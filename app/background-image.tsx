"use client";

import { useEffect, useState } from "react";
import { getBackgroundImageUrl } from "@/lib/firebase/storage";

export function BackgroundImage() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    loadBackgroundImage();
  }, []);

  async function loadBackgroundImage() {
    try {
      const url = await getBackgroundImageUrl();
      setImageUrl(url);
    } catch (error) {
      console.error("Erreur lors du chargement de l'image de fond:", error);
    }
  }

  // Image par défaut si aucune image n'est uploadée
  const defaultImageUrl = "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80";
  const backgroundImage = imageUrl || defaultImageUrl;

  return (
    <>
      {/* Image de fond avec overlay */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 0,
          backgroundImage: `url('${backgroundImage}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundAttachment: "fixed",
          opacity: 0.5,
        }}
      />
      {/* Overlay sombre pour la lisibilité */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 0,
          background: "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.7) 100%)",
        }}
      />
    </>
  );
}
