/**
 * Executive Home Pillow workspace layout targets (closure 002).
 * Used by UI and regression tests — not decorative CSS only.
 */
export const PILLOW_WORKSPACE_LAYOUT = {
  /** Outer workspace uses most of the viewport */
  workspaceMinVh: 75,
  workspaceTargetVh: 88,
  /** Conversation history must be a large readable document region */
  messageHistoryMinVh: 50,
  /** Composer is a strategic writing surface */
  composerMinPx: 180,
  composerMaxPx: 420,
  /** Decision dossier when present */
  decisionMinVh: 42,
  decisionMaxVh: 58,
  /** Context/guidance strip stays secondary */
  contextStripMaxVh: 12,
  /** Pillow owns content width — centres are below, not beside */
  pillowBesideCentres: false,
  focusEventName: "empireai:focus-pillow",
} as const;
