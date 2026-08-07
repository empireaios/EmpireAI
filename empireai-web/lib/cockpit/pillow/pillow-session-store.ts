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
  artifacts?: import("@/lib/pillow/types").PillowChatArtifact[];
};

export type PillowSessionSnapshot = {
  turns: PillowConversationTurn[];
  lastScreenPath: string;
  updatedAt: string;
  /** Host session id from /api/pillow/session — enables server-side conversation memory */
  hostSessionId?: string;
};

/** Pillow Operating Shell viewing modes (UI-only). */
export type PillowViewMode = "dock" | "float" | "workspace";

export type PillowFloatGeometry = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type PillowPanelPreferences = {
  expanded: boolean;
  widthPx: number;
  voiceEnabled: boolean;
  /**
   * @deprecated Prefer `viewMode`. Kept for backward compatibility —
   * `true` maps to `workspace` when `viewMode` is absent.
   */
  workspaceMode?: boolean;
  /** Canonical viewing mode: docked panel, floating window, or full workspace. */
  viewMode?: PillowViewMode;
  /** Mode to restore when collapsing from workspace (dock or float). */
  previousViewMode?: Exclude<PillowViewMode, "workspace">;
  /** Floating window geometry (viewport pixels). Clamped on load. */
  float?: PillowFloatGeometry;
};

export const PILLOW_DOCK_WIDTH_MIN = 360;
export const PILLOW_DOCK_WIDTH_MAX = 960;
export const PILLOW_FLOAT_WIDTH_MIN = 360;
export const PILLOW_FLOAT_HEIGHT_MIN = 320;
export const PILLOW_FLOAT_WIDTH_DEFAULT = 520;
export const PILLOW_FLOAT_HEIGHT_DEFAULT = 640;

const DEFAULT_PANEL: PillowPanelPreferences = {
  expanded: true,
  widthPx: 560,
  voiceEnabled: false,
  workspaceMode: false,
  viewMode: "dock",
  previousViewMode: "dock",
};

export function clampPillowDockWidth(widthPx: number): number {
  return Math.max(
    PILLOW_DOCK_WIDTH_MIN,
    Math.min(PILLOW_DOCK_WIDTH_MAX, Number(widthPx) || DEFAULT_PANEL.widthPx),
  );
}

export function resolvePillowViewMode(
  prefs: Pick<PillowPanelPreferences, "viewMode" | "workspaceMode">,
): PillowViewMode {
  if (prefs.viewMode === "dock" || prefs.viewMode === "float" || prefs.viewMode === "workspace") {
    return prefs.viewMode;
  }
  return prefs.workspaceMode ? "workspace" : "dock";
}

/** Keep floating window fully visible inside the browser viewport. */
export function clampPillowFloatGeometry(
  geometry: PillowFloatGeometry,
  viewport: { width: number; height: number } = {
    width: typeof window !== "undefined" ? window.innerWidth : 1280,
    height: typeof window !== "undefined" ? window.innerHeight : 800,
  },
): PillowFloatGeometry {
  const maxWidth = Math.max(PILLOW_FLOAT_WIDTH_MIN, viewport.width - 16);
  const maxHeight = Math.max(PILLOW_FLOAT_HEIGHT_MIN, viewport.height - 16);
  const width = Math.max(
    PILLOW_FLOAT_WIDTH_MIN,
    Math.min(maxWidth, Number(geometry.width) || PILLOW_FLOAT_WIDTH_DEFAULT),
  );
  const height = Math.max(
    PILLOW_FLOAT_HEIGHT_MIN,
    Math.min(maxHeight, Number(geometry.height) || PILLOW_FLOAT_HEIGHT_DEFAULT),
  );
  const x = Math.max(0, Math.min(viewport.width - width, Number(geometry.x) || 0));
  const y = Math.max(0, Math.min(viewport.height - height, Number(geometry.y) || 0));
  return { x, y, width, height };
}

export function defaultPillowFloatGeometry(
  viewport: { width: number; height: number } = {
    width: typeof window !== "undefined" ? window.innerWidth : 1280,
    height: typeof window !== "undefined" ? window.innerHeight : 800,
  },
): PillowFloatGeometry {
  const width = Math.min(PILLOW_FLOAT_WIDTH_DEFAULT, Math.max(PILLOW_FLOAT_WIDTH_MIN, viewport.width - 48));
  const height = Math.min(
    PILLOW_FLOAT_HEIGHT_DEFAULT,
    Math.max(PILLOW_FLOAT_HEIGHT_MIN, viewport.height - 48),
  );
  return clampPillowFloatGeometry(
    {
      x: Math.max(24, viewport.width - width - 24),
      y: Math.max(24, Math.round((viewport.height - height) / 2)),
      width,
      height,
    },
    viewport,
  );
}

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
    const parsed = { ...DEFAULT_PANEL, ...(JSON.parse(raw) as Partial<PillowPanelPreferences>) };
    const viewMode = resolvePillowViewMode(parsed);
    const previousViewMode =
      parsed.previousViewMode === "float" || parsed.previousViewMode === "dock"
        ? parsed.previousViewMode
        : "dock";
    const float = parsed.float
      ? clampPillowFloatGeometry(parsed.float)
      : defaultPillowFloatGeometry();
    return {
      ...parsed,
      widthPx: clampPillowDockWidth(Number(parsed.widthPx) || DEFAULT_PANEL.widthPx),
      workspaceMode: viewMode === "workspace",
      viewMode,
      previousViewMode,
      float,
    };
  } catch {
    return DEFAULT_PANEL;
  }
}

export function savePillowPanelPreferences(prefs: PillowPanelPreferences): void {
  if (typeof window === "undefined") return;
  const viewMode = resolvePillowViewMode(prefs);
  const next: PillowPanelPreferences = {
    ...prefs,
    viewMode,
    workspaceMode: viewMode === "workspace",
    widthPx: clampPillowDockWidth(prefs.widthPx),
    float: prefs.float ? clampPillowFloatGeometry(prefs.float) : undefined,
  };
  window.localStorage.setItem(PILLOW_PANEL_STATE_KEY, JSON.stringify(next));
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
