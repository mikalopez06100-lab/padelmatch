// Utilitaire pour les notifications PWA

export function showNotification(title: string, options?: NotificationOptions) {
  if (typeof window === "undefined") return;

  if ("Notification" in window) {
    if (Notification.permission === "granted") {
      new Notification(title, {
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        ...options,
      });
    } else if (Notification.permission === "default") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          new Notification(title, {
            icon: "/favicon.ico",
            badge: "/favicon.ico",
            ...options,
          });
        }
      });
    }
  }
}

export function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return Promise.resolve("denied");
  }

  if (Notification.permission !== "default") {
    return Promise.resolve(Notification.permission);
  }

  return Notification.requestPermission();
}
