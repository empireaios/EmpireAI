/** T1-04 — Responsive breakpoint detection. */

import type { LayoutUnderstandingConfiguration } from "./configuration.js";
import type { ResponsiveBreakpoint } from "./types.js";

export class ResponsiveLayoutDetector {
  detect(
    viewport: { width: number; height: number },
    config: LayoutUnderstandingConfiguration,
  ): ResponsiveBreakpoint[] {
    return config.responsiveBreakpoints.map((bp) => ({
      name: bp.name,
      viewportWidth: viewport.width,
      viewportHeight: viewport.height,
      matched: viewport.width >= bp.minWidth && viewport.width <= bp.maxWidth,
    }));
  }

  breakpointChanged(
    previous: ResponsiveBreakpoint[] | null,
    current: ResponsiveBreakpoint[],
  ): boolean {
    if (!previous) return false;
    const prevActive = previous.find((b) => b.matched)?.name ?? null;
    const currActive = current.find((b) => b.matched)?.name ?? null;
    return prevActive !== currActive;
  }
}
