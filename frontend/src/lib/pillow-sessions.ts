export interface PillowLocalSession {
  id: string;
  label: string;
  bookmarked: boolean;
  createdAt: string;
  lastActiveAt: string;
}

const STORAGE_KEY = "empireai:pillow:sessions";

function readAll(): Record<string, PillowLocalSession[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, PillowLocalSession[]>) : {};
  } catch {
    return {};
  }
}

function writeAll(data: Record<string, PillowLocalSession[]>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function listLocalSessions(workspaceId: string): PillowLocalSession[] {
  return readAll()[workspaceId] ?? [];
}

export function upsertLocalSession(workspaceId: string, session: PillowLocalSession) {
  const all = readAll();
  const list = all[workspaceId] ?? [];
  const idx = list.findIndex((entry) => entry.id === session.id);
  if (idx >= 0) list[idx] = session;
  else list.unshift(session);
  all[workspaceId] = list.slice(0, 20);
  writeAll(all);
}

export function removeLocalSession(workspaceId: string, sessionId: string) {
  const all = readAll();
  all[workspaceId] = (all[workspaceId] ?? []).filter((entry) => entry.id !== sessionId);
  writeAll(all);
}

export function toggleBookmark(workspaceId: string, sessionId: string) {
  const all = readAll();
  const list = all[workspaceId] ?? [];
  const entry = list.find((item) => item.id === sessionId);
  if (entry) entry.bookmarked = !entry.bookmarked;
  writeAll(all);
  return entry;
}

export function searchLocalSessions(workspaceId: string, query: string): PillowLocalSession[] {
  const q = query.trim().toLowerCase();
  if (!q) return listLocalSessions(workspaceId);
  return listLocalSessions(workspaceId).filter((session) =>
    session.label.toLowerCase().includes(q),
  );
}
