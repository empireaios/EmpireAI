import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  CBW_CAPABILITIES,
  CBW_INTEGRATION_TARGETS,
  CBW_METADATA_VERSION,
  CBW_PRODUCT_TYPES,
  COURSE_BUILDER_REPORT_VERSION,
  buildCourseBuilderWorkerConfiguration,
  createCourseBuilderWorker,
  resetCourseBuilderWorkerForTesting,
} from "../../course-builder-worker/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function build(options?: Parameters<typeof createCourseBuilderWorker>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createCourseBuilderWorker(bootstrap, options);
  await engine.initialize();
  engine.connect();
  return engine;
}

const researchInput = {
  researchReportId: "dpr-rsh-001",
  opportunityId: "dpr-opp-001",
  businessId: "dbiz-course-01",
  factoryMissionId: "dpf-dpm-course-01",
  productTitle: "Freelancer Client Onboarding Course",
  courseTitle: "Freelancer Client Onboarding Course",
  productType: "self_paced_course" as const,
  targetAudience: "Solo freelancers and consultants",
  customerPainPoints: [
    "No structured onboarding curriculum for new clients",
    "Inconsistent lesson flow across tools and checklists",
  ],
  marketGap: "Affordable self-paced onboarding course for freelancers",
  demandAssessment: "High demand for structured freelancer onboarding courses",
  researchTopic: "Freelance client onboarding course",
  validated: true,
};

const fullInput = {
  ...researchInput,
  productType: "self_paced_course" as const,
  validated: true,
};

describe("Q5-05 Course Builder Worker", () => {
  beforeEach(resetCourseBuilderWorkerForTesting);

  test("1 locks mandatory course-builder-worker boundaries", () => {
    const c = buildCourseBuilderWorkerConfiguration(REPO_ROOT, {
      neverBuildSalesPages: false as never,
      neverProcessPayments: false as never,
      neverDeliverCoursesToCustomers: false as never,
      neverPublishCoursesDirectly: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
      neverImplementQ506OrLater: false as never,
      followApprovedProductResearch: false as never,
      followApprovedProductIntent: false as never,
    });
    assert.equal(c.neverBuildSalesPages, true);
    assert.equal(c.neverProcessPayments, true);
    assert.equal(c.neverDeliverCoursesToCustomers, true);
    assert.equal(c.neverPublishCoursesDirectly, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverImplementQ506OrLater, true);
    assert.equal(c.followApprovedProductResearch, true);
    assert.equal(c.followApprovedProductIntent, true);
  });

  test("2 initializes PILLOW-CBW-001 for Q5-05 with DPF + DPR integrations", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q5-05");
    assert.equal(state.engineVersion, "PILLOW-CBW-001");
    assert.equal(state.configuration.workerId, "wkr-course-builder-01");
    for (const target of CBW_INTEGRATION_TARGETS) {
      assert.ok(state.configuration.integrationTargets.includes(target));
    }
    assert.ok(state.configuration.integrationTargets.includes("digital_product_research_worker"));
    assert.ok(state.configuration.integrationTargets.includes("digital_products_factory_core"));
    for (const type of CBW_PRODUCT_TYPES) {
      assert.ok(state.configuration.supportedProductTypes.includes(type));
    }
    assert.ok(CBW_CAPABILITIES.includes("receive_approved_digital_product_research"));
    assert.ok(CBW_CAPABILITIES.includes("produce_machine_readable_course_builder_reports"));
  });

  test("3 receives approved digital product research", async () => {
    const report = (await build()).receiveApprovedDigitalProductResearch(researchInput);
    assert.equal(report.action, "receive_approved_digital_product_research");
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.latestCourse!.researchReportId, "dpr-rsh-001");
    assert.equal(report.latestCourse!.opportunityId, "dpr-opp-001");
    assert.ok(report.latestCourse!.courseId.startsWith("cbw-crs-"));
  });

  test("4 designs curriculum and organizes modules", async () => {
    const engine = await build();
    engine.receiveApprovedDigitalProductResearch(researchInput);
    const curriculum = engine.designCompleteCourseCurriculum(fullInput);
    assert.equal(curriculum.action, "design_complete_course_curriculum");
    assert.ok(curriculum.latestCourse!.curriculum);
    assert.ok(curriculum.latestCourse!.moduleStructure.length >= 1);

    const modules = engine.organizeModules(fullInput);
    assert.equal(modules.action, "organize_modules");
    assert.ok(modules.latestCourse!.modules.length >= 1);
  });

  test("5 creates lessons, quizzes, and multiple course types", async () => {
    assert.ok(CBW_PRODUCT_TYPES.includes("self_paced_course"));
    assert.ok(CBW_PRODUCT_TYPES.includes("workshop"));
    assert.ok(CBW_PRODUCT_TYPES.includes("bootcamp"));

    const courseEngine = await build();
    courseEngine.receiveApprovedDigitalProductResearch({
      ...researchInput,
      productType: "self_paced_course",
    });
    courseEngine.designCompleteCourseCurriculum({ ...fullInput, productType: "self_paced_course" });
    courseEngine.organizeModules({ ...fullInput, productType: "self_paced_course" });
    const lessons = courseEngine.createLessons({
      ...fullInput,
      productType: "self_paced_course",
    });
    assert.equal(lessons.action, "create_lessons");
    assert.equal(lessons.latestCourse!.productType, "self_paced_course");
    assert.ok(lessons.latestCourse!.lessons.length >= 1);
    assert.ok(lessons.latestCourse!.lessonCount >= 1);

    const quizzes = courseEngine.generateQuizzesAndAssessments({
      ...fullInput,
      productType: "self_paced_course",
    });
    assert.equal(quizzes.action, "generate_quizzes_and_assessments");
    assert.ok(quizzes.latestCourse!.quizzes.length >= 1);
    assert.ok(quizzes.latestCourse!.quizCount >= 1);

    resetCourseBuilderWorkerForTesting();
    const workshopEngine = await build();
    const received = workshopEngine.receiveApprovedDigitalProductResearch({
      researchReportId: "dpr-rsh-workshop-01",
      opportunityId: "dpr-opp-workshop-01",
      businessId: "dbiz-workshop-01",
      factoryMissionId: "dpf-dpm-workshop-01",
      productTitle: "Freelancer Onboarding Workshop",
      productType: "workshop",
      targetAudience: "Solo freelancers and consultants",
      researchTopic: "Freelance onboarding workshop",
      validated: true,
    });
    assert.equal(received.latestCourse!.productType, "workshop");
    workshopEngine.designCompleteCourseCurriculum({
      productType: "workshop",
      productTitle: "Freelancer Onboarding Workshop",
      validated: true,
    });
    workshopEngine.organizeModules({ productType: "workshop", validated: true });
    const workshopLessons = workshopEngine.createLessons({
      productType: "workshop",
      validated: true,
    });
    assert.equal(workshopLessons.latestCourse!.productType, "workshop");
    assert.ok(workshopLessons.latestCourse!.lessons.length >= 1);
  });

  test("6 generates resources and learning objectives", async () => {
    const engine = await build();
    engine.receiveApprovedDigitalProductResearch(researchInput);
    engine.designCompleteCourseCurriculum(fullInput);
    engine.organizeModules(fullInput);
    engine.createLessons(fullInput);
    engine.generateQuizzesAndAssessments(fullInput);

    const resources = engine.generateDownloadableResources(fullInput);
    assert.equal(resources.action, "generate_downloadable_resources");
    assert.ok(resources.latestCourse!.resources.length >= 1);
    assert.ok(resources.latestCourse!.resourceCount >= 1);

    const objectives = engine.createLearningObjectives(fullInput);
    assert.equal(objectives.action, "create_learning_objectives");
    assert.ok(objectives.latestCourse!.learningObjectives.length >= 1);
  });

  test("7 validates instructional flow and packages export-ready assets", async () => {
    const engine = await build();
    engine.receiveApprovedDigitalProductResearch(researchInput);
    engine.designCompleteCourseCurriculum(fullInput);
    engine.organizeModules(fullInput);
    engine.createLessons(fullInput);
    engine.generateQuizzesAndAssessments(fullInput);
    engine.generateDownloadableResources(fullInput);
    engine.createLearningObjectives(fullInput);

    const flow = engine.validateInstructionalFlow(fullInput);
    assert.equal(flow.action, "validate_instructional_flow");
    assert.ok(flow.latestCourse!.qualityReview.length > 0);
    assert.ok(typeof flow.latestCourse!.instructionalFlowValidated === "boolean");
    assert.ok(flow.latestCourse!.confidenceScore > 0);

    const exportReady = engine.packageExportReadyCourseAssets(fullInput);
    assert.equal(exportReady.action, "package_export_ready_course_assets");
    assert.ok(exportReady.latestCourse!.exportFormats.length >= 1);
  });

  test("8 produces Course Builder Report with all required fields", async () => {
    const engine = await build();
    engine.receiveApprovedDigitalProductResearch(researchInput);
    engine.designCompleteCourseCurriculum(fullInput);
    engine.organizeModules(fullInput);
    engine.createLessons(fullInput);
    engine.generateQuizzesAndAssessments(fullInput);
    engine.generateDownloadableResources(fullInput);
    engine.createLearningObjectives(fullInput);
    engine.validateInstructionalFlow(fullInput);
    engine.packageExportReadyCourseAssets(fullInput);

    const report = engine.produceCourseBuilderReport(fullInput);
    const latest = report.latestCourse!;
    assert.ok(latest.courseId.startsWith("cbw-crs-"));
    assert.ok(latest.timestamp);
    assert.ok(latest.productId.startsWith("cbw-prd-") || latest.productId.length > 0);
    assert.ok(latest.courseTitle.length > 0);
    assert.ok(CBW_PRODUCT_TYPES.includes(latest.productType as (typeof CBW_PRODUCT_TYPES)[number]));
    assert.ok(latest.targetAudience.length > 0);
    assert.ok(Array.isArray(latest.learningObjectives));
    assert.ok(latest.learningObjectives.length >= 1);
    assert.ok(Array.isArray(latest.moduleStructure));
    assert.ok(latest.moduleStructure.length >= 1);
    assert.ok(latest.lessonCount >= 1);
    assert.ok(latest.quizCount >= 1);
    assert.ok(latest.resourceCount >= 1);
    assert.ok(latest.qualityReview.length > 0);
    assert.ok(Array.isArray(latest.exportFormats));
    assert.ok(latest.confidenceScore > 0);
    assert.equal(latest.metadataVersion, CBW_METADATA_VERSION);
    assert.equal(latest.reportVersion, COURSE_BUILDER_REPORT_VERSION);
    assert.equal(latest.neverPublishCoursesDirectly, true);
    assert.equal(latest.neverBuildSalesPages, true);
    assert.ok(latest.traceabilityRefs.length >= 1);
  });

  test("9 rejects sales-page/payment/deliver/publish/override/Q5-06 boundaries", async () => {
    const engine = await build();
    engine.receiveApprovedDigitalProductResearch(researchInput);
    for (const forbidden of [
      { buildSalesPages: true },
      { processPayments: true },
      { deliverCoursesToCustomers: true },
      { publishCoursesDirectly: true },
      { overridePillow: true },
      { overrideGrandKing: true },
      { implementQ506OrLater: true },
    ] as const) {
      const report = engine.produceCourseBuilderReport({
        ...fullInput,
        ...forbidden,
      });
      assert.equal(report.validation.decision, "fail");
      assert.equal(report.latestCourse, null);
    }
  });

  test("10 lists + submits via ERR + cockpit", async () => {
    const submittedIds: string[] = [];
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
    const engine = createCourseBuilderWorker(bootstrap, {
      dependencies: {
        executiveReportingRuntime: {
          submitWorkerReport: (input) => {
            submittedIds.push(String(input.missionId));
            return { records: [{ reportId: "ert-worker-cbw-001" }] };
          },
        },
      },
    });
    await engine.initialize();
    engine.connect();
    engine.receiveApprovedDigitalProductResearch(researchInput);
    engine.designCompleteCourseCurriculum(fullInput);
    engine.organizeModules(fullInput);
    engine.createLessons(fullInput);
    engine.generateQuizzesAndAssessments(fullInput);
    engine.generateDownloadableResources(fullInput);
    engine.createLearningObjectives(fullInput);
    engine.validateInstructionalFlow(fullInput);
    engine.packageExportReadyCourseAssets(fullInput);
    const produced = engine.produceCourseBuilderReport(fullInput);
    const listed = engine.list();
    assert.ok(listed.courses.length >= 1);
    const submitted = engine.submitReport({
      courseId: produced.latestCourse!.courseId,
      validated: true,
    });
    assert.equal(submitted.action, "submit_report");
    assert.deepEqual(submittedIds, ["Q5-05"]);
    assert.equal(submitted.latestCourse!.submittedToExecutiveReporting, true);
    assert.equal(submitted.latestCourse!.executiveReportId, "ert-worker-cbw-001");
    assert.ok(engine.getAuditTrail().length >= 1);
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.missionId, "Q5-05");
    assert.equal(cockpit.neverPublishCoursesDirectly, true);
    assert.equal(cockpit.neverBuildSalesPages, true);
  });
});
