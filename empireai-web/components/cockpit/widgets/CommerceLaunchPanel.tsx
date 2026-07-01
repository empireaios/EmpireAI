"use client";

import {
  ActionButton,
  Badge,
  DataTable,
  Panel,
  StatCard,
} from "@/components/platform/ui/PlatformPrimitives";
import {
  COMMERCE_LAUNCH_DEPLOYMENT_CHECKLIST,
  COMMERCE_LAUNCH_FOCUS,
  COMMERCE_LAUNCH_PUBLICATION_PIPELINE,
  COMMERCE_LAUNCH_WORKFLOW,
  type DeploymentChecklistItem,
  type LaunchWorkflowStatus,
  type LaunchWorkflowStep,
  type PublicationPipelineRow,
  type PublicationStageStatus,
} from "@/components/cockpit/widgets/launch/commerceLaunchDemoData";

function workflowBadgeVariant(
  status: LaunchWorkflowStatus,
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

function publicationBadgeVariant(
  status: PublicationStageStatus,
): "success" | "gold" | "default" | "warning" | "danger" {
  switch (status) {
    case "published":
      return "success";
    case "ready":
      return "gold";
    case "review":
      return "warning";
    case "blocked":
      return "danger";
    default:
      return "default";
  }
}

function checklistBadgeVariant(
  status: DeploymentChecklistItem["status"],
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

function LaunchWorkflowStepRow({ step }: { step: LaunchWorkflowStep }) {
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

/** SCR-201 — Commerce Launch Centre panel (presentation-only demo). */
export function CommerceLaunchPanel() {
  const readyCount = COMMERCE_LAUNCH_DEPLOYMENT_CHECKLIST.filter(
    (item) => item.status === "ready",
  ).length;
  const blockedCount = COMMERCE_LAUNCH_DEPLOYMENT_CHECKLIST.filter(
    (item) => item.status === "blocked",
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="gold">Launch readiness {COMMERCE_LAUNCH_FOCUS.readinessScore}%</Badge>
        <Badge variant="warning">Pipeline 4 products</Badge>
        <Badge variant="success">Preview deployed 1</Badge>
      </div>

      <div className="rounded-xl border border-gold/20 bg-white/[0.02] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Badge variant="gold">Launch focus</Badge>
            <h2 className="mt-2 font-display text-2xl text-[#f0d78c]">
              {COMMERCE_LAUNCH_FOCUS.product}
            </h2>
            <p className="text-sm text-[#8a847a]">
              {COMMERCE_LAUNCH_FOCUS.company} · {COMMERCE_LAUNCH_FOCUS.agent}
            </p>
          </div>
          <p className="font-display text-4xl text-[#d4af37]">
            {COMMERCE_LAUNCH_FOCUS.readinessScore}%
          </p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <ActionButton variant="secondary" disabled>
            Start launch session
          </ActionButton>
          <ActionButton variant="secondary" disabled>
            Approve publication
          </ActionButton>
          <ActionButton disabled>Deploy to preview</ActionButton>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Launch readiness"
          value={`${COMMERCE_LAUNCH_FOCUS.readinessScore}%`}
          change="Demo score — not live"
          trend="neutral"
        />
        <StatCard
          label="Workflow complete"
          value={`${COMMERCE_LAUNCH_WORKFLOW.filter((s) => s.status === "complete").length}/${COMMERCE_LAUNCH_WORKFLOW.length}`}
          change="Discovery and preview done"
          trend="up"
        />
        <StatCard
          label="Publication queue"
          value={String(COMMERCE_LAUNCH_PUBLICATION_PIPELINE.length)}
          change="Nova Home catalog"
          trend="neutral"
        />
        <StatCard
          label="Deploy checklist"
          value={`${readyCount}/${COMMERCE_LAUNCH_DEPLOYMENT_CHECKLIST.length}`}
          change={blockedCount > 0 ? `${blockedCount} blocked` : "On track"}
          trend={blockedCount > 0 ? "down" : "up"}
        />
      </div>

      <Panel
        title="Launch Readiness Workflow"
        subtitle="Discovery → Preview → Build → Readiness → Publication → Deploy"
      >
        <div className="space-y-6 border-l border-gold/10 pl-4">
          {COMMERCE_LAUNCH_WORKFLOW.map((step) => (
            <LaunchWorkflowStepRow key={step.id} step={step} />
          ))}
        </div>
      </Panel>

      <div className="grid gap-6 xl:grid-cols-5">
        <Panel
          title="Product Publication Pipeline"
          subtitle="Listing packages by stage"
          className="xl:col-span-3"
        >
          <DataTable<PublicationPipelineRow>
            keyField="productId"
            data={COMMERCE_LAUNCH_PUBLICATION_PIPELINE}
            columns={[
              { key: "productName", header: "Product" },
              { key: "company", header: "Company" },
              { key: "stage", header: "Stage" },
              {
                key: "status",
                header: "Status",
                render: (row) => (
                  <Badge variant={publicationBadgeVariant(row.status)}>
                    {row.status}
                  </Badge>
                ),
              },
              {
                key: "confidence",
                header: "Confidence",
                render: (row) => `${row.confidence}%`,
              },
              { key: "updatedAt", header: "Updated" },
            ]}
          />
        </Panel>

        <Panel
          title="Deployment Checklist"
          subtitle={`${readyCount} ready · ${blockedCount} blocked`}
          className="xl:col-span-2"
        >
          <ul className="space-y-4">
            {COMMERCE_LAUNCH_DEPLOYMENT_CHECKLIST.map((item) => (
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
    </div>
  );
}
