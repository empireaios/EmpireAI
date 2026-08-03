import type { ArchitectureWorkerConfiguration } from "./configuration.js";

import type { EnrichmentContext } from "./integrations.js";

import {

  ARCHITECTURE_DOMAINS,

  ARCHITECTURE_WORKER_IDENTITY,

  ARCHITECTURE_WORKER_REPORT_VERSION,

  ARW_METADATA_VERSION,

} from "./paths.js";

import type {

  ApiArchitectureEntry,

  ArchitecturalDecision,

  ArchitectureContext,

  ArchitectureDomain,

  ArchitectureReport,

  ArchitectureStep,

  ArchitectureWorkerCatalog,

  ArchitectureWorkerInput,

  DataFlowEntry,

  DeploymentArchitecture,

  IntegrationArchitectureEntry,

  IntegrationHandshake,

  ModuleArchitectureEntry,

  PreservedDecision,

  SelfReviewFinding,

  SelfReviewResult,

  ServiceDependencyEntry,

} from "./types.js";



let architectureSequence = 0;



/** Pure Architecture Worker helpers for Q6-03 — architecture (structural signals). */

export class ArchitectureBuilder {

  buildCatalog(

    config: ArchitectureWorkerConfiguration,

    reports: ArchitectureReport[],

    integrations: IntegrationHandshake[],

  ): ArchitectureWorkerCatalog {

    return {

      reportVersion: ARCHITECTURE_WORKER_REPORT_VERSION,

      workerId: config.workerId,

      architectureReports: reports.map(cloneReport),

      integrations: integrations.map((i) => ({ ...i })),

      metadataVersion: ARW_METADATA_VERSION,

      executiveAuthority: "pillow",

      neverWriteFrontendCode: true,

      neverWriteBackendCode: true,

      neverDeployApplications: true,

      neverOverridePillow: true,

      neverOverrideGrandKing: true,

      neverImplementApplicationLogic: true,

      neverImplementQ604OrLater: true,

    };

  }



  mergeContext(

    input: ArchitectureWorkerInput,

    context: ArchitectureContext,

    enrichment?: EnrichmentContext | null,

  ): ArchitectureContext {

    return {

      platformId: input.platformId ?? enrichment?.platformId ?? context.platformId ?? null,

      platformName:

        input.platformName ?? enrichment?.platformName ?? context.platformName ?? null,

      businessId: input.businessId ?? enrichment?.businessId ?? context.businessId ?? null,

      factoryMissionId:

        input.factoryMissionId ??

        enrichment?.factoryMissionId ??

        context.factoryMissionId ??

        null,

      businessObjective:

        input.businessObjective ??

        enrichment?.businessObjective ??

        context.businessObjective ??

        null,

      requirementsReportId:

        input.requirementsReportId ??

        enrichment?.requirementsReportId ??

        context.requirementsReportId ??

        null,

      functionalRequirements:

        enrichment?.functionalRequirements ?? context.functionalRequirements ?? [],

      userStories: enrichment?.userStories ?? context.userStories ?? [],

    };

  }



  createArchitectureShell(

    input: ArchitectureWorkerInput,

    config: ArchitectureWorkerConfiguration,

    context: ArchitectureContext,

  ): ArchitectureReport {

    architectureSequence += 1;

    const now = new Date().toISOString();

    const reqId = context.requirementsReportId?.trim() || input.requirementsReportId?.trim() || "";

    const hasRequirements = reqId.length > 0;

    const architectureId =

      input.architectureId?.trim() || `arw-arch-${Date.now()}-${architectureSequence}`;

    const platformId =

      input.platformId?.trim() ||

      context.platformId?.trim() ||

      `arw-plt-${architectureSequence}`;

    const platformName =

      input.platformName?.trim() ||

      context.platformName?.trim() ||

      (hasRequirements ? "Platform from approved requirements" : "Unspecified platform");

    const businessId =

      input.businessId?.trim() || context.businessId?.trim() || `arw-biz-${architectureSequence}`;

    const factoryMissionId =

      input.factoryMissionId?.trim() ||

      context.factoryMissionId?.trim() ||

      `arw-msn-${architectureSequence}`;

    const businessObjective =

      input.businessObjective?.trim() ||

      context.businessObjective?.trim() ||

      (hasRequirements ? "Architecture aligned to approved requirements" : "Business objective pending approved requirements");



    return this.lockReport({

      architectureId,

      timestamp: now,

      platformId,

      platformName,

      systemOverview: hasRequirements

        ? `System architecture for ${platformName} derived from approved requirements ${reqId}`

        : "Architecture shell — awaiting approved requirements report",

      moduleArchitecture: [],

      apiArchitecture: [],

      dataFlow: [],

      serviceDependencies: [],

      deploymentArchitecture: {

        topology: "pending",

        environments: [],

        components: [],

      },

      integrationArchitecture: [],

      securityConsiderations: [],

      scalabilityConsiderations: [],

      maintainabilityConsiderations: [],

      confidenceScore: hasRequirements ? 35 : 20,

      metadataVersion: ARW_METADATA_VERSION,

      requirementsReportId: reqId,

      factoryMissionId,

      businessId,

      businessObjective,

      architecturalDecisions: [],

      assumptions: hasRequirements

        ? []

        : ["Approved requirements report not yet provided — architecture shell only"],

      supportedArchitectureDomains: [...ARCHITECTURE_DOMAINS] as ArchitectureDomain[],

      architectureSteps: hasRequirements

        ? [

            this.step(

              "receive_requirements",

              "Receive approved requirements report",

              1,

              "Requirements report received and recorded",

            ),

          ]

        : [

            this.step(

              "receive_requirements",

              "Receive approved requirements report",

              1,

              "Incomplete — awaiting approved requirements report",

            ),

          ],

      selfReviewPassed: false,

      selfReviewFindings: hasRequirements

        ? []

        : [

            {

              findingId: `arw-f-req-${architectureSequence}`,

              category: "requirements",

              severity: "warning",

              message: "Approved requirements report missing or empty",

            },

          ],

      selfReviewSummary: hasRequirements

        ? "Shell created — architecture stages pending"

        : "Incomplete shell — approved requirements report required",

      qualityReview: "",

      complianceReview:

        "Pending — no frontend/backend code, application logic, or deployment in scope.",

      architecturalCompliance: hasRequirements ? "partial" : "non_compliant",

      architecturalComplianceNotes: hasRequirements

        ? "Awaiting architecture design stages"

        : "Cannot produce complete architecture without approved requirements report",

      workerId: config.workerId || ARCHITECTURE_WORKER_IDENTITY.workerId,

      reportVersion: ARCHITECTURE_WORKER_REPORT_VERSION,

      traceabilityRefs: unique([

        architectureId,

        platformId,

        factoryMissionId,

        reqId || "requirements:missing",

      ]),

      preservedDecisions: hasRequirements

        ? [

            {

              decisionId: `arw-dec-req-${Date.now()}`,

              topic: platformName,

              decision: `Received approved requirements report (${reqId})`,

              recordedAt: now,

            },

          ]

        : [],

      submittedToExecutiveReporting: false,

      executiveReportId: null,

    });

  }



  designOverallSystemArchitecture(

    context: ArchitectureContext,

    report: ArchitectureReport,

  ): { systemOverview: string; steps: ArchitectureStep[]; decisions: ArchitecturalDecision[] } {

    const objective = report.businessObjective;

    const platformName = report.platformName;

    const systemOverview = `Enterprise ${platformName} system architecture: layered modular design supporting "${objective.slice(0, 120)}" with clear service boundaries, API contracts, and deployment topology. Structural design signals only — no application code.`;



    return {

      systemOverview,

      steps: [

        this.step(

          "design_system",

          "Design overall system architecture",

          2,

          `System overview defined for ${platformName}`,

        ),

      ],

      decisions: [

        {

          decisionId: `arw-dec-sys-${Date.now()}`,

          topic: "system_architecture",

          decision: `Adopt layered modular architecture for ${platformName} aligned to approved requirements ${report.requirementsReportId}`,

          recordedAt: new Date().toISOString(),

        },

      ],

    };

  }



  defineApplicationModules(report: ArchitectureReport): {

    moduleArchitecture: ModuleArchitectureEntry[];

    steps: ArchitectureStep[];

    decisions: ArchitecturalDecision[];

  } {

    const modules: ModuleArchitectureEntry[] = [

      {

        moduleId: `arw-mod-${architectureSequence}-core`,

        name: "Core Platform Module",

        responsibility: "Orchestrates platform lifecycle and domain coordination per approved requirements",

        dependencies: [],

      },

      {

        moduleId: `arw-mod-${architectureSequence}-api`,

        name: "API Gateway Module",

        responsibility: "Exposes internal and external API contracts as structural design signals",

        dependencies: [`arw-mod-${architectureSequence}-core`],

      },

    ];



    if (report.systemOverview.toLowerCase().includes("user") || report.systemOverview.toLowerCase().includes("saas")) {

      modules.push({

        moduleId: `arw-mod-${architectureSequence}-ux`,

        name: "Presentation Module",

        responsibility: "Defines presentation layer boundaries — no frontend code implementation",

        dependencies: [`arw-mod-${architectureSequence}-api`],

      });

    }



    return {

      moduleArchitecture: modules,

      steps: [

        this.step(

          "define_modules",

          "Define application modules",

          3,

          `Defined ${modules.length} application module(s)`,

        ),

      ],

      decisions: [

        {

          decisionId: `arw-dec-mod-${Date.now()}`,

          topic: "module_design",

          decision: `Defined ${modules.length} modules with explicit responsibilities and dependencies`,

          recordedAt: new Date().toISOString(),

        },

      ],

    };

  }



  designInternalAndExternalApis(report: ArchitectureReport): {

    apiArchitecture: ApiArchitectureEntry[];

    steps: ArchitectureStep[];

    decisions: ArchitecturalDecision[];

  } {

    const apis: ApiArchitectureEntry[] = [

      {

        apiId: `arw-api-${architectureSequence}-internal`,

        name: "Platform Internal API",

        protocol: "REST/JSON",

        endpoints: ["/internal/platform/lifecycle", "/internal/platform/status"],

        direction: "internal",

      },

      {

        apiId: `arw-api-${architectureSequence}-external`,

        name: "Platform External API",

        protocol: "REST/JSON",

        endpoints: ["/v1/platform/capabilities"],

        direction: "external",

      },

    ];



    return {

      apiArchitecture: apis,

      steps: [

        this.step(

          "design_apis",

          "Design internal and external APIs",

          4,

          `Designed ${apis.length} API contract(s)`,

        ),

      ],

      decisions: [

        {

          decisionId: `arw-dec-api-${Date.now()}`,

          topic: "api_design",

          decision: "REST/JSON API contracts for internal and external boundaries — structural signals only",

          recordedAt: new Date().toISOString(),

        },

      ],

    };

  }



  designServiceBoundaries(report: ArchitectureReport): {

    serviceDependencies: ServiceDependencyEntry[];

    steps: ArchitectureStep[];

    decisions: ArchitecturalDecision[];

  } {

    const coreModule = report.moduleArchitecture[0]?.moduleId ?? `arw-mod-${architectureSequence}-core`;

    const apiModule = report.moduleArchitecture[1]?.moduleId ?? `arw-mod-${architectureSequence}-api`;



    const serviceDependencies: ServiceDependencyEntry[] = [

      {

        dependencyId: `arw-svc-${architectureSequence}-1`,

        fromService: "platform-orchestration-service",

        toService: coreModule,

        kind: "synchronous",

      },

      {

        dependencyId: `arw-svc-${architectureSequence}-2`,

        fromService: coreModule,

        toService: apiModule,

        kind: "contract-bound",

      },

    ];



    return {

      serviceDependencies,

      steps: [

        this.step(

          "design_services",

          "Design service boundaries",

          5,

          `Defined ${serviceDependencies.length} service boundary/dependencies`,

        ),

      ],

      decisions: [

        {

          decisionId: `arw-dec-svc-${Date.now()}`,

          topic: "service_architecture",

          decision: "Service boundaries follow module decomposition with explicit dependency contracts",

          recordedAt: new Date().toISOString(),

        },

      ],

    };

  }



  designDataFlowArchitecture(report: ArchitectureReport): {

    dataFlow: DataFlowEntry[];

    steps: ArchitectureStep[];

    decisions: ArchitecturalDecision[];

  } {

    const coreModule = report.moduleArchitecture[0]?.name ?? "Core Platform Module";

    const apiModule = report.moduleArchitecture[1]?.name ?? "API Gateway Module";



    const dataFlow: DataFlowEntry[] = [

      {

        flowId: `arw-flow-${architectureSequence}-1`,

        from: "External Client",

        to: apiModule,

        description: "External requests enter through API gateway boundary",

        dataType: "request/response",

      },

      {

        flowId: `arw-flow-${architectureSequence}-2`,

        from: apiModule,

        to: coreModule,

        description: "Validated requests routed to core platform orchestration",

        dataType: "domain commands",

      },

      {

        flowId: `arw-flow-${architectureSequence}-3`,

        from: coreModule,

        to: "Platform Data Store",

        description: "Persistent state managed through defined data access boundary",

        dataType: "structured records",

      },

    ];



    return {

      dataFlow,

      steps: [

        this.step(

          "design_data_flow",

          "Design data flow architecture",

          6,

          `Defined ${dataFlow.length} data flow(s)`,

        ),

      ],

      decisions: [

        {

          decisionId: `arw-dec-flow-${Date.now()}`,

          topic: "event_flow",

          decision: "Request-response data flow with explicit gateway and persistence boundaries",

          recordedAt: new Date().toISOString(),

        },

      ],

    };

  }



  designDeploymentTopology(report: ArchitectureReport): {

    deploymentArchitecture: DeploymentArchitecture;

    integrationArchitecture: IntegrationArchitectureEntry[];

    steps: ArchitectureStep[];

    decisions: ArchitecturalDecision[];

  } {

    const deploymentArchitecture: DeploymentArchitecture = {

      topology: "multi-tier cloud-native",

      environments: ["development", "staging", "production"],

      components: [

        {

          componentId: `arw-dep-${architectureSequence}-gateway`,

          name: "API Gateway",

          role: "Edge routing and API contract enforcement",

        },

        {

          componentId: `arw-dep-${architectureSequence}-core`,

          name: "Core Services",

          role: "Platform orchestration and domain logic boundary",

        },

        {

          componentId: `arw-dep-${architectureSequence}-data`,

          name: "Data Layer",

          role: "Persistent storage boundary",

        },

      ],

    };



    const integrationArchitecture: IntegrationArchitectureEntry[] = [

      {

        integrationId: `arw-int-${architectureSequence}-epfc`,

        system: "Enterprise Platform Factory Core",

        pattern: "mission-context-sync",

        notes: "Platform mission context synchronized from EPFC",

      },

      {

        integrationId: `arw-int-${architectureSequence}-rqw`,

        system: "Requirements Worker",

        pattern: "requirements-traceability",

        notes: `Architecture traceable to requirements ${report.requirementsReportId}`,

      },

    ];



    return {

      deploymentArchitecture,

      integrationArchitecture,

      steps: [

        this.step(

          "design_deployment",

          "Design deployment topology",

          7,

          `Defined ${deploymentArchitecture.topology} topology with ${deploymentArchitecture.environments.length} environment(s)`,

        ),

      ],

      decisions: [

        {

          decisionId: `arw-dec-dep-${Date.now()}`,

          topic: "deployment_topology",

          decision: "Multi-tier cloud-native deployment topology — structural design only, no deployment execution",

          recordedAt: new Date().toISOString(),

        },

      ],

    };

  }



  identifyArchitecturalDependencies(report: ArchitectureReport): {

    serviceDependencies: ServiceDependencyEntry[];

    assumptions: string[];

    steps: ArchitectureStep[];

    decisions: ArchitecturalDecision[];

  } {

    const existing = report.serviceDependencies;

    const additional: ServiceDependencyEntry[] = [

      {

        dependencyId: `arw-svc-${architectureSequence}-dep-ext`,

        fromService: report.platformName,

        toService: "Enterprise Platform Factory Core",

        kind: "platform-context",

      },

    ];



    const assumptions = [

      "Infrastructure provider supports multi-tier cloud-native deployment",

      "Requirements Worker artifacts remain the authoritative requirements source",

    ];



    return {

      serviceDependencies: [...existing, ...additional],

      assumptions,

      steps: [

        this.step(

          "identify_dependencies",

          "Identify architectural dependencies",

          8,

          `Identified ${existing.length + additional.length} architectural dependency/dependencies`,

        ),

      ],

      decisions: [

        {

          decisionId: `arw-dec-dep-${Date.now()}`,

          topic: "external_integrations",

          decision: "External dependencies limited to EPFC and Requirements Worker traceability",

          recordedAt: new Date().toISOString(),

        },

      ],

    };

  }



  evaluateScalabilitySecurityAndMaintainability(report: ArchitectureReport): {

    securityConsiderations: string[];

    scalabilityConsiderations: string[];

    maintainabilityConsiderations: string[];

    steps: ArchitectureStep[];

    decisions: ArchitecturalDecision[];

  } {

    const securityConsiderations = [

      "API gateway enforces authentication and authorization at boundary — structural design only",

      "Sensitive values masked in architecture reports per governance policy",

      "No application logic implementation — security controls defined as architectural signals",

    ];



    const scalabilityConsiderations = [

      "Horizontal scaling of core services via stateless service boundary design",

      "API gateway supports load distribution across service instances",

      "Data layer designed for read/write separation at architectural level",

    ];



    const maintainabilityConsiderations = [

      "Modular decomposition enables independent module evolution",

      "Clear API contracts between modules reduce coupling",

      "Architecture reports preserve complete traceability to approved requirements",

    ];



    return {

      securityConsiderations,

      scalabilityConsiderations,

      maintainabilityConsiderations,

      steps: [

        this.step(

          "evaluate_quality",

          "Evaluate scalability, security, and maintainability",

          9,

          "Quality attributes evaluated at architectural level",

        ),

      ],

      decisions: [

        {

          decisionId: `arw-dec-qual-${Date.now()}`,

          topic: "system_architecture",

          decision: "Scalability, security, and maintainability evaluated as structural architectural signals",

          recordedAt: new Date().toISOString(),

        },

      ],

    };

  }



  buildArchitectureReport(

    input: ArchitectureWorkerInput,

    config: ArchitectureWorkerConfiguration,

    context: ArchitectureContext,

    partial?: ArchitectureReport | null,

  ): ArchitectureReport {

    architectureSequence += 1;

    let report = partial ?? this.createArchitectureShell(input, config, context);



    const systemResult = this.designOverallSystemArchitecture(context, report);

    report = {

      ...report,

      systemOverview: systemResult.systemOverview,

      architecturalDecisions: [...report.architecturalDecisions, ...systemResult.decisions],

      architectureSteps: [...report.architectureSteps, ...systemResult.steps],

    };



    const modulesResult = this.defineApplicationModules(report);

    report = {

      ...report,

      moduleArchitecture: modulesResult.moduleArchitecture,

      architecturalDecisions: [...report.architecturalDecisions, ...modulesResult.decisions],

      architectureSteps: [...report.architectureSteps, ...modulesResult.steps],

    };



    const apisResult = this.designInternalAndExternalApis(report);

    report = {

      ...report,

      apiArchitecture: apisResult.apiArchitecture,

      architecturalDecisions: [...report.architecturalDecisions, ...apisResult.decisions],

      architectureSteps: [...report.architectureSteps, ...apisResult.steps],

    };



    const servicesResult = this.designServiceBoundaries(report);

    report = {

      ...report,

      serviceDependencies: servicesResult.serviceDependencies,

      architecturalDecisions: [...report.architecturalDecisions, ...servicesResult.decisions],

      architectureSteps: [...report.architectureSteps, ...servicesResult.steps],

    };



    const dataFlowResult = this.designDataFlowArchitecture(report);

    report = {

      ...report,

      dataFlow: dataFlowResult.dataFlow,

      architecturalDecisions: [...report.architecturalDecisions, ...dataFlowResult.decisions],

      architectureSteps: [...report.architectureSteps, ...dataFlowResult.steps],

    };



    const deploymentResult = this.designDeploymentTopology(report);

    report = {

      ...report,

      deploymentArchitecture: deploymentResult.deploymentArchitecture,

      integrationArchitecture: deploymentResult.integrationArchitecture,

      architecturalDecisions: [...report.architecturalDecisions, ...deploymentResult.decisions],

      architectureSteps: [...report.architectureSteps, ...deploymentResult.steps],

    };



    const depsResult = this.identifyArchitecturalDependencies(report);

    report = {

      ...report,

      serviceDependencies: depsResult.serviceDependencies,

      assumptions: [...report.assumptions, ...depsResult.assumptions],

      architecturalDecisions: [...report.architecturalDecisions, ...depsResult.decisions],

      architectureSteps: [...report.architectureSteps, ...depsResult.steps],

    };



    const qualityResult = this.evaluateScalabilitySecurityAndMaintainability(report);

    report = {

      ...report,

      securityConsiderations: qualityResult.securityConsiderations,

      scalabilityConsiderations: qualityResult.scalabilityConsiderations,

      maintainabilityConsiderations: qualityResult.maintainabilityConsiderations,

      architecturalDecisions: [...report.architecturalDecisions, ...qualityResult.decisions],

      architectureSteps: [...report.architectureSteps, ...qualityResult.steps],

    };



    const selfReview = this.runSelfReview(report);

    report = {

      ...report,

      timestamp: new Date().toISOString(),

      confidenceScore: selfReview.confidenceScore,

      selfReviewPassed: selfReview.passed,

      selfReviewFindings: selfReview.findings,

      selfReviewSummary: selfReview.summary,

      qualityReview: selfReview.qualityReview,

      complianceReview: selfReview.complianceReview,

      architecturalCompliance: selfReview.architecturalCompliance,

      architecturalComplianceNotes: selfReview.architecturalComplianceNotes,

      architectureSteps: [

        ...report.architectureSteps,

        this.step(

          "produce_report",

          "Produce architecture report",

          10,

          "Complete architecture report assembled",

        ),

      ],

      preservedDecisions: [

        ...report.preservedDecisions,

        {

          decisionId: `arw-dec-report-${Date.now()}`,

          topic: report.platformName,

          decision: `Produced architecture report with ${report.moduleArchitecture.length} modules, ${report.apiArchitecture.length} APIs`,

          recordedAt: new Date().toISOString(),

        },

      ],

    };



    return this.lockReport(report);

  }



  runSelfReview(report: ArchitectureReport): SelfReviewResult {

    const findings: SelfReviewFinding[] = [];

    let score = 40;



    if (!report.requirementsReportId?.trim()) {

      findings.push({

        findingId: `arw-f-${Date.now()}-req`,

        category: "requirements",

        severity: "error",

        message: "Missing approved requirements report ID",

      });

    } else {

      score += 15;

    }



    if (!report.systemOverview?.trim()) {

      findings.push({

        findingId: `arw-f-${Date.now()}-sys`,

        category: "system",

        severity: "error",

        message: "Missing system overview",

      });

    } else {

      score += 10;

    }



    if (report.moduleArchitecture.length === 0) {

      findings.push({

        findingId: `arw-f-${Date.now()}-mod`,

        category: "modules",

        severity: "error",

        message: "No application modules defined",

      });

    } else {

      score += 10;

    }



    if (report.apiArchitecture.length === 0) {

      findings.push({

        findingId: `arw-f-${Date.now()}-api`,

        category: "apis",

        severity: "warning",

        message: "No API architecture defined",

      });

    } else {

      score += 10;

    }



    if (report.assumptions.some((a) => report.architecturalDecisions.some((d) => d.decision.includes(a)))) {

      findings.push({

        findingId: `arw-f-${Date.now()}-assumption`,

        category: "assumptions",

        severity: "error",

        message: "Assumptions must not appear as architectural decisions",

      });

    } else {

      score += 10;

    }



    if (report.traceabilityRefs.length === 0) {

      findings.push({

        findingId: `arw-f-${Date.now()}-trace`,

        category: "traceability",

        severity: "warning",

        message: "Missing traceability references",

      });

    } else {

      score += 5;

    }



    const hasErrors = findings.some((f) => f.severity === "error");

    const passed = !hasErrors && report.requirementsReportId.trim().length > 0;



    return {

      passed,

      summary: passed

        ? "Self-review passed — architecture traces to approved requirements with assumptions distinguished"

        : "Self-review incomplete — resolve findings before submission",

      qualityReview: passed

        ? "Architecture is structural, traceable, and distinct from assumptions"

        : "Quality review flagged incomplete or conflated architecture",

      complianceReview:

        "No frontend/backend code, application logic, or deployment performed by Architecture Worker",

      findings,

      confidenceScore: Math.min(100, score),

      architecturalCompliance: passed ? "compliant" : report.requirementsReportId ? "partial" : "non_compliant",

      architecturalComplianceNotes: passed

        ? "Architecture aligned to approved requirements report"

        : "Architecture incomplete or missing approved requirements",

      requirementsAvailable: report.requirementsReportId.trim().length > 0,

    };

  }



  private step(stepType: string, title: string, order: number, summary?: string): ArchitectureStep {

    return {

      stepId: `arw-step-${stepType}-${order}`,

      stepType,

      title,

      order,

      summary,

    };

  }



  private lockReport(report: Omit<ArchitectureReport, keyof BoundaryFlags> & Partial<BoundaryFlags>): ArchitectureReport {

    return {

      ...report,

      metadataVersion: report.metadataVersion || ARW_METADATA_VERSION,

      neverWriteFrontendCode: true,

      neverWriteBackendCode: true,

      neverDeployApplications: true,

      neverOverridePillow: true,

      neverOverrideGrandKing: true,

      neverImplementApplicationLogic: true,

      neverImplementQ604OrLater: true,

      followApprovedRequirements: true,

      preserveCompleteTraceability: true,

      separateArchitecturalDecisionsFromAssumptions: true,

      validateArchitecturalConsistency: true,

      preserveAuditHistory: true,

      structuralSignalOnly: true,

      maskSensitiveValues: true,

    } as ArchitectureReport;

  }

}



type BoundaryFlags = Pick<

  ArchitectureReport,

  | "neverWriteFrontendCode"

  | "neverWriteBackendCode"

  | "neverDeployApplications"

  | "neverOverridePillow"

  | "neverOverrideGrandKing"

  | "neverImplementApplicationLogic"

  | "neverImplementQ604OrLater"

  | "followApprovedRequirements"

  | "preserveCompleteTraceability"

  | "separateArchitecturalDecisionsFromAssumptions"

  | "validateArchitecturalConsistency"

  | "preserveAuditHistory"

  | "structuralSignalOnly"

  | "maskSensitiveValues"

>;



function cloneReport(report: ArchitectureReport): ArchitectureReport {

  return {

    ...report,

    architectureSteps: report.architectureSteps.map((s) => ({ ...s })),

    supportedArchitectureDomains: [...report.supportedArchitectureDomains],

    moduleArchitecture: report.moduleArchitecture.map((m) => ({ ...m })),

    apiArchitecture: report.apiArchitecture.map((a) => ({ ...a })),

    dataFlow: report.dataFlow.map((f) => ({ ...f })),

    serviceDependencies: report.serviceDependencies.map((d) => ({ ...d })),

    deploymentArchitecture: {

      ...report.deploymentArchitecture,

      environments: [...report.deploymentArchitecture.environments],

      components: report.deploymentArchitecture.components.map((c) => ({ ...c })),

    },

    integrationArchitecture: report.integrationArchitecture.map((i) => ({ ...i })),

    securityConsiderations: [...report.securityConsiderations],

    scalabilityConsiderations: [...report.scalabilityConsiderations],

    maintainabilityConsiderations: [...report.maintainabilityConsiderations],

    architecturalDecisions: report.architecturalDecisions.map((d) => ({ ...d })),

    assumptions: [...report.assumptions],

    selfReviewFindings: report.selfReviewFindings.map((f) => ({ ...f })),

    traceabilityRefs: [...report.traceabilityRefs],

    preservedDecisions: report.preservedDecisions.map((d) => ({ ...d })),

  };

}



function unique(values: string[]): string[] {

  return [...new Set(values.filter(Boolean))];

}



export function resetArchitectureSequenceForTesting() {

  architectureSequence = 0;

}


