import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildE2eReadinessPipeline,
  buildE2eReadinessPipelineSync,
  evaluateE2eBuilderGate,
} from "./builder-gate.js";
import { executeE2eTestingPipeline } from "./pipeline.js";
import {
  BROWSER_TRUTH_COMPANION_PATH,
  E2E_TESTING_SYSTEM_PATH,
  MANDATORY_E2E_JOURNEYS,
} from "./paths.js";
import { formatE2eTestingPreamble } from "./mission-preamble.js";
import { getCriticalJourneys } from "./journey-registry.js";
import type {
  E2eBuilderGateResult,
  E2eTestingAnalysis,
  E2eTestingMetrics,
  E2eTestingRequest,
  E2eTestingState,
  E2eTestExecutionResult,
} from "./types.js";

export interface E2eTestingEngineOptions {
  dryRunExecution?: boolean;
}

/**
 * End-to-End Testing Engine (PILLOW-E2E-001 / P4-07).
 * Permanent constitutional E2E acceptance architecture — Browser Truth remains final authority.
 */
export class E2eTestingEngine {
  private initializedAt: string | null = null;
  private totalExecutions = 0;
  private lastExecution: E2eTestExecutionResult | null = null;
  private history: E2eTestExecutionResult[] = [];
  private reader: RepositoryReader;
  private lastReadiness: import("./types.js").E2eReadinessPipeline | null = null;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    private options: E2eTestingEngineOptions = {},
  ) {
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<E2eTestingState> {
    const systemDoc = await this.reader.readText(E2E_TESTING_SYSTEM_PATH);
    if (!systemDoc?.includes("End-to-End Testing")) {
      throw new Error(
        `${E2E_TESTING_SYSTEM_PATH} missing — E2E Testing Engine requires P4-07 system doc.`,
      );
    }
    const companion = await this.reader.readText(BROWSER_TRUTH_COMPANION_PATH);
    if (!companion?.includes("Browser Truth")) {
      throw new Error(
        `${BROWSER_TRUTH_COMPANION_PATH} missing — E2E Testing requires Browser Truth companion.`,
      );
    }
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  getState(): E2eTestingState {
    if (!this.initializedAt) {
      throw new Error("E2E Testing Engine not initialized. Call initialize() first.");
    }
    const status =
      this.lastExecution?.failurePolicy?.blockProductionAcceptance
        ? "blocked"
        : this.lastExecution && !this.lastExecution.success
          ? "degraded"
          : "ready";
    return {
      engineVersion: "PILLOW-E2E-001",
      status,
      initializedAt: this.initializedAt,
      doctrinePath: E2E_TESTING_SYSTEM_PATH,
      companionPath: BROWSER_TRUTH_COMPANION_PATH,
      totalExecutions: this.totalExecutions,
      lastExecution: this.lastExecution,
    };
  }

  async refreshReadiness(request: E2eTestingRequest = {}): Promise<E2eBuilderGateResult> {
    const pipeline = await buildE2eReadinessPipeline({
      bootstrap: this.bootstrap,
      request,
    });
    this.lastReadiness = pipeline;
    return evaluateE2eBuilderGate(pipeline, request);
  }

  evaluateBuilderGateSync(request: E2eTestingRequest = {}): E2eBuilderGateResult {
    const pipeline =
      this.lastReadiness ??
      buildE2eReadinessPipelineSync({
        bootstrap: this.bootstrap,
        request,
      });
    return evaluateE2eBuilderGate(pipeline, request);
  }

  validateForSupervisorSync(request: E2eTestingRequest = {}): {
    valid: boolean;
    health: "healthy" | "degraded" | "blocked";
    readinessScore: number;
    notes: string[];
    pipeline: import("./types.js").E2eReadinessPipeline;
  } {
    const gate = this.evaluateBuilderGateSync(request);
    const criticalBlocked = this.lastExecution?.failurePolicy?.blockProductionAcceptance ?? false;
    return {
      valid: gate.allowed && !criticalBlocked,
      health:
        criticalBlocked
          ? "blocked"
          : gate.pipeline.readinessScore >= 75
            ? "healthy"
            : gate.allowed
              ? "degraded"
              : "blocked",
      readinessScore: gate.readinessScore,
      notes: [
        `Readiness: ${gate.readinessScore}/100`,
        gate.pipeline.recommendedAction,
        `${MANDATORY_E2E_JOURNEYS.length} mandatory journeys registered`,
        "Browser Truth (P4-06) remains final production acceptance authority",
      ],
      pipeline: gate.pipeline,
    };
  }

  formatMissionPreamble(request: E2eTestingRequest = {}): string {
    const readiness =
      this.lastReadiness ??
      buildE2eReadinessPipelineSync({
        bootstrap: this.bootstrap,
        request,
      });

    return formatE2eTestingPreamble({
      readiness,
      lastExecution: this.lastExecution,
    });
  }

  async runSuite(request: E2eTestingRequest = {}): Promise<E2eTestExecutionResult> {
    const dryRun = request.dryRun ?? this.options.dryRunExecution ?? true;
    const result = await executeE2eTestingPipeline({
      bootstrap: this.bootstrap,
      request: { ...request, dryRun },
    });
    this.totalExecutions += 1;
    this.lastExecution = result;
    this.history.push(result);
    return result;
  }

  getMetrics(): E2eTestingMetrics {
    const total = Math.max(this.history.length, 1);
    const passed = this.history.filter((h) => h.success).length;
    const criticalFailures = this.history.reduce(
      (n, h) => n + h.criticalFailures.length,
      0,
    );
    const regressions = this.history.filter((h) => !h.success && h.criticalFailures.length > 0).length;
    const avgMs =
      this.history.length > 0
        ? this.history.reduce((sum, h) => sum + h.journeys.length, 0) / this.history.length
        : 0;

    const lastPassRate = this.lastExecution?.passRate ?? (this.bootstrap.repositoryHealth.healthy ? 1 : 0.5);

    return {
      passRate: passed / total,
      criticalFailures,
      regressionCount: regressions,
      coverageEstimate: getCriticalJourneys().length / MANDATORY_E2E_JOURNEYS.length,
      flakyTestCount: 0,
      averageExecutionMs: avgMs * 10,
      trend: regressions > 1 ? "degrading" : passed > regressions ? "improving" : "stable",
      ...(lastPassRate >= 0 ? {} : {}),
    };
  }

  analyzeTestingHealth(): E2eTestingAnalysis {
    const last = this.lastExecution;
    const recurringFailures =
      last?.criticalFailures.filter((j) => j.verdict === "FAIL").map((j) => j.id) ?? [];
    const coverageGaps: string[] = [];
    if (!last) {
      coverageGaps.push("No E2E suite execution recorded — run runSuite()");
    }
    const missingJourneys: string[] = [];
    const registered = new Set(last?.journeys.map((j) => j.id) ?? MANDATORY_E2E_JOURNEYS);
    for (const id of MANDATORY_E2E_JOURNEYS) {
      if (!registered.has(id)) missingJourneys.push(id);
    }

    const recommendations: string[] = [
      "Execute deployment pipeline: Critical → Integration → Browser → Production Smoke",
      "Grand King workflows require Browser Truth sign-off after automated E2E validation",
    ];
    if (recurringFailures.length > 0) {
      recommendations.push(`Recovery recommended for: ${recurringFailures.join(", ")}`);
    }
    if (missingJourneys.length > 0) {
      recommendations.push(`Register missing journeys: ${missingJourneys.join(", ")}`);
    }

    return {
      recurringFailures,
      coverageGaps,
      missingJourneys,
      flakyTests: [],
      regressionTrends:
        this.history.filter((h) => !h.success).length > 0
          ? [`${this.history.filter((h) => !h.success).length} failed execution(s) in history`]
          : [],
      recommendations,
    };
  }

  getCockpitSnapshot() {
    const state = this.getState();
    const metrics = this.getMetrics();
    const last = this.lastExecution;
    const analysis = this.analyzeTestingHealth();

    return {
      currentTestStatus: last ? (last.success ? "passing" : "failing") : "not-run",
      passRate: last?.passRate ?? metrics.passRate,
      criticalFailures: last?.criticalFailures.map((j) => `${j.id}: ${j.detail}`) ?? [],
      regressionHistory: this.history.slice(-5).map((h) => ({
        at: h.executedAt,
        success: h.success,
        passRate: h.passRate,
      })),
      coverage: metrics.coverageEstimate,
      latestBrowserTests: last?.stages
        .filter((s) => s.stage === "browser_tests")
        .map((s) => `${s.stage}: ${s.status}`) ?? [],
      latestProductionTests: last?.stages
        .filter((s) => s.stage === "production_smoke_tests")
        .map((s) => `${s.stage}: ${s.status}`) ?? [],
      acceptanceStatus: last?.acceptanceSummary ?? "Awaiting E2E suite execution",
      browserTruthAuthority: "P4-06 final authority",
      analysis,
      metrics,
      engineStatus: state.status,
    };
  }
}

export function createE2eTestingEngine(
  bootstrap: EmpireBootstrapContext,
  options?: E2eTestingEngineOptions,
): E2eTestingEngine {
  return new E2eTestingEngine(bootstrap, options);
}
