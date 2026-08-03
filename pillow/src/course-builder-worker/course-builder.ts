import type { CourseBuilderWorkerConfiguration } from "./configuration.js";
import type { DprEnrichmentContext } from "./integrations.js";
import {
  CBW_METADATA_VERSION,
  COURSE_BUILDER_REPORT_VERSION,
  COURSE_BUILDER_WORKER_IDENTITY,
  EXPORT_FORMATS,
  PRODUCT_TYPES,
} from "./paths.js";
import type {
  CourseBuilderReport,
  CourseBuilderWorkerCatalog,
  CourseBuilderWorkerInput,
  CourseContext,
  CourseCurriculum,
  CourseLesson,
  CourseModule,
  CourseModuleStructureEntry,
  CourseQuiz,
  CourseResource,
  ExportFormat,
  IntegrationHandshake,
  ProductType,
  SelfReviewFinding,
  SelfReviewResult,
} from "./types.js";

/** Pure Course Builder Worker helpers for Q5-05 — educational course creation only. */
export class CourseBuilder {
  buildCatalog(
    config: CourseBuilderWorkerConfiguration,
    courses: CourseBuilderReport[],
    integrations: IntegrationHandshake[],
  ): CourseBuilderWorkerCatalog {
    return {
      reportVersion: COURSE_BUILDER_REPORT_VERSION,
      workerId: config.workerId,
      courses: courses.map(cloneCourse),
      integrations: integrations.map((i) => ({ ...i })),
      metadataVersion: CBW_METADATA_VERSION,
      executiveAuthority: "pillow",
      neverBuildSalesPages: true,
      neverProcessPayments: true,
      neverDeliverCoursesToCustomers: true,
      neverPublishCoursesDirectly: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    };
  }

  mergeContext(
    input: CourseBuilderWorkerInput,
    context: CourseContext,
    enrichment?: DprEnrichmentContext | null,
  ): CourseContext {
    const receivedResearch =
      context.receivedResearch ||
      Boolean(input.researchReportId?.trim()) ||
      Boolean(enrichment?.researchReportId?.trim()) ||
      Boolean(input.researchTopic?.trim()) ||
      Boolean(enrichment?.researchTopic?.trim());
    return {
      researchReportId:
        input.researchReportId ?? enrichment?.researchReportId ?? context.researchReportId ?? null,
      opportunityId:
        input.opportunityId ?? enrichment?.opportunityId ?? context.opportunityId ?? null,
      businessId: input.businessId ?? enrichment?.businessId ?? context.businessId ?? null,
      factoryMissionId:
        input.factoryMissionId ??
        enrichment?.factoryMissionId ??
        context.factoryMissionId ??
        null,
      productTitle:
        input.productTitle ??
        input.courseTitle ??
        enrichment?.productTitle ??
        context.productTitle ??
        null,
      courseTitle:
        input.courseTitle ??
        input.productTitle ??
        enrichment?.productTitle ??
        context.courseTitle ??
        context.productTitle ??
        null,
      productType: this.normalizeProductType(
        input.productType ?? enrichment?.productType ?? context.productType,
      ),
      targetAudience:
        input.targetAudience ?? enrichment?.targetAudience ?? context.targetAudience ?? null,
      customerPainPoints:
        input.customerPainPoints ??
        enrichment?.customerPainPoints ??
        context.customerPainPoints ??
        [],
      marketGap: input.marketGap ?? enrichment?.marketGap ?? context.marketGap ?? null,
      demandAssessment:
        input.demandAssessment ?? enrichment?.demandAssessment ?? context.demandAssessment ?? null,
      researchTopic:
        input.researchTopic ?? enrichment?.researchTopic ?? context.researchTopic ?? null,
      receivedResearch,
    };
  }

  canBuildCourse(context: CourseContext): { ready: boolean; reason?: string } {
    if (
      !context.receivedResearch &&
      !context.researchReportId &&
      !context.researchTopic &&
      !context.productTitle &&
      !context.courseTitle
    ) {
      return {
        ready: false,
        reason:
          "Approved digital product research context required (researchReportId, researchTopic, productTitle, or courseTitle)",
      };
    }
    return { ready: true };
  }

  designCompleteCourseCurriculum(
    context: CourseContext,
    moduleCount: number,
    lessonsPerModule: number,
  ): CourseCurriculum {
    const title = this.resolveTitle(context);
    const audience = context.targetAudience?.trim() || "adult learners";
    const pain =
      context.customerPainPoints?.[0] ??
      "practical skill gaps between learner need and available instruction";
    const moduleTitles: string[] = [];
    const toc: string[] = [];
    for (let i = 1; i <= moduleCount; i++) {
      const moduleTitle = this.moduleTitle(title, i, moduleCount, context);
      moduleTitles.push(moduleTitle);
      toc.push(`Module ${i}: ${moduleTitle} (${lessonsPerModule} lessons)`);
    }
    return {
      title,
      subtitle: `A practical ${this.normalizeProductType(context.productType)} for ${audience}`,
      tableOfContents: toc,
      moduleTitles,
      learningObjectives: [
        `Understand the core problem space around ${title}`,
        `Apply structured practices that address ${pain}`,
        `Complete module activities with measurable skill demonstration`,
        `Use quizzes and downloadable resources for reinforced learning`,
      ],
    };
  }

  organizeModules(
    curriculum: CourseCurriculum,
    context: CourseContext,
    lessonsPerModule: number,
  ): { modules: CourseModule[]; moduleStructure: CourseModuleStructureEntry[] } {
    const title = this.resolveTitle(context);
    const audience = context.targetAudience?.trim() || "adult learners";
    const pain =
      context.customerPainPoints?.[0] ??
      "incomplete guidance and fragmented learning paths";
    const modules: CourseModule[] = [];
    const moduleStructure: CourseModuleStructureEntry[] = [];
    curriculum.moduleTitles.forEach((moduleTitle, index) => {
      const moduleNumber = index + 1;
      const lessonIds = Array.from(
        { length: lessonsPerModule },
        (_, lessonIndex) =>
          `cbw-lsn-${courseSequence || 1}-m${moduleNumber}-l${lessonIndex + 1}`,
      );
      const summary = this.moduleSummary(
        title,
        moduleNumber,
        curriculum.moduleTitles.length,
        audience,
        pain,
        context,
      );
      modules.push({
        moduleNumber,
        title: moduleTitle,
        summary,
        lessonIds,
      });
      moduleStructure.push({
        moduleNumber,
        title: moduleTitle,
        summary,
        lessonCount: lessonsPerModule,
      });
    });
    return { modules, moduleStructure };
  }

  createLessons(
    modules: CourseModule[],
    context: CourseContext,
    lessonsPerModule: number,
  ): CourseLesson[] {
    const title = this.resolveTitle(context);
    const audience = context.targetAudience?.trim() || "adult learners";
    const pain =
      context.customerPainPoints?.[0] ??
      "incomplete guidance and fragmented digital product practices";
    const marketGap = context.marketGap?.trim() || `Coverage gaps for ${title}`;
    const demand =
      context.demandAssessment?.trim() || "Demand assessed from approved research signals";
    const lessons: CourseLesson[] = [];
    for (const module of modules) {
      for (let lessonNumber = 1; lessonNumber <= lessonsPerModule; lessonNumber++) {
        const lessonId =
          module.lessonIds[lessonNumber - 1] ??
          `cbw-lsn-${courseSequence || 1}-m${module.moduleNumber}-l${lessonNumber}`;
        const lessonTitle = this.lessonTitle(
          title,
          module.title,
          module.moduleNumber,
          lessonNumber,
          lessonsPerModule,
        );
        const learningObjectives = [
          `Explain the key concept of ${lessonTitle} within ${module.title}`,
          `Apply one practice from ${lessonTitle} to a real ${audience} scenario`,
        ];
        const body = this.buildLessonBody(
          title,
          module.moduleNumber,
          modules.length,
          lessonNumber,
          lessonsPerModule,
          lessonTitle,
          module.title,
          audience,
          pain,
          marketGap,
          demand,
          context,
        );
        lessons.push({
          lessonId,
          moduleNumber: module.moduleNumber,
          lessonNumber,
          title: lessonTitle,
          learningObjectives,
          body,
          estimatedMinutes: 12 + lessonNumber * 3,
        });
      }
    }
    return lessons;
  }

  generateQuizzesAndAssessments(
    modules: CourseModule[],
    context: CourseContext,
  ): CourseQuiz[] {
    const title = this.resolveTitle(context);
    return modules.map((module) => ({
      quizId: `cbw-quiz-${courseSequence || 1}-m${module.moduleNumber}`,
      moduleNumber: module.moduleNumber,
      title: `${module.title} Checkpoint`,
      questions: [
        {
          questionId: `cbw-q-${courseSequence || 1}-m${module.moduleNumber}-1`,
          prompt: `What is the primary learning outcome of Module ${module.moduleNumber} in ${title}?`,
          options: [
            `Apply the core practice from ${module.title}`,
            "Build a sales page for the course",
            "Process a customer payment",
            "Publish the course directly to customers",
          ],
          answerHint: `Focus on educational practice from ${module.title}`,
        },
        {
          questionId: `cbw-q-${courseSequence || 1}-m${module.moduleNumber}-2`,
          prompt: `Which action best reinforces ${module.title}?`,
          options: [
            "Complete the lesson practice and document evidence",
            "Skip assessment and mark complete",
            "Deliver the course to a customer",
            "Override factory governance",
          ],
          answerHint: "Choose the instructional reinforcement path",
        },
        {
          questionId: `cbw-q-${courseSequence || 1}-m${module.moduleNumber}-3`,
          prompt: `How should a learner use the downloadable resources for ${module.title}?`,
          options: [
            "As worksheets and checklists that support practice",
            "As a payment receipt",
            "As a live customer delivery channel",
            "As a sales funnel asset",
          ],
          answerHint: "Resources support learning, never commerce",
        },
      ],
    }));
  }

  generateDownloadableResources(
    modules: CourseModule[],
    context: CourseContext,
  ): CourseResource[] {
    const title = this.resolveTitle(context);
    const resources: CourseResource[] = [
      {
        resourceId: `cbw-res-${courseSequence || 1}-worksheet`,
        title: `${title} Practice Worksheet`,
        resourceType: "worksheet",
        description: `Guided worksheet for applying ${title} methods module by module.`,
      },
      {
        resourceId: `cbw-res-${courseSequence || 1}-checklist`,
        title: `${title} Progress Checklist`,
        resourceType: "checklist",
        description: "Checklist to track lesson completion and evidence of learning.",
      },
      {
        resourceId: `cbw-res-${courseSequence || 1}-template`,
        title: `${title} Decision Log Template`,
        resourceType: "template",
        description: "Template for recording learner decisions and review dates.",
      },
      {
        resourceId: `cbw-res-${courseSequence || 1}-reading`,
        title: `${title} Supplemental Reading Guide`,
        resourceType: "reading",
        description: `Reading guide aligned to approved research intent for ${title}.`,
      },
    ];
    if (modules.length > 2) {
      resources.push({
        resourceId: `cbw-res-${courseSequence || 1}-module-pack`,
        title: `${title} Module Reflection Pack`,
        resourceType: "worksheet",
        description: "Per-module reflection prompts for instructional reinforcement.",
      });
    }
    return resources;
  }

  createLearningObjectives(
    curriculum: CourseCurriculum | null,
    lessons: CourseLesson[],
    context: CourseContext,
  ): string[] {
    const title = this.resolveTitle(context);
    const fromCurriculum = curriculum?.learningObjectives ?? [];
    const fromLessons = lessons
      .slice(0, 4)
      .flatMap((lesson) => lesson.learningObjectives)
      .slice(0, 4);
    return unique([
      ...fromCurriculum,
      ...fromLessons,
      `Demonstrate applied competence in ${title} through module assessments`,
    ]);
  }

  prepareExportFormats(): ExportFormat[] {
    return [...EXPORT_FORMATS];
  }

  validateInstructionalFlow(
    course: Pick<
      CourseBuilderReport,
      | "courseTitle"
      | "modules"
      | "lessons"
      | "quizzes"
      | "resources"
      | "learningObjectives"
      | "curriculum"
      | "moduleStructure"
      | "researchReportId"
      | "lessonCount"
      | "quizCount"
      | "resourceCount"
    >,
    context: CourseContext,
  ): SelfReviewResult {
    const findings: SelfReviewFinding[] = [];
    let score = 72;
    if (!course.modules.length) {
      findings.push({
        findingId: `cbw-f-${courseSequence}-modules`,
        category: "structure",
        severity: "error",
        message: "No modules present",
      });
      score -= 25;
    }
    if (!course.lessons.length) {
      findings.push({
        findingId: `cbw-f-${courseSequence}-lessons`,
        category: "content",
        severity: "error",
        message: "No lesson bodies present",
      });
      score -= 20;
    } else {
      score += 8;
    }
    if (course.lessonCount < 4) {
      findings.push({
        findingId: `cbw-f-${courseSequence}-lesson-count`,
        category: "content",
        severity: "warning",
        message: "Lesson count is below preferred course threshold",
      });
      score -= 6;
    } else {
      score += 6;
    }
    if (!course.quizzes.length) {
      findings.push({
        findingId: `cbw-f-${courseSequence}-quizzes`,
        category: "assessment",
        severity: "warning",
        message: "Quizzes/assessments not yet included",
      });
      score -= 5;
    } else {
      score += 5;
    }
    if (!course.resources.length) {
      findings.push({
        findingId: `cbw-f-${courseSequence}-resources`,
        category: "resources",
        severity: "warning",
        message: "Downloadable resources not yet included",
      });
      score -= 5;
    } else {
      score += 5;
    }
    if (!course.learningObjectives.length) {
      findings.push({
        findingId: `cbw-f-${courseSequence}-objectives`,
        category: "objectives",
        severity: "warning",
        message: "Learning objectives missing from report package",
      });
      score -= 4;
    } else {
      score += 4;
    }
    if (!course.curriculum) {
      findings.push({
        findingId: `cbw-f-${courseSequence}-curriculum`,
        category: "structure",
        severity: "warning",
        message: "Curriculum missing from report package",
      });
      score -= 4;
    } else {
      score += 4;
    }
    if (!course.researchReportId && !context.researchReportId) {
      findings.push({
        findingId: `cbw-f-${courseSequence}-research`,
        category: "research_compliance",
        severity: "warning",
        message: "No researchReportId bound; course intent derived from available context",
      });
      score -= 4;
    } else {
      score += 6;
    }

    const moduleLessonAlignment = course.modules.every((module) => {
      const lessonIds = new Set(
        course.lessons
          .filter((lesson) => lesson.moduleNumber === module.moduleNumber)
          .map((lesson) => lesson.lessonId),
      );
      return module.lessonIds.every((id) => lessonIds.has(id));
    });
    if (!moduleLessonAlignment && course.modules.length && course.lessons.length) {
      findings.push({
        findingId: `cbw-f-${courseSequence}-alignment`,
        category: "instructional_flow",
        severity: "warning",
        message: "Module lessonIds are not fully aligned to lesson records",
      });
      score -= 5;
    } else if (course.modules.length && course.lessons.length) {
      score += 5;
    }

    const confidenceScore = clamp(score, 0, 100);
    const passed =
      findings.every((f) => f.severity !== "error") &&
      course.modules.length > 0 &&
      course.lessons.length > 0 &&
      course.lessonCount >= 3;
    const instructionalFlowValidated = passed;
    const researchCompliance =
      course.researchReportId || context.researchReportId
        ? passed
          ? ("compliant" as const)
          : ("partial" as const)
        : ("partial" as const);
    const summary = passed
      ? `Instructional flow validated for '${course.courseTitle}' with confidence ${confidenceScore}/100. Curriculum, modules, lessons, quizzes, and resources are export-ready as structural signals only.`
      : `Instructional flow incomplete for '${course.courseTitle}' (confidence ${confidenceScore}/100). Resolve findings before executive submission.`;
    const qualityReview = passed
      ? `Quality review: original course material present across ${course.modules.length} modules (${course.lessonCount} lessons, ${course.quizCount} quizzes, ${course.resourceCount} resources); instructionalFlowValidated=${instructionalFlowValidated}; researchCompliance=${researchCompliance}.`
      : `Quality review: gaps remain — ${findings.map((f) => f.message).join("; ")}.`;

    return {
      passed,
      summary,
      qualityReview,
      findings,
      confidenceScore,
      researchCompliance,
      researchComplianceNotes:
        researchCompliance === "compliant"
          ? "Course follows approved digital product research intent"
          : "Course partially aligned to available research/product intent signals",
      instructionalFlowValidated,
    };
  }

  buildCourse(
    input: CourseBuilderWorkerInput,
    config: CourseBuilderWorkerConfiguration,
    context: CourseContext,
  ): CourseBuilderReport {
    courseSequence += 1;
    const now = new Date().toISOString();
    const moduleCount = clamp(
      input.moduleCount ?? config.defaultModuleCount ?? 4,
      2,
      10,
    );
    const lessonsPerModule = clamp(
      input.lessonsPerModule ?? config.defaultLessonsPerModule ?? 3,
      1,
      8,
    );
    const productType = this.normalizeProductType(
      input.productType ?? context.productType ?? config.defaultProductType,
    );
    const courseTitle = this.resolveTitle(context, input);
    const courseId = input.courseId?.trim() || `cbw-crs-${Date.now()}-${courseSequence}`;
    const productId = input.productId?.trim() || `cbw-prd-${Date.now()}-${courseSequence}`;
    const businessId =
      input.businessId?.trim() || context.businessId?.trim() || `dbiz-cbw-${courseSequence}`;
    const factoryMissionId =
      input.factoryMissionId?.trim() ||
      context.factoryMissionId?.trim() ||
      `dpf-cbw-${courseSequence}`;
    const targetAudience =
      input.targetAudience?.trim() ||
      context.targetAudience?.trim() ||
      "Adult learners seeking practical skill development";

    const curriculum = this.designCompleteCourseCurriculum(
      context,
      moduleCount,
      lessonsPerModule,
    );
    const organized = this.organizeModules(curriculum, context, lessonsPerModule);
    const lessons = this.createLessons(organized.modules, context, lessonsPerModule);
    const quizzes = this.generateQuizzesAndAssessments(organized.modules, context);
    const resources = this.generateDownloadableResources(organized.modules, context);
    const learningObjectives = this.createLearningObjectives(curriculum, lessons, context);
    const exportFormats = this.prepareExportFormats();
    const lessonCount = lessons.length;
    const quizCount = quizzes.length;
    const resourceCount = resources.length;
    const draftForReview = {
      courseTitle,
      modules: organized.modules,
      lessons,
      quizzes,
      resources,
      learningObjectives,
      curriculum,
      moduleStructure: organized.moduleStructure,
      researchReportId: context.researchReportId ?? input.researchReportId ?? null,
      lessonCount,
      quizCount,
      resourceCount,
    };
    const review = this.validateInstructionalFlow(draftForReview, context);
    const confidenceScore =
      input.confidenceScore != null && Number.isFinite(input.confidenceScore)
        ? clamp(input.confidenceScore, 0, 100)
        : review.confidenceScore;

    const traceabilityRefs = unique([
      `course:${courseId}`,
      `product:${productId}`,
      `business:${businessId}`,
      `mission:${factoryMissionId}`,
      ...(context.researchReportId ? [`research:${context.researchReportId}`] : []),
      ...(context.opportunityId ? [`opportunity:${context.opportunityId}`] : []),
      `type:${productType}`,
    ]);
    const preservedDecisions = [
      {
        decisionId: `cbw-dec-${courseSequence}-curriculum`,
        topic: courseTitle,
        decision: `Designed ${moduleCount}-module curriculum (${lessonsPerModule} lessons/module) for ${productType} — course material only, no sales/publish/delivery`,
        recordedAt: now,
      },
      {
        decisionId: `cbw-dec-${courseSequence}-export`,
        topic: courseTitle,
        decision: `Prepared structural export signals (${exportFormats.join(", ")}) without publishing or delivering courses`,
        recordedAt: now,
      },
    ];

    return {
      courseId,
      timestamp: now,
      productId,
      courseTitle,
      targetAudience,
      learningObjectives,
      moduleStructure: organized.moduleStructure,
      lessonCount,
      quizCount,
      resourceCount,
      qualityReview: review.qualityReview,
      exportFormats,
      confidenceScore,
      metadataVersion: CBW_METADATA_VERSION,
      researchReportId: context.researchReportId ?? input.researchReportId ?? null,
      opportunityId: context.opportunityId ?? input.opportunityId ?? null,
      businessId,
      factoryMissionId,
      productType,
      curriculum,
      modules: organized.modules,
      lessons,
      quizzes,
      resources,
      instructionalFlowValidated: review.instructionalFlowValidated,
      selfReviewPassed: review.passed,
      selfReviewFindings: review.findings,
      selfReviewSummary: review.summary,
      researchCompliance: review.researchCompliance,
      researchComplianceNotes: review.researchComplianceNotes,
      workerId: config.workerId || COURSE_BUILDER_WORKER_IDENTITY.workerId,
      reportVersion: COURSE_BUILDER_REPORT_VERSION,
      traceabilityRefs,
      preservedDecisions,
      submittedToExecutiveReporting: false,
      executiveReportId: null,
      neverBuildSalesPages: true,
      neverProcessPayments: true,
      neverDeliverCoursesToCustomers: true,
      neverPublishCoursesDirectly: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverImplementQ506OrLater: true,
      followApprovedProductResearch: true,
      followApprovedProductIntent: true,
      produceOriginalCourseMaterial: true,
      preserveCompleteTraceability: true,
      validateEducationalQuality: true,
      performSelfReviewBeforeSubmission: true,
      preserveAuditHistory: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
    };
  }

  normalizeProductType(type: string | ProductType | null | undefined): ProductType {
    const raw = type?.trim() ?? "";
    if (raw && (PRODUCT_TYPES as readonly string[]).includes(raw)) {
      return raw as ProductType;
    }
    switch (raw) {
      case "course":
      case "online_course":
      case "elearning":
        return "self_paced_course";
      case "video":
      case "video_series":
        return "video_course";
      case "text":
      case "written_course":
        return "text_based_course";
      case "live_workshop":
        return "workshop";
      case "certification":
      case "certificate":
        return "certification_course";
      case "intensive":
        return "bootcamp";
      case "blended":
        return "hybrid_course";
      case "ebook":
      case "guide":
      case "manual":
        return "text_based_course";
      case "prompt_pack":
      case "prompt_library":
        return "self_paced_course";
      default:
        return raw ? "unknown" : "self_paced_course";
    }
  }

  private resolveTitle(context: CourseContext, input?: CourseBuilderWorkerInput): string {
    return (
      input?.courseTitle?.trim() ||
      input?.productTitle?.trim() ||
      context.courseTitle?.trim() ||
      context.productTitle?.trim() ||
      context.researchTopic?.trim() ||
      "Digital Product Course"
    );
  }

  private moduleTitle(
    productTitle: string,
    moduleNumber: number,
    moduleCount: number,
    context: CourseContext,
  ): string {
    const themes = [
      `Foundations of ${productTitle}`,
      `Diagnosing Learner Challenges`,
      `Building the Core Skill Framework`,
      `Guided Practice and Application`,
      `Assessment and Feedback Loops`,
      `Advanced Scenarios and Edge Cases`,
      `Capstone Integration`,
      `Sustaining Results Over Time`,
      `Implementation Playbook`,
      `Review, Certify, and Next Steps`,
    ];
    if (moduleNumber === moduleCount) return `Putting ${productTitle} Into Practice`;
    if (moduleNumber === 1) return themes[0]!;
    const painHint = context.customerPainPoints?.[0]
      ? `Addressing ${truncate(context.customerPainPoints[0], 48)}`
      : null;
    return themes[moduleNumber - 1] ?? painHint ?? `Module ${moduleNumber}: ${productTitle}`;
  }

  private moduleSummary(
    productTitle: string,
    moduleNumber: number,
    moduleCount: number,
    audience: string,
    pain: string,
    context: CourseContext,
  ): string {
    if (moduleNumber === 1) {
      return `Introduces ${productTitle} for ${audience} and frames the learning problem of ${pain}.`;
    }
    if (moduleNumber === moduleCount) {
      return `Consolidates methods into an actionable close for ${audience}, with assessments and resources.`;
    }
    return `Develops practical instruction for ${productTitle} module ${moduleNumber}, grounded in approved research intent${
      context.marketGap ? ` and market gap '${truncate(context.marketGap, 60)}'` : ""
    }.`;
  }

  private lessonTitle(
    productTitle: string,
    moduleTitle: string,
    moduleNumber: number,
    lessonNumber: number,
    lessonsPerModule: number,
  ): string {
    if (lessonNumber === 1) return `${moduleTitle}: Core Concepts`;
    if (lessonNumber === lessonsPerModule) {
      return `${moduleTitle}: Practice and Reflection`;
    }
    return `${productTitle} Module ${moduleNumber} Lesson ${lessonNumber}: Applied Methods`;
  }

  private buildLessonBody(
    productTitle: string,
    moduleNumber: number,
    moduleCount: number,
    lessonNumber: number,
    lessonsPerModule: number,
    lessonTitle: string,
    moduleTitle: string,
    audience: string,
    pain: string,
    marketGap: string,
    demand: string,
    context: CourseContext,
  ): string {
    const researchLine = context.researchReportId
      ? `This lesson follows approved research report ${context.researchReportId}.`
      : `This lesson follows the approved product intent available for ${productTitle}.`;
    const paragraphs = [
      `${lessonTitle} opens with a clear learning picture for ${audience}. ${researchLine}`,
      `Learners face ${pain}. The market still shows ${marketGap}. Demand context: ${demand}.`,
      `In this lesson you will define the outcome, select one practice, and produce a tangible artifact tied to ${moduleTitle}.`,
      `Start by writing the lesson objective in one sentence. Then list the constraints that most often block progress for ${audience}.`,
      `Next, apply a three-part method: diagnose the current state, design a minimal working approach, and document the learning evidence for later audit.`,
      `Worked example: a practitioner preparing ${productTitle} materials captures the audience need, chooses one practice exercise, and validates clarity with a short walkthrough.`,
      `Close the lesson by recording what changed, what evidence supports the change, and the single next action that moves ${productTitle} forward.`,
      moduleNumber === moduleCount && lessonNumber === lessonsPerModule
        ? `This final lesson prepares export-ready structure only. It does not publish, sell, deliver courses, or process payments.`
        : `Module ${moduleNumber} lesson ${lessonNumber} of ${lessonsPerModule} keeps the instruction original, practical, and aligned to approved product research.`,
    ];
    return paragraphs.join("\n\n");
  }
}

let courseSequence = 0;

export function resetCourseSequenceForTesting() {
  courseSequence = 0;
}

function cloneCourse(course: CourseBuilderReport): CourseBuilderReport {
  return {
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
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function truncate(value: string, max: number) {
  return value.length <= max ? value : `${value.slice(0, max - 1)}…`;
}
