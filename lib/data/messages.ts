// Data Access Layer pour les Messages (chat)
// Séparation logique UI / logique data

import type { Message } from "../types";
import { STORAGE_KEYS, loadFromStorage, saveToStorage } from "./storage";

export function loadMessages(partieId: string): Message[] {
  try {
    const raw = loadFromStorage<Record<string, Message[]>>(STORAGE_KEYS.messages, {});
    return raw[partieId] ?? [];
  } catch {
    return [];
  }
}

export function saveMessage(partieId: string, message: Message): void {
  try {
    const allMessages = loadFromStorage<Record<string, Message[]>>(STORAGE_KEYS.messages, {});
    if (!allMessages[partieId]) {
      allMessages[partieId] = [];
    }
    allMessages[partieId] = [...allMessages[partieId], message];
    saveToStorage(STORAGE_KEYS.messages, allMessages);
  } catch (error) {
    console.error("Erreur lors de la sauvegarde du message:", error);
  }
}

export function createMessage(
  partieId: string,
  pseudo: string,
  contenu: string
): Message {
  const newMessage: Message = {
    id: crypto.randomUUID(),
    partieId,
    pseudo,
    contenu: contenu.trim(),
    createdAt: Date.now(),
  };
  saveMessage(partieId, newMessage);
  return newMessage;
}

// TODO: Migration backend - remplacer par Firebase Firestore / Supabase Realtime
// export async function loadMessagesFromBackend(partieId: string): Promise<Message[]>
// export async function sendMessageToBackend(partieId: string, message: Omit<Message, "id" | "createdAt">): Promise<Message>
// export async function subscribeToMessages(partieId: string, callback: (messages: Message[]) => void): Promise<() => void>
