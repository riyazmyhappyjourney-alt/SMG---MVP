// Client Favorites / Saved Properties Store
// Persisted in localStorage and synchronized with a custom window event

const FAVORITES_STORAGE_KEY = 'smg_saved_properties';

export function getFavoritePropertyIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function isFavoriteProperty(id: string): boolean {
  const ids = getFavoritePropertyIds();
  return ids.includes(id);
}

export function toggleFavoriteProperty(id: string): boolean {
  if (typeof window === 'undefined') return false;
  const current = getFavoritePropertyIds();
  const exists = current.includes(id);
  const updated = exists ? current.filter((x) => x !== id) : [...current, id];

  try {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('smg:favorites-updated', { detail: { ids: updated } }));
  } catch {
    // Ignore storage errors
  }

  return !exists;
}

export function clearAllFavorites(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(FAVORITES_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('smg:favorites-updated', { detail: { ids: [] } }));
  } catch {
    // Ignore
  }
}
