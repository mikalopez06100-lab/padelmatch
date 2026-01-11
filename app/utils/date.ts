// Utilitaires pour le formatage de dates

const DAYS_FR = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const MONTHS_FR = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

export function formatDateLong(dateISO: string): string {
  try {
    const date = new Date(dateISO);
    const day = DAYS_FR[date.getDay()];
    const dayNumber = date.getDate();
    const month = MONTHS_FR[date.getMonth()];
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${day} ${dayNumber} ${month} • ${hours}:${minutes}`;
  } catch {
    return dateISO;
  }
}

export function formatTimeShort(timestamp: number): string {
  const date = new Date(timestamp);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}
