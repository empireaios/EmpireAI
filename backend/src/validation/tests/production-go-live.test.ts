import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

import { resetDatabaseInstance } from "../../brain/database.js";
import { resetGkrRepository } from "../../grand-king-revenue-pipeline/index.js";
import { configureValidationEnvironment } from "../harness.js";
import {
  buildGrandKingLiveOperationsMode,
  resetOperationsModeStore,
  GRAND_KING_LIVE_OPERATIONS_MODE_MISSION_ID,
  grandKingLiveOperationsModeTools,
} from "../../runtime/grand-king-live-operations-mode/index.js";
import {
  buildGlobalOperationalCommandCenter,
  GLOBAL_OPERATIONAL_COMMAND_CENTER_MISSION_ID,
  globalOperationalCommandCenterTools,
} from "../../runtime/global-operational-command-center/index.js";
import {
  buildGlobalAdvertisingIntelligence,
  GLOBAL_ADVERTISING_INTELLIGENCE_MISSION_ID,
  globalAdvertisingIntelligenceTools,
} from "../../runtime/global-advertising-intelligence/index.js";
import {
  buildFirstOrderOperations,
  FIRST_ORDER_OPERATIONS_MISSION_ID,
  firstOrderOperationsTools,
} from "../../runtime/first-order-operations/index.js";
import {
  buildGlobalOrderIntelligence,
  GLOBAL_ORDER_INTELLIGENCE_MISSION_ID,
  globalOrderIntelligenceTools,
} from "../../runtime/global-order-intelligence/index.js";
import {
  buildPostPurchaseIntelligence,
  POST_PURCHASE_INTELLIGENCE_MISSION_ID,
  postPurchaseIntelligenceTools,
} from "../../runtime/post-purchase-intelligence/index.js";
import {
  buildGlobalKnowledgeEvolution,
  GLOBAL_KNOWLEDGE_EVOLUTION_MISSION_ID,
  globalKnowledgeEvolutionTools,
} from "../../runtime/global-knowledge-evolution/index.js";
import {
  buildAiStrategicMemory,
  AI_STRATEGIC_MEMORY_MISSION_ID,
  aiStrategicMemoryTools,
} from "../../runtime/ai-strategic-memory/index.js";
import {
  buildEmpirePlaybookEngine,
  EMPIRE_PLAYBOOK_ENGINE_MISSION_ID,
  empirePlaybookEngineTools,
} from "../../runtime/empire-playbook-engine/index.js";
import {
  buildGlobalRiskCommand,
  GLOBAL_RISK_COMMAND_MISSION_ID,
  globalRiskCommandTools,
} from "../../runtime/global-risk-command/index.js";
import {
  buildFounderPlatformReadiness,
  FOUNDER_PLATFORM_READINESS_MISSION_ID,
  founderPlatformReadinessTools,
} from "../../runtime/founder-platform-readiness/index.js";
import {
  buildProductionHardening,
  PRODUCTION_HARDENING_MISSION_ID,
  productionHardeningTools,
} from "../../runtime/production-hardening/index.js";
import {
  buildVersion1AcceptanceTest,
  VERSION_1_ACCEPTANCE_TEST_MISSION_ID,
  version1AcceptanceTestTools,
} from "../../runtime/version-1-acceptance-test/index.js";
import {
  buildGrandKingGoLiveChecklist,
  GRAND_KING_GO_LIVE_CHECKLIST_MISSION_ID,
  grandKingGoLiveChecklistTools,
} from "../../runtime/grand-king-go-live-checklist/index.js";
import {
  buildVersion1GoldMaster,
  VERSION_1_GOLD_MASTER_MISSION_ID,
  version1GoldMasterTools,
} from "../../runtime/version-1-gold-master/index.js";

const WORKSPACE_ID = "ws-pgl-001";
const COMPANY_ID = "co-grand-king";

describe("V1 Production + Go-Live (REAL-036→REAL-050)", () => {
  beforeEach(() => {
    configureValidationEnvironment();
    resetDatabaseInstance();
    resetGkrRepository();
    resetOperationsModeStore();
  });

  afterEach(() => {
    resetGkrRepository();
    resetOperationsModeStore();
    resetDatabaseInstance();
  });

  it("REAL-036 — live operations mode", () => {
    const dash = buildGrandKingLiveOperationsMode(WORKSPACE_ID, COMPANY_ID);
    assert.equal(dash.missionId, GRAND_KING_LIVE_OPERATIONS_MODE_MISSION_ID);
    assert.equal(dash.transitionRequires.grandKingApproval, true);
    assert.ok(dash.availableModes.includes("PRODUCTION"));
  });

  it("REAL-037 — global operational command center", () => {
    const hq = buildGlobalOperationalCommandCenter(WORKSPACE_ID, COMPANY_ID);
    assert.equal(hq.missionId, GLOBAL_OPERATIONAL_COMMAND_CENTER_MISSION_ID);
    assert.ok(hq.reusedModules.length >= 5);
    assert.ok(hq.morningBrief.length > 0);
  });

  it("REAL-038 — advertising intelligence recommend only", () => {
    const ads = buildGlobalAdvertisingIntelligence(WORKSPACE_ID, COMPANY_ID);
    assert.equal(ads.missionId, GLOBAL_ADVERTISING_INTELLIGENCE_MISSION_ID);
    assert.equal(ads.recommendOnly, true);
    assert.equal(ads.platforms.length, 7);
  });

  it("REAL-039 — first order milestones", () => {
    const fo = buildFirstOrderOperations(WORKSPACE_ID, COMPANY_ID);
    assert.equal(fo.missionId, FIRST_ORDER_OPERATIONS_MISSION_ID);
    assert.equal(fo.milestones.length, 7);
  });

  it("REAL-040 — global order intelligence", () => {
    const oi = buildGlobalOrderIntelligence(WORKSPACE_ID, COMPANY_ID);
    assert.equal(oi.missionId, GLOBAL_ORDER_INTELLIGENCE_MISSION_ID);
    assert.ok(Array.isArray(oi.orders));
  });

  it("REAL-041 — post purchase intelligence", () => {
    const pp = buildPostPurchaseIntelligence(WORKSPACE_ID, COMPANY_ID);
    assert.equal(pp.missionId, POST_PURCHASE_INTELLIGENCE_MISSION_ID);
    assert.ok(pp.recommendations.length > 0);
  });

  it("REAL-042 — global knowledge evolution", () => {
    const ke = buildGlobalKnowledgeEvolution(WORKSPACE_ID, COMPANY_ID);
    assert.equal(ke.missionId, GLOBAL_KNOWLEDGE_EVOLUTION_MISSION_ID);
    assert.ok(ke.learningSources.length >= 5);
  });

  it("REAL-043 — AI strategic memory", () => {
    const sm = buildAiStrategicMemory(WORKSPACE_ID, COMPANY_ID);
    assert.equal(sm.missionId, AI_STRATEGIC_MEMORY_MISSION_ID);
    assert.ok(sm.categories.length > 0);
  });

  it("REAL-044 — empire playbook engine", () => {
    const pb = buildEmpirePlaybookEngine(WORKSPACE_ID, COMPANY_ID);
    assert.equal(pb.missionId, EMPIRE_PLAYBOOK_ENGINE_MISSION_ID);
    assert.equal(pb.executiveReferenceOnly, true);
    assert.ok(pb.playbooks.length >= 8);
  });

  it("REAL-045 — global risk command", () => {
    const risk = buildGlobalRiskCommand(WORKSPACE_ID, COMPANY_ID);
    assert.equal(risk.missionId, GLOBAL_RISK_COMMAND_MISSION_ID);
    assert.equal(risk.dimensions.length, 9);
  });

  it("REAL-046 — founder platform readiness", () => {
    const fp = buildFounderPlatformReadiness(WORKSPACE_ID, COMPANY_ID);
    assert.equal(fp.missionId, FOUNDER_PLATFORM_READINESS_MISSION_ID);
    assert.equal(fp.grandKingRemainsPlatformOwner, true);
    assert.equal(fp.foundersAreTenants, true);
  });

  it("REAL-047 — production hardening", () => {
    const ph = buildProductionHardening(WORKSPACE_ID, COMPANY_ID);
    assert.equal(ph.missionId, PRODUCTION_HARDENING_MISSION_ID);
    assert.ok(ph.moduleCount > 0);
  });

  it("REAL-048 — version 1 acceptance test", () => {
    const acc = buildVersion1AcceptanceTest(WORKSPACE_ID, COMPANY_ID);
    assert.equal(acc.missionId, VERSION_1_ACCEPTANCE_TEST_MISSION_ID);
    assert.equal(acc.acceptanceReport.passed, true);
    assert.ok(acc.acceptanceReport.overallScore >= 90);
  });

  it("REAL-049 — Grand King go-live checklist", () => {
    const cl = buildGrandKingGoLiveChecklist(WORKSPACE_ID, COMPANY_ID);
    assert.equal(cl.missionId, GRAND_KING_GO_LIVE_CHECKLIST_MISSION_ID);
    assert.ok(cl.checklists.length >= 8);
  });

  it("REAL-050 — version 1 gold master", () => {
    const gold = buildVersion1GoldMaster(WORKSPACE_ID, COMPANY_ID);
    assert.equal(gold.missionId, VERSION_1_GOLD_MASTER_MISSION_ID);
    assert.equal(gold.version, "1.0.0-gold");
    assert.equal(gold.versionLock.locked, true);
    assert.ok(gold.version1Certificate.certificateId.length > 0);
  });

  it("Brain tools registered for production go-live modules", () => {
    assert.ok(grandKingLiveOperationsModeTools.some((t) => t.name === "grand_king_live_operations_mode.dashboard"));
    assert.ok(globalOperationalCommandCenterTools.some((t) => t.name === "global_operational_command_center.dashboard"));
    assert.ok(version1GoldMasterTools.some((t) => t.name === "version_1_gold_master.dashboard"));
    assert.ok(grandKingGoLiveChecklistTools.some((t) => t.name === "grand_king_go_live_checklist.dashboard"));
    assert.ok(globalAdvertisingIntelligenceTools.some((t) => t.name === "global_advertising_intelligence.dashboard"));
    assert.ok(firstOrderOperationsTools.some((t) => t.name === "first_order_operations.dashboard"));
    assert.ok(globalOrderIntelligenceTools.some((t) => t.name === "global_order_intelligence.dashboard"));
    assert.ok(postPurchaseIntelligenceTools.some((t) => t.name === "post_purchase_intelligence.dashboard"));
    assert.ok(globalKnowledgeEvolutionTools.some((t) => t.name === "global_knowledge_evolution.dashboard"));
    assert.ok(aiStrategicMemoryTools.some((t) => t.name === "ai_strategic_memory.dashboard"));
    assert.ok(empirePlaybookEngineTools.some((t) => t.name === "empire_playbook_engine.dashboard"));
    assert.ok(globalRiskCommandTools.some((t) => t.name === "global_risk_command.dashboard"));
    assert.ok(founderPlatformReadinessTools.some((t) => t.name === "founder_platform_readiness.dashboard"));
    assert.ok(productionHardeningTools.some((t) => t.name === "production_hardening.dashboard"));
    assert.ok(version1AcceptanceTestTools.some((t) => t.name === "version_1_acceptance_test.dashboard"));
  });
});
