"use client";

import Link from "next/link";
import { Panel, DataTable } from "@/components/platform/ui/PlatformPrimitives";
import { useBrainModule } from "@/lib/brain/hooks/useBrainModule";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import type { MissionCentreView } from "@/lib/cockpit/panel-types";
import { COCKPIT_BASE } from "@/lib/cockpit/types";

/** SCR-020 — Live certification blocker strip. */
export function MissionBlockerStripLive() {
  const { data, loading, error, reload } = useBrainModule<MissionCentreView>("cockpit-missions");

  if (loading) {
    return <Panel title="Mission Blockers">Loading…</Panel>;
  }
  if (error || !data) {
    return (
      <Panel title="Mission Blockers">
        <button type="button" className="text-sm text-[#d4af37]" onClick={() => void reload()}>
          Retry
        </button>
      </Panel>
    );
  }

  if (data.blockers.length === 0) {
    return (
      <Panel title="Current Blockers" subtitle="Live · no open current blockers">
        <p className="text-sm text-emerald-300/90">No current operational blockers.</p>
      </Panel>
    );
  }

  return (
    <Panel title="Current Blockers" subtitle="Live · human executive language · engineering refs expandable">
      <div className="flex flex-wrap gap-2">
        {data.blockers.map((b) => (
          <div
            key={b.id}
            className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-sm"
          >
            <span className="text-[#c8c0b0]">{b.detail}</span>
            <details className="mt-1 text-[11px] text-[#6f6a60]">
              <summary className="cursor-pointer text-amber-200/80">Engineering ref</summary>
              {b.id} · {b.label}
            </details>
          </div>
        ))}
      </div>
      <Link href={`${COCKPIT_BASE}/founder/production`} className="mt-3 inline-block text-xs text-[#d4af37]">
        Production Centre →
      </Link>
    </Panel>
  );
}

/** SCR-020 — Pending Pillow approvals triage. */
export function MissionApprovalTriageLive() {
  const { data, loading, error, reload } = useBrainModule<MissionCentreView>("cockpit-missions");

  if (loading) {
    return <Panel title="Approval Triage">Loading…</Panel>;
  }
  if (error || !data) {
    return (
      <Panel title="Approval Triage">
        <button type="button" className="text-sm text-[#d4af37]" onClick={() => void reload()}>
          Retry
        </button>
      </Panel>
    );
  }

  return (
    <Panel
      title="Approval Triage"
      subtitle={`Live · ${data.pendingApprovals.length} pending (Pillow gate + commerce)`}
    >
      {data.pendingApprovals.length === 0 ? (
        <p className="text-sm text-[#6f6a60]">No pending approval.</p>
      ) : (
        <DataTable
          keyField="approvalId"
          data={data.pendingApprovals}
          columns={[
            { key: "title", header: "Approval" },
            { key: "type", header: "Type" },
            {
              key: "status",
              header: "Status",
              render: (r) => <StatusBadge status={r.status.toLowerCase()} />,
            },
          ]}
        />
      )}
      <Link href={`${COCKPIT_BASE}/development/pillow`} className="mt-3 inline-block text-xs text-[#d4af37]">
        Pillow Centre →
      </Link>
    </Panel>
  );
}

/** SCR-020 — Full OMS mission queue. */
export function MissionQueueFullLive() {
  const { data, loading, error, reload } = useBrainModule<MissionCentreView>("cockpit-missions");

  if (loading) {
    return <Panel title="Mission Queue">Loading…</Panel>;
  }
  if (error || !data) {
    return (
      <Panel title="Mission Queue">
        <button type="button" className="text-sm text-[#d4af37]" onClick={() => void reload()}>
          Retry
        </button>
      </Panel>
    );
  }

  const rawObjective = (data.oms.activeObjective ?? "").trim();
  const activeMission =
    !rawObjective ||
    /awaiting implementation/i.test(rawObjective) ||
    /^no active/i.test(rawObjective)
      ? "No active mission"
      : rawObjective;

  return (
    <div className="space-y-4">
      <Panel title="Current Mission" subtitle={`Health: ${data.oms.overallHealth}`}>
        <p className="text-sm text-[#f0d78c]">{activeMission}</p>
        {activeMission !== "No active mission" && (
          <p className="mt-2 text-xs text-[#8a847a]">
            {data.oms.progress}% · Confidence {data.oms.confidence}%
          </p>
        )}
        {data.oms.nextHighestImpactAction && activeMission !== "No active mission" && (
          <p className="mt-2 text-sm text-[#c8c0b0]">Next: {data.oms.nextHighestImpactAction}</p>
        )}
      </Panel>
      <Panel title="Mission Queue" subtitle="Live · active / queued / historical objectives">
        {data.missions.length === 0 ? (
          <p className="text-sm text-[#6f6a60]">No active mission.</p>
        ) : (
          <DataTable
            keyField="id"
            data={data.missions}
            columns={[
              { key: "id", header: "ID" },
              { key: "title", header: "Objective" },
              { key: "priority", header: "Priority" },
              {
                key: "status",
                header: "Status",
                render: (r) => <StatusBadge status={r.status.toLowerCase()} />,
              },
              {
                key: "progress",
                header: "Progress",
                render: (r) => `${r.progress}%`,
              },
            ]}
          />
        )}
      </Panel>
    </div>
  );
}
