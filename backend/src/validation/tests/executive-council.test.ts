import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

import { resetDatabaseInstance } from "../../brain/database.js";
import {
  initializeExecutiveRegistry,
  runExecutiveDebate,
  generateExecutiveMissions,
  buildExecutiveHeadquartersDashboard,
  recordExecutiveAccountability,
  updateExecutiveCertification,
  DEFAULT_EXECUTIVES,
  resetExecutiveCouncilRepository,
} from "../../executive-council/index.js";
import { configureValidationEnvironment } from "../harness.js";

const WORKSPACE_ID = "ws-ec001";
const COMPANY_ID = "co-grand-king";

describe("Executive Council (EC-001–EC-010)", () => {
  beforeEach(() => {
    configureValidationEnvironment();
    resetDatabaseInstance();
    resetExecutiveCouncilRepository();
  });

  afterEach(() => {
    resetExecutiveCouncilRepository();
    resetDatabaseInstance();
  });

  it("EC-001/EC-002 — core runtime and registry seed 20 executives", () => {
    const executives = initializeExecutiveRegistry(WORKSPACE_ID, COMPANY_ID);
    assert.equal(executives.length, DEFAULT_EXECUTIVES.length);
    assert.ok(executives.some((e) => e.title === "Chief Executive Officer"));
    assert.ok(executives.some((e) => e.title === "Chief Experiment Officer"));
    assert.ok(executives.every((e) => e.certificationStatus));
  });

  it("EC-003 — debate engine produces opinions with consensus outcome", () => {
    initializeExecutiveRegistry(WORKSPACE_ID, COMPANY_ID);
    const session = runExecutiveDebate(WORKSPACE_ID, COMPANY_ID, {
      topic: "Launch wireless earbuds globally",
      subjectType: "product",
      summary: "CIS reviewed product with strong commercial scores; margin 72%, shipping 18 days.",
      metrics: { marginPercent: 72, aggregateScore: 78 },
    });

    assert.ok(session.opinions.length >= 15);
    assert.ok(session.opinions.every((o) => o.confidence >= 0 && o.confidence <= 100));
    assert.ok(session.opinions.every((o) => o.reasoning.length > 0));
    assert.ok(session.opinions.every((o) => o.supportingEvidence.length >= 1));
    assert.ok(session.opinions.every((o) => o.risks.length >= 1));
    assert.ok(session.opinions.every((o) => o.expectedOutcome.length > 0));
    assert.ok(["CONSENSUS", "MAJORITY", "SPLIT_DECISION", "CONFLICT", "ESCALATION_REQUIRED"].includes(session.consensus));
    assert.ok(session.decision?.awaitingSoulApproval);
  });

  it("EC-007/EC-008 — accountability and certification update executive quality", () => {
    initializeExecutiveRegistry(WORKSPACE_ID, COMPANY_ID);
    const session = runExecutiveDebate(WORKSPACE_ID, COMPANY_ID, {
      topic: "Supplier reliability review",
      subjectType: "supplier",
      summary: "Evaluate CJ Dropshipping lead times for core SKUs.",
    });
    const opinion = session.opinions[0]!;

    recordExecutiveAccountability(WORKSPACE_ID, COMPANY_ID, {
      executiveId: opinion.executiveId,
      recommendationId: opinion.opinionId,
      sessionId: session.sessionId,
      predictedOutcome: opinion.expectedOutcome,
      outcome: "CORRECT",
      commercialResult: "Margin preserved",
      confidenceAtRecommendation: opinion.confidence,
    });

    const certified = updateExecutiveCertification(WORKSPACE_ID, COMPANY_ID, opinion.executiveId, "ACTIVE", "ESTABLISHED");
    assert.ok(certified);
    assert.equal(certified!.certificationStatus, "ACTIVE");
  });

  it("EC-009 — mission generator produces King's daily missions", () => {
    initializeExecutiveRegistry(WORKSPACE_ID, COMPANY_ID);
    runExecutiveDebate(WORKSPACE_ID, COMPANY_ID, {
      topic: "Amazon US listing expansion",
      subjectType: "marketplace",
      summary: "Product ready for Amazon marketplace launch.",
    });
    const missions = generateExecutiveMissions(WORKSPACE_ID, COMPANY_ID);

    assert.ok(missions.length >= 5);
    assert.ok(missions.every((m) => m.awaitingKingApproval));
    assert.ok(missions.some((m) => m.type === "STRATEGIC_OPPORTUNITY"));
    assert.ok(missions.some((m) => m.type === "MARKETPLACE_OPPORTUNITY"));
  });

  it("EC-005/EC-010 — Executive Headquarters dashboard is primary mission control payload", () => {
    initializeExecutiveRegistry(WORKSPACE_ID, COMPANY_ID);
    runExecutiveDebate(WORKSPACE_ID, COMPANY_ID, {
      topic: "Premium brand positioning",
      subjectType: "general",
      summary: "Council review of brand strategy for Q3.",
    });
    generateExecutiveMissions(WORKSPACE_ID, COMPANY_ID);

    const dashboard = buildExecutiveHeadquartersDashboard(WORKSPACE_ID, COMPANY_ID);

    assert.equal(dashboard.moduleId, "executive-council");
    assert.equal(dashboard.missionId, "EC-001-EC-010");
    assert.ok(dashboard.ceoBriefing.length > 0);
    assert.equal(dashboard.executiveCouncil.totalExecutives, 20);
    assert.ok(dashboard.currentDebate);
    assert.ok(dashboard.commercialConfidence >= 0);
    assert.ok(dashboard.workflow.length === 8);
    assert.ok(dashboard.generatedMissions.length >= 1);
  });
});
