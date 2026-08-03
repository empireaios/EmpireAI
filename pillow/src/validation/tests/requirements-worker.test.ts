import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  RQW_CAPABILITIES,
  RQW_INTEGRATION_TARGETS,
  RQW_METADATA_VERSION,
  RQW_REQUIREMENT_TYPES,
  REQUIREMENTS_WORKER_REPORT_VERSION,
  buildRequirementsWorkerConfiguration,
  createRequirementsWorker,
  resetRequirementsWorkerForTesting,
} from "../../requirements-worker/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function build(options?: Parameters<typeof createRequirementsWorker>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createRequirementsWorker(bootstrap, options);
  await engine.initialize();
  engine.connect();
  return engine;
}

const intentInput = {
  platformId: "epfc-plt-saas-01",
  platformName: "EmpireAI SaaS Platform",
  businessId: "epfc-biz-saas-01",
  factoryMissionId: "epfc-msn-saas-01",
  businessObjective:
    "Coordinate enterprise SaaS platform lifecycle from requirements to production.",
  approvedBusinessIntent:
    "Approved: Build an enterprise SaaS platform with lifecycle coordination, user-facing capabilities, and governed enterprise processes under Pillow.",
  intentApproved: true,
  validated: true,
};

describe("Q6-02 Requirements Worker", () => {
  beforeEach(resetRequirementsWorkerForTesting);

  test("1 locks mandatory requirements-worker boundaries", () => {
    const c = buildRequirementsWorkerConfiguration(REPO_ROOT, {
      neverDesignArchitecture: false as never,
      neverWriteApplicationCode: false as never,
      neverDeploySoftware: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
      neverInventUnsupportedBusinessRequirements: false as never,
      neverImplementQ603OrLater: false as never,
    });
    assert.equal(c.neverDesignArchitecture, true);
    assert.equal(c.neverWriteApplicationCode, true);
    assert.equal(c.neverDeploySoftware, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverInventUnsupportedBusinessRequirements, true);
    assert.equal(c.neverImplementQ603OrLater, true);
  });

  test("2 initializes PILLOW-RQW-001 Q6-02 with enterprise_platform_factory_core integration", async () => {
    const state = (
      await build({
        dependencies: {
          enterprisePlatformFactoryCore: {
            getMissions: () => [
              {
                factoryMissionId: "epfc-msn-saas-01",
                platformId: "epfc-plt-saas-01",
                platformName: "EmpireAI SaaS Platform",
                businessId: "epfc-biz-saas-01",
                businessObjective:
                  "Coordinate enterprise SaaS platform lifecycle from requirements to production.",
              },
            ],
            getLatestMissionId: () => "epfc-msn-saas-01",
          },
        },
      })
    ).getState();
    assert.equal(state.missionId, "Q6-02");
    assert.equal(state.engineVersion, "PILLOW-RQW-001");
    assert.equal(state.configuration.workerId, "wkr-requirements-01");
    for (const target of RQW_INTEGRATION_TARGETS) {
      assert.ok(state.configuration.integrationTargets.includes(target));
    }
    assert.ok(
      state.configuration.integrationTargets.includes("enterprise_platform_factory_core"),
    );
    for (const type of RQW_REQUIREMENT_TYPES) {
      assert.ok(state.configuration.supportedRequirementTypes.includes(type));
    }
    assert.ok(RQW_CAPABILITIES.includes("receive_approved_business_intent"));
    assert.ok(RQW_CAPABILITIES.includes("produce_machine_readable_requirements_reports"));
  });

  test("3 receive approved business intent → rqw-req-*", async () => {
    const report = (await build()).receiveApprovedBusinessIntent(intentInput);
    assert.equal(report.action, "receive_approved_business_intent");
    assert.notEqual(report.validation.decision, "fail");
    assert.ok(report.latestRequirementsReport!.requirementsId.startsWith("rqw-req-"));
    assert.ok(report.latestRequirementsReport!.approvedBusinessIntent.length > 0);
    assert.equal(report.latestRequirementsReport!.intentApproved, true);
  });

  test("4 identify stakeholders + define business objectives", async () => {
    const engine = await build();
    engine.receiveApprovedBusinessIntent(intentInput);
    const stakeholders = engine.identifyStakeholders(intentInput);
    assert.equal(stakeholders.action, "identify_stakeholders");
    assert.ok(stakeholders.latestRequirementsReport!.stakeholders.length >= 1);

    const objectives = engine.defineBusinessObjectives(intentInput);
    assert.equal(objectives.action, "define_business_objectives");
    assert.ok(objectives.latestRequirementsReport!.businessObjective.length > 0);
  });

  test("5 produce functional + non-functional requirements", async () => {
    const engine = await build();
    engine.receiveApprovedBusinessIntent(intentInput);
    engine.identifyStakeholders(intentInput);
    engine.defineBusinessObjectives(intentInput);

    const functional = engine.produceFunctionalRequirements(intentInput);
    assert.equal(functional.action, "produce_functional_requirements");
    assert.ok(functional.latestRequirementsReport!.functionalRequirements.length >= 1);
    for (const fr of functional.latestRequirementsReport!.functionalRequirements) {
      assert.ok(fr.id.startsWith("rqw-fr-"));
    }

    const nfr = engine.produceNonFunctionalRequirements(intentInput);
    assert.equal(nfr.action, "produce_non_functional_requirements");
    assert.ok(nfr.latestRequirementsReport!.nonFunctionalRequirements.length >= 1);
    for (const item of nfr.latestRequirementsReport!.nonFunctionalRequirements) {
      assert.ok(item.id.startsWith("rqw-nfr-"));
    }
  });

  test("6 generate user stories + use cases", async () => {
    const engine = await build();
    engine.receiveApprovedBusinessIntent(intentInput);
    engine.identifyStakeholders(intentInput);
    engine.defineBusinessObjectives(intentInput);
    engine.produceFunctionalRequirements(intentInput);
    engine.produceNonFunctionalRequirements(intentInput);

    const stories = engine.generateUserStories(intentInput);
    assert.equal(stories.action, "generate_user_stories");
    assert.ok(stories.latestRequirementsReport!.userStories.length >= 1);
    for (const story of stories.latestRequirementsReport!.userStories) {
      assert.ok(story.id.startsWith("rqw-story-"));
    }

    const useCases = engine.generateUseCases(intentInput);
    assert.equal(useCases.action, "generate_use_cases");
    assert.ok(useCases.latestRequirementsReport!.useCases.length >= 1);
    for (const uc of useCases.latestRequirementsReport!.useCases) {
      assert.ok(uc.id.startsWith("rqw-uc-"));
    }
  });

  test("7 generate acceptance criteria + identify assumptions/risks/constraints", async () => {
    const engine = await build();
    engine.receiveApprovedBusinessIntent(intentInput);
    engine.identifyStakeholders(intentInput);
    engine.defineBusinessObjectives(intentInput);
    engine.produceFunctionalRequirements(intentInput);
    engine.produceNonFunctionalRequirements(intentInput);
    engine.generateUserStories(intentInput);
    engine.generateUseCases(intentInput);

    const acceptance = engine.generateAcceptanceCriteria(intentInput);
    assert.equal(acceptance.action, "generate_acceptance_criteria");
    assert.ok(acceptance.latestRequirementsReport!.acceptanceCriteria.length >= 1);
    for (const ac of acceptance.latestRequirementsReport!.acceptanceCriteria) {
      assert.ok(ac.id.startsWith("rqw-ac-"));
    }

    const risks = engine.identifyAssumptionsRisksAndConstraints(intentInput);
    assert.equal(risks.action, "identify_assumptions_risks_and_constraints");
    assert.ok(Array.isArray(risks.latestRequirementsReport!.assumptions));
    assert.ok(risks.latestRequirementsReport!.constraints.length >= 1);
    assert.ok(risks.latestRequirementsReport!.risks.length >= 1);
  });

  test("8 produce Requirements Report with ALL required minimum fields; assumptions distinct from requirements", async () => {
    const report = (await build()).produceRequirementsReport(intentInput);
    const latest = report.latestRequirementsReport!;
    assert.ok(latest.requirementsId.startsWith("rqw-req-"));
    assert.ok(latest.timestamp);
    assert.ok(latest.platformId.startsWith("epfc-plt-") || latest.platformId.startsWith("rqw-plt-"));
    assert.ok(latest.platformName.length > 0);
    assert.ok(latest.businessObjective.length > 0);
    assert.ok(latest.stakeholders.length >= 1);
    assert.ok(latest.functionalRequirements.length >= 1);
    assert.ok(latest.nonFunctionalRequirements.length >= 1);
    assert.ok(latest.userStories.length >= 1);
    assert.ok(latest.useCases.length >= 1);
    assert.ok(latest.acceptanceCriteria.length >= 1);
    assert.ok(Array.isArray(latest.assumptions));
    assert.ok(latest.constraints.length >= 1);
    assert.ok(latest.risks.length >= 1);
    assert.ok(latest.confidenceScore > 0);
    assert.equal(latest.metadataVersion, RQW_METADATA_VERSION);
    assert.equal(latest.reportVersion, REQUIREMENTS_WORKER_REPORT_VERSION);
    assert.equal(latest.neverDesignArchitecture, true);
    assert.equal(latest.neverWriteApplicationCode, true);
    assert.equal(latest.neverDeploySoftware, true);
    assert.equal(latest.neverInventUnsupportedBusinessRequirements, true);
    assert.ok(latest.traceabilityRefs.length >= 1);
    for (const assumption of latest.assumptions) {
      for (const fr of latest.functionalRequirements) {
        assert.ok(!fr.statement.includes(assumption));
      }
    }
  });

  test("9 reject designArchitecture/writeApplicationCode/deploySoftware/override/Q6-03/inventUnsupportedBusinessRequirements", async () => {
    const engine = await build();
    engine.receiveApprovedBusinessIntent(intentInput);
    for (const forbidden of [
      { designArchitecture: true },
      { writeApplicationCode: true },
      { deploySoftware: true },
      { overridePillow: true },
      { overrideGrandKing: true },
      { implementQ603OrLater: true },
      { inventUnsupportedBusinessRequirements: true },
    ] as const) {
      const report = engine.produceRequirementsReport({
        ...intentInput,
        ...forbidden,
      });
      assert.equal(report.validation.decision, "fail");
      assert.equal(report.latestRequirementsReport, null);
    }
  });

  test("10 list + ERR submit missionId Q6-02 + cockpit + audit", async () => {
    const submittedIds: string[] = [];
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
    const engine = createRequirementsWorker(bootstrap, {
      dependencies: {
        executiveReportingRuntime: {
          submitWorkerReport: (input) => {
            submittedIds.push(String(input.missionId));
            return { records: [{ reportId: "ert-rqw-001" }] };
          },
        },
      },
    });
    await engine.initialize();
    engine.connect();
    engine.receiveApprovedBusinessIntent(intentInput);
    engine.identifyStakeholders(intentInput);
    engine.defineBusinessObjectives(intentInput);
    engine.produceFunctionalRequirements(intentInput);
    engine.produceNonFunctionalRequirements(intentInput);
    engine.generateUserStories(intentInput);
    engine.generateUseCases(intentInput);
    engine.generateAcceptanceCriteria(intentInput);
    engine.identifyAssumptionsRisksAndConstraints(intentInput);
    const produced = engine.produceRequirementsReport(intentInput);
    const listed = engine.list();
    assert.ok(listed.requirementsReports.length >= 1);
    const submitted = engine.submitReport({
      requirementsId: produced.latestRequirementsReport!.requirementsId,
      validated: true,
    });
    assert.equal(submitted.action, "submit_report");
    assert.deepEqual(submittedIds, ["Q6-02"]);
    assert.equal(submitted.latestRequirementsReport!.submittedToExecutiveReporting, true);
    assert.equal(submitted.latestRequirementsReport!.executiveReportId, "ert-rqw-001");
    assert.ok(engine.getAuditTrail().length >= 1);
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.missionId, "Q6-02");
    assert.equal(cockpit.neverDesignArchitecture, true);
    assert.equal(cockpit.neverWriteApplicationCode, true);
    assert.equal(cockpit.neverDeploySoftware, true);
    assert.equal(cockpit.neverInventUnsupportedBusinessRequirements, true);
  });
});
