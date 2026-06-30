import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

import { resetDatabaseInstance } from "../../brain/database.js";
import { initializeExecutiveRegistry } from "../../executive-council/services/executive-registry-service.js";
import { resetGkrRepository } from "../../grand-king-revenue-pipeline/index.js";
import { configureValidationEnvironment } from "../harness.js";
import {
  buildEmpireEconomics,
  empireEconomicsTools,
  EMPIRE_ECONOMICS_MISSION_ID,
} from "../../runtime/empire-economics/index.js";
import {
  buildGrandKingFinancialCommandCenter,
  grandKingFinancialCommandCenterTools,
  GRAND_KING_FINANCIAL_COMMAND_CENTER_MISSION_ID,
} from "../../runtime/grand-king-financial-command-center/index.js";
import {
  buildFounderPlatformPreparation,
  founderPlatformPreparationTools,
  FOUNDER_PLATFORM_PREPARATION_MISSION_ID,
} from "../../runtime/founder-platform-preparation/index.js";
import {
  buildAiSelfImprovementEngine,
  aiSelfImprovementEngineTools,
  AI_SELF_IMPROVEMENT_ENGINE_MISSION_ID,
} from "../../runtime/ai-self-improvement-engine/index.js";
import {
  buildVersion2BacklogEngine,
  resetVersion2BacklogStore,
  version2BacklogEngineTools,
  VERSION_2_BACKLOG_ENGINE_MISSION_ID,
} from "../../runtime/version-2-backlog-engine/index.js";
import {
  buildVersion1ReadinessAudit,
  version1ReadinessAuditTools,
  VERSION_1_READINESS_AUDIT_MISSION_ID,
} from "../../runtime/version-1-readiness-audit/index.js";
import {
  buildVersion1Lockdown,
  version1LockdownTools,
  VERSION_1_LOCKDOWN_MISSION_ID,
} from "../../runtime/version-1-lockdown/index.js";

const WORKSPACE_ID = "ws-v1-001";
const COMPANY_ID = "co-grand-king";

describe("Version 1 Completion Package (REAL-019→REAL-025)", () => {
  beforeEach(() => {
    configureValidationEnvironment();
    resetDatabaseInstance();
    resetGkrRepository();
    resetVersion2BacklogStore();
  });

  afterEach(() => {
    resetGkrRepository();
    resetVersion2BacklogStore();
    resetDatabaseInstance();
  });

  it("REAL-019 — empire economics tracks costs and net profit", () => {
    initializeExecutiveRegistry(WORKSPACE_ID, COMPANY_ID);
    const econ = buildEmpireEconomics(WORKSPACE_ID, COMPANY_ID);
    assert.equal(econ.missionId, EMPIRE_ECONOMICS_MISSION_ID);
    assert.ok(econ.costBreakdown.length >= 8);
    assert.ok(econ.monthlyRecurringCostUsd >= 0);
    assert.equal(econ.architectureComplete, true);
    assert.ok(econ.costBreakdown.some((c) => c.provider === "vercel"));
  });

  it("REAL-020 — Grand King financial command center", () => {
    initializeExecutiveRegistry(WORKSPACE_ID, COMPANY_ID);
    const fin = buildGrandKingFinancialCommandCenter(WORKSPACE_ID, COMPANY_ID);
    assert.equal(fin.missionId, GRAND_KING_FINANCIAL_COMMAND_CENTER_MISSION_ID);
    assert.ok(fin.economics.moduleId === "empire-economics");
    assert.ok(Array.isArray(fin.revenueByCountry));
    assert.ok(fin.executiveRecommendations.length > 0);
  });

  it("REAL-021 — founder platform separate from Grand King", () => {
    const fp = buildFounderPlatformPreparation(WORKSPACE_ID, COMPANY_ID);
    assert.equal(fp.missionId, FOUNDER_PLATFORM_PREPARATION_MISSION_ID);
    assert.equal(fp.neverMergeWithGrandKing, true);
    assert.equal(fp.grandKingRemainsUnique, true);
    assert.ok(fp.surfaces.every((s) => s.grandKingSeparated));
  });

  it("REAL-022 — AI self-improvement recommends only", () => {
    const ai = buildAiSelfImprovementEngine(WORKSPACE_ID, COMPANY_ID);
    assert.equal(ai.missionId, AI_SELF_IMPROVEMENT_ENGINE_MISSION_ID);
    assert.ok(ai.suggestions.every((s) => s.selfModifyBlocked === true));
    assert.ok(ai.architectureSuggestions.length > 0);
  });

  it("REAL-023 — version 2 backlog preserves King discussions", () => {
    const backlog = buildVersion2BacklogEngine(WORKSPACE_ID, COMPANY_ID);
    assert.equal(backlog.missionId, VERSION_2_BACKLOG_ENGINE_MISSION_ID);
    assert.ok(backlog.entries.length >= 5);
    assert.ok(backlog.entries.some((e) => e.uxImpact.toLowerCase().includes("navigation") || e.reason.toLowerCase().includes("navigation")));
  });

  it("REAL-024 — version 1 readiness audit", () => {
    initializeExecutiveRegistry(WORKSPACE_ID, COMPANY_ID);
    const audit = buildVersion1ReadinessAudit(WORKSPACE_ID, COMPANY_ID);
    assert.equal(audit.missionId, VERSION_1_READINESS_AUDIT_MISSION_ID);
    assert.ok(audit.version1ReadinessScore >= 50);
    assert.equal(audit.dimensions.length, 10);
    assert.ok(audit.productionRecommendation.length > 0);
  });

  it("REAL-025 — version 1 lockdown baseline", () => {
    initializeExecutiveRegistry(WORKSPACE_ID, COMPANY_ID);
    const lock = buildVersion1Lockdown(WORKSPACE_ID, COMPANY_ID);
    assert.equal(lock.missionId, VERSION_1_LOCKDOWN_MISSION_ID);
    assert.equal(lock.baseline.version, "1.0.0");
    assert.equal(lock.baseline.versionLock.locked, true);
    assert.ok(lock.baseline.databaseInventory.length > 0);
    assert.ok(lock.baseline.apiInventory.length > 0);
  });

  it("Brain tools registered for V1 completion modules", () => {
    assert.ok(empireEconomicsTools.some((t) => t.name === "empire_economics.dashboard"));
    assert.ok(grandKingFinancialCommandCenterTools.some((t) => t.name === "grand_king_financial_command_center.dashboard"));
    assert.ok(founderPlatformPreparationTools.some((t) => t.name === "founder_platform_preparation.dashboard"));
    assert.ok(aiSelfImprovementEngineTools.some((t) => t.name === "ai_self_improvement_engine.dashboard"));
    assert.ok(version2BacklogEngineTools.some((t) => t.name === "version_2_backlog_engine.dashboard"));
    assert.ok(version1ReadinessAuditTools.some((t) => t.name === "version_1_readiness_audit.dashboard"));
    assert.ok(version1LockdownTools.some((t) => t.name === "version_1_lockdown.baseline"));
  });
});
