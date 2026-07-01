import { HealthGrid } from "@/components/empire/HealthGrid";
import { asArray, asNumber, asRecord, asString } from "@/lib/empire-data";

type Props = {
  readiness: Record<string, unknown> | null;
  lockdown: Record<string, unknown> | null;
};

export function Version1CompletionPanel({ readiness, lockdown }: Props) {
  if (!readiness && !lockdown) return null;

  const score = asNumber(readiness?.version1ReadinessScore);
  const dimensions = asArray(readiness?.dimensions);
  const baseline = asRecord(lockdown?.baseline);
  const versionLock = asRecord(baseline?.versionLock);

  const healthItems = dimensions.slice(0, 4).map((d, i) => {
    const row = asRecord(d);
    return {
      id: `dim-${i}`,
      label: asString(row?.dimension, "Dimension"),
      status: asString(row?.status, "WARNING"),
      detail: `${asNumber(row?.score)}%`,
    };
  });

  return (
    <section className="empireCard" style={{ marginBottom: "1rem" }}>
      <p className="empireEyebrow">Version 1 Completion (REAL-024 → REAL-025)</p>
      <p className="empireMetricHint">
        Readiness: {score}% · {asString(readiness?.productionRecommendation)?.slice(0, 120)}
        {(asString(readiness?.productionRecommendation)?.length ?? 0) > 120 ? "…" : ""}
      </p>
      {healthItems.length > 0 && <HealthGrid items={healthItems} title="Readiness Dimensions" />}
      {versionLock && (
        <p className="empireMetricHint" style={{ marginTop: "0.5rem" }}>
          V1 Lock: {asString(baseline?.version)} · hash {asString(versionLock.baselineHash)?.slice(0, 12)}… · {asArray(baseline?.moduleInventory).length} modules inventoried
        </p>
      )}
    </section>
  );
}
