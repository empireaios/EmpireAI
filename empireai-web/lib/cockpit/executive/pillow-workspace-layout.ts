/**
 * Executive Home Pillow workspace layout.
 * Canonical scroll owner = document/page. Nested overflow is exceptional only.
 */
export const PILLOW_WORKSPACE_LAYOUT = {
  /**
   * Workspace participates in page flow — do not lock a viewport-height prison.
   * Empty-state visual presence only (not a scroll container height).
   */
  workspaceMinPx: 320,
  /**
   * Message history is page-flow by default (no max-height scroll prison).
   * Internal history scrolling is disabled; long threads scroll with the page.
   */
  messageHistoryInternalScroll: false,
  /** Composer remains a strategic writing surface without trapping the page */
  composerMinPx: 140,
  composerMaxPx: 320,
  /** Context/guidance strip — compact; overflow only if content exceeds strip */
  contextStripMaxPx: 120,
  /** Pillow owns content width — centres are below, not beside */
  pillowBesideCentres: false,
  focusEventName: "empireai:focus-pillow",
} as const;
