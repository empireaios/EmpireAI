import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildExecutiveHomeBrief,
  buildExecutiveHomeCentreSummaries,
  enrichExecutiveHomeViewP704,
} from "../../domain/services/executive-home-p7-04.js";
import { loadExecutiveHomeView } from "../../domain/services/cockpit-panel-views.js";
import { configureValidationEnvironment } from "../harness.js";

configureValidationEnvironment();

describe("P7-04 — Executive Home", () => {
  it("loads executive home view with P7-04 architecture fields", () => {
    const view = loadExecutiveHomeView("ws-foundation");
    assert.equal(view.architectureVersion, "P7-04");
    assert.ok(view.executiveBrief.overallEmpireStatus);
    assert.ok(view.executiveBrief.currentRecommendation);
    assert.ok(view.centreSummaries.mission.currentMission);
    assert.ok(view.centreSummaries.business.href);
    assert.ok(view.centreSummaries.production.href);
    assert.equal(view.centreSummaries.mission.href, "/cockpit/missions");
  });

  it("builds executive brief with risk and recommendation", () => {
    const view = loadExecutiveHomeView("ws-foundation");
    const brief = buildExecutiveHomeBrief({
      command: view.command,
      summaryCards: view.summaryCards,
      nextExecutiveAction: view.nextExecutiveAction,
      executiveAlerts: view.executiveAlerts,
    });
    assert.ok(brief.highestPriorityRisk);
    assert.ok(brief.currentStrategicObjective);
    assert.equal(brief.currentRecommendation, view.nextExecutiveAction);
  });

  it("builds centre summaries for all four centres", () => {
    const view = loadExecutiveHomeView("ws-foundation");
    const centres = buildExecutiveHomeCentreSummaries({
      command: view.command,
      portfolio: view.portfolio,
      summaryCards: view.summaryCards,
      engineSummaries: view.engineSummaries,
      nextExecutiveAction: view.nextExecutiveAction,
      executiveAlerts: view.executiveAlerts,
      pendingApprovals: view.command.pendingApprovals.count,
    });
    assert.ok(centres.pillow.recommendations.length >= 1);
    assert.ok(centres.mission.dependencies.length >= 4);
    assert.equal(typeof centres.business.activeBusinesses, "number");
    assert.ok(Array.isArray(centres.production.currentIncidents));
  });

  it("enriches partial views with P7-04 fields", () => {
    const view = loadExecutiveHomeView("ws-foundation");
    const { architectureVersion, executiveBrief, centreSummaries, ...base } = view;
    void architectureVersion;
    void executiveBrief;
    void centreSummaries;
    const enriched = enrichExecutiveHomeViewP704(base);
    assert.equal(enriched.architectureVersion, "P7-04");
    assert.ok(enriched.executiveBrief);
    assert.ok(enriched.centreSummaries);
  });
});
