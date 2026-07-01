/**
 * User settings — UX-021 Empire Settings (owner: auth, settings).
 * Frontend-seeded persistence keyed by user id; ready for backend sync later.
 */

export interface UserSettings {
  displayName: string;
  updatedAt: string;
}

const STORAGE_KEY = "empire.userSettings.v1";

function storageKey(userId: string): string {
  return `${STORAGE_KEY}:${userId}`;
}

export function loadUserSettings(userId: string): UserSettings | null {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as UserSettings;
    if (typeof parsed.displayName !== "string") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveUserSettings(userId: string, settings: UserSettings): void {
  localStorage.setItem(storageKey(userId), JSON.stringify(settings));
}
