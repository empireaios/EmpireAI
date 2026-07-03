"use client";

import {
  ActionButton,
  Badge,
  DataTable,
  Panel,
  StatCard,
} from "@/components/platform/ui/PlatformPrimitives";
import { useBrainModule } from "@/lib/brain/hooks/useBrainModule";

type LaunchView = {
  readinessScore: number | null;
  launchDecision: string;
  launchStatus: string;
  workflowStage: string | null;
  focusLabel: string;
  focusDetail: string;
  blockingCount: number;
  workflowSteps: Array<{
    id: string;
    label: string;
    description: string;
    status: "complete" | "in_progress" | "blocked" | "pending";
    progress: number;
  }>;
  deploymentChecklist: Array<{
    itemId: string;
    category: string;
    label: string;
    status: "ready" | "blocked" | "pending";
    note: string;
  }>;
};

function workflowBadgeVariant(
  status: LaunchView["workflowSteps"][number]["status"],
): "success" | "gold" | "default" | "warning" {
  switch (status) {
    case "complete":
      return "success";
    case "in_progress":
      return "gold";
    case "blocked":
      return "warning";
    default:
      return "default";
  }
}

function checklistBadgeVariant(
  status: LaunchView["deploymentChecklist"][number]["status"],
): "success" | "gold" | "warning" {
  switch (status) {
    case "ready":
      return "success";
    case "blocked":
      return "warning";
    default:
      return "gold";
  }
}

function LaunchWorkflowStepRow({
  step,
}: {
  step: LaunchView["workflowSteps"][number];
}) {
  return (
    <div className="relative pl-8">
      <span
        className={`absolute left-0 top-1.5 h-3 w-3 rounded-full border-2 ${
          step.status === "complete"
            ? "border-emerald-400 bg-emerald-400/30"
            : step.status === "in_progress"
              ? "border-[#d4af37] bg-[#d4af37]/30"
              : step.status === "blocked"
                ? "border-amber-400 bg-amber-400/20"
                : "border-gold/20 bg-white/[0.03]"
        }`}
      />
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-[#f0d78c]">{step.label}</p>
          <p className="mt-1 text-xs text-[#8a847a]">{step.description}</p>
        </div>
        <Badge variant={workflowBadgeVariant(step.status)}>
          {step.status.replace("_", " ")}
        </Badge>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#b8922a] to-[#d4af37] transition-all duration-700"
          style={{ width: `${step.progress}%` }}
        />
      </div>
    </div>
  );
}

/** SCR-201 — Commerce Launch Centre (Brain live — P0-4). */
export function CommerceLaunchPanel() {
  const { data, loading, error, reload } = useBrainModule<LaunchView>("launch");

  if (loading) {
    return <Panel title="Launch Centre">Loading live launch readiness…</Panel>;
  }

  if (error || !data) {
    return (
      <Panel title="Launch Centre" subtitle="Brain dispatch unavailable">
        <button type="button" className="text-sm text-[#d4af37]" onClick={() => void reload()}>
          Retry
        </button>
      </Panel>
    );
  }

  const readinessScore = data.readinessScore ?? null;
  const readyCount = data.deploymentChecklist.filter((i) => i.status === "ready").length;
  const blockedCount = data.deploymentChecklist.filter((i) => i.status === "blocked").length;
  const completeSteps = data.workflowSteps.filter((s) => s.status === "complete").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="gold">
          Launch readiness{" "}
          {readinessScore !== null ? `${readinessScore}%` : "Awaiting implementation"}
        </Badge>
        <Badge variant="warning">{data.launchDecision.replace(/_/g, " ")}</Badge>
        <Badge variant={data.blockingCount > 0 ? "warning" : "success"}>
          {data.blockingCount} blocking
        </Badge>
      </div>

      <div className="rounded-xl border border-gold/20 bg-white/[0.02] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Badge variant="gold">Launch focus</Badge>
            <h2 className="mt-2 font-display text-2xl text-[#f0d78c]">{data.focusLabel}</h2>
            <p className="text-sm text-[#8a847a]">
              {data.focusDetail} · {data.launchStatus}
              {data.workflowStage ? ` · ${data.workflowStage}` : ""}
            </p>
          </div>
          <p className="font-display text-4xl text-[#d4af37]">
            {readinessScore !== null ? `${readinessScore}%` : "—"}
          </p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <ActionButton variant="secondary" disabled>
            Launch actions via Brain dispatch
          </ActionButton>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Launch readiness"
          value={readinessScore !== null ? `${readinessScore}%` : "Awaiting implementation"}
          change={data.launchDecision}
          trend="neutral"
        />
        <StatCard
          label="Workflow complete"
          value={`${completeSteps}/${data.workflowSteps.length}`}
          change="Live Grand King dashboard"
          trend="up"
        />
        <StatCard
          label="Blocking items"
          value={String(data.blockingCount)}
          change="Commerce readiness engine"
          trend={data.blockingCount > 0 ? "down" : "up"}
        />
        <StatCard
          label="Deploy checklist"
          value={`${readyCount}/${data.deploymentChecklist.length}`}
          change={blockedCount > 0 ? `${blockedCount} blocked` : "On track"}
          trend={blockedCount > 0 ? "down" : "up"}
        />
      </div>

      <Panel
        title="Launch Readiness Workflow"
        subtitle="Brand → Products → Store → Payments → Fulfillment → Launch"
      >
        <div className="space-y-6 border-l border-gold/10 pl-4">
          {data.workflowSteps.map((step) => (
            <LaunchWorkflowStepRow key={step.id} step={step} />
          ))}
        </div>
      </Panel>

      <Panel
        title="Deployment Checklist"
        subtitle={`${readyCount} ready · ${blockedCount} blocked · live blockers from Brain`}
      >
        <ul className="space-y-4">
          {data.deploymentChecklist.map((item) => (
            <li
              key={item.itemId}
              className="rounded-lg border border-gold/10 bg-white/[0.02] p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#6f6a60]">
                    {item.category}
                  </p>
                  <p className="mt-1 text-sm font-medium text-[#f0d78c]">{item.label}</p>
                </div>
                <Badge variant={checklistBadgeVariant(item.status)}>{item.status}</Badge>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-[#8a847a]">{item.note}</p>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
