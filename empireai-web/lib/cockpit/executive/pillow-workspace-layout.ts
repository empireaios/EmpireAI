/**
 * Executive Home Pillow workspace layout (Mission 007).
 *
 * Page remains the primary owner for Executive Home sections.
 * Inside the Pillow chat shell, history uses a bounded workspace window
 * with controlled internal scrolling so long threads do not grow the page
 * unboundedly — without recreating a full-viewport scroll prison.
 */
export const PILLOW_WORKSPACE_LAYOUT = {
  workspaceMinPx: 320,
  /** Bounded chat shell height (vh) — history scrolls inside; page still scrolls around the shell. */
  chatShellMaxVh: 72,
  chatShellMaxPx: 720,
  /**
   * History uses internal scroll inside the bounded shell.
   * overscrollBehavior must remain "auto" so wheel can continue the page at boundaries.
   */
  messageHistoryInternalScroll: true,
  historyOverscrollBehavior: "auto" as const,
  /** Bound DOM: only render the latest N messages; load earlier on demand. */
  visibleMessageWindow: 40,
  composerMinPx: 96,
  composerMaxPx: 220,
  contextStripMaxPx: 96,
  pillowBesideCentres: false,
  focusEventName: "empireai:focus-pillow",
} as const;
