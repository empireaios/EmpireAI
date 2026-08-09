"use client";

import Link from "next/link";
import { ExternalLink, Target } from "lucide-react";
import { Badge } from "@/components/platform/ui/PlatformPrimitives";
import { useBrainModule } from "@/lib/brain/hooks/useBrainModule";

/** Never present programme placeholders as current operating truth. */
function humanizeCommandCopy(value: string | null | undefined): string {
  const text = (value ?? "").trim();
  if (!text) return "—";
  if (/awaiting implementation/i.test(text)) {
    if (/first-revenue|proof-001|revenue validation/i.test(text)) {
      return "No realised revenue yet";
    }
    if (/mission|objective/i.test(text) || text.length < 40) {
      return "No active mission";
    }
    return "Not yet measured";
  }
  return text;
}

type BlockerChipStatus = "open" | "closed" | "partial";

type OperationalCommandView = {
  computedAt: string;
  certificationBlockers: Record<
    "B5" | "B6" | "B7" | "B8",
    { id: string; label: string; status: BlockerChipStatus; detail: string }
  >;
  operationalReadiness: { percent: number; passed: boolean; detail: string };
  crirReadiness: {
    score: number | null;
    launchReady: boolean;
    reportCount: number;
    status: string;
    detail: string;
  };
  proof001: {
    achieved: boolean;
    progressPercent: number;
    stagesPassed: number;
    totalStages: number;
    detail: string;
  };
  commerceReadiness: {
    score: number | null;
    launchDecision: string;
    blockingCount: number;
  };
  pendingApprovals: {
    count: number;
    top: { approvalId: string; title: string; summary: string; type: string } | null;
  };
  nextExecutiveApproval: string | null;
  success001: {
    blocker: string;
    progressPercent: number;
    currentNetProfitUsd: number;
  };
  implementation: {
    milestone: string;
    phase: string;
    objective: string;
    currentBlocker: string;
  };
  oms: {
    activeObjective: string;
    progress: number;
    confidence: number;
    overallHealth: "GREEN" | "YELLOW" | "RED";
    currentBlocker: string | null;
    nextHighestImpactAction: string | null;
    forecastCompletion: string | null;
    remainingBlockers: string[];
  };
};

function healthBadgeVariant(
  health: "GREEN" | "YELLOW" | "RED",
): "success" | "warning" | "danger" {
  if (health === "GREEN") return "success";
  if (health === "RED") return "danger";
  return "warning";
}

function formatForecast(iso: string | null): string {
  if (!iso) return "No tracked ETA";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}
function blockerBadgeVariant(
  status: BlockerChipStatus,
): "success" | "warning" | "danger" | "default" {
  if (status === "closed") return "success";
  if (status === "partial") return "warning";
  return "danger";
}

function GlobalApprovalBar({
  pendingCount,
  topTitle,
  topSummary,
}: {
  pendingCount: number;
  topTitle: string | null;
  topSummary: string | null;
}) {
  return (
    <div
      className="flex flex-col gap-3 border-b border-gold/15 bg-[#0a0a0a] px-4 py-3 lg:flex-row lg:items-center lg:justify-between lg:px-8"
      data-testid="gc-02-approval-bar"
      aria-label="Approval Bar"
    >
      <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#6f6a60]">
          Approval Bar
        </span>
        <span className="font-medium text-[#d4af37]">{pendingCount} pending</span>
        {topTitle ? (
          <span className="truncate text-[#c8c0b0]" title={topSummary ?? undefined}>
            {topTitle}
          </span>
        ) : (
          <span className="text-[#8a847a]">No items awaiting executive verdict</span>
        )}
      </div>
      <Link
        href="/cockpit/development/approvals"
        className="inline-flex items-center gap-1.5 text-sm text-[#d4af37] hover:text-[#f0d78c]"
      >
        Open queue <ExternalLink size={14} aria-hidden="true" />
      </Link>
    </div>
  );
}

function Success001BlockerBar({ blocker }: { blocker: string }) {
  return (
    <div
      className="border-b border-amber-500/20 bg-amber-950/20 px-4 py-2 lg:px-8"
      data-testid="gc-06-blocker-bar"
      aria-label="SUCCESS-001 blocker"
    >
      <Link
        href="/cockpit/command"
        className="inline-flex max-w-full items-center gap-2 text-sm text-amber-200/90 hover:text-amber-100"
        title="Open SUCCESS-001 Command Center"
      >
        <Target size={14} aria-hidden="true" className="shrink-0" />
        <span className="shrink-0 font-medium">Blocking SUCCESS-001:</span>
        <span className="truncate">{blocker}</span>
      </Link>
    </div>
  );
}

function MetricChip({
  label,
  value,
  detail,
  variant = "default",
}: {
  label: string;
  value: string;
  detail?: string;
  variant?: "default" | "success" | "warning" | "danger" | "gold";
}) {
  return (
    <div
      className="min-w-[140px] flex-1 rounded-lg border border-gold/10 bg-white/[0.02] px-3 py-2"
      title={detail}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#6f6a60]">
        {label}
      </p>
      <p className="mt-0.5 font-display text-lg text-[#f0d78c]">{value}</p>
      {detail && <p className="mt-0.5 truncate text-[10px] text-[#8a847a]">{detail}</p>}
      <div className="mt-1">
        <Badge variant={variant}>live</Badge>
      </div>
    </div>
  );
}

/** P0-6 — King's operational command strip mounted in CockpitShell. */
export function ExecutiveCommandStrip() {
  const { data, loading, error, reload } = useBrainModule<OperationalCommandView>("cockpit-command");

  if (loading) {
    return (
      <div className="space-y-3 border-b border-gold/10 bg-[#050505] px-4 py-3 lg:px-8">
        <div className="h-4 w-48 animate-pulse rounded bg-white/[0.04]" />
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4].map((key) => (
            <div
              key={key}
              className="h-16 min-w-[140px] flex-1 animate-pulse rounded-lg border border-gold/10 bg-white/[0.02]"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-between border-b border-gold/10 bg-[#050505] px-4 py-3 lg:px-8">
        <span className="text-sm text-[#8a847a]">Executive command data unavailable</span>
        <button type="button" className="text-sm text-[#d4af37]" onClick={() => void reload()}>
          Retry
        </button>
      </div>
    );
  }

  const blockerKeys = ["B5", "B6", "B7", "B8"] as const;
  const openBlockers = blockerKeys.filter(
    (k) => data.certificationBlockers[k].status !== "closed",
  ).length;

  return (
    <div className="border-b border-gold/20">
      {data.success001.blocker && data.success001.progressPercent < 100 && (
        <Success001BlockerBar blocker={data.success001.blocker} />
      )}

      <GlobalApprovalBar
        pendingCount={data.pendingApprovals.count}
        topTitle={data.pendingApprovals.top?.title ?? null}
        topSummary={data.pendingApprovals.top?.summary ?? null}
      />

      <div className="space-y-3 bg-[#050505] px-4 py-3 lg:px-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#6f6a60]">
            Production blockers
          </span>
          {blockerKeys.map((key) => {
            const chip = data.certificationBlockers[key];
            return (
              <span key={key} title={chip.detail}>
                <Badge variant={blockerBadgeVariant(chip.status)}>
                  {key} · {chip.status}
                </Badge>
              </span>
            );
          })}
          <Badge variant={openBlockers === 0 ? "success" : "warning"}>
            {openBlockers === 0 ? "All closed" : `${openBlockers} open`}
          </Badge>
        </div>

        <div className="flex flex-wrap gap-2">
          <MetricChip
            label="Operational readiness"
            value={`${data.operationalReadiness.percent}%`}
            detail={data.operationalReadiness.detail}
            variant={data.operationalReadiness.passed ? "success" : "warning"}
          />
          <MetricChip
            label="CRIR readiness"
            value={
              data.crirReadiness.score !== null
                ? `${data.crirReadiness.score}%`
                : "No tracked ETA"
            }
            detail={data.crirReadiness.detail}
            variant={data.crirReadiness.launchReady ? "success" : "warning"}
          />
          <MetricChip
            label="First revenue"
            value={
              data.proof001.achieved
                ? "Validated"
                : `${data.proof001.progressPercent}%`
            }
            detail={humanizeCommandCopy(data.proof001.detail)}
            variant={data.proof001.achieved ? "success" : "default"}
          />
          <MetricChip
            label="Commerce readiness"
            value={
              data.commerceReadiness.score !== null
                ? `${data.commerceReadiness.score}%`
                : "Not yet measured"
            }
            detail={`${data.commerceReadiness.launchDecision} · ${data.commerceReadiness.blockingCount} blocking`}
            variant={
              data.commerceReadiness.launchDecision === "READY_TO_LAUNCH"
                ? "success"
                : "gold"
            }
          />
        </div>

        <div className="rounded-lg border border-gold/15 bg-white/[0.02] p-3">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#6f6a60]">
              Current mission
            </span>
            <Badge variant={healthBadgeVariant(data.oms.overallHealth)}>
              {data.oms.overallHealth}
            </Badge>
          </div>
          <p className="text-sm font-medium text-[#f0d78c]">
            {humanizeCommandCopy(data.oms.activeObjective)}
          </p>
          <div className="mt-2 grid gap-2 text-xs text-[#8a847a] sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <span className="text-[#6f6a60]">Progress · </span>
              <span className="text-[#c8c0b0]">{data.oms.progress}%</span>
            </div>
            <div>
              <span className="text-[#6f6a60]">Confidence · </span>
              <span className="text-[#c8c0b0]">{data.oms.confidence}%</span>
            </div>
            <div>
              <span className="text-[#6f6a60]">Forecast · </span>
              <span className="text-[#c8c0b0]">{formatForecast(data.oms.forecastCompletion)}</span>
            </div>
            <div className="sm:col-span-2">
              <span className="text-[#6f6a60]">Next action · </span>
              <span className="text-[#c8c0b0]">
                {data.oms.nextHighestImpactAction ?? "No action required"}
              </span>
            </div>
          </div>
          {data.oms.remainingBlockers.length > 0 && (
            <p className="mt-2 truncate text-xs text-amber-200/80" title={data.oms.remainingBlockers.join(" · ")}>
              Blockers: {data.oms.remainingBlockers[0]}
              {data.oms.remainingBlockers.length > 1
                ? ` (+${data.oms.remainingBlockers.length - 1} more)`
                : ""}
            </p>
          )}
        </div>

        <div className="grid gap-2 text-xs text-[#8a847a] sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <span className="text-[#6f6a60]">Milestone · </span>
            <span className="text-[#c8c0b0]">{data.implementation.milestone}</span>
          </div>
          <div>
            <span className="text-[#6f6a60]">Phase · </span>
            <span className="text-[#c8c0b0]">{data.implementation.phase}</span>
          </div>
          <div>
            <span className="text-[#6f6a60]">Objective · </span>
            <span className="text-[#c8c0b0]">{data.implementation.objective}</span>
          </div>
          <div>
            <span className="text-[#6f6a60]">Next approval · </span>
            <span className="text-[#c8c0b0]">
              {data.nextExecutiveApproval ?? "None pending"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
