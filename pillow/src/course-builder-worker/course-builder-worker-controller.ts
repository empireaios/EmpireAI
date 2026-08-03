import type { CourseBuilderWorkerConfiguration } from "./configuration.js";
import type { CourseBuilderWorkerDependencies } from "./integrations.js";
import { CourseManager } from "./course-manager.js";
import type {
  CourseBuilderWorkerInput,
  CourseBuilderWorkerRunReport,
  EngineStatus,
} from "./types.js";

export class CourseBuilderWorkerController {
  private status: EngineStatus = "idle";
  private latestReport: CourseBuilderWorkerRunReport | null = null;

  constructor(
    private readonly manager: CourseManager,
    private readonly config: CourseBuilderWorkerConfiguration,
  ) {}

  initialize() {
    this.manager.ensureSeeded(this.config);
    this.status = "active";
  }

  bindIntegrations(deps: CourseBuilderWorkerDependencies = {}) {
    this.manager.bindIntegrations(deps);
  }

  getStatus() {
    return this.status;
  }

  getManager() {
    return this.manager;
  }

  getConfiguration() {
    return {
      ...this.config,
      integrationTargets: [...this.config.integrationTargets],
      supportedProductTypes: [...this.config.supportedProductTypes],
      reportingLine: [...this.config.reportingLine],
      seedCourses: this.config.seedCourses.map((course) => ({
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
    };
  }

  getLatestReport() {
    return this.latestReport;
  }

  connect(input: Record<string, unknown> = {}) {
    this.status = "connecting";
    return this.finish(this.manager.connect(input, this.config));
  }

  receiveApprovedDigitalProductResearch(input: CourseBuilderWorkerInput = {}) {
    this.status = "receiving";
    return this.finish(
      this.manager.receiveApprovedDigitalProductResearch(input, this.config),
    );
  }

  designCompleteCourseCurriculum(input: CourseBuilderWorkerInput = {}) {
    this.status = "designing_curriculum";
    return this.finish(this.manager.designCompleteCourseCurriculum(input, this.config));
  }

  organizeModules(input: CourseBuilderWorkerInput = {}) {
    this.status = "organizing_modules";
    return this.finish(this.manager.organizeModules(input, this.config));
  }

  createLessons(input: CourseBuilderWorkerInput = {}) {
    this.status = "creating_lessons";
    return this.finish(this.manager.createLessons(input, this.config));
  }

  generateQuizzesAndAssessments(input: CourseBuilderWorkerInput = {}) {
    this.status = "generating_quizzes";
    return this.finish(this.manager.generateQuizzesAndAssessments(input, this.config));
  }

  generateDownloadableResources(input: CourseBuilderWorkerInput = {}) {
    this.status = "generating_resources";
    return this.finish(this.manager.generateDownloadableResources(input, this.config));
  }

  createLearningObjectives(input: CourseBuilderWorkerInput = {}) {
    this.status = "creating_objectives";
    return this.finish(this.manager.createLearningObjectives(input, this.config));
  }

  validateInstructionalFlow(input: CourseBuilderWorkerInput = {}) {
    this.status = "validating_flow";
    return this.finish(this.manager.validateInstructionalFlow(input, this.config));
  }

  packageExportReadyCourseAssets(input: CourseBuilderWorkerInput = {}) {
    this.status = "exporting";
    return this.finish(this.manager.packageExportReadyCourseAssets(input, this.config));
  }

  produceCourseBuilderReport(input: CourseBuilderWorkerInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.produceCourseBuilderReport(input, this.config));
  }

  submitReport(input: CourseBuilderWorkerInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.submitReport(input, this.config));
  }

  list() {
    this.status = "active";
    return this.finish(this.manager.list(this.config));
  }

  validate(input: CourseBuilderWorkerInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.validate(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  private finish(report: CourseBuilderWorkerRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
