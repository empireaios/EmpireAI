import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildBrowserReadinessPipeline,
  buildBrowserReadinessPipelineSync,
  evaluateBrowserBuilderGate,
} from "./builder-gate.js";
import { compareBehaviourLayers } from "./drift-detector.js";
import { executeBrowserVerificationPipeline } from "./pipeline.js";
import {
  BROWSER_TRUTH_SYSTEM_PATH,
  PRODUCTION_TRUTH_COMPANION_PATH,
  PRODUCTION_URL,
} from "./paths.js";
import { formatBrowserTruthPreamble } from "./mission-preamble.js";
import type {
  BrowserBuilderGateResult,
  BrowserTruthMetrics,
  BrowserTruthRequest,
  BrowserTruthState,
  BrowserVerificationResult,
} from "./types.js";

export interface BrowserTruthEngineOptions {
  /** Skip live production fetch — default true for CI/local */
  dryRunProductionProbe?: boolean;
}

/**
 * Browser Truth Engine (PILLOW-BT-001 / P4-06).
 * Permanent constitutional acceptance doctrine — production browser is highest operational truth.
 */
export class BrowserTruthEngine {
  private initializedAt: string | null = null;
  private totalVerifications = 0;
  private lastVerification: BrowserVerificationResult | null = null;
  private history: BrowserVerificationResult[] = [];
  private reader: RepositoryReader;
  private lastReadiness: import("./types.js").BrowserReadinessPipeline | null = null;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    private options: BrowserTruthEngineOptions = {},
  ) {
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<BrowserTruthState> {
    const systemDoc = await this.reader.readText(BROWSER_TRUTH_SYSTEM_PATH);
    if (!systemDoc?.includes("Browser Truth")) {
      throw new Error(
        `${BROWSER_TRUTH_SYSTEM_PATH} missing — Browser Truth Engine requires P4-06 system doc.`,
      );
    }
    const companion = await this.reader.readText(PRODUCTION_TRUTH_COMPANION_PATH);
    if (!companion?.includes("Production Truth")) {
      throw new Error(
        `${PRODUCTION_TRUTH_COMPANION_PATH} missing — Browser Truth requires Production Truth companion.`,
      );
    }
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  getState(): BrowserTruthState {
    if (!this.initializedAt) {
      throw new Error("Browser Truth Engine not initialized. Call initialize() first.");
    }
    const status =
      this.lastVerification?.driftDetected.regression
        ? "degraded"
        : "ready";
    return {
      engineVersion: "PILLOW-BT-001",
      status,
      initializedAt: this.initializedAt,
      doctrinePath: BROWSER_TRUTH_SYSTEM_PATH,
      companionPath: PRODUCTION_TRUTH_COMPANION_PATH,
      productionUrl: PRODUCTION_URL,
      totalVerifications: this.totalVerifications,
      lastVerification: this.lastVerification,
    };
  }

  async refreshReadiness(request: BrowserTruthRequest = {}): Promise<BrowserBuilderGateResult> {
    const pipeline = await buildBrowserReadinessPipeline({
      bootstrap: this.bootstrap,
      request: {
        ...request,
        dryRun: request.dryRun ?? this.options.dryRunProductionProbe ?? true,
      },
    });
    this.lastReadiness = pipeline;
    return evaluateBrowserBuilderGate(pipeline, request);
  }

  evaluateBuilderGateSync(request: BrowserTruthRequest = {}): BrowserBuilderGateResult {
    const pipeline =
      this.lastReadiness ??
      buildBrowserReadinessPipelineSync({
        bootstrap: this.bootstrap,
        request,
      });
    return evaluateBrowserBuilderGate(pipeline, request);
  }

  validateForSupervisorSync(request: BrowserTruthRequest = {}): {
    valid: boolean;
    health: "healthy" | "degraded" | "blocked";
    readinessScore: number;
    notes: string[];
    pipeline: import("./types.js").BrowserReadinessPipeline;
  } {
    const gate = this.evaluateBuilderGateSync(request);
    return {
      valid: gate.allowed,
      health:
        gate.pipeline.readinessScore >= 75
          ? "healthy"
          : gate.allowed
            ? "degraded"
            : "blocked",
      readinessScore: gate.readinessScore,
      notes: [
        `Readiness: ${gate.readinessScore}/100`,
        gate.pipeline.recommendedAction,
        `Production URL: ${PRODUCTION_URL}`,
        "Mission complete requires Repository PASS · Production PASS · Grand King PASS",
      ],
      pipeline: gate.pipeline,
    };
  }

  formatMissionPreamble(request: BrowserTruthRequest = {}): string {
    const readiness =
      this.lastReadiness ??
      ({
        pipelineVersion: "P4-06",
        success: true,
        readinessScore: 100,
        doctrinePresent: true,
        productionTruthAligned: true,
        productionReachable: true,
        recommendedAction: "Browser Truth ready",
        steps: [],
      } as import("./types.js").BrowserReadinessPipeline);

    return formatBrowserTruthPreamble({
      readiness,
      lastVerification: this.lastVerification,
    });
  }

  async runVerification(request: BrowserTruthRequest = {}): Promise<BrowserVerificationResult> {
    const dryRun = request.dryRun ?? this.options.dryRunProductionProbe ?? true;
    const result = await executeBrowserVerificationPipeline({
      bootstrap: this.bootstrap,
      request: { ...request, dryRun },
    });
    this.totalVerifications += 1;
    this.lastVerification = result;
    this.history.push(result);
    return result;
  }

  compareBehaviourLayers(expectedBehaviour: string) {
    return compareBehaviourLayers({
      repositoryBehaviour: this.bootstrap.repositoryHealth.healthy
        ? "Repository healthy — structural acceptance met"
        : "Repository degraded",
      productionBehaviour: this.lastVerification?.dryRun
        ? "Production dry-run — live browser pending"
        : this.lastVerification?.success
          ? "Production reachable — probe passed"
          : "Production verification incomplete",
      browserBehaviour: this.lastVerification
        ? `Browser verification ${this.lastVerification.success ? "ready" : "degraded"}`
        : "Browser verification not yet run",
      expectedBehaviour,
    });
  }

  getMetrics(): BrowserTruthMetrics {
    const total = Math.max(this.history.length, 1);
    const passed = this.history.filter((h) => h.success).length;
    const failedChecks = this.history.reduce(
      (n, h) => n + h.checks.filter((c) => c.status === "failed").length,
      0,
    );
    const regressions = this.history.filter((h) => h.driftDetected.regression).length;
    const prodPass = this.history.filter((h) => h.acceptance.productionAcceptance === "PASS").length;
    const gkPass = this.history.filter((h) => h.acceptance.grandKingAcceptance === "PASS").length;

    return {
      validationPassRate: passed / total,
      failedBrowserChecks: failedChecks,
      regressionRate: regressions / total,
      productionAcceptanceRate: prodPass / total,
      grandKingAcceptanceRate: gkPass / total,
      trend: regressions > 1 ? "degrading" : passed > regressions ? "improving" : "stable",
    };
  }

  getCockpitSnapshot() {
    const state = this.getState();
    const metrics = this.getMetrics();
    const last = this.lastVerification;

    return {
      productionStatus: last?.success ? "verified" : "pending",
      browserValidationStatus: last ? (last.dryRun ? "dry-run" : "live") : "not-run",
      latestBrowserTests: last?.checks.slice(0, 6).map((c) => `${c.dimension}: ${c.status}`) ?? [],
      latestProductionVerification: last?.evidence.testResults ?? "None",
      grandKingAcceptance: last?.acceptance.grandKingAcceptance ?? "PENDING",
      regressionAlerts: last?.driftDetected.findings ?? [],
      knownBrowserIssues: last?.evidence.knownLimitations ?? [],
      metrics,
      productionUrl: state.productionUrl,
    };
  }

  recordGrandKingAcceptance(missionId: string, verdict: "PASS" | "FAIL"): void {
    if (!this.lastVerification) return;
    this.lastVerification.acceptance.grandKingAcceptance = verdict;
    this.lastVerification.acceptance = {
      ...this.lastVerification.acceptance,
      missionComplete:
        this.lastVerification.acceptance.repositoryAcceptance === "PASS" &&
        this.lastVerification.acceptance.productionAcceptance === "PASS" &&
        verdict === "PASS",
      summary: `Grand King ${verdict} for ${missionId}`,
    };
    this.lastVerification.evidence.acceptanceStatus = verdict;
  }
}

export function createBrowserTruthEngine(
  bootstrap: EmpireBootstrapContext,
  options?: BrowserTruthEngineOptions,
): BrowserTruthEngine {
  return new BrowserTruthEngine(bootstrap, options);
}
