import { asNumber, asRecord, asString } from "@/lib/empire-data";

type Props = {
  completion: Record<string, unknown> | null;
};

export function Version1AbsoluteCompletionPanel({ completion }: Props) {
  if (!completion) return null;

  const cert = asRecord(completion.completionCertificate);
  const arch = asRecord(completion.architectureInventory);

  return (
    <section className="empireCard" style={{ marginBottom: "1rem" }}>
      <p className="empireEyebrow">Version 1 Completion Package (REAL-100)</p>
      <p className="empireMetricHint">
        {asString(completion.summary)?.slice(0, 200)}
        {(asString(completion.summary)?.length ?? 0) > 200 ? "…" : ""}
      </p>
      <p className="empireMetricHint" style={{ marginTop: "0.5rem" }}>
        Certificate {asString(cert?.certificateId)?.slice(0, 8)}… · acceptance {asNumber(cert?.acceptanceScore)}% ·
        {" "}{asNumber(arch?.runtimeModuleCount)} runtime modules · {asNumber(completion.apiRouteCount)} API routes
      </p>
    </section>
  );
}
