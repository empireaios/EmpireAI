/**
 * Executive Home Pillow workspace layout (mission 003).
 * Page scroll is primary — avoid nested scroll prisons.
 */
export const PILLOW_WORKSPACE_LAYOUT = {
  /** Minimum useful workspace height without locking the page */
  workspaceMinVh: 70,
  /** Conversation history large but page-scroll friendly */
  messageHistoryMinVh: 48,
  messageHistoryMaxVh: 62,
  /** Composer is a strategic writing surface */
  composerMinPx: 180,
  composerMaxPx: 420,
  /** Context/guidance strip stays secondary */
  contextStripMaxVh: 10,
  /** Pillow owns content width — centres are below, not beside */
  pillowBesideCentres: false,
  /** Nested scroll must release wheel to the page at boundaries */
  overscrollBehavior: "auto" as const,
  focusEventName: "empireai:focus-pillow",
} as const;
