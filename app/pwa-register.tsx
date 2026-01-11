"use client";

import { useEffect } from "react";

export function PWARegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Ajouter le manifest
    const manifestLink = document.createElement("link");
    manifestLink.rel = "manifest";
    manifestLink.href = "/manifest.json";
    document.head.appendChild(manifestLink);

    // Meta tags pour PWA
    const metaThemeColor = document.createElement("meta");
    metaThemeColor.name = "theme-color";
    metaThemeColor.content = "#000000";
    document.head.appendChild(metaThemeColor);

    const metaAppleCapable = document.createElement("meta");
    metaAppleCapable.name = "apple-mobile-web-app-capable";
    metaAppleCapable.content = "yes";
    document.head.appendChild(metaAppleCapable);

    const metaAppleStatusBar = document.createElement("meta");
    metaAppleStatusBar.name = "apple-mobile-web-app-status-bar-style";
    metaAppleStatusBar.content = "black-translucent";
    document.head.appendChild(metaAppleStatusBar);

    const metaAppleTitle = document.createElement("meta");
    metaAppleTitle.name = "apple-mobile-web-app-title";
    metaAppleTitle.content = "PadelMatch";
    document.head.appendChild(metaAppleTitle);

    // Service Worker
    if ("serviceWorker" in navigator) {
      // Demander la permission pour les notifications
      if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission().catch(() => {
          // Ignore si l'utilisateur refuse
        });
      }

      // Enregistrer le service worker
      const registerSW = () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            console.log("Service Worker enregistré avec succès:", registration.scope);
          })
          .catch((error) => {
            console.log("Échec de l'enregistrement du Service Worker:", error);
          });
      };

      if (document.readyState === "loading") {
        window.addEventListener("load", registerSW);
      } else {
        registerSW();
      }
    }
  }, []);

  return null;
}
