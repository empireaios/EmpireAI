import assert from "node:assert/strict";

import path from "node:path";

import { beforeEach, describe, test } from "node:test";

import { runBootstrap } from "../../bootstrap/engine.js";

import {

  ARW_CAPABILITIES,

  ARW_INTEGRATION_TARGETS,

  ARW_METADATA_VERSION,

  ARW_ARCHITECTURE_DOMAINS,

  ARCHITECTURE_WORKER_REPORT_VERSION,

  buildArchitectureWorkerConfiguration,

  createArchitectureWorker,

  resetArchitectureWorkerForTesting,

} from "../../architecture-worker/index.js";



const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");



async function build(options?: Parameters<typeof createArchitectureWorker>[1]) {

  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });

  const engine = createArchitectureWorker(bootstrap, options);

  await engine.initialize();

  engine.connect();

  return engine;

}



const requirementsInput = {

  requirementsReportId: "rqw-req-saas-01",

  platformId: "epfc-plt-saas-01",

  platformName: "EmpireAI SaaS Platform",

  businessId: "epfc-biz-saas-01",

  factoryMissionId: "epfc-msn-saas-01",

  businessObjective:

    "Coordinate enterprise SaaS platform lifecycle from requirements to production.",

  validated: true,

};



const mockRequirementsWorker = {

  getRequirementsReports: () => [

    {

      requirementsId: "rqw-req-saas-01",

      platformId: "epfc-plt-saas-01",

      platformName: "EmpireAI SaaS Platform",

      businessId: "epfc-biz-saas-01",

      factoryMissionId: "epfc-msn-saas-01",

      businessObjective:

        "Coordinate enterprise SaaS platform lifecycle from requirements to production.",

      functionalRequirements: [

        { id: "rqw-fr-1", statement: "Platform shall support lifecycle coordination" },

      ],

      userStories: [

        { id: "rqw-story-1", asA: "platform stakeholder", iWant: "lifecycle coordination", soThat: "enterprise processes are governed" },

      ],

    },

  ],

  getLatestRequirementsReportId: () => "rqw-req-saas-01",

};



describe("Q6-03 Architecture Worker", () => {

  beforeEach(resetArchitectureWorkerForTesting);



  test("1 locks mandatory architecture-worker boundaries", () => {

    const c = buildArchitectureWorkerConfiguration(REPO_ROOT, {

      neverWriteFrontendCode: false as never,

      neverWriteBackendCode: false as never,

      neverDeployApplications: false as never,

      neverOverridePillow: false as never,

      neverOverrideGrandKing: false as never,

      neverImplementApplicationLogic: false as never,

      neverImplementQ604OrLater: false as never,

    });

    assert.equal(c.neverWriteFrontendCode, true);

    assert.equal(c.neverWriteBackendCode, true);

    assert.equal(c.neverDeployApplications, true);

    assert.equal(c.neverOverridePillow, true);

    assert.equal(c.neverOverrideGrandKing, true);

    assert.equal(c.neverImplementApplicationLogic, true);

    assert.equal(c.neverImplementQ604OrLater, true);

  });



  test("2 initializes PILLOW-ARW-001 Q6-03 with EPFC + requirements_worker integrations", async () => {

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

          requirementsWorker: mockRequirementsWorker,

        },

      })

    ).getState();

    assert.equal(state.missionId, "Q6-03");

    assert.equal(state.engineVersion, "PILLOW-ARW-001");

    assert.equal(state.configuration.workerId, "wkr-architecture-01");

    for (const target of ARW_INTEGRATION_TARGETS) {

      assert.ok(state.configuration.integrationTargets.includes(target));

    }

    assert.ok(

      state.configuration.integrationTargets.includes("enterprise_platform_factory_core"),

    );

    assert.ok(state.configuration.integrationTargets.includes("requirements_worker"));

    for (const domain of ARW_ARCHITECTURE_DOMAINS) {

      assert.ok(state.configuration.supportedArchitectureDomains.includes(domain));

    }

    assert.ok(ARW_CAPABILITIES.includes("receive_approved_requirements_reports"));

    assert.ok(ARW_CAPABILITIES.includes("produce_machine_readable_architecture_reports"));

  });



  test("3 receive approved requirements → arw-arch-*", async () => {

    const report = (

      await build({ dependencies: { requirementsWorker: mockRequirementsWorker } })

    ).receiveApprovedRequirementsReports(requirementsInput);

    assert.equal(report.action, "receive_approved_requirements_reports");

    assert.notEqual(report.validation.decision, "fail");

    assert.ok(report.latestArchitectureReport!.architectureId.startsWith("arw-arch-"));

    assert.ok(report.latestArchitectureReport!.requirementsReportId.length > 0);

    assert.equal(report.latestArchitectureReport!.requirementsReportId, "rqw-req-saas-01");

  });



  test("4 design system architecture + define modules", async () => {

    const engine = await build({ dependencies: { requirementsWorker: mockRequirementsWorker } });

    engine.receiveApprovedRequirementsReports(requirementsInput);

    const system = engine.designOverallSystemArchitecture(requirementsInput);

    assert.equal(system.action, "design_overall_system_architecture");

    assert.ok(system.latestArchitectureReport!.systemOverview.length > 0);



    const modules = engine.defineApplicationModules(requirementsInput);

    assert.equal(modules.action, "define_application_modules");

    assert.ok(modules.latestArchitectureReport!.moduleArchitecture.length >= 1);

    for (const mod of modules.latestArchitectureReport!.moduleArchitecture) {

      assert.ok(mod.moduleId.startsWith("arw-mod-"));

    }

  });



  test("5 design APIs + service boundaries", async () => {

    const engine = await build({ dependencies: { requirementsWorker: mockRequirementsWorker } });

    engine.receiveApprovedRequirementsReports(requirementsInput);

    engine.designOverallSystemArchitecture(requirementsInput);

    engine.defineApplicationModules(requirementsInput);



    const apis = engine.designInternalAndExternalApis(requirementsInput);

    assert.equal(apis.action, "design_internal_and_external_apis");

    assert.ok(apis.latestArchitectureReport!.apiArchitecture.length >= 1);

    for (const api of apis.latestArchitectureReport!.apiArchitecture) {

      assert.ok(api.apiId.startsWith("arw-api-"));

    }



    const services = engine.designServiceBoundaries(requirementsInput);

    assert.equal(services.action, "design_service_boundaries");

    assert.ok(services.latestArchitectureReport!.serviceDependencies.length >= 1);

    for (const svc of services.latestArchitectureReport!.serviceDependencies) {

      assert.ok(svc.dependencyId.startsWith("arw-svc-"));

    }

  });



  test("6 design data flow + deployment topology", async () => {

    const engine = await build({ dependencies: { requirementsWorker: mockRequirementsWorker } });

    engine.receiveApprovedRequirementsReports(requirementsInput);

    engine.designOverallSystemArchitecture(requirementsInput);

    engine.defineApplicationModules(requirementsInput);

    engine.designInternalAndExternalApis(requirementsInput);

    engine.designServiceBoundaries(requirementsInput);



    const dataFlow = engine.designDataFlowArchitecture(requirementsInput);

    assert.equal(dataFlow.action, "design_data_flow_architecture");

    assert.ok(dataFlow.latestArchitectureReport!.dataFlow.length >= 1);

    for (const flow of dataFlow.latestArchitectureReport!.dataFlow) {

      assert.ok(flow.flowId.startsWith("arw-flow-"));

    }



    const deployment = engine.designDeploymentTopology(requirementsInput);

    assert.equal(deployment.action, "design_deployment_topology");

    assert.ok(deployment.latestArchitectureReport!.deploymentArchitecture.topology.length > 0);

    assert.ok(deployment.latestArchitectureReport!.deploymentArchitecture.environments.length >= 1);

    for (const comp of deployment.latestArchitectureReport!.deploymentArchitecture.components) {

      assert.ok(comp.componentId.startsWith("arw-dep-"));

    }

  });



  test("7 identify dependencies + evaluate scalability/security/maintainability", async () => {

    const engine = await build({ dependencies: { requirementsWorker: mockRequirementsWorker } });

    engine.receiveApprovedRequirementsReports(requirementsInput);

    engine.designOverallSystemArchitecture(requirementsInput);

    engine.defineApplicationModules(requirementsInput);

    engine.designInternalAndExternalApis(requirementsInput);

    engine.designServiceBoundaries(requirementsInput);

    engine.designDataFlowArchitecture(requirementsInput);

    engine.designDeploymentTopology(requirementsInput);



    const deps = engine.identifyArchitecturalDependencies(requirementsInput);

    assert.equal(deps.action, "identify_architectural_dependencies");

    assert.ok(deps.latestArchitectureReport!.serviceDependencies.length >= 1);

    assert.ok(Array.isArray(deps.latestArchitectureReport!.assumptions));



    const quality = engine.evaluateScalabilitySecurityAndMaintainability(requirementsInput);

    assert.equal(quality.action, "evaluate_scalability_security_and_maintainability");

    assert.ok(quality.latestArchitectureReport!.securityConsiderations.length >= 1);

    assert.ok(quality.latestArchitectureReport!.scalabilityConsiderations.length >= 1);

    assert.ok(quality.latestArchitectureReport!.maintainabilityConsiderations.length >= 1);

  });



  test("8 produce Architecture Report with ALL required minimum fields", async () => {

    const report = (

      await build({ dependencies: { requirementsWorker: mockRequirementsWorker } })

    ).produceArchitectureReport(requirementsInput);

    const latest = report.latestArchitectureReport!;

    assert.ok(latest.architectureId.startsWith("arw-arch-"));

    assert.ok(latest.timestamp);

    assert.ok(latest.platformId.startsWith("epfc-plt-") || latest.platformId.startsWith("arw-plt-"));

    assert.ok(latest.platformName.length > 0);

    assert.ok(latest.systemOverview.length > 0);

    assert.ok(latest.moduleArchitecture.length >= 1);

    assert.ok(latest.apiArchitecture.length >= 1);

    assert.ok(latest.dataFlow.length >= 1);

    assert.ok(latest.serviceDependencies.length >= 1);

    assert.ok(latest.deploymentArchitecture.topology.length > 0);

    assert.ok(latest.integrationArchitecture.length >= 1);

    assert.ok(latest.securityConsiderations.length >= 1);

    assert.ok(latest.scalabilityConsiderations.length >= 1);

    assert.ok(latest.maintainabilityConsiderations.length >= 1);

    assert.ok(latest.confidenceScore > 0);

    assert.equal(latest.metadataVersion, ARW_METADATA_VERSION);

    assert.equal(latest.reportVersion, ARCHITECTURE_WORKER_REPORT_VERSION);

    assert.equal(latest.neverWriteFrontendCode, true);

    assert.equal(latest.neverWriteBackendCode, true);

    assert.equal(latest.neverDeployApplications, true);

    assert.equal(latest.neverImplementApplicationLogic, true);

    assert.ok(latest.traceabilityRefs.length >= 1);

    assert.ok(latest.requirementsReportId.length > 0);

    for (const assumption of latest.assumptions) {

      for (const dec of latest.architecturalDecisions) {

        assert.ok(!dec.decision.includes(assumption));

      }

    }

  });



  test("9 reject writeFrontend/writeBackend/deploy/implementLogic/override/Q6-04", async () => {

    const engine = await build({ dependencies: { requirementsWorker: mockRequirementsWorker } });

    engine.receiveApprovedRequirementsReports(requirementsInput);

    for (const forbidden of [

      { writeFrontendCode: true },

      { writeBackendCode: true },

      { deployApplications: true },

      { implementApplicationLogic: true },

      { overridePillow: true },

      { overrideGrandKing: true },

      { implementQ604OrLater: true },

    ] as const) {

      const report = engine.produceArchitectureReport({

        ...requirementsInput,

        ...forbidden,

      });

      assert.equal(report.validation.decision, "fail");

      assert.equal(report.latestArchitectureReport, null);

    }

  });



  test("10 list + ERR submit missionId Q6-03 + cockpit + audit", async () => {

    const submittedIds: string[] = [];

    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });

    const engine = createArchitectureWorker(bootstrap, {

      dependencies: {

        requirementsWorker: mockRequirementsWorker,

        executiveReportingRuntime: {

          submitWorkerReport: (input) => {

            submittedIds.push(String(input.missionId));

            return { records: [{ reportId: "ert-arw-001" }] };

          },

        },

      },

    });

    await engine.initialize();

    engine.connect();

    engine.receiveApprovedRequirementsReports(requirementsInput);

    engine.designOverallSystemArchitecture(requirementsInput);

    engine.defineApplicationModules(requirementsInput);

    engine.designInternalAndExternalApis(requirementsInput);

    engine.designServiceBoundaries(requirementsInput);

    engine.designDataFlowArchitecture(requirementsInput);

    engine.designDeploymentTopology(requirementsInput);

    engine.identifyArchitecturalDependencies(requirementsInput);

    engine.evaluateScalabilitySecurityAndMaintainability(requirementsInput);

    const produced = engine.produceArchitectureReport(requirementsInput);

    const listed = engine.list();

    assert.ok(listed.architectureReports.length >= 1);

    const submitted = engine.submitReport({

      architectureId: produced.latestArchitectureReport!.architectureId,

      validated: true,

    });

    assert.equal(submitted.action, "submit_report");

    assert.deepEqual(submittedIds, ["Q6-03"]);

    assert.equal(submitted.latestArchitectureReport!.submittedToExecutiveReporting, true);

    assert.equal(submitted.latestArchitectureReport!.executiveReportId, "ert-arw-001");

    assert.ok(engine.getAuditTrail().length >= 1);

    const cockpit = engine.getCockpitSnapshot();

    assert.equal(cockpit.missionId, "Q6-03");

    assert.equal(cockpit.neverWriteFrontendCode, true);

    assert.equal(cockpit.neverWriteBackendCode, true);

    assert.equal(cockpit.neverDeployApplications, true);

    assert.equal(cockpit.neverImplementApplicationLogic, true);

  });

});


