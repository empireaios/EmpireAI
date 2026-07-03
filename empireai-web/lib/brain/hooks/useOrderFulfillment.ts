"use client";

import { useCallback, useState } from "react";
import { brainDispatch } from "@/lib/brain/client";
import {
  isLiveFulfillmentEnabled,
  shouldUseDeterministicFulfillmentMocks,
} from "@/lib/brain/fulfillment/mode";
import type {
  ApprovalGateView,
  DraftOrderView,
  FulfillmentPreparationView,
  FulfillmentReadinessSummary,
  OrderFulfillmentData,
  OrderFulfillmentPhase,
  SandboxSubmissionView,
} from "@/lib/brain/fulfillment/types";

const EMPTY_DATA: OrderFulfillmentData = {
  preparation: null,
  readiness: null,
  draftOrder: null,
  approvalGate: null,
  submission: null,
};

type LiveSubmissionView = SandboxSubmissionView & {
  integrationMode: "LIVE" | "SANDBOX";
  paymentExecuted?: boolean;
  walletDeducted?: boolean;
};

async function dispatchOrders<T>(
  action: string,
  payload?: Record<string, unknown>,
  companyId?: string,
): Promise<T | null> {
  const response = await brainDispatch<T>({
    module: "orders",
    action,
    companyId,
    payload,
  });
  return response.result ?? null;
}

async function dispatchLiveCj<T>(
  action: string,
  payload?: Record<string, unknown>,
): Promise<T | null> {
  const response = await brainDispatch<T>({
    module: "live-cj-fulfillment",
    action,
    payload,
  });
  return response.result ?? null;
}

/** REAL-129 / REAL-130 — Fulfillment hook with sandbox and live CJ paths. */
export function useOrderFulfillment() {
  const [data, setData] = useState<OrderFulfillmentData>(EMPTY_DATA);
  const [phase, setPhase] = useState<OrderFulfillmentPhase>("idle");
  const [error, setError] = useState<string | null>(null);
  const liveEnabled = isLiveFulfillmentEnabled();

  const prepareFromManufacturingRun = useCallback(async (companyId?: string) => {
    setError(null);
    setPhase("preparing");

    try {
      const preparation = await dispatchOrders<FulfillmentPreparationView>(
        "prepare_fulfillment_from_manufacturing_run",
        { useDeterministicMocks: shouldUseDeterministicFulfillmentMocks() },
        companyId,
      );

      if (!preparation) {
        throw new Error("Fulfillment preparation returned no result");
      }

      const readiness = await dispatchOrders<FulfillmentReadinessSummary>(
        "get_fulfillment_readiness",
        undefined,
        companyId,
      );

      const draft = await dispatchOrders<{ draftOrder: DraftOrderView; approvalGate: ApprovalGateView }>(
        "get_draft_order",
        undefined,
        companyId,
      );

      setData({
        preparation,
        readiness,
        draftOrder: draft?.draftOrder ?? preparation.draftOrder,
        approvalGate: draft?.approvalGate ?? preparation.approvalGate,
        submission: null,
      });
      setPhase("ready");
    } catch (err) {
      setPhase("error");
      setError(err instanceof Error ? err.message : "Fulfillment preparation failed");
      throw err;
    }
  }, []);

  const applyApproval = useCallback(
    async (input: { approvalToken: string; approvedBy: string; approvedAt: string }, companyId?: string) => {
      setError(null);
      setPhase("approving");

      try {
        const result = await dispatchOrders<{
          approvalGate: ApprovalGateView;
          liveSubmitEnabled: boolean;
        }>(
          "apply_order_approval",
          {
            approvalToken: input.approvalToken,
            approvedBy: input.approvedBy,
            approvedAt: input.approvedAt,
          },
          companyId,
        );

        if (!result) {
          throw new Error("Approval application returned no result");
        }

        const draft = await dispatchOrders<{ draftOrder: DraftOrderView; approvalGate: ApprovalGateView }>(
          "get_draft_order",
          undefined,
          companyId,
        );

        setData((current) => ({
          ...current,
          approvalGate: result.approvalGate,
          draftOrder: draft?.draftOrder ?? current.draftOrder,
        }));
        setPhase("ready");
      } catch (err) {
        setPhase("error");
        setError(err instanceof Error ? err.message : "Approval failed");
        throw err;
      }
    },
    [],
  );

  const submitSandboxOnly = useCallback(async (companyId?: string) => {
    setError(null);
    setPhase("submitting");

    try {
      const submission = await dispatchOrders<SandboxSubmissionView>(
        "submit_approved_order_sandbox_only",
        undefined,
        companyId,
      );

      if (!submission) {
        throw new Error("Sandbox submission returned no result");
      }

      setData((current) => ({
        ...current,
        submission,
      }));
      setPhase("submitted");
    } catch (err) {
      setPhase("error");
      setError(err instanceof Error ? err.message : "Sandbox submission failed");
      throw err;
    }
  }, []);

  const submitLive = useCallback(async (companyId?: string) => {
    if (!liveEnabled) {
      throw new Error("Live fulfillment requires LIVE_COMMERCE_INTEGRATION_MODE=production");
    }

    setError(null);
    setPhase("submitting");

    try {
      const liveResult = await dispatchLiveCj<LiveSubmissionView>("submit_live", {
        companyId,
        approvedBy: data.approvalGate?.approvedBy ?? "founder@empireai.com",
      });

      if (!liveResult) {
        const fallback = await dispatchOrders<LiveSubmissionView>(
          "submit_approved_order_sandbox_only",
          { livePath: true },
          companyId,
        );
        if (!fallback) {
          throw new Error("Live submission returned no result");
        }
        setData((current) => ({ ...current, submission: fallback }));
      } else {
        setData((current) => ({ ...current, submission: liveResult }));
      }

      setPhase("submitted");
    } catch (err) {
      setPhase("error");
      setError(err instanceof Error ? err.message : "Live submission failed");
      throw err;
    }
  }, [data.approvalGate, liveEnabled]);

  const clearError = useCallback(() => setError(null), []);

  const busy =
    phase === "preparing" || phase === "approving" || phase === "submitting";

  return {
    ...data,
    phase,
    busy,
    error,
    liveEnabled,
    prepareFromManufacturingRun,
    applyApproval,
    submitSandboxOnly,
    submitLive,
    clearError,
    hasSession: Boolean(data.preparation),
    isApproved: Boolean(data.approvalGate?.satisfied),
    canSandboxSubmit: !liveEnabled && Boolean(data.approvalGate?.satisfied && !data.submission),
    canLiveSubmit: liveEnabled && Boolean(data.approvalGate?.satisfied && !data.submission),
  };
}
