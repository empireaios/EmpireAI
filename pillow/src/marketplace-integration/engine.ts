import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildMarketplaceIntegrationReadinessPipeline,
  buildMarketplaceIntegrationReadinessPipelineSync,
  evaluateMarketplaceIntegrationGate,
} from "./builder-gate.js";
import {
  COMMERCE_ARCHITECTURE_COMPANION_PATH,
  G2_MARKETPLACE_COMPANION_PATH,
  MARKETPLACE_INTEGRATION_PATH,
  MARKETPLACE_CONNECTOR_CAPABILITIES,
  MARKETPLACE_INTEGRATION_PIPELINE,
  MARKETPLACE_SYNC_DOMAINS,
  MARKETPLACE_FAILURE_KINDS,
} from "./paths.js";
import { MARKETPLACE_CONNECTOR_REGISTRY } from "./connector-registry.js";
import {
  buildMarketplaceIntegrationCockpitSnapshot,
  executeMarketplaceIntegrationAssessment,
} from "./integration-assessment.js";
import { formatMarketplaceIntegrationPreamble } from "./mission-preamble.js";
import type {
  MarketplaceIntegrationAnalysis,
  MarketplaceIntegrationAssessment,
  MarketplaceIntegrationEngineState,
  MarketplaceIntegrationGateResult,
  MarketplaceIntegrationMetrics,
  MarketplaceIntegrationReadinessPipeline,
  MarketplaceIntegrationRequest,
  MarketplaceIntegrationCockpitSnapshot,
} from "./types.js";

/**
 * Marketplace Integration Engine (PILLOW-MI-001 / P8-03).
 * Constitutional marketplace abstraction — provider-independent, replaceable connectors.
 */
export class MarketplaceIntegrationEngine {
  private initializedAt: string | null = null;
  private reader: RepositoryReader;
  private lastReadiness: MarketplaceIntegrationReadinessPipeline | null = null;
  private lastAssessment: MarketplaceIntegrationAssessment | null = null;

  constructor(private bootstrap: EmpireBootstrapContext) {
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<MarketplaceIntegrationEngineState> {
    const doctrine = await this.reader.readText(MARKETPLACE_INTEGRATION_PATH);
    if (!doctrine?.includes("Marketplace Integration Architecture")) {
      throw new Error(
        `${MARKETPLACE_INTEGRATION_PATH} missing — Marketplace Integration requires P8-03 doctrine.`,
      );
    }
    const commerce = await this.reader.readText(COMMERCE_ARCHITECTURE_COMPANION_PATH);
    if (!commerce?.includes("Commerce")) {
      throw new Error(`${COMMERCE_ARCHITECTURE_COMPANION_PATH} missing — requires P3-05 companion.`);
    }
    const g2 = await this.reader.readText(G2_MARKETPLACE_COMPANION_PATH);
    if (!g2?.includes("MARKETPLACE_INTEGRATION")) {
      throw new Error(`${G2_MARKETPLACE_COMPANION_PATH} missing — requires G2-02 foundation.`);
    }
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  getState(): MarketplaceIntegrationEngineState {
    if (!this.initializedAt) {
      throw new Error("Marketplace Integration Engine not initialized. Call initialize() first.");
    }
    return {
      engineVersion: "PILLOW-MI-001",
      status: this.lastAssessment?.overallHealth === "critical" ? "blocked" : "ready",
      initializedAt: this.initializedAt,
      doctrinePath: MARKETPLACE_INTEGRATION_PATH,
      companionPath: COMMERCE_ARCHITECTURE_COMPANION_PATH,
      connectorCount: MARKETPLACE_CONNECTOR_REGISTRY.length,
      pipelinePhaseCount: MARKETPLACE_INTEGRATION_PIPELINE.length,
    };
  }

  async refreshReadiness(
    request: MarketplaceIntegrationRequest = {},
  ): Promise<MarketplaceIntegrationReadinessPipeline> {
    this.lastReadiness = await buildMarketplaceIntegrationReadinessPipeline({
      bootstrap: this.bootstrap,
      request,
    });
    return this.lastReadiness;
  }

  evaluateBuilderGateSync(request: MarketplaceIntegrationRequest = {}): MarketplaceIntegrationGateResult {
    const pipeline =
      this.lastReadiness ??
      buildMarketplaceIntegrationReadinessPipelineSync({ bootstrap: this.bootstrap, request });
    return evaluateMarketplaceIntegrationGate(pipeline, request);
  }

  runAssessment(_request: MarketplaceIntegrationRequest = {}): MarketplaceIntegrationAssessment {
    this.lastAssessment = executeMarketplaceIntegrationAssessment();
    return this.lastAssessment;
  }

  getCockpitSnapshot(): MarketplaceIntegrationCockpitSnapshot {
    const assessment = this.lastAssessment ?? executeMarketplaceIntegrationAssessment();
    return buildMarketplaceIntegrationCockpitSnapshot(assessment);
  }

  getMetrics(): MarketplaceIntegrationMetrics {
    const gate = this.evaluateBuilderGateSync({ missionId: "P8-03", roadmapItem: "P8-03" });
    return {
      connectorCount: MARKETPLACE_CONNECTOR_REGISTRY.length,
      pipelinePhases: MARKETPLACE_INTEGRATION_PIPELINE.length,
      syncDomains: MARKETPLACE_SYNC_DOMAINS.length,
      failureKinds: MARKETPLACE_FAILURE_KINDS.length,
      capabilityCount: MARKETPLACE_CONNECTOR_CAPABILITIES.length,
      readinessScore: gate.readinessScore,
    };
  }

  analyzeIntegration(): MarketplaceIntegrationAnalysis {
    const assessment = this.lastAssessment ?? executeMarketplaceIntegrationAssessment();
    return {
      integrationQuality: assessment.connectorAssessments.map(
        (c) => `${c.displayName}: ${c.integrationQuality}`,
      ),
      providerStability: assessment.connectorAssessments.map(
        (c) => `${c.displayName}: ${c.providerStability}`,
      ),
      commercialOpportunities: assessment.connectorAssessments.map((c) => c.commercialOpportunity),
      connectorImprovements: assessment.connectorAssessments.map((c) => c.improvement),
      futureMarketplaceRecommendations: [
        "Walmart Marketplace · Google Merchant · Future REG-MARKETPLACE rows",
        "Supplier connectors via G2 supplier fabric — same abstraction pattern",
      ],
    };
  }

  formatMissionPreamble(request: MarketplaceIntegrationRequest = {}): string {
    return formatMarketplaceIntegrationPreamble(request);
  }
}

export function createMarketplaceIntegrationEngine(
  bootstrap: EmpireBootstrapContext,
): MarketplaceIntegrationEngine {
  return new MarketplaceIntegrationEngine(bootstrap);
}
