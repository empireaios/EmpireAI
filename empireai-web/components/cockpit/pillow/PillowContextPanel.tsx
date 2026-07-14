"use client";

import type { PillowExecutiveContextSnapshot } from "@/lib/pillow-ux/types";

export function PillowContextPanel({
  snapshot,
  screenTitle,
}: {
  snapshot: PillowExecutiveContextSnapshot;
  screenTitle: string;
}) {
  const fields = [
    { label: "Screen", value: screenTitle },
    { label: "Business", value: snapshot.currentBusiness },
    { label: "Mission", value: snapshot.currentMission },
    { label: "Journey", value: snapshot.currentJourney },
    { label: "Builder", value: snapshot.builderStatus },
    { label: "Supervisor", value: snapshot.supervisorStatus },
    { label: "Production", value: snapshot.productionStatus },
    { label: "Guardian", value: snapshot.guardianStatus },
    { label: "Approvals", value: String(snapshot.pendingApprovals) },
    { label: "Alerts", value: String(snapshot.alertCount) },
  ].filter((f) => f.value && f.value !== "—" && f.value !== "0");

  return (
    <div className="rounded-lg border border-gold/10 bg-black/30 px-3 py-2">
      <p className="text-[10px] uppercase tracking-wider text-[#6f6a60]">
        Pillow Context · P7-03
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {fields.map((field) => (
          <span
            key={field.label}
            className="rounded border border-gold/10 px-2 py-0.5 text-[10px] text-[#c8c0b0]"
            title={field.value ?? undefined}
          >
            {field.label}: {String(field.value).slice(0, 32)}
          </span>
        ))}
      </div>
      {snapshot.grandKingSummary && (
        <p className="mt-2 line-clamp-2 text-[11px] text-[#8a847a]">{snapshot.grandKingSummary}</p>
      )}
    </div>
  );
}
