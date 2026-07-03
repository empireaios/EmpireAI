"use client";

import { useState } from "react";
import Link from "next/link";
import { ActionButton, DataTable, Panel, StatCard } from "@/components/platform/ui/PlatformPrimitives";
import { CockpitPageHeader } from "@/components/cockpit/layout/CockpitPageHeader";
import { CockpitLoadingState, CockpitErrorState } from "@/components/cockpit/ui/CockpitStates";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import { useBrainModule } from "@/lib/brain/hooks/useBrainModule";
import { getCockpitScreenDataMode } from "@/lib/cockpit/kpis/registry";
import type {
  AutomationCentreView,
  AutomationDetailView,
  AutomationTimelineView,
} from "@/lib/cockpit/panel-types";
import { brainDispatch } from "@/lib/brain/client";

/** SCR-303 — Cockpit Automation Centre (Brain-only — no direct automation internals). */
export function AutomationCentrePanel() {
  const { data, loading, error, reload } = useBrainModule<AutomationCentreView>("cockpit-automation");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const detail = useBrainModule<AutomationDetailView & { found?: boolean }>(
    "cockpit-automation",
    "load_detail",
    { enabled: Boolean(selectedId), payload: selectedId ? { automationId: selectedId } : undefined },
  );
  const timeline = useBrainModule<AutomationTimelineView & { found?: boolean }>(
    "cockpit-automation",
    "load_timeline",
    { enabled: Boolean(selectedId), payload: selectedId ? { automationId: selectedId } : undefined },
  );

  if (loading) {
    return (
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <CockpitPageHeader
          eyebrow="Operations"
          title="Automation Centre"
          dataMode={getCockpitScreenDataMode("SCR-303")}
        />
        <CockpitLoadingState message="Loading automation centre from Brain…" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <CockpitPageHeader
          eyebrow="Operations"
          title="Automation Centre"
          dataMode={getCockpitScreenDataMode("SCR-303")}
        />
        <CockpitErrorState message="Automation Centre unavailable via Brain" onRetry={() => void reload()} />
      </div>
    );
  }

  const healthLabel = data.overview.health.toLowerCase();

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6" aria-label="Automation Centre">
      <CockpitPageHeader
        eyebrow="Operations"
        title="Automation Centre"
        dataMode={getCockpitScreenDataMode("SCR-303")}
      />
      <p className="text-sm text-[#8a847a]">
        Executive visibility into Business Automation — observe, approve, and intervene via Pillow governance.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" role="region" aria-label="Automation KPIs">
        {data.kpis.map((kpi) => (
          <StatCard key={kpi.id} label={kpi.label} value={kpi.value} trend={kpi.trend} />
        ))}
      </div>

      <Panel title="Automation Overview" subtitle={`Health: ${data.overview.health}`}>
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge status={healthLabel} />
          <span className="text-sm text-[#8a847a]">
            Running {data.overview.runningCount} · Queued {data.overview.queuedCount} · Failed{" "}
            {data.overview.failedCount}
          </span>
        </div>
      </Panel>

      {data.attentionItems.length > 0 ? (
        <Panel title="Executive Attention Items" subtitle="Requires Grand King review">
          <ul className="space-y-2" aria-label="Executive attention items">
            {data.attentionItems.map((item) => (
              <li
                key={item.id}
                className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-sm text-[#f0d78c]"
              >
                {item.label}
              </li>
            ))}
          </ul>
        </Panel>
      ) : (
        <Panel title="Executive Attention Items">
          <p className="text-sm text-[#6f6a60]">No items require immediate executive attention.</p>
        </Panel>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        <WorkflowTable
          title="Running Workflows"
          rows={data.runningWorkflows}
          emptyLabel="No workflows currently running"
          onSelect={setSelectedId}
          selectedId={selectedId}
        />
        <WorkflowTable
          title="Queued Workflows"
          rows={data.queuedWorkflows}
          emptyLabel="Automation queue is empty"
          onSelect={setSelectedId}
          selectedId={selectedId}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <WorkflowTable
          title="Failed Workflows"
          rows={data.failedWorkflows}
          emptyLabel="No failed workflows"
          onSelect={setSelectedId}
          selectedId={selectedId}
        />
        <Panel title="Approval Queue" subtitle="Pillow-governed automation approvals">
          {data.approvalQueue.length === 0 ? (
            <p className="text-sm text-[#6f6a60]">No pending automation approvals.</p>
          ) : (
            <DataTable
              keyField="approvalId"
              data={data.approvalQueue}
              columns={[
                { key: "summary", header: "Request" },
                { key: "approvalTier", header: "Tier" },
                {
                  key: "approvalState",
                  header: "State",
                  render: (row) => <StatusBadge status={row.approvalState} />,
                },
              ]}
            />
          )}
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Recovery Centre" subtitle="Registry-driven recovery operations">
          {data.recoveryOperations.length === 0 ? (
            <p className="text-sm text-[#6f6a60]">No active recovery operations.</p>
          ) : (
            <DataTable
              keyField="recoveryId"
              data={data.recoveryOperations}
              columns={[
                { key: "executionId", header: "Execution" },
                { key: "recoveryState", header: "State" },
                { key: "failureCategory", header: "Category" },
              ]}
            />
          )}
        </Panel>
        <Panel title="Scheduler" subtitle="Scheduled and retrying automations">
          <ul className="space-y-1 text-sm text-[#c8c0b0]">
            <li>Due scheduled: {data.schedulerSummary.dueCount}</li>
            <li>Retrying: {data.schedulerSummary.retryingCount}</li>
            <li>Recovered: {data.schedulerSummary.recoveredCount}</li>
          </ul>
        </Panel>
      </div>

      <Panel title="Automation Registry Health" subtitle="REG-WORKFLOW · MONITOR · REPORT · NOTIFICATION">
        <DataTable
          keyField="registryId"
          data={data.registryHealth}
          columns={[
            { key: "name", header: "Registry Row" },
            { key: "registryType", header: "Type" },
            { key: "status", header: "Status" },
            { key: "detail", header: "Detail" },
          ]}
        />
      </Panel>

      <Panel title="Recent Activity" subtitle="Triggers, recovery, and audit events">
        {data.recentActivity.length === 0 ? (
          <p className="text-sm text-[#6f6a60]">No recent automation activity recorded.</p>
        ) : (
          <DataTable
            keyField="eventId"
            data={data.recentActivity}
            columns={[
              { key: "kind", header: "Kind" },
              { key: "title", header: "Title" },
              { key: "summary", header: "Summary" },
              { key: "timestamp", header: "Time" },
            ]}
          />
        )}
      </Panel>

      {selectedId && detail.data && detail.data.found !== false ? (
        <AutomationDetailPanel
          detail={detail.data as AutomationDetailView}
          timeline={timeline.data as AutomationTimelineView | null}
          onAction={async (action, extra) => {
            await brainDispatch({
              module: "cockpit-automation",
              action: "execute_action",
              payload: { action, automationId: selectedId, ...extra },
            });
            void reload();
            detail.reload();
          }}
        />
      ) : null}

      <Panel title="Relationship Links" subtitle="Integrated command surfaces — no duplicated data">
        <div className="flex flex-wrap gap-3">
          {data.relationshipLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded border border-gold/10 px-3 py-1 text-xs text-[#d4af37] hover:bg-gold/5"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </Panel>

      {data.pluginWidgets.length > 0 ? (
        <Panel title="Plugin Widgets">
          <div className="grid gap-3 sm:grid-cols-2">
            {data.pluginWidgets.map((widget) => (
              <div key={widget.pluginId} className="rounded-lg border border-gold/10 p-3">
                <p className="text-sm font-medium text-[#f0d78c]">{widget.title}</p>
                <p className="mt-1 text-xs text-[#8a847a]">{widget.summary}</p>
              </div>
            ))}
          </div>
        </Panel>
      ) : null}
    </div>
  );
}

function WorkflowTable({
  title,
  rows,
  emptyLabel,
  onSelect,
  selectedId,
}: {
  title: string;
  rows: AutomationCentreView["runningWorkflows"];
  emptyLabel: string;
  onSelect: (id: string) => void;
  selectedId: string | null;
}) {
  return (
    <Panel title={title}>
      {rows.length === 0 ? (
        <p className="text-sm text-[#6f6a60]">{emptyLabel}</p>
      ) : (
        <DataTable
          keyField="automationId"
          data={rows}
          columns={[
            { key: "workflowId", header: "Workflow" },
            { key: "currentState", header: "State" },
            {
              key: "automationId",
              header: "",
              render: (row) => (
                <button
                  type="button"
                  className={`text-xs ${selectedId === row.automationId ? "text-[#f0d78c]" : "text-[#d4af37]"}`}
                  onClick={() => onSelect(row.automationId)}
                  aria-label={`View automation ${row.automationId}`}
                >
                  Details
                </button>
              ),
            },
          ]}
        />
      )}
    </Panel>
  );
}

function AutomationDetailPanel({
  detail,
  timeline,
  onAction,
}: {
  detail: AutomationDetailView;
  timeline: AutomationTimelineView | null;
  onAction: (action: string, extra?: Record<string, unknown>) => Promise<void>;
}) {
  return (
    <Panel title="Automation Detail" subtitle={detail.automationId} aria-label="Automation detail view">
      <dl className="grid gap-2 text-sm sm:grid-cols-2">
        <DetailItem label="Workflow" value={detail.workflowId} />
        <DetailItem label="Trigger" value={detail.triggerId} />
        <DetailItem label="State" value={detail.currentState} />
        <DetailItem label="Approval" value={detail.approvalStatus} />
        <DetailItem label="Decision Source" value={detail.decisionSource ?? "—"} />
        <DetailItem label="Correlation" value={detail.correlationId} />
      </dl>

      {detail.recoveryStatus ? (
        <p className="mt-3 text-xs text-amber-200/90">
          Recovery: {detail.recoveryStatus.recoveryState}
          {detail.recoveryStatus.failureCause ? ` — ${detail.recoveryStatus.failureCause}` : ""}
        </p>
      ) : null}

      {detail.businessEngines.length > 0 ? (
        <div className="mt-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#6f6a60]">Business Engines</p>
          <ul className="mt-2 space-y-1 text-xs text-[#c8c0b0]">
            {detail.businessEngines.map((engine) => (
              <li key={engine.stepId}>
                {engine.stepId}: {engine.executorRef}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {timeline?.events?.length ? (
        <div className="mt-4" aria-label="Workflow timeline">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#6f6a60]">Workflow Timeline</p>
          <ol className="mt-2 space-y-1">
            {timeline.events.map((event) => (
              <li key={event.phase} className="flex items-center gap-2 text-xs text-[#c8c0b0]">
                <StatusBadge status={event.state} />
                <span>{event.label}</span>
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      <div className="mt-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#6f6a60]">EKLS Learning</p>
        {detail.eklsLearning.lessonsLearnedHref ? (
          <Link href={detail.eklsLearning.lessonsLearnedHref} className="text-xs text-[#d4af37]">
            View lessons learned →
          </Link>
        ) : (
          <p className="text-xs text-[#6f6a60]">No EKLS link available.</p>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2" role="toolbar" aria-label="Executive automation actions">
        {detail.availableActions
          .filter((item) => item.enabled)
          .map((item) => (
            <ActionButton key={item.action} onClick={() => void onAction(item.action)}>
              {item.label}
            </ActionButton>
          ))}
      </div>
    </Panel>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-[0.2em] text-[#6f6a60]">{label}</dt>
      <dd className="text-[#f0d78c]">{value}</dd>
    </div>
  );
}
