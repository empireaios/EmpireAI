/**
 * Pillow operating shell — conversation persistence (frontend only, no secrets).
 */

export const PILLOW_SESSION_STORAGE_KEY = "empireai:pillow:session:v1" as const;
export const PILLOW_PANEL_STATE_KEY = "empireai:pillow:panel:v1" as const;

export type PillowConversationTurn = {
  id: string;
  role: "grand-king" | "pillow";
  content: string;
  screenPath: string;
  recordedAt: string;
};

export type PillowSessionSnapshot = {
  turns: PillowConversationTurn[];
  lastScreenPath: string;
  updatedAt: string;
  /** Host session id from /api/pillow/session — enables server-side conversation memory */
  hostSessionId?: string;
};

export type PillowPanelPreferences = {
  expanded: boolean;
  widthPx: number;
  voiceEnabled: boolean;
};

const DEFAULT_PANEL: PillowPanelPreferences = {
  expanded: true,
  widthPx: 420,
  voiceEnabled: false,
};

export function loadPillowSession(): PillowSessionSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PILLOW_SESSION_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PillowSessionSnapshot;
  } catch {
    return null;
  }
}

export function savePillowSession(snapshot: PillowSessionSnapshot): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PILLOW_SESSION_STORAGE_KEY, JSON.stringify(snapshot));
}

export function clearPillowHostSession(): void {
  const session = loadPillowSession();
  if (!session) return;
  savePillowSession({ ...session, hostSessionId: undefined });
}

export function loadPillowPanelPreferences(): PillowPanelPreferences {
  if (typeof window === "undefined") return DEFAULT_PANEL;
  try {
    const raw = window.localStorage.getItem(PILLOW_PANEL_STATE_KEY);
    if (!raw) return DEFAULT_PANEL;
    return { ...DEFAULT_PANEL, ...(JSON.parse(raw) as Partial<PillowPanelPreferences>) };
  } catch {
    return DEFAULT_PANEL;
  }
}

export function savePillowPanelPreferences(prefs: PillowPanelPreferences): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PILLOW_PANEL_STATE_KEY, JSON.stringify(prefs));
}

export function appendPillowTurn(
  session: PillowSessionSnapshot | null,
  turn: Omit<PillowConversationTurn, "id" | "recordedAt">,
): PillowSessionSnapshot {
  const base: PillowSessionSnapshot = session ?? {
    turns: [],
    lastScreenPath: turn.screenPath,
    updatedAt: new Date().toISOString(),
  };
  const next: PillowSessionSnapshot = {
    ...base,
    lastScreenPath: turn.screenPath,
    updatedAt: new Date().toISOString(),
    turns: [
      ...base.turns,
      {
        ...turn,
        id: `turn-${base.turns.length + 1}-${Date.now()}`,
        recordedAt: new Date().toISOString(),
      },
    ].slice(-200),
  };
  savePillowSession(next);
  return next;
}
