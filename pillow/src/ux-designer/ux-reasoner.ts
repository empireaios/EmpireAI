import type { ScreenCatalogEntry, UxReasoningReport } from "./types.js";

export function evaluateUx(screen: ScreenCatalogEntry | null, request: string): UxReasoningReport {
  const base = {
    clarity: 78,
    usability: 80,
    consistency: 85,
    branding: 88,
    informationHierarchy: 82,
    navigation: 84,
    accessibility: 72,
    mobileResponsiveness: 76,
    executiveWorkflow: 86,
    businessEffectiveness: 83,
  };

  const recommendations: string[] = [];

  if (/pink|neon|colour|color/i.test(request)) {
    recommendations.push("Verify colour changes maintain WCAG AA contrast on dark backgrounds");
    base.branding -= 5;
  }

  if (/spacing|readability|contrast/i.test(request)) {
    base.accessibility += 8;
    base.clarity += 6;
    recommendations.push("Increase line-height and section spacing for executive readability");
  }

  if (/move.*left|layout|dashboard/i.test(request)) {
    recommendations.push("Ensure layout shifts do not obscure CockpitSidebar on lg breakpoints");
    base.navigation -= 3;
  }

  if (/mobile|responsive/i.test(request)) {
    base.mobileResponsiveness += 10;
    recommendations.push("Test CockpitMobileNav and Pillow panel overlap at 375px width");
  }

  if (screen?.department === "Executive") {
    recommendations.push("Preserve Executive Home widget priority order: alerts → next action → KPIs");
  }

  if (recommendations.length === 0) {
    recommendations.push("Run visual comparison against current screen before Cursor implementation");
  }

  const scores = Object.values(base);
  const overallScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

  return { ...base, overallScore, recommendations };
}
