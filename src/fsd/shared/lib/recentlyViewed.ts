const RECENTLY_VIEWED_STORAGE_KEY = 'ducati-recently-viewed';
const MAX_RECENTLY_VIEWED = 12;

export function readRecentlyViewedIds(): string[] {
  try {
    const raw = window.localStorage.getItem(RECENTLY_VIEWED_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((id): id is string => typeof id === 'string');
  } catch {
    return [];
  }
}

export function recordRecentlyViewed(productId: string) {
  try {
    const ids = readRecentlyViewedIds().filter((id) => id !== productId);
    ids.unshift(productId);
    window.localStorage.setItem(
      RECENTLY_VIEWED_STORAGE_KEY,
      JSON.stringify(ids.slice(0, MAX_RECENTLY_VIEWED)),
    );
  } catch {
  }
}
