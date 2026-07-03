import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";

/** Maps engine / executive health strings to StatusBadge labels. */
export function engineHealthToStatus(
  health: string | null | undefined,
): string {
  if (!health) return "pending";
  const h = health.toUpperCase();
  if (h === "HEALTHY" || h === "GREEN" || h === "COMPLETE") return "connected";
  if (h === "FAILED" || h === "RED" || h === "BLOCKED") return "blocked";
  if (h === "NOT_IMPLEMENTED") return "architecture";
  if (h === "WARNING" || h === "YELLOW") return "pending";
  return "pending";
}

/** G4-10 — Standard health indicator for engine centers and executive widgets. */
export function CockpitHealthBadge({
  health,
}: {
  health: string | null | undefined;
}) {
  return <StatusBadge status={engineHealthToStatus(health)} />;
}
