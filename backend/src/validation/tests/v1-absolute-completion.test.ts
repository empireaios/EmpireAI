import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

import { resetDatabaseInstance } from "../../brain/database.js";
import { resetGkrRepository } from "../../grand-king-revenue-pipeline/index.js";
import { configureValidationEnvironment } from "../harness.js";
import { buildGlobalSupplierMarket, GLOBAL_SUPPLIER_MARKET_MISSION_ID, globalSupplierMarketTools } from "../../runtime/global-supplier-market/index.js";
import { buildGlobalMarketplaceAdapterFramework, GLOBAL_MARKETPLACE_ADAPTER_FRAMEWORK_MISSION_ID } from "../../runtime/global-marketplace-adapter-framework/index.js";
import { buildMarketplaceDifferenceEngine, MARKETPLACE_DIFFERENCE_ENGINE_MISSION_ID } from "../../runtime/marketplace-difference-engine/index.js";
import { buildCountryDifferenceEngine, COUNTRY_DIFFERENCE_ENGINE_MISSION_ID } from "../../runtime/country-difference-engine/index.js";
import { buildGlobalPriceIntelligence, GLOBAL_PRICE_INTELLIGENCE_MISSION_ID } from "../../runtime/global-price-intelligence/index.js";
import { buildShippingIntelligence, SHIPPING_INTELLIGENCE_MISSION_ID } from "../../runtime/shipping-intelligence/index.js";
import { buildProductLaunchCommander, PRODUCT_LAUNCH_COMMANDER_MISSION_ID } from "../../runtime/product-launch-commander/index.js";
import { buildPostLaunchCommander, POST_LAUNCH_COMMANDER_MISSION_ID } from "../../runtime/post-launch-commander/index.js";
import { buildProductScaleEngine, PRODUCT_SCALE_ENGINE_MISSION_ID } from "../../runtime/product-scale-engine/index.js";
import { buildProductRetirementEngine, PRODUCT_RETIREMENT_ENGINE_MISSION_ID } from "../../runtime/product-retirement-engine/index.js";
import { buildEmpireRevenueForecast, EMPIRE_REVENUE_FORECAST_MISSION_ID } from "../../runtime/empire-revenue-forecast/index.js";
import { buildEmpireCashflowEngine, EMPIRE_CASHFLOW_ENGINE_MISSION_ID } from "../../runtime/empire-cashflow-engine/index.js";
import { buildEmpireInvestmentEngine, EMPIRE_INVESTMENT_ENGINE_MISSION_ID } from "../../runtime/empire-investment-engine/index.js";
import { buildGlobalOpportunityBoard, GLOBAL_OPPORTUNITY_BOARD_MISSION_ID, globalOpportunityBoardTools } from "../../runtime/global-opportunity-board/index.js";
import { buildExecutiveStrategyRoom, EXECUTIVE_STRATEGY_ROOM_MISSION_ID } from "../../runtime/executive-strategy-room/index.js";
import { buildKingDecisionHistory, KING_DECISION_HISTORY_MISSION_ID } from "../../runtime/king-decision-history/index.js";
import { buildSoulLearningReview, SOUL_LEARNING_REVIEW_MISSION_ID } from "../../runtime/soul-learning-review/index.js";
import { buildEmpirePatternLibrary, EMPIRE_PATTERN_LIBRARY_MISSION_ID } from "../../runtime/empire-pattern-library/index.js";
import { buildGlobalExpansionScore, GLOBAL_EXPANSION_SCORE_MISSION_ID } from "../../runtime/global-expansion-score/index.js";
import { buildEmpirePriorityEngine, EMPIRE_PRIORITY_ENGINE_MISSION_ID } from "../../runtime/empire-priority-engine/index.js";
import { buildCommandCenterPolish, COMMAND_CENTER_POLISH_MISSION_ID } from "../../runtime/command-center-polish/index.js";
import { buildUxReviewPreparation, UX_REVIEW_PREPARATION_MISSION_ID } from "../../runtime/ux-review-preparation/index.js";
import { buildPerformanceReview, PERFORMANCE_REVIEW_MISSION_ID } from "../../runtime/performance-review/index.js";
import { buildSecurityReview, SECURITY_REVIEW_MISSION_ID } from "../../runtime/security-review/index.js";
import { buildArchitectureReview, ARCHITECTURE_REVIEW_MISSION_ID } from "../../runtime/architecture-review/index.js";
import { buildCommercialReview, COMMERCIAL_REVIEW_MISSION_ID } from "../../runtime/commercial-review/index.js";
import { buildVersion1FreezeReview, VERSION_1_FREEZE_REVIEW_MISSION_ID } from "../../runtime/version-1-freeze-review/index.js";
import { buildVersion1ReleaseCandidate, VERSION_1_RELEASE_CANDIDATE_MISSION_ID } from "../../runtime/version-1-release-candidate/index.js";
import { buildVersion1GoLiveApproval, VERSION_1_GO_LIVE_APPROVAL_MISSION_ID } from "../../runtime/version-1-go-live-approval/index.js";
import { buildVersion1Completion, VERSION_1_COMPLETION_MISSION_ID, version1CompletionTools } from "../../runtime/version-1-completion/index.js";

const WORKSPACE_ID = "ws-v1abs-001";
const COMPANY_ID = "co-grand-king";

const BUILDERS: Array<{ missionId: string; build: (w: string, c: string) => { missionId: string; items: unknown[]; architectureComplete: boolean; reusedModules?: string[] } }> = [
  { missionId: GLOBAL_SUPPLIER_MARKET_MISSION_ID, build: buildGlobalSupplierMarket },
  { missionId: GLOBAL_MARKETPLACE_ADAPTER_FRAMEWORK_MISSION_ID, build: buildGlobalMarketplaceAdapterFramework },
  { missionId: MARKETPLACE_DIFFERENCE_ENGINE_MISSION_ID, build: buildMarketplaceDifferenceEngine },
  { missionId: COUNTRY_DIFFERENCE_ENGINE_MISSION_ID, build: buildCountryDifferenceEngine },
  { missionId: GLOBAL_PRICE_INTELLIGENCE_MISSION_ID, build: buildGlobalPriceIntelligence },
  { missionId: SHIPPING_INTELLIGENCE_MISSION_ID, build: buildShippingIntelligence },
  { missionId: PRODUCT_LAUNCH_COMMANDER_MISSION_ID, build: buildProductLaunchCommander },
  { missionId: POST_LAUNCH_COMMANDER_MISSION_ID, build: buildPostLaunchCommander },
  { missionId: PRODUCT_SCALE_ENGINE_MISSION_ID, build: buildProductScaleEngine },
  { missionId: PRODUCT_RETIREMENT_ENGINE_MISSION_ID, build: buildProductRetirementEngine },
  { missionId: EMPIRE_REVENUE_FORECAST_MISSION_ID, build: buildEmpireRevenueForecast },
  { missionId: EMPIRE_CASHFLOW_ENGINE_MISSION_ID, build: buildEmpireCashflowEngine },
  { missionId: EMPIRE_INVESTMENT_ENGINE_MISSION_ID, build: buildEmpireInvestmentEngine },
  { missionId: GLOBAL_OPPORTUNITY_BOARD_MISSION_ID, build: buildGlobalOpportunityBoard },
  { missionId: EXECUTIVE_STRATEGY_ROOM_MISSION_ID, build: buildExecutiveStrategyRoom },
  { missionId: KING_DECISION_HISTORY_MISSION_ID, build: buildKingDecisionHistory },
  { missionId: SOUL_LEARNING_REVIEW_MISSION_ID, build: buildSoulLearningReview },
  { missionId: EMPIRE_PATTERN_LIBRARY_MISSION_ID, build: buildEmpirePatternLibrary },
  { missionId: GLOBAL_EXPANSION_SCORE_MISSION_ID, build: buildGlobalExpansionScore },
  { missionId: EMPIRE_PRIORITY_ENGINE_MISSION_ID, build: buildEmpirePriorityEngine },
  { missionId: COMMAND_CENTER_POLISH_MISSION_ID, build: buildCommandCenterPolish },
  { missionId: UX_REVIEW_PREPARATION_MISSION_ID, build: buildUxReviewPreparation },
  { missionId: PERFORMANCE_REVIEW_MISSION_ID, build: buildPerformanceReview },
  { missionId: SECURITY_REVIEW_MISSION_ID, build: buildSecurityReview },
  { missionId: ARCHITECTURE_REVIEW_MISSION_ID, build: buildArchitectureReview },
  { missionId: COMMERCIAL_REVIEW_MISSION_ID, build: buildCommercialReview },
  { missionId: VERSION_1_FREEZE_REVIEW_MISSION_ID, build: buildVersion1FreezeReview },
  { missionId: VERSION_1_RELEASE_CANDIDATE_MISSION_ID, build: buildVersion1ReleaseCandidate },
  { missionId: VERSION_1_GO_LIVE_APPROVAL_MISSION_ID, build: buildVersion1GoLiveApproval },
  { missionId: VERSION_1_COMPLETION_MISSION_ID, build: buildVersion1Completion },
];

describe("V1 Absolute Completion (REAL-071→REAL-100)", () => {
  beforeEach(() => {
    configureValidationEnvironment();
    resetDatabaseInstance();
    resetGkrRepository();
  });

  afterEach(() => {
    resetGkrRepository();
    resetDatabaseInstance();
  });

  for (const { missionId, build } of BUILDERS) {
    it(`${missionId} — dashboard builds with items`, () => {
      const dash = build(WORKSPACE_ID, COMPANY_ID);
      assert.equal(dash.missionId, missionId);
      assert.ok(dash.items.length > 0);
      assert.equal(dash.architectureComplete, true);
    });
  }

  it("REAL-071 — supplier market uses supplier-intelligence catalog", () => {
    const dash = buildGlobalSupplierMarket(WORKSPACE_ID, COMPANY_ID);
    assert.ok(dash.reusedModules?.includes("supplier-intelligence"));
    assert.ok(dash.items.length >= 5);
  });

  it("REAL-084 — opportunity board lanes in summary", () => {
    const board = buildGlobalOpportunityBoard(WORKSPACE_ID, COMPANY_ID);
    assert.ok(board.summary.includes("boardLanes"));
    assert.equal(globalOpportunityBoardTools.length, 1);
  });

  it("REAL-100 — completion certificate and inventories", () => {
    const pkg = buildVersion1Completion(WORKSPACE_ID, COMPANY_ID);
    assert.equal(pkg.missionId, VERSION_1_COMPLETION_MISSION_ID);
    assert.ok(pkg.completionCertificate.certificateId);
    assert.ok(pkg.architectureInventory.runtimeModuleCount > 80);
    assert.ok(pkg.apiRouteCount > 0);
    assert.equal(version1CompletionTools.length, 1);
    assert.equal(globalSupplierMarketTools.length, 1);
  });
});
