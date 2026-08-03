import type { CourseBuilderWorkerConfiguration } from "./configuration.js";
import {
  IntegrationCoordinator,
  type CourseBuilderWorkerDependencies,
} from "./integrations.js";
import { CourseBuilder } from "./course-builder.js";
import { CourseStore } from "./course-store.js";
import { HealthMonitor, CourseValidator, RecoveryManager } from "./course-validator.js";
import { appendCbwLog } from "./cbw-logging.js";
import {
  CBW_CAPABILITIES,
  CBW_METADATA_VERSION,
  COURSE_BUILDER_WORKER_ID,
  INTEGRATION_TARGETS,
} from "./paths.js";
import type {
  CourseBuilderReport,
  CourseBuilderWorkerCatalog,
  CourseBuilderWorkerEngineRecord,
  CourseBuilderWorkerInput,
  CourseBuilderWorkerRunReport,
  CourseContext,
  IntegrationHandshake,
  OperationalState,
} from "./types.js";

export class CourseManager {
  private engineRecord: CourseBuilderWorkerEngineRecord | null = null;
  private seeded = false;
  private catalog: CourseBuilderWorkerCatalog | null = null;
  private readonly store = new CourseStore();
  private readonly builder = new CourseBuilder();
  private readonly validator = new CourseValidator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();
  private readonly integrations = new IntegrationCoordinator();
  private handshakes: IntegrationHandshake[] = [];
  private context: CourseContext = {};

  bindIntegrations(deps: CourseBuilderWorkerDependencies = {}) {
    this.integrations.bind(deps);
  }

  ensureSeeded(config: CourseBuilderWorkerConfiguration) {
    if (this.seeded) return;
    this.store.seed(config.seedCourses);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    this.seeded = true;
    this.ensureRecord("connected", config);
  }

  getEngineRecord() {
    return this.engineRecord
      ? {
          ...this.engineRecord,
          supportedCapabilities: [...this.engineRecord.supportedCapabilities],
          integrationTargets: [...this.engineRecord.integrationTargets],
        }
      : null;
  }

  getCatalog() {
    return this.catalog ? cloneCatalog(this.catalog) : null;
  }

  getCourses() {
    return this.store.list();
  }

  getLatestCourseId() {
    return this.store.getLatestCourseId();
  }

  getAuditTrail() {
    return this.store.getAuditTrail();
  }

  getIntegrations() {
    return this.handshakes.map((h) => ({ ...h }));
  }

  getContext() {
    return {
      ...this.context,
      customerPainPoints: [...(this.context.customerPainPoints ?? [])],
    };
  }

  connect(
    _input: Record<string, unknown>,
    config: CourseBuilderWorkerConfiguration,
  ): CourseBuilderWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.handshakes = this.integrations.connect(
      config.workerId,
      config.integrationTargets.length ? config.integrationTargets : [...INTEGRATION_TARGETS],
    );
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    this.ensureRecord("connected", config);
    appendCbwLog({
      event: "connect",
      details: `Course Builder Worker connected; integrations=${this.handshakes.length}`,
    });
    return this.report(
      "connect",
      this.getCatalog(),
      [],
      null,
      {
        validationReportId: `cbw-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: config.enabled ? "pass" : "fail",
        errors: config.enabled ? [] : ["Course Builder Worker is disabled"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: CBW_METADATA_VERSION,
      },
      started,
    );
  }

  receiveApprovedDigitalProductResearch(
    input: CourseBuilderWorkerInput,
    config: CourseBuilderWorkerConfiguration,
  ) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.courseRulesEnabled) {
      return this.disabled(
        "receive_approved_digital_product_research",
        config,
        !config.enabled ? "Course Builder Worker is disabled" : "Course rules are disabled",
      );
    }
    if (this.hasBoundary(input)) {
      return this.boundaryFail(
        "receive_approved_digital_product_research",
        input,
        config,
        started,
      );
    }
    const enriched = this.integrations.enrichFromApprovedResearch(input);
    const { enrichment } = this.integrations.pullResearchContext(enriched);
    this.context = this.builder.mergeContext(enriched, this.context, enrichment);
    this.context = {
      ...this.context,
      receivedResearch: true,
      productType: this.builder.normalizeProductType(
        enriched.productType ?? this.context.productType ?? config.defaultProductType,
      ),
    };
    // Always materialize a fresh course for newly received research so product type
    // and research identity are not reused from a prior in-memory course shell.
    const course = this.builder.buildCourse(enriched, config, this.context);
    this.store.save(course, "receive_approved_digital_product_research");
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.validateCourses(
      [course],
      { ...enriched, validated: enriched.validated ?? true },
      started,
      { allowIncompleteCourse: true },
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      course,
    );
    appendCbwLog({
      event: "receive_approved_digital_product_research",
      details: `researchReportId=${course.researchReportId ?? "none"} course=${course.courseId} type=${course.productType}`,
    });
    return this.report(
      "receive_approved_digital_product_research",
      this.getCatalog(),
      [course],
      course,
      validation,
      started,
    );
  }

  designCompleteCourseCurriculum(
    input: CourseBuilderWorkerInput,
    config: CourseBuilderWorkerConfiguration,
  ) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.courseRulesEnabled) {
      return this.disabled(
        "design_complete_course_curriculum",
        config,
        !config.enabled ? "Course Builder Worker is disabled" : "Course rules are disabled",
      );
    }
    if (this.hasBoundary(input)) {
      return this.boundaryFail("design_complete_course_curriculum", input, config, started);
    }
    const enriched = this.integrations.enrichFromApprovedResearch(input);
    const { enrichment } = this.integrations.pullResearchContext(enriched);
    this.context = this.builder.mergeContext(enriched, this.context, enrichment);
    const moduleCount = enriched.moduleCount ?? config.defaultModuleCount;
    const lessonsPerModule = enriched.lessonsPerModule ?? config.defaultLessonsPerModule;
    const curriculum = this.builder.designCompleteCourseCurriculum(
      this.context,
      moduleCount,
      lessonsPerModule,
    );
    const latest = this.ensureWorkingCourse(enriched, config, started);
    if (!latest) {
      const validation = this.validator.finalize(
        "fail",
        ["Unable to design curriculum without research/product context"],
        [],
        started,
      );
      return this.report(
        "design_complete_course_curriculum",
        this.getCatalog(),
        [],
        null,
        validation,
        started,
      );
    }
    const organized = this.builder.organizeModules(curriculum, this.context, lessonsPerModule);
    const updated: CourseBuilderReport = {
      ...latest,
      curriculum,
      courseTitle: curriculum.title,
      learningObjectives: curriculum.learningObjectives,
      modules: organized.modules,
      moduleStructure: organized.moduleStructure,
      timestamp: new Date().toISOString(),
      preservedDecisions: [
        ...latest.preservedDecisions,
        {
          decisionId: `cbw-dec-curriculum-${Date.now()}`,
          topic: curriculum.title,
          decision: `Course curriculum designed with ${curriculum.moduleTitles.length} modules`,
          recordedAt: new Date().toISOString(),
        },
      ],
    };
    this.store.save(updated, "design_complete_course_curriculum");
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.validateCourses(
      [updated],
      { ...enriched, validated: enriched.validated ?? true },
      started,
      { allowIncompleteCourse: true },
    );
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      updated,
    );
    appendCbwLog({
      event: "design_complete_course_curriculum",
      details: `course=${updated.courseId} modules=${curriculum.moduleTitles.length}`,
    });
    return this.report(
      "design_complete_course_curriculum",
      this.getCatalog(),
      [updated],
      updated,
      validation,
      started,
    );
  }

  organizeModules(input: CourseBuilderWorkerInput, config: CourseBuilderWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.courseRulesEnabled) {
      return this.disabled(
        "organize_modules",
        config,
        !config.enabled ? "Course Builder Worker is disabled" : "Course rules are disabled",
      );
    }
    if (this.hasBoundary(input)) {
      return this.boundaryFail("organize_modules", input, config, started);
    }
    const enriched = this.integrations.enrichFromApprovedResearch(input);
    const { enrichment } = this.integrations.pullResearchContext(enriched);
    this.context = this.builder.mergeContext(enriched, this.context, enrichment);
    const latest = this.ensureWorkingCourse(enriched, config, started);
    if (!latest) {
      const validation = this.validator.finalize(
        "fail",
        ["Unable to organize modules without research/product context"],
        [],
        started,
      );
      return this.report("organize_modules", this.getCatalog(), [], null, validation, started);
    }
    const moduleCount = enriched.moduleCount ?? config.defaultModuleCount;
    const lessonsPerModule = enriched.lessonsPerModule ?? config.defaultLessonsPerModule;
    const curriculum =
      latest.curriculum ??
      this.builder.designCompleteCourseCurriculum(this.context, moduleCount, lessonsPerModule);
    const organized = this.builder.organizeModules(curriculum, this.context, lessonsPerModule);
    const updated: CourseBuilderReport = {
      ...latest,
      curriculum,
      modules: organized.modules,
      moduleStructure: organized.moduleStructure,
      timestamp: new Date().toISOString(),
    };
    this.store.save(updated, "organize_modules");
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.validateCourses(
      [updated],
      { ...enriched, validated: enriched.validated ?? true },
      started,
      { allowIncompleteCourse: true },
    );
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      updated,
    );
    appendCbwLog({
      event: "organize_modules",
      details: `course=${updated.courseId} modules=${organized.modules.length}`,
    });
    return this.report(
      "organize_modules",
      this.getCatalog(),
      [updated],
      updated,
      validation,
      started,
    );
  }

  createLessons(input: CourseBuilderWorkerInput, config: CourseBuilderWorkerConfiguration) {
    return this.runContentStage("create_lessons", input, config, (course) => {
      const lessonsPerModule = input.lessonsPerModule ?? config.defaultLessonsPerModule;
      const moduleCount = input.moduleCount ?? config.defaultModuleCount;
      const curriculum =
        course.curriculum ??
        this.builder.designCompleteCourseCurriculum(this.context, moduleCount, lessonsPerModule);
      const modules =
        course.modules.length > 0
          ? course.modules
          : this.builder.organizeModules(curriculum, this.context, lessonsPerModule).modules;
      const lessons = this.builder.createLessons(modules, this.context, lessonsPerModule);
      const moduleStructure =
        course.moduleStructure.length > 0
          ? course.moduleStructure.map((entry) => ({
              ...entry,
              lessonCount:
                lessons.filter((l) => l.moduleNumber === entry.moduleNumber).length ||
                entry.lessonCount,
            }))
          : modules.map((module) => ({
              moduleNumber: module.moduleNumber,
              title: module.title,
              summary: module.summary,
              lessonCount: lessons.filter((l) => l.moduleNumber === module.moduleNumber).length,
            }));
      return {
        ...course,
        curriculum,
        modules,
        lessons,
        moduleStructure,
        lessonCount: lessons.length,
      };
    });
  }

  generateQuizzesAndAssessments(
    input: CourseBuilderWorkerInput,
    config: CourseBuilderWorkerConfiguration,
  ) {
    return this.runContentStage("generate_quizzes_and_assessments", input, config, (course) => {
      const lessonsPerModule = input.lessonsPerModule ?? config.defaultLessonsPerModule;
      const moduleCount = input.moduleCount ?? config.defaultModuleCount;
      const curriculum =
        course.curriculum ??
        this.builder.designCompleteCourseCurriculum(this.context, moduleCount, lessonsPerModule);
      const modules =
        course.modules.length > 0
          ? course.modules
          : this.builder.organizeModules(curriculum, this.context, lessonsPerModule).modules;
      const quizzes = this.builder.generateQuizzesAndAssessments(modules, this.context);
      return {
        ...course,
        curriculum,
        modules,
        quizzes,
        quizCount: quizzes.length,
      };
    });
  }

  generateDownloadableResources(
    input: CourseBuilderWorkerInput,
    config: CourseBuilderWorkerConfiguration,
  ) {
    return this.runContentStage("generate_downloadable_resources", input, config, (course) => {
      const lessonsPerModule = input.lessonsPerModule ?? config.defaultLessonsPerModule;
      const moduleCount = input.moduleCount ?? config.defaultModuleCount;
      const curriculum =
        course.curriculum ??
        this.builder.designCompleteCourseCurriculum(this.context, moduleCount, lessonsPerModule);
      const modules =
        course.modules.length > 0
          ? course.modules
          : this.builder.organizeModules(curriculum, this.context, lessonsPerModule).modules;
      const resources = this.builder.generateDownloadableResources(modules, this.context);
      return {
        ...course,
        curriculum,
        modules,
        resources,
        resourceCount: resources.length,
      };
    });
  }

  createLearningObjectives(
    input: CourseBuilderWorkerInput,
    config: CourseBuilderWorkerConfiguration,
  ) {
    return this.runContentStage("create_learning_objectives", input, config, (course) => {
      const learningObjectives = this.builder.createLearningObjectives(
        course.curriculum,
        course.lessons,
        this.context,
      );
      return {
        ...course,
        learningObjectives,
        curriculum: course.curriculum
          ? { ...course.curriculum, learningObjectives }
          : course.curriculum,
      };
    });
  }

  validateInstructionalFlow(
    input: CourseBuilderWorkerInput,
    config: CourseBuilderWorkerConfiguration,
  ) {
    return this.runContentStage("validate_instructional_flow", input, config, (course) => {
      const review = this.builder.validateInstructionalFlow(course, this.context);
      return {
        ...course,
        instructionalFlowValidated: review.instructionalFlowValidated,
        selfReviewPassed: review.passed,
        selfReviewSummary: review.summary,
        selfReviewFindings: review.findings,
        qualityReview: review.qualityReview,
        confidenceScore: review.confidenceScore,
        researchCompliance: review.researchCompliance,
        researchComplianceNotes: review.researchComplianceNotes,
      };
    });
  }

  packageExportReadyCourseAssets(
    input: CourseBuilderWorkerInput,
    config: CourseBuilderWorkerConfiguration,
  ) {
    return this.runContentStage(
      "package_export_ready_course_assets",
      input,
      config,
      (course) => ({
        ...course,
        exportFormats: this.builder.prepareExportFormats(),
        preservedDecisions: [
          ...course.preservedDecisions,
          {
            decisionId: `cbw-dec-export-${Date.now()}`,
            topic: course.courseTitle,
            decision:
              "Prepared export-ready structural formats (markdown/scorm_ready/zip_ready/lms_package_ready) without publishing or delivering",
            recordedAt: new Date().toISOString(),
          },
        ],
      }),
    );
  }

  produceCourseBuilderReport(input: CourseBuilderWorkerInput, config: CourseBuilderWorkerConfiguration) {
    return this.runFullBuild("produce_course_builder_report", input, config);
  }

  submitReport(input: CourseBuilderWorkerInput, config: CourseBuilderWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) {
      return this.boundaryFail("submit_report", input, config, started);
    }
    if (!config.executiveReportingEnabled) {
      return this.disabled("submit_report", config, "Executive reporting submission is disabled");
    }
    let courses = this.store.list();
    if (input.courseId) {
      const one = this.store.get(input.courseId);
      courses = one ? [one] : [];
    }
    if (!courses.length) {
      const generated = this.runFullBuild("produce_course_builder_report", input, config);
      courses = generated.courses;
      if (!courses.length || generated.validation.decision === "fail") return generated;
    }
    const submission = this.integrations.submitReport(courses);
    if (submission.submitted && submission.executiveReportId) {
      courses = courses.map(
        (c) => this.store.markSubmitted(c.courseId, submission.executiveReportId!) ?? c,
      );
    }
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const latest = courses[courses.length - 1] ?? null;
    const validation = this.validator.validateCourses(
      courses.length ? courses : null,
      { ...input, validated: input.validated ?? true },
      started,
    );
    if (!submission.submitted) validation.warnings.push(submission.details);
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      latest,
    );
    appendCbwLog({
      event: "submit_report",
      details: `courses=${courses.length} submitted=${submission.submitted}`,
    });
    return this.report(
      "submit_report",
      this.getCatalog(),
      courses,
      latest,
      validation.warnings.length && validation.decision === "pass"
        ? { ...validation, decision: "partial" }
        : validation,
      started,
    );
  }

  list(config: CourseBuilderWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const courses = this.store.list();
    const latest = courses[courses.length - 1] ?? null;
    const validation = this.validator.validateCourses(
      courses.length ? courses : null,
      { validated: true },
      started,
    );
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      latest,
    );
    return this.report("list", this.getCatalog(), courses, latest, validation, started);
  }

  validate(input: CourseBuilderWorkerInput, config: CourseBuilderWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const courses = this.store.list();
    const latest = courses[courses.length - 1] ?? null;
    const validation = this.validator.validateCourses(
      courses.length ? courses : null,
      { ...input, validated: input.validated ?? true },
      started,
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      latest,
    );
    return this.report("validate", this.getCatalog(), courses, latest, validation, started);
  }

  diagnostics(config: CourseBuilderWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.finalize(
      config.enabled ? "pass" : "fail",
      config.enabled ? [] : ["Course Builder Worker is disabled"],
      [],
      started,
    );
    this.ensureRecord("active", config);
    appendCbwLog({ event: "diagnostics", details: `courses=${this.store.count()}` });
    return this.report(
      "diagnostics",
      this.getCatalog(),
      this.store.list(),
      null,
      validation,
      started,
    );
  }

  private runContentStage(
    action: CourseBuilderWorkerRunReport["action"],
    input: CourseBuilderWorkerInput,
    config: CourseBuilderWorkerConfiguration,
    mutate: (course: CourseBuilderReport) => CourseBuilderReport,
  ): CourseBuilderWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.courseRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled ? "Course Builder Worker is disabled" : "Course rules are disabled",
      );
    }
    if (this.hasBoundary(input)) return this.boundaryFail(action, input, config, started);
    const enriched = this.integrations.enrichFromApprovedResearch(input);
    const { enrichment } = this.integrations.pullResearchContext(enriched);
    this.context = this.builder.mergeContext(enriched, this.context, enrichment);
    const latest = this.ensureWorkingCourse(enriched, config, started);
    if (!latest) {
      const validation = this.validator.finalize(
        "fail",
        ["No course available — approved research/product context required"],
        [],
        started,
      );
      this.recovery.recordFailure();
      this.ensureRecord("failed", config, "failed");
      return this.report(action, this.getCatalog(), [], null, validation, started);
    }
    const updated: CourseBuilderReport = {
      ...mutate(latest),
      timestamp: new Date().toISOString(),
    };
    this.store.save(updated, action);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const earlyStage =
      action === "create_lessons" ||
      action === "generate_quizzes_and_assessments" ||
      action === "generate_downloadable_resources" ||
      action === "create_learning_objectives";
    const validation = this.validator.validateCourses(
      [updated],
      { ...enriched, validated: enriched.validated ?? true },
      started,
      earlyStage ? { allowIncompleteCourse: true } : {},
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      updated,
    );
    appendCbwLog({
      event: action,
      details: `course=${updated.courseId} lessons=${updated.lessonCount} confidence=${updated.confidenceScore}`,
    });
    return this.report(action, this.getCatalog(), [updated], updated, validation, started);
  }

  private runFullBuild(
    action: CourseBuilderWorkerRunReport["action"],
    input: CourseBuilderWorkerInput,
    config: CourseBuilderWorkerConfiguration,
  ): CourseBuilderWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.courseRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled ? "Course Builder Worker is disabled" : "Course rules are disabled",
      );
    }
    if (this.hasBoundary(input)) return this.boundaryFail(action, input, config, started);
    const enriched = this.integrations.enrichFromApprovedResearch(input);
    const { enrichment } = this.integrations.pullResearchContext(enriched);
    this.context = this.builder.mergeContext(enriched, this.context, enrichment);
    if (enriched.researchReportId || enriched.researchTopic || enriched.productTitle || enriched.courseTitle) {
      this.context = { ...this.context, receivedResearch: true };
    }
    const readiness = this.builder.canBuildCourse(this.context);
    if (!readiness.ready) {
      const validation = this.validator.finalize(
        "fail",
        [readiness.reason ?? "Not ready"],
        [],
        started,
      );
      this.recovery.recordFailure();
      this.ensureRecord("failed", config, "failed");
      return this.report(action, this.getCatalog(), [], null, validation, started);
    }
    const course = this.builder.buildCourse(enriched, config, this.context);
    this.store.save(course, action);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.validateCourses(
      [course],
      { ...enriched, validated: enriched.validated ?? true },
      started,
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      course,
    );
    appendCbwLog({
      event: action,
      details: `course=${course.courseId} type=${course.productType} lessons=${course.lessonCount} confidence=${course.confidenceScore}`,
    });
    return this.report(action, this.getCatalog(), [course], course, validation, started);
  }

  private ensureWorkingCourse(
    input: CourseBuilderWorkerInput,
    config: CourseBuilderWorkerConfiguration,
    _started: number,
  ): CourseBuilderReport | null {
    if (input.courseId) {
      const existing = this.store.get(input.courseId);
      if (existing) return existing;
    }
    const latest = this.store.list().at(-1);
    if (latest) return latest;
    const readiness = this.builder.canBuildCourse(this.context);
    if (!readiness.ready) return null;
    const created = this.builder.buildCourse(input, config, this.context);
    this.store.save(created, "bootstrap_course");
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    return created;
  }

  private boundaryFail(
    action: CourseBuilderWorkerRunReport["action"],
    input: CourseBuilderWorkerInput,
    config: CourseBuilderWorkerConfiguration,
    started: number,
  ) {
    const validation = this.validator.validateCourses(null, input, started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], null, validation, started);
  }

  private disabled(
    action: CourseBuilderWorkerRunReport["action"],
    config: CourseBuilderWorkerConfiguration,
    message: string,
  ) {
    const started = Date.now();
    const validation = this.validator.finalize("fail", [message], [], started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], null, validation, started);
  }

  private hasBoundary(input: CourseBuilderWorkerInput) {
    return (
      input.buildSalesPages === true ||
      input.processPayments === true ||
      input.deliverCoursesToCustomers === true ||
      input.publishCoursesDirectly === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.implementQ506OrLater === true
    );
  }

  private ensureRecord(
    state: OperationalState,
    config: CourseBuilderWorkerConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "passed",
    latest: CourseBuilderReport | null = null,
  ) {
    const course = latest ?? this.store.list().at(-1) ?? null;
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `cbw-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: COURSE_BUILDER_WORKER_ID,
      engineVersion: "PILLOW-CBW-001",
      currentOperationalState: state,
      healthStatus: this.healthMonitor.status(
        validationStatus === "failed" ? "fail" : "pass",
        config.enabled,
      ),
      validationStatus,
      supportedCapabilities: [...CBW_CAPABILITIES],
      totalCourses: this.store.count(),
      lastCourseId: course?.courseId ?? this.store.getLatestCourseId(),
      lastProductType: course?.productType ?? null,
      lastConfidenceScore: course?.confidenceScore ?? null,
      workerId: config.workerId,
      integrationTargets: [...INTEGRATION_TARGETS],
      metadataVersion: CBW_METADATA_VERSION,
    };
  }

  private report(
    action: CourseBuilderWorkerRunReport["action"],
    catalog: CourseBuilderWorkerCatalog | null,
    courses: CourseBuilderReport[],
    latestCourse: CourseBuilderReport | null,
    validation: CourseBuilderWorkerRunReport["validation"],
    started: number,
  ): CourseBuilderWorkerRunReport {
    const engineRecord = this.getEngineRecord()!;
    return {
      courseRunReportId: `cbw-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord,
      catalog,
      courses,
      latestCourse,
      integrations: this.getIntegrations(),
      validation,
      durationMs: Date.now() - started,
      metadataVersion: CBW_METADATA_VERSION,
    };
  }
}

function cloneCatalog(catalog: CourseBuilderWorkerCatalog): CourseBuilderWorkerCatalog {
  return {
    ...catalog,
    courses: catalog.courses.map((course) => ({
      ...course,
      learningObjectives: [...course.learningObjectives],
      moduleStructure: course.moduleStructure.map((m) => ({ ...m })),
      exportFormats: [...course.exportFormats],
      curriculum: course.curriculum
        ? {
            ...course.curriculum,
            tableOfContents: [...course.curriculum.tableOfContents],
            moduleTitles: [...course.curriculum.moduleTitles],
            learningObjectives: [...course.curriculum.learningObjectives],
          }
        : null,
      modules: course.modules.map((m) => ({ ...m, lessonIds: [...m.lessonIds] })),
      lessons: course.lessons.map((l) => ({
        ...l,
        learningObjectives: [...l.learningObjectives],
      })),
      quizzes: course.quizzes.map((q) => ({
        ...q,
        questions: q.questions.map((question) => ({
          ...question,
          options: question.options ? [...question.options] : undefined,
        })),
      })),
      resources: course.resources.map((r) => ({ ...r })),
      selfReviewFindings: course.selfReviewFindings.map((f) => ({ ...f })),
      traceabilityRefs: [...course.traceabilityRefs],
      preservedDecisions: course.preservedDecisions.map((d) => ({ ...d })),
    })),
    integrations: catalog.integrations.map((i) => ({ ...i })),
  };
}
