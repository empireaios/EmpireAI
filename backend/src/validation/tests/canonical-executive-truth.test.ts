import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildCanonicalExecutiveTruth } from "../../domain/services/canonical-executive-truth.js";

function baseCommand(overrides: Record<string, unknown> = {}) {
  return {
    certificationBlockers: {},
    operationalReadiness: { percent: 60, passed: false, detail: "partial" },
    proof001: {
      achieved: false,
      progressPercent: 40,
      stagesPassed: 2,
      totalStages: 5,
      detail: "in progress",
    },
    oms: {
      activeObjective: "Awaiting implementation",
      progress: 0,
      overallHealth: "YELLOW",
      nextHighestImpactAction: null,
    },
    pendingApprovals: { count: 0, top: null },
    success001: { currentNetProfitUsd: 0, progressPercent: 0 },
    ...overrides,
  } as never;
}

describe("canonical executive truth", () => {
  it("treats awaiting implementation as no active mission", () => {
    const truth = buildCanonicalExecutiveTruth({
      workspaceId: "ws_test",
      command: baseCommand(),
      portfolio: {
        portfolioMetrics: [{ label: "Portfolio Revenue", value: "$1.63M", change: "+18.4%" }],
        companies: [
          { id: "1", name: "Meridian Commerce", status: "live", revenue: "$428k" },
          { id: "2", name: "Atlas Fintech", status: "live", revenue: "$891k" },
        ],
        recentActivity: [],
      } as never,
      engineSummaries: [{ engineId: "storefront", displayName: "Store", health: "HEALTHY", progress: { percent: 1, label: "ok" } }] as never,
      pillowPendingApprovals: 0,
      nextExecutiveAction: "Continue",
    });
    assert.equal(truth.activeMissionHuman, "No active mission");
    assert.equal(truth.openMissionCount, 0);
    assert.equal(truth.realisedProfitUsd, 0);
    assert.equal(truth.seedPortfolioExcludedFromLiveEconomics, true);
    assert.ok(!/\$1\.63M/.test(JSON.stringify(truth)));
  });

  it("counts commerce opportunity as pending approval", () => {
    // Without live repo opportunity this stays 0; count still uses max(command, pillow).
    const truth = buildCanonicalExecutiveTruth({
      workspaceId: "ws_test",
      command: baseCommand({
        pendingApprovals: {
          count: 1,
          top: { approvalId: "a1", title: "Approve listing", summary: "x", type: "commerce" },
        },
        oms: {
          activeObjective: "First-dollar commerce",
          progress: 40,
          overallHealth: "GREEN",
          nextHighestImpactAction: "Approve",
        },
      }),
      portfolio: { portfolioMetrics: [], companies: [], recentActivity: [] } as never,
      engineSummaries: [],
      pillowPendingApprovals: 1,
      nextExecutiveAction: "Approve opportunity",
    });
    assert.equal(truth.pendingApprovals, 1);
    assert.equal(truth.activeMissionTitle, "First-dollar commerce");
    assert.ok(truth.grandKingAttention.length >= 1);
  });
});
