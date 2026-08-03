import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildCourseBuilderWorkerConfiguration,
  type CourseBuilderWorkerConfiguration,
} from "./configuration.js";
import type { CourseBuilderWorkerDependencies } from "./integrations.js";
import { CourseBuilderWorkerController } from "./course-builder-worker-controller.js";
import { resetCbwLogsForTesting } from "./cbw-logging.js";
import { COURSE_BUILDER_WORKER_SYSTEM_PATH } from "./paths.js";
import { resetCourseSequenceForTesting } from "./course-builder.js";
import { CourseManager } from "./course-manager.js";
import type {
  CourseBuilderWorkerCockpitSnapshot,
  CourseBuilderWorkerInput,
  CourseBuilderWorkerState,
} from "./types.js";

export interface CourseBuilderWorkerOptions {
  configuration?: Partial<CourseBuilderWorkerConfiguration>;
  dependencies?: CourseBuilderWorkerDependencies;
}

/** Authoritative Q5-05 Course Builder Worker — educational course creation only. */
export class CourseBuilderWorker {
  private initializedAt: string | null = null;
  private readonly controller: CourseBuilderWorkerController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: CourseBuilderWorkerOptions = {},
  ) {
    const manager = new CourseManager();
    if (options.dependencies) manager.bindIntegrations(options.dependencies);
    this.controller = new CourseBuilderWorkerController(
      manager,
      buildCourseBuilderWorkerConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      COURSE_BUILDER_WORKER_SYSTEM_PATH,
    );
    if (!doc?.includes("Course Builder Worker")) {
      throw new Error(
        `${COURSE_BUILDER_WORKER_SYSTEM_PATH} missing — Q5-05 system doc required.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: CourseBuilderWorkerDependencies = {}) {
    this.controller.bindIntegrations(deps);
  }

  getState(): CourseBuilderWorkerState {
    if (!this.initializedAt) {
      throw new Error("Course Builder Worker not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-CBW-001",
      missionId: "Q5-05",
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
        totalCourses: engineRecord?.totalCourses ?? 0,
        lastCourseId: engineRecord?.lastCourseId ?? null,
        lastProductType: engineRecord?.lastProductType ?? null,
        lastConfidenceScore: engineRecord?.lastConfidenceScore ?? null,
        notes: [
          "Course-only: does not build sales pages, process payments, deliver courses to customers, publish courses directly, override Pillow or Grand King, or implement Q5-06 or later.",
        ],
      },
    };
  }

  connect(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  receiveApprovedDigitalProductResearch(input: CourseBuilderWorkerInput = {}) {
    return this.controller.receiveApprovedDigitalProductResearch(input);
  }

  designCompleteCourseCurriculum(input: CourseBuilderWorkerInput = {}) {
    return this.controller.designCompleteCourseCurriculum(input);
  }

  organizeModules(input: CourseBuilderWorkerInput = {}) {
    return this.controller.organizeModules(input);
  }

  createLessons(input: CourseBuilderWorkerInput = {}) {
    return this.controller.createLessons(input);
  }

  generateQuizzesAndAssessments(input: CourseBuilderWorkerInput = {}) {
    return this.controller.generateQuizzesAndAssessments(input);
  }

  generateDownloadableResources(input: CourseBuilderWorkerInput = {}) {
    return this.controller.generateDownloadableResources(input);
  }

  createLearningObjectives(input: CourseBuilderWorkerInput = {}) {
    return this.controller.createLearningObjectives(input);
  }

  validateInstructionalFlow(input: CourseBuilderWorkerInput = {}) {
    return this.controller.validateInstructionalFlow(input);
  }

  packageExportReadyCourseAssets(input: CourseBuilderWorkerInput = {}) {
    return this.controller.packageExportReadyCourseAssets(input);
  }

  produceCourseBuilderReport(input: CourseBuilderWorkerInput = {}) {
    return this.controller.produceCourseBuilderReport(input);
  }

  submitReport(input: CourseBuilderWorkerInput = {}) {
    return this.controller.submitReport(input);
  }

  list() {
    return this.controller.list();
  }

  validate(input: CourseBuilderWorkerInput = {}) {
    return this.controller.validate(input);
  }

  diagnostics() {
    return this.controller.diagnostics();
  }

  getCourses() {
    return this.controller.getManager().getCourses();
  }

  getCatalog() {
    return this.controller.getManager().getCatalog();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getLatestCourseId() {
    return this.controller.getManager().getLatestCourseId();
  }

  getAuditTrail() {
    return this.controller.getManager().getAuditTrail();
  }

  getIntegrations() {
    return this.controller.getManager().getIntegrations();
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
        `Courses: ${state.health.totalCourses}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): CourseBuilderWorkerCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q5-05",
      status: state.status,
      healthStatus: state.health.status,
      totalCourses: state.health.totalCourses,
      latestCourseId: this.getLatestCourseId(),
      lastProductType: state.health.lastProductType,
      lastConfidenceScore: state.health.lastConfidenceScore,
      workerId: state.configuration.workerId,
      neverBuildSalesPages: true,
      neverProcessPayments: true,
      neverDeliverCoursesToCustomers: true,
      neverPublishCoursesDirectly: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    };
  }
}

export function createCourseBuilderWorker(
  bootstrap: EmpireBootstrapContext,
  options?: CourseBuilderWorkerOptions,
) {
  return new CourseBuilderWorker(bootstrap, options);
}

export function resetCourseBuilderWorkerForTesting() {
  resetCbwLogsForTesting();
  resetCourseSequenceForTesting();
}
