import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildProductionModeReadinessPipeline,
  buildProductionModeReadinessPipelineSync,
  evaluateProductionModeBuilderGate,
} from "./builder-gate.js";
import {
  PRODUCTION_MODE_PATH,
  PRODUCTION_TRUTH_COMPANION_PATH,
  BRAIN_RUNTIME_COMPANION_PATH,
} from "./paths.js";
import { formatProductionModePreamble } from "./mission-preamble.js";
import {
  buildDefaultProductionSnapshot,
  executeProductionModeAssessment,
} from "./production-assessment.js";
import { PRODUCTION_COMPONENT_REGISTRY } from "./component-registry.js";
import { FEATURE_FLAG_REGISTRY } from "./feature-flag-registry.js";
import type {
  ProductionModeAnalysis,
  ProductionModeAssessment,
  ProductionModeBuilderGateResult,
  ProductionModeMetrics,
  ProductionModeRequest,
  ProductionModeSnapshot,
  ProductionModeState,
} from "./types.js";

/**
 * Production Mode Engine (PILLOW-PM-001 / P5-02).
 * Permanent doctrine defining operational state of every production capability.
 */
export class ProductionModeEngine {
  private initializedAt: string | null = null;
  private reader: RepositoryReader;
  private lastReadiness: import("./types.js").ProductionModeReadinessPipeline | null = null;
  private lastAssessment: ProductionModeAssessment | null = null;
  private lastSnapshot: ProductionModeSnapshot | null = null;

  constructor(private bootstrap: EmpireBootstrapContext) {
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<ProductionModeState> {
    const systemDoc = await this.reader.readText(PRODUCTION_MODE_PATH);
    if (!systemDoc?.includes("Production Mode")) {
      throw new Error(
        `${PRODUCTION_MODE_PATH} missing — Production Mode Engine requires P5-02 doctrine.`,
      );
    }
    const companion = await this.reader.readText(PRODUCTION_TRUTH_COMPANION_PATH);
    if (!companion?.includes("Production Truth")) {
      throw new Error(
        `${PRODUCTION_TRUTH_COMPANION_PATH} missing — Production Mode requires Production Truth companion.`,
      );
    }
    const runtime = await this.reader.readText(BRAIN_RUNTIME_COMPANION_PATH);
    if (!runtime?.includes("Brain Runtime")) {
      throw new Error(
        `${BRAIN_RUNTIME_COMPANION_PATH} missing — Production Mode requires Brain Runtime companion.`,
      );
    }
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  getState(): ProductionModeState {
    if (!this.initializedAt) {
      throw new Error("Production Mode Engine not initialized. Call initialize() first.");
    }
    return {
      engineVersion: "PILLOW-PM-001",
      status: this.lastAssessment?.success === false ? "degraded" : "ready",
      initializedAt: this.initializedAt,
      doctrinePath: PRODUCTION_MODE_PATH,
      companionPath: PRODUCTION_TRUTH_COMPANION_PATH,
      lastAssessment: this.lastAssessment,
    };
  }

  ingestProductionSnapshot(snapshot: ProductionModeSnapshot): ProductionModeAssessment {
    this.lastSnapshot = snapshot;
    const result = executeProductionModeAssessment({ snapshot });
    this.lastAssessment = result;
    return result;
  }

  async refreshReadiness(request: ProductionModeRequest = {}): Promise<ProductionModeBuilderGateResult> {
    const pipeline = await buildProductionModeReadinessPipeline({
      bootstrap: this.bootstrap,
      request,
    });
    this.lastReadiness = pipeline;
    return evaluateProductionModeBuilderGate(pipeline, request);
  }

  evaluateBuilderGateSync(request: ProductionModeRequest = {}): ProductionModeBuilderGateResult {
    const pipeline =
      this.lastReadiness ??
      buildProductionModeReadinessPipelineSync({
        bootstrap: this.bootstrap,
        request,
      });
    return evaluateProductionModeBuilderGate(pipeline, request);
  }

  validateForSupervisorSync(request: ProductionModeRequest = {}): {
    valid: boolean;
    health: "healthy" | "degraded" | "blocked";
    readinessScore: number;
    notes: string[];
    pipeline: import("./types.js").ProductionModeReadinessPipeline;
  } {
    const gate = this.evaluateBuilderGateSync(request);
    return {
      valid: gate.allowed,
      health: gate.pipeline.readinessScore >= 75 ? "healthy" : gate.allowed ? "degraded" : "blocked",
      readinessScore: gate.readinessScore,
      notes: [
        `Readiness: ${gate.readinessScore}/100`,
        gate.pipeline.recommendedAction,
        this.lastAssessment?.grandKingSummary ?? "Run production mode assessment",
      ],
      pipeline: gate.pipeline,
    };
  }

  formatMissionPreamble(request: ProductionModeRequest = {}): string {
    const readiness =
      this.lastReadiness ??
      buildProductionModeReadinessPipelineSync({
        bootstrap: this.bootstrap,
        request,
      });
    return formatProductionModePreamble({
      readiness,
      lastAssessment: this.lastAssessment,
    });
  }

  runAssessment(snapshot?: ProductionModeSnapshot | null): ProductionModeAssessment {
    const snap = snapshot ?? this.lastSnapshot ?? buildDefaultProductionSnapshot();
    return this.ingestProductionSnapshot(snap);
  }

  /** Grand King acceptance — every subsystem has one documented production state. */
  verifyGrandKingClarity(): {
    complete: boolean;
    componentCount: number;
    flagCount: number;
    assessment: ProductionModeAssessment;
  } {
    const assessment = this.runAssessment();
    const complete =
      assessment.components.length >= 15 &&
      assessment.featureFlags.every((f) => f.documented) &&
      assessment.components.every((c) => c.reason && c.activationRules);

    return {
      complete,
      componentCount: assessment.components.length,
      flagCount: assessment.featureFlags.length,
      assessment,
    };
  }

  analyzeProductionDrift(): ProductionModeAnalysis {
    const snap = this.lastSnapshot;
    const drift: string[] = [];
    const configDrift: string[] = [];
    const recommendations: string[] = [
      "Set EMPIRE_V1_OPERATIONAL_READY=true only after operational validation",
      "Keep EMPIRE_ENABLE_EXTENSION_ROUTES=false in production unless explicitly required",
    ];

    if (snap?.extensionRoutesEnabled && snap.nodeEnv === "production") {
      drift.push("Extension routes enabled in production — verify intentional");
    }
    if (!snap?.pillowProductionMode && snap?.nodeEnv === "production") {
      configDrift.push("Pillow in dry-run readiness — EMPIRE_V1_OPERATIONAL_READY not set");
    }
    if (snap?.liveCommerceMode === "sandbox" && snap.nodeEnv === "production") {
      configDrift.push("Commerce in sandbox mode — live orders disabled");
    }
    if (snap?.redisOptional) {
      configDrift.push("REDIS_OPTIONAL=true — queue may be degraded");
    }

    return {
      productionDrift: drift,
      configurationDrift: configDrift,
      featureDrift: [],
      capabilityDrift: this.lastAssessment?.deferredModules.map((m) => `${m} deferred`) ?? [],
      productionReadiness: [
        `${PRODUCTION_COMPONENT_REGISTRY.filter((c) => c.productionState === "production_enabled").length} production-enabled`,
        `${PRODUCTION_COMPONENT_REGISTRY.filter((c) => c.productionState === "production_disabled").length} production-disabled`,
      ],
      recommendations,
    };
  }

  getMetrics(): ProductionModeMetrics {
    const enabled = PRODUCTION_COMPONENT_REGISTRY.filter(
      (c) => c.productionState === "production_enabled",
    ).length;
    const disabled = PRODUCTION_COMPONENT_REGISTRY.filter(
      (c) => c.productionState === "production_disabled",
    ).length;

    return {
      totalComponents: PRODUCTION_COMPONENT_REGISTRY.length,
      enabledCount: enabled,
      disabledCount: disabled,
      documentedFlags: FEATURE_FLAG_REGISTRY.filter((f) => f.documented).length,
      readinessScore: this.lastReadiness?.readinessScore ?? 100,
      driftSignals: this.analyzeProductionDrift().configurationDrift.length,
      trend: "stable",
    };
  }

  getCockpitSnapshot() {
    const metrics = this.getMetrics();
    const analysis = this.analyzeProductionDrift();
    const last = this.lastAssessment;

    return {
      productionStatus: last?.overallStatus ?? "unknown",
      enabledModules: last?.enabledModules ?? [],
      disabledModules: last?.disabledModules ?? [],
      limitedModules: last?.limitedModules ?? [],
      deferredModules: last?.deferredModules ?? [],
      featureFlags: last?.featureFlags.map((f) => `${f.envVar}=${f.productionDefault}`) ?? [],
      runtimeConfiguration: last?.snapshot
        ? `NODE_ENV=${last.snapshot.nodeEnv} · Pillow prod=${last.snapshot.pillowProductionMode} · Extensions=${last.snapshot.extensionRoutesEnabled}`
        : "Awaiting snapshot",
      knownLimitations: PRODUCTION_COMPONENT_REGISTRY.flatMap((c) => c.knownLimitations).slice(0, 8),
      deploymentHealth: last?.summary ?? "Awaiting assessment",
      grandKingSummary: last?.grandKingSummary ?? "Run production mode assessment",
      metrics,
      analysis,
    };
  }
}

export function createProductionModeEngine(
  bootstrap: EmpireBootstrapContext,
): ProductionModeEngine {
  return new ProductionModeEngine(bootstrap);
}
