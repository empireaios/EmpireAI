import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchExecutiveCouncilHeadquarters,
  fetchGrandKingRevenuePipelineHeadquarters,
  fetchSuccess001CommandCenterDashboard,
} from "@/api/dashboard";
import { brainDispatch } from "@/api/dispatch";
import { GRAND_KING_COMPANY_ID } from "@/config/constants";
import { buildApprovalQueue, type ApprovalQueueItem } from "@/lib/approval-queue";
import { extractSuccess001Blocker } from "@/lib/success001-blocker";
import { paths } from "@/routes/paths";

export type ApprovalVerdict = "approved" | "rejected" | "deferred";

const VERDICT_DECISION: Record<ApprovalVerdict, string> = {
  approved: "APPROVED",
  rejected: "REJECTED",
  deferred: "DEFERRED",
};

export function useFounderGovernanceChrome(enabled: boolean) {
  const [loading, setLoading] = useState(enabled);
  const [success001, setSuccess001] = useState<Record<string, unknown> | null>(null);
  const [executiveCouncil, setExecutiveCouncil] = useState<Record<string, unknown> | null>(null);
  const [grandKingRevenuePipeline, setGrandKingRevenuePipeline] = useState<Record<string, unknown> | null>(null);
  const [sessionVerdicts, setSessionVerdicts] = useState<Record<string, ApprovalVerdict>>({});

  const reload = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    try {
      const [s1Res, ecRes, gkrRes] = await Promise.all([
        fetchSuccess001CommandCenterDashboard().catch(() => null),
        fetchExecutiveCouncilHeadquarters().catch(() => null),
        fetchGrandKingRevenuePipelineHeadquarters().catch(() => null),
      ]);
      setSuccess001(s1Res?.dashboard ?? null);
      setExecutiveCouncil(ecRes?.dashboard ?? null);
      setGrandKingRevenuePipeline(gkrRes?.dashboard ?? null);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const allItems = useMemo(
    () =>
      buildApprovalQueue(
        { executiveCouncil, success001, grandKingRevenuePipeline },
        {
          debate: paths.dashboard.debate,
          success001: paths.dashboard.success001,
          command: paths.dashboard.command,
        },
      ),
    [executiveCouncil, success001, grandKingRevenuePipeline],
  );

  const pendingItems = useMemo(
    () => allItems.filter((item) => !sessionVerdicts[item.id]),
    [allItems, sessionVerdicts],
  );

  const blockerText = useMemo(() => extractSuccess001Blocker(success001), [success001]);

  const recordVerdict = useCallback(
    (item: ApprovalQueueItem, verdict: ApprovalVerdict) => {
      setSessionVerdicts((prev) => ({ ...prev, [item.id]: verdict }));
      void brainDispatch("decision-registry", "record", GRAND_KING_COMPANY_ID, {
        decisionId: `approval-${item.id}`,
        title: item.title,
        category: "strategic",
        decision: VERDICT_DECISION[verdict],
        reason: item.detail ?? "Grand King verdict via GC-02 Approval Bar",
        approver: "Grand King",
        actor: "grand-king",
        metadata: { source: item.source, surface: "GC-02" },
      }).catch(() => undefined);
    },
    [],
  );

  return {
    loading,
    pendingItems,
    pendingCount: pendingItems.length,
    topItem: pendingItems[0] ?? null,
    blockerText,
    recordVerdict,
    reload,
  };
}
