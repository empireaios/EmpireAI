"use client";

import { useState } from "react";
import {
  ActionButton,
  Badge,
  Panel,
} from "@/components/platform/ui/PlatformPrimitives";
import type { useOrderFulfillment } from "@/lib/brain/hooks/useOrderFulfillment";
import {
  isLiveFulfillmentEnabled,
} from "@/lib/brain/fulfillment/mode";

type FulfillmentHook = ReturnType<typeof useOrderFulfillment>;

type FulfillmentReadinessPanelProps = {
  fulfillment: FulfillmentHook;
  compact?: boolean;
};

export function FulfillmentReadinessPanel({
  fulfillment,
  compact = false,
}: FulfillmentReadinessPanelProps) {
  const [approvalToken, setApprovalToken] = useState("");
  const [approvedBy, setApprovedBy] = useState("founder@empireai.test");

  const readinessDetails =
    fulfillment.readiness?.readiness ?? fulfillment.preparation?.readiness;
  const draftOrder = fulfillment.draftOrder ?? fulfillment.preparation?.draftOrder;
  const approvalGate = fulfillment.approvalGate ?? fulfillment.preparation?.approvalGate;
  const readinessSummary = fulfillment.readiness;

  async function handlePrepare() {
    fulfillment.clearError();
    await fulfillment.prepareFromManufacturingRun();
  }

  async function handleApprove() {
    fulfillment.clearError();
    await fulfillment.applyApproval({
      approvalToken: approvalToken.trim() || `approval-${Date.now()}`,
      approvedBy: approvedBy.trim(),
      approvedAt: new Date().toISOString(),
    });
  }

  async function handleSandboxSubmit() {
    fulfillment.clearError();
    await fulfillment.submitSandboxOnly();
  }

  const liveEnabled = isLiveFulfillmentEnabled();

  async function handleLiveSubmit() {
    fulfillment.clearError();
    await fulfillment.submitLive();
  }

  return (
    <Panel
      className={compact ? "mt-8" : "mb-8"}
      title="CJ Fulfillment Readiness"
      subtitle={
        liveEnabled
          ? "Approval-gated order preparation — live CJ path"
          : "Approval-gated order preparation — sandbox only"
      }
      action={
        <ActionButton
          variant="secondary"
          disabled={fulfillment.busy}
          onClick={() => void handlePrepare()}
        >
          {fulfillment.phase === "preparing" ? "Preparing…" : "Prepare fulfillment"}
        </ActionButton>
      }
    >
      <div className="space-y-5 p-5">
        {!liveEnabled ? (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-200">
            Live order submission is disabled. Sandbox only.
          </div>
        ) : (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-200">
            Live CJ fulfillment path enabled — founder approval required before submit.
          </div>
        )}

        {!fulfillment.hasSession && fulfillment.phase === "idle" && (
          <p className="text-sm text-[#8a847a]">
            Run <strong className="text-[#c8c0b0]">Prepare fulfillment</strong> to
            evaluate CJ readiness from the latest manufacturing run.
          </p>
        )}

        {readinessDetails && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Metric
              label="Readiness"
              value={readinessDetails.ready ? "Ready" : "Not ready"}
              ready={readinessDetails.ready}
            />
            <Metric
              label="Est. cost"
              value={
                draftOrder
                  ? `${draftOrder.currency} ${draftOrder.estimatedCost.toFixed(2)}`
                  : readinessSummary
                    ? `${readinessSummary.currency} ${readinessSummary.estimatedCost.toFixed(2)}`
                    : "—"
              }
            />
            <Metric
              label="Est. delivery"
              value={
                draftOrder
                  ? `${draftOrder.estimatedDeliveryDaysMin}–${draftOrder.estimatedDeliveryDaysMax} days`
                  : readinessSummary
                    ? `${readinessSummary.estimatedDeliveryDaysMin}–${readinessSummary.estimatedDeliveryDaysMax} days`
                    : "—"
              }
            />
            <Metric label="Mode" value={readinessDetails.integrationMode} />
          </div>
        )}

        {readinessDetails && !readinessDetails.ready && readinessDetails.issues.length > 0 && (
          <IssueList title="Readiness issues" items={readinessDetails.issues} />
        )}

        {fulfillment.preparation?.supplierValidation.issues.length ? (
          <IssueList
            title="Supplier validation"
            items={fulfillment.preparation.supplierValidation.issues}
          />
        ) : null}

        {approvalGate && (
          <div className="rounded-lg border border-gold/10 bg-white/[0.02] p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-medium text-[#c8c0b0]">Approval gate</h3>
              <Badge variant={approvalGate.satisfied ? "success" : "warning"}>
                {approvalGate.satisfied ? "Approved" : "Pending approval"}
              </Badge>
            </div>
            <dl className="grid gap-2 text-xs text-[#8a847a] sm:grid-cols-2">
              <div>
                <dt className="uppercase tracking-wider text-[#6f6a60]">Order status</dt>
                <dd className="text-[#c8c0b0]">{approvalGate.orderStatus}</dd>
              </div>
              <div>
                <dt className="uppercase tracking-wider text-[#6f6a60]">Approved by</dt>
                <dd className="text-[#c8c0b0]">{approvalGate.approvedBy ?? "—"}</dd>
              </div>
            </dl>

            {!approvalGate.satisfied && fulfillment.hasSession && (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="block text-xs text-[#8a847a]">
                  Approval token
                  <input
                    className="mt-1 w-full rounded-lg border border-gold/15 bg-black/20 px-3 py-2 text-sm text-[#f0d78c]"
                    value={approvalToken}
                    onChange={(event) => setApprovalToken(event.target.value)}
                    placeholder="founder-approval-token"
                  />
                </label>
                <label className="block text-xs text-[#8a847a]">
                  Approved by
                  <input
                    className="mt-1 w-full rounded-lg border border-gold/15 bg-black/20 px-3 py-2 text-sm text-[#f0d78c]"
                    value={approvedBy}
                    onChange={(event) => setApprovedBy(event.target.value)}
                    placeholder="founder@empireai.test"
                  />
                </label>
                <div className="sm:col-span-2">
                  <ActionButton
                    variant="secondary"
                    disabled={fulfillment.busy}
                    onClick={() => void handleApprove()}
                  >
                    {fulfillment.phase === "approving" ? "Applying…" : "Apply approval"}
                  </ActionButton>
                </div>
              </div>
            )}
          </div>
        )}

        {draftOrder?.payload && (
          <div className="rounded-lg border border-gold/10 bg-black/20 p-4">
            <h3 className="mb-2 text-sm font-medium text-[#c8c0b0]">Draft order payload</h3>
            <pre className="max-h-64 overflow-auto text-xs leading-relaxed text-[#8a847a]">
              {JSON.stringify(draftOrder.payload, null, 2)}
            </pre>
          </div>
        )}

        {fulfillment.canSandboxSubmit && (
          <div className="flex flex-wrap items-center gap-3">
            <ActionButton disabled={fulfillment.busy} onClick={() => void handleSandboxSubmit()}>
              {fulfillment.phase === "submitting" ? "Submitting sandbox…" : "Submit sandbox order"}
            </ActionButton>
            <span className="text-xs text-[#6f6a60]">No payment · no wallet deduction · no live CJ API</span>
          </div>
        )}

        {fulfillment.canLiveSubmit && (
          <div className="flex flex-wrap items-center gap-3">
            <ActionButton disabled={fulfillment.busy} onClick={() => void handleLiveSubmit()}>
              {fulfillment.phase === "submitting" ? "Submitting live…" : "Submit live CJ order"}
            </ActionButton>
            <span className="text-xs text-[#6f6a60]">Requires production credentials · governed submit</span>
          </div>
        )}

        {fulfillment.submission && (
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
            <div className="mb-2 flex items-center gap-2">
              <Badge variant="success">Sandbox submitted</Badge>
              <span className="text-xs text-emerald-300">{fulfillment.submission.message}</span>
            </div>
            {fulfillment.submission.tracking ? (
              <div className="space-y-2 text-sm text-[#c8c0b0]">
                <p>
                  Tracking:{" "}
                  <span className="font-mono text-[#f0d78c]">
                    {fulfillment.submission.tracking.trackingNumber}
                  </span>{" "}
                  · {fulfillment.submission.tracking.carrier}
                </p>
                <p className="text-xs text-[#8a847a]">
                  Status: {fulfillment.submission.tracking.deliveryStatus} (placeholder sync)
                </p>
                <ul className="space-y-1 text-xs text-[#8a847a]">
                  {fulfillment.submission.tracking.events.map((event) => (
                    <li key={`${event.status}-${event.occurredAt}`}>
                      {event.status}: {event.description}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-xs text-[#8a847a]">Tracking placeholder pending sync.</p>
            )}
          </div>
        )}

        {fulfillment.error && (
          <p className="text-sm text-red-400">{fulfillment.error}</p>
        )}
      </div>
    </Panel>
  );
}

function Metric({
  label,
  value,
  ready,
}: {
  label: string;
  value: string;
  ready?: boolean;
}) {
  return (
    <div className="rounded-lg border border-gold/10 bg-white/[0.02] p-3">
      <p className="text-xs uppercase tracking-wider text-[#6f6a60]">{label}</p>
      <p
        className={`mt-1 font-display text-lg ${
          ready === true ? "text-emerald-400" : ready === false ? "text-amber-300" : "text-[#f0d78c]"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function IssueList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
      <h3 className="mb-2 text-sm font-medium text-red-300">{title}</h3>
      <ul className="list-disc space-y-1 pl-4 text-xs text-red-200/80">
        {items.map((issue) => (
          <li key={issue}>{issue}</li>
        ))}
      </ul>
    </div>
  );
}
