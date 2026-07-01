import { asArray, asNumber, asString } from "@/lib/empire-data";

/** Live SUCCESS-001 blocker from REAL-035 dashboard payload (GC-06). */
export function extractSuccess001Blocker(dashboard: Record<string, unknown> | null): string {
  if (!dashboard) {
    return "SUCCESS-001 status loading…";
  }

  const explicit = asString(dashboard.topBlocker, "");
  if (explicit && explicit !== "—") {
    return explicit;
  }

  const sections = [
    asArray(dashboard.operationalBlockers),
    asArray(dashboard.commercialBlockers),
    asArray(dashboard.supplierBlockers),
    asArray(dashboard.marketplaceBlockers),
    asArray(dashboard.blockers),
    asArray(dashboard.criticalBlockers),
  ];

  for (const items of sections) {
    for (const item of items) {
      const text = asString(item);
      if (text && text !== "—") {
        return text;
      }
    }
  }

  const progress = asNumber(dashboard.progressPercent);
  if (progress > 0) {
    return "No blocker detected — keep momentum.";
  }

  return "Net profit path not yet active — connect live commerce.";
}
