import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildMediaCertificationConfiguration,
  type MediaCertificationConfiguration,
} from "./configuration.js";
import { resetCertificationSequenceForTesting } from "./certification-store.js";
import { MEDIA_CERTIFICATION_SYSTEM_PATH } from "./paths.js";
import { MediaCertificationController } from "./media-certification-controller.js";
import { MediaCertificationCore } from "./media-certification-core.js";
import { resetMdcLogsForTesting } from "./mdc-logging.js";
import type {
  MediaCertificationCockpitSnapshot,
  MediaCertificationInput,
  MediaCertificationState,
} from "./types.js";

export interface MediaCertificationOptions {
  configuration?: Partial<MediaCertificationConfiguration>;
}

/** Authoritative Q4-19 Media Certification — final Q4 acceptance gate. */
export class MediaCertification {
  private initializedAt: string | null = null;
  private readonly controller: MediaCertificationController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: MediaCertificationOptions = {},
  ) {
    this.controller = new MediaCertificationController(
      new MediaCertificationCore(),
      buildMediaCertificationConfiguration(
        bootstrap.repositoryRoot,
        options.configuration,
      ),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      MEDIA_CERTIFICATION_SYSTEM_PATH,
    );
    if (!doc?.includes("Media Certification")) {
      throw new Error(
        `${MEDIA_CERTIFICATION_SYSTEM_PATH} missing — Q4-19 system doc required.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  getState(): MediaCertificationState {
    if (!this.initializedAt) {
      throw new Error("Media Certification not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-MDC-001",
      missionId: "Q4-19",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration,
      latestReport,
      engineRecord,
      health: {
        status: engineRecord?.healthStatus ?? "standby",
        healthScore:
          engineRecord?.healthStatus === "healthy" ? 100 : engineRecord ? 70 : 50,
        engineEnabled: configuration.enabled,
        lastOperationAt: latestReport?.runTimestamp ?? null,
        lastValidationDecision: latestReport?.validation.decision ?? null,
        totalCertificationReports: this.getReports().length,
        certifiedCount: engineRecord?.certifiedCount ?? 0,
        failedCount: engineRecord?.failedCount ?? 0,
        lastFinalResult: engineRecord?.lastFinalResult ?? null,
        q4ProductionReady: engineRecord?.q4ProductionReady ?? false,
        q5ReadinessConfirmed: engineRecord?.q5ReadinessConfirmed ?? false,
        notes: [
          "Acceptance gate only: does not publish media, modify Media Factory components, repair failures, begin Q5, override Pillow, or override Grand King.",
        ],
      },
    };
  }

  connectMediaCertification(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  connect(input: Record<string, unknown> = {}) {
    return this.connectMediaCertification(input);
  }

  certifyFactory(input: MediaCertificationInput = {}) {
    return this.controller.certifyFactory(input);
  }

  verifyComponent(input: MediaCertificationInput = {}) {
    return this.controller.verifyComponent(input);
  }

  verifyIntegration(input: MediaCertificationInput = {}) {
    return this.controller.verifyIntegration(input);
  }

  verifyGovernance(input: MediaCertificationInput = {}) {
    return this.controller.verifyGovernance(input);
  }

  verifyTraceability(input: MediaCertificationInput = {}) {
    return this.controller.verifyTraceability(input);
  }

  verifyAutonomousOperation(input: MediaCertificationInput = {}) {
    return this.controller.verifyAutonomousOperation(input);
  }

  assessReadiness(input: MediaCertificationInput = {}) {
    return this.controller.assessReadiness(input);
  }

  produceReport(input: MediaCertificationInput = {}) {
    return this.controller.produceReport(input);
  }

  listReports() {
    return this.controller.list();
  }

  listCertificationReports() {
    return this.listReports();
  }

  validateMediaCertification(input: MediaCertificationInput = {}) {
    return this.controller.validate(input);
  }

  runDiagnostics() {
    return this.controller.diagnostics();
  }

  getReports() {
    return this.controller.getManager().getReports();
  }

  getLatestCertificationReport() {
    return this.controller.getManager().getLatestReport();
  }

  getLatestCertificationId() {
    return this.getLatestCertificationReport()?.certificationId ?? null;
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getAuditTrail(limit = 50) {
    return this.controller.getManager().getAuditTrail(limit);
  }

  validateForSupervisorSync() {
    const state = this.getState();
    const score =
      state.latestReport?.validation.decision === "fail"
        ? 40
        : state.latestReport?.validation.decision === "partial"
          ? 70
          : 100;
    return {
      valid: state.health.status !== "failed",
      health:
        score >= 75
          ? ("healthy" as const)
          : score >= 50
            ? ("degraded" as const)
            : ("blocked" as const),
      readinessScore: score,
      notes: [
        `Engine status: ${state.status}`,
        `Media Certification reports: ${state.health.totalCertificationReports}`,
        `Q4 production ready: ${state.health.q4ProductionReady}`,
        `Q5 readiness confirmed: ${state.health.q5ReadinessConfirmed}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): MediaCertificationCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q4-19",
      status: state.status,
      healthStatus: state.health.status,
      totalCertificationReports: state.health.totalCertificationReports,
      latestCertificationId: this.getLatestCertificationId(),
      q4ProductionReady: state.health.q4ProductionReady,
      q5ReadinessConfirmed: state.health.q5ReadinessConfirmed,
      neverPublishMedia: true,
      neverModifyMediaFactoryComponents: true,
      neverRepairFailuresAutomatically: true,
      neverBeginQ5Implementation: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    };
  }
}

export function createMediaCertification(
  bootstrap: EmpireBootstrapContext,
  options?: MediaCertificationOptions,
) {
  return new MediaCertification(bootstrap, options);
}

export function resetMediaCertificationForTesting() {
  resetMdcLogsForTesting();
  resetCertificationSequenceForTesting();
}
