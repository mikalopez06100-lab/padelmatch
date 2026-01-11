// Data Access Layer pour les Blocks (soft block)
// Séparation logique UI / logique data

import { STORAGE_KEYS, loadFromStorage, saveToStorage } from "./storage";

export function loadBlocks(): string[] {
  try {
    const blocks = loadFromStorage<string[]>(STORAGE_KEYS.blocks, []);
    return Array.isArray(blocks) ? blocks.map((p) => String(p)) : [];
  } catch {
    return [];
  }
}

export function saveBlocks(blocks: string[]): void {
  saveToStorage(STORAGE_KEYS.blocks, blocks);
}

export function addBlock(pseudo: string): void {
  const blocks = loadBlocks();
  if (!blocks.includes(pseudo)) {
    saveBlocks([...blocks, pseudo]);
  }
}

export function removeBlock(pseudo: string): void {
  const blocks = loadBlocks();
  saveBlocks(blocks.filter((p) => p !== pseudo));
}

export function isBlocked(pseudo: string): boolean {
  const blocks = loadBlocks();
  return blocks.includes(pseudo);
}

// TODO: Migration backend - remplacer par Firebase Firestore / Supabase
// export async function loadBlocksFromBackend(userId: string): Promise<string[]>
// export async function addBlockInBackend(userId: string, blockedPseudo: string): Promise<void>
// export async function removeBlockFromBackend(userId: string, blockedPseudo: string): Promise<void>
