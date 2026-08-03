import type { RequirementsWorkerConfiguration } from "./configuration.js";
import type { EnrichmentContext } from "./integrations.js";
import {
  REQUIREMENTS_WORKER_IDENTITY,
  REQUIREMENTS_WORKER_REPORT_VERSION,
  REQUIREMENT_TYPES,
  RQW_METADATA_VERSION,
} from "./paths.js";
import type {
  AcceptanceCriterion,
  BusinessRule,
  FunctionalRequirement,
  NonFunctionalRequirement,
  PreservedDecision,
  RequirementType,
  RequirementsContext,
  RequirementsReport,
  RequirementsStep,
  RequirementsWorkerCatalog,
  RequirementsWorkerInput,
  RiskEntry,
  SelfReviewFinding,
  SelfReviewResult,
  StakeholderEntry,
  UseCase,
  UserStory,
  IntegrationHandshake,
} from "./types.js";

let requirementsSequence = 0;

/** Pure Requirements Worker helpers for Q6-02 — requirements (structural signals). */
export class RequirementsBuilder {
  buildCatalog(
    config: RequirementsWorkerConfiguration,
    reports: RequirementsReport[],
    integrations: IntegrationHandshake[],
  ): RequirementsWorkerCatalog {
    return {
      reportVersion: REQUIREMENTS_WORKER_REPORT_VERSION,
      workerId: config.workerId,
      requirementsReports: reports.map(cloneReport),
      integrations: integrations.map((i) => ({ ...i })),
      metadataVersion: RQW_METADATA_VERSION,
      executiveAuthority: "pillow",
      neverDesignArchitecture: true,
      neverWriteApplicationCode: true,
      neverDeploySoftware: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverInventUnsupportedBusinessRequirements: true,
      neverImplementQ603OrLater: true,
    };
  }

  mergeContext(
    input: RequirementsWorkerInput,
    context: RequirementsContext,
    enrichment?: EnrichmentContext | null,
  ): RequirementsContext {
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
      approvedBusinessIntent:
        input.approvedBusinessIntent ?? context.approvedBusinessIntent ?? null,
      intentApproved: input.intentApproved ?? context.intentApproved ?? false,
      stakeholders: input.stakeholders ?? context.stakeholders ?? [],
      requirementType: this.normalizeRequirementType(
        input.requirementType ?? context.requirementType,
      ),
    };
  }

  normalizeRequirementType(value: unknown): RequirementType {
    if (
      typeof value === "string" &&
      (REQUIREMENT_TYPES as readonly string[]).includes(value)
    ) {
      return value as RequirementType;
    }
    return "functional_requirements";
  }

  createRequirementsShell(
    input: RequirementsWorkerInput,
    config: RequirementsWorkerConfiguration,
    context: RequirementsContext,
  ): RequirementsReport {
    requirementsSequence += 1;
    const now = new Date().toISOString();
    const intent = this.resolveIntent(input, context);
    const hasIntent = intent.trim().length > 0;
    const requirementsId =
      input.requirementsId?.trim() || `rqw-req-${Date.now()}-${requirementsSequence}`;
    const platformId =
      input.platformId?.trim() ||
      context.platformId?.trim() ||
      `rqw-plt-${requirementsSequence}`;
    const platformName =
      input.platformName?.trim() ||
      context.platformName?.trim() ||
      (hasIntent ? "Platform from approved intent" : "Unspecified platform");
    const businessId =
      input.businessId?.trim() || context.businessId?.trim() || `rqw-biz-${requirementsSequence}`;
    const factoryMissionId =
      input.factoryMissionId?.trim() ||
      context.factoryMissionId?.trim() ||
      `rqw-msn-${requirementsSequence}`;
    const businessObjective =
      input.businessObjective?.trim() ||
      context.businessObjective?.trim() ||
      (hasIntent ? intent.slice(0, 200) : "Business objective pending approved intent");

    return this.lockReport({
      requirementsId,
      timestamp: now,
      platformId,
      platformName,
      businessObjective,
      stakeholders: [],
      functionalRequirements: [],
      nonFunctionalRequirements: [],
      userStories: [],
      useCases: [],
      acceptanceCriteria: [],
      assumptions: hasIntent
        ? []
        : ["Approved business intent not yet provided — requirements shell only"],
      constraints: [],
      technicalConstraints: [],
      regulatoryConstraints: [],
      risks: [],
      businessRules: [],
      confidenceScore: hasIntent ? 35 : 20,
      metadataVersion: RQW_METADATA_VERSION,
      businessId,
      factoryMissionId,
      approvedBusinessIntent: intent,
      intentApproved: input.intentApproved ?? context.intentApproved ?? hasIntent,
      requirementType: this.normalizeRequirementType(
        input.requirementType ?? context.requirementType ?? config.defaultRequirementType,
      ),
      supportedRequirementTypes: [...REQUIREMENT_TYPES] as RequirementType[],
      requirementsSteps: hasIntent
        ? [
            this.step(
              "receive_intent",
              "Receive approved business intent",
              1,
              "Business intent received and recorded",
            ),
          ]
        : [
            this.step(
              "receive_intent",
              "Receive approved business intent",
              1,
              "Incomplete — awaiting approved business intent",
            ),
          ],
      selfReviewPassed: false,
      selfReviewFindings: hasIntent
        ? []
        : [
            {
              findingId: `rqw-f-intent-${requirementsSequence}`,
              category: "intent",
              severity: "warning",
              message: "Approved business intent missing or empty",
            },
          ],
      selfReviewSummary: hasIntent
        ? "Shell created — requirements stages pending"
        : "Incomplete shell — approved business intent required",
      qualityReview: "",
      complianceReview:
        "Pending — no architecture design, application code, or deployment in scope.",
      researchCompliance: hasIntent ? "partial" : "non_compliant",
      researchComplianceNotes: hasIntent
        ? "Awaiting stakeholder and requirements stages"
        : "Cannot produce complete requirements without approved business intent",
      workerId: config.workerId || REQUIREMENTS_WORKER_IDENTITY.workerId,
      reportVersion: REQUIREMENTS_WORKER_REPORT_VERSION,
      traceabilityRefs: unique([
        requirementsId,
        platformId,
        factoryMissionId,
        hasIntent ? "intent:approved" : "intent:missing",
      ]),
      preservedDecisions: hasIntent
        ? [
            {
              decisionId: `rqw-dec-intent-${Date.now()}`,
              topic: platformName,
              decision: `Received approved business intent (${intent.slice(0, 120)})`,
              recordedAt: now,
            },
          ]
        : [],
      submittedToExecutiveReporting: false,
      executiveReportId: null,
    });
  }

  identifyStakeholders(
    context: RequirementsContext,
    report: RequirementsReport,
  ): { stakeholders: StakeholderEntry[]; steps: RequirementsStep[] } {
    const intent = report.approvedBusinessIntent;
    const provided = context.stakeholders ?? [];
    const stakeholders: StakeholderEntry[] =
      provided.length > 0
        ? [...provided]
        : intent.includes("SaaS") || intent.includes("platform")
          ? [
              { name: "Product Owner", role: "defines platform vision from approved intent" },
              { name: "Enterprise Platform Factory", role: "orchestrates platform lifecycle" },
              { name: "End Users", role: "consumers described in approved intent" },
            ]
          : [
              { name: "Business Sponsor", role: "approved business intent authority" },
              { name: "Requirements Analyst", role: "structures requirements from intent" },
            ];
    return {
      stakeholders,
      steps: [
        this.step(
          "identify_stakeholders",
          "Identify stakeholders",
          2,
          `Identified ${stakeholders.length} stakeholder(s) tied to approved intent`,
        ),
      ],
    };
  }

  defineBusinessObjectives(
    context: RequirementsContext,
    report: RequirementsReport,
  ): { businessObjective: string; steps: RequirementsStep[] } {
    const objective =
      context.businessObjective?.trim() ||
      report.businessObjective?.trim() ||
      report.approvedBusinessIntent.slice(0, 300) ||
      "Objective derived from approved business intent";
    return {
      businessObjective: objective,
      steps: [
        this.step(
          "define_objectives",
          "Define business objectives",
          3,
          `Business objective aligned to approved intent: ${objective.slice(0, 100)}`,
        ),
      ],
    };
  }

  produceFunctionalRequirements(report: RequirementsReport): {
    functionalRequirements: FunctionalRequirement[];
    businessRules: BusinessRule[];
    steps: RequirementsStep[];
  } {
    const intent = report.approvedBusinessIntent;
    const objective = report.businessObjective;
    const functionalRequirements: FunctionalRequirement[] = [];
    const businessRules: BusinessRule[] = [];

    functionalRequirements.push({
      id: `rqw-fr-${requirementsSequence}-1`,
      statement: `The platform shall support the approved business objective: ${objective.slice(0, 150)}`,
      priority: "high",
      category: "core_capability",
    });

    if (intent.toLowerCase().includes("lifecycle") || intent.toLowerCase().includes("platform")) {
      functionalRequirements.push({
        id: `rqw-fr-${requirementsSequence}-2`,
        statement:
          "The platform shall expose lifecycle coordination capabilities described in the approved business intent",
        priority: "high",
        category: "platform_lifecycle",
      });
    }

    if (intent.toLowerCase().includes("user") || intent.toLowerCase().includes("customer")) {
      functionalRequirements.push({
        id: `rqw-fr-${requirementsSequence}-3`,
        statement:
          "The platform shall provide user-facing capabilities explicitly referenced in the approved business intent",
        priority: "medium",
        category: "user_experience",
      });
    }

    businessRules.push({
      id: `rqw-br-${requirementsSequence}-1`,
      statement: "All requirements must trace to the approved business intent — no unsupported scope",
      category: "traceability",
    });

    return {
      functionalRequirements,
      businessRules,
      steps: [
        this.step(
          "produce_functional",
          "Produce functional requirements",
          4,
          `Generated ${functionalRequirements.length} functional requirement(s) from approved intent`,
        ),
      ],
    };
  }

  produceNonFunctionalRequirements(report: RequirementsReport): {
    nonFunctionalRequirements: NonFunctionalRequirement[];
    steps: RequirementsStep[];
  } {
    const intent = report.approvedBusinessIntent.toLowerCase();
    const nonFunctionalRequirements: NonFunctionalRequirement[] = [
      {
        id: `rqw-nfr-${requirementsSequence}-1`,
        statement:
          "The platform shall maintain audit history and traceability for all requirement artifacts",
        category: "auditability",
      },
      {
        id: `rqw-nfr-${requirementsSequence}-2`,
        statement:
          "The platform shall distinguish structural requirements from assumptions in all reports",
        category: "quality",
      },
    ];

    if (intent.includes("enterprise") || intent.includes("saas")) {
      nonFunctionalRequirements.push({
        id: `rqw-nfr-${requirementsSequence}-3`,
        statement:
          "The platform shall support enterprise-grade availability expectations stated in approved intent",
        category: "availability",
      });
    }

    return {
      nonFunctionalRequirements,
      steps: [
        this.step(
          "produce_non_functional",
          "Produce non-functional requirements",
          5,
          `Generated ${nonFunctionalRequirements.length} non-functional requirement(s)`,
        ),
      ],
    };
  }

  generateUserStories(report: RequirementsReport): {
    userStories: UserStory[];
    steps: RequirementsStep[];
  } {
    const objective = report.businessObjective.slice(0, 100);
    const userStories: UserStory[] = [
      {
        id: `rqw-story-${requirementsSequence}-1`,
        asA: "platform stakeholder",
        iWant: `capabilities aligned to "${objective}"`,
        soThat: "the approved business intent is realized without unsupported scope",
        priority: "high",
      },
    ];

    if (report.functionalRequirements.length > 1) {
      userStories.push({
        id: `rqw-story-${requirementsSequence}-2`,
        asA: "enterprise operator",
        iWant: "lifecycle coordination as described in approved intent",
        soThat: "platform delivery follows governed enterprise processes",
        priority: "medium",
      });
    }

    return {
      userStories,
      steps: [
        this.step(
          "generate_stories",
          "Generate user stories",
          6,
          `Generated ${userStories.length} user story/stories from requirements`,
        ),
      ],
    };
  }

  generateUseCases(report: RequirementsReport): {
    useCases: UseCase[];
    steps: RequirementsStep[];
  } {
    const actors = report.stakeholders
      .map((s) => (typeof s === "string" ? s : s.name))
      .slice(0, 3);
    const useCases: UseCase[] = [
      {
        id: `rqw-uc-${requirementsSequence}-1`,
        title: "Process approved business intent into requirements",
        actors: actors.length ? actors : ["Business Sponsor", "Requirements Worker"],
        preconditions: ["Approved business intent is available", "Platform mission is active"],
        mainFlow: [
          "Receive approved business intent",
          "Identify stakeholders and objectives",
          "Produce functional and non-functional requirements",
          "Generate stories, use cases, and acceptance criteria",
        ],
        postconditions: [
          "Requirements report produced with traceability to approved intent",
          "Assumptions distinguished from requirements",
        ],
      },
    ];

    return {
      useCases,
      steps: [
        this.step(
          "generate_use_cases",
          "Generate use cases",
          7,
          `Generated ${useCases.length} use case(s)`,
        ),
      ],
    };
  }

  generateAcceptanceCriteria(report: RequirementsReport): {
    acceptanceCriteria: AcceptanceCriterion[];
    steps: RequirementsStep[];
  } {
    const acceptanceCriteria: AcceptanceCriterion[] = report.userStories.map((story, index) => ({
      id: `rqw-ac-${requirementsSequence}-${index + 1}`,
      storyId: story.id,
      criterion: `Given approved business intent, when ${story.asA} uses the platform, then ${story.soThat}`,
      measurable: true,
    }));

    if (!acceptanceCriteria.length) {
      acceptanceCriteria.push({
        id: `rqw-ac-${requirementsSequence}-1`,
        criterion:
          "Requirements report includes all mandatory fields traceable to approved business intent",
        measurable: true,
      });
    }

    return {
      acceptanceCriteria,
      steps: [
        this.step(
          "generate_acceptance",
          "Generate acceptance criteria",
          8,
          `Generated ${acceptanceCriteria.length} acceptance criterion/criteria`,
        ),
      ],
    };
  }

  identifyAssumptionsRisksAndConstraints(report: RequirementsReport): {
    assumptions: string[];
    constraints: string[];
    technicalConstraints: string[];
    regulatoryConstraints: string[];
    risks: RiskEntry[];
    steps: RequirementsStep[];
  } {
    const assumptions: string[] = [];
    if (report.approvedBusinessIntent.length < 50) {
      assumptions.push(
        "Business intent is concise — detailed market or user research may be required in later missions",
      );
    }
    assumptions.push(
      "Stakeholder roles inferred from approved intent unless explicitly provided",
    );

    const technicalConstraints = [
      "Requirements Worker produces structural requirements only — no architecture or code",
      "Implementation deferred to downstream Q6-03+ missions under Pillow governance",
    ];
    const regulatoryConstraints = [
      "Enterprise governance and Pillow approval gates apply to all downstream implementation",
    ];
    const constraints = [...technicalConstraints, ...regulatoryConstraints];

    const risks: RiskEntry[] = [
      {
        id: `rqw-risk-${requirementsSequence}-1`,
        description:
          "Thin business intent may require assumption-heavy requirements until further approval",
        severity: report.approvedBusinessIntent.length < 50 ? "medium" : "low",
      },
    ];

    return {
      assumptions,
      constraints,
      technicalConstraints,
      regulatoryConstraints,
      risks,
      steps: [
        this.step(
          "identify_risks",
          "Identify assumptions, risks, and constraints",
          9,
          `${assumptions.length} assumption(s), ${risks.length} risk(s), ${constraints.length} constraint(s)`,
        ),
      ],
    };
  }

  buildRequirementsReport(
    input: RequirementsWorkerInput,
    config: RequirementsWorkerConfiguration,
    context: RequirementsContext,
    partial?: RequirementsReport | null,
  ): RequirementsReport {
    requirementsSequence += 1;
    let report =
      partial ??
      this.createRequirementsShell(input, config, context);

    const stakeholdersResult = this.identifyStakeholders(context, report);
    report = {
      ...report,
      stakeholders: stakeholdersResult.stakeholders,
      requirementsSteps: [...report.requirementsSteps, ...stakeholdersResult.steps],
    };

    const objectivesResult = this.defineBusinessObjectives(context, report);
    report = {
      ...report,
      businessObjective: objectivesResult.businessObjective,
      requirementsSteps: [...report.requirementsSteps, ...objectivesResult.steps],
    };

    const functionalResult = this.produceFunctionalRequirements(report);
    report = {
      ...report,
      functionalRequirements: functionalResult.functionalRequirements,
      businessRules: functionalResult.businessRules,
      requirementsSteps: [...report.requirementsSteps, ...functionalResult.steps],
    };

    const nfrResult = this.produceNonFunctionalRequirements(report);
    report = {
      ...report,
      nonFunctionalRequirements: nfrResult.nonFunctionalRequirements,
      requirementsSteps: [...report.requirementsSteps, ...nfrResult.steps],
    };

    const storiesResult = this.generateUserStories(report);
    report = {
      ...report,
      userStories: storiesResult.userStories,
      requirementsSteps: [...report.requirementsSteps, ...storiesResult.steps],
    };

    const useCasesResult = this.generateUseCases(report);
    report = {
      ...report,
      useCases: useCasesResult.useCases,
      requirementsSteps: [...report.requirementsSteps, ...useCasesResult.steps],
    };

    const acceptanceResult = this.generateAcceptanceCriteria(report);
    report = {
      ...report,
      acceptanceCriteria: acceptanceResult.acceptanceCriteria,
      requirementsSteps: [...report.requirementsSteps, ...acceptanceResult.steps],
    };

    const riskResult = this.identifyAssumptionsRisksAndConstraints(report);
    report = {
      ...report,
      assumptions: riskResult.assumptions,
      constraints: riskResult.constraints,
      technicalConstraints: riskResult.technicalConstraints,
      regulatoryConstraints: riskResult.regulatoryConstraints,
      risks: riskResult.risks,
      requirementsSteps: [...report.requirementsSteps, ...riskResult.steps],
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
      researchCompliance: selfReview.researchCompliance,
      researchComplianceNotes: selfReview.researchComplianceNotes,
      requirementsSteps: [
        ...report.requirementsSteps,
        this.step(
          "produce_report",
          "Produce requirements report",
          10,
          "Complete requirements report assembled",
        ),
      ],
      preservedDecisions: [
        ...report.preservedDecisions,
        {
          decisionId: `rqw-dec-report-${Date.now()}`,
          topic: report.platformName,
          decision: `Produced requirements report with ${report.functionalRequirements.length} FR, ${report.userStories.length} stories`,
          recordedAt: new Date().toISOString(),
        },
      ],
    };

    return this.lockReport(report);
  }

  runSelfReview(report: RequirementsReport): SelfReviewResult {
    const findings: SelfReviewFinding[] = [];
    let score = 40;

    if (!report.approvedBusinessIntent?.trim()) {
      findings.push({
        findingId: `rqw-f-${Date.now()}-intent`,
        category: "intent",
        severity: "error",
        message: "Missing approved business intent",
      });
    } else {
      score += 15;
    }

    if (report.functionalRequirements.length === 0) {
      findings.push({
        findingId: `rqw-f-${Date.now()}-fr`,
        category: "functional",
        severity: "error",
        message: "No functional requirements produced",
      });
    } else {
      score += 10;
    }

    if (report.nonFunctionalRequirements.length === 0) {
      findings.push({
        findingId: `rqw-f-${Date.now()}-nfr`,
        category: "non_functional",
        severity: "warning",
        message: "No non-functional requirements produced",
      });
    } else {
      score += 10;
    }

    if (report.userStories.length === 0) {
      findings.push({
        findingId: `rqw-f-${Date.now()}-stories`,
        category: "stories",
        severity: "warning",
        message: "No user stories produced",
      });
    } else {
      score += 10;
    }

    if (report.assumptions.some((a) => report.functionalRequirements.some((fr) => fr.statement.includes(a)))) {
      findings.push({
        findingId: `rqw-f-${Date.now()}-assumption`,
        category: "assumptions",
        severity: "error",
        message: "Assumptions must not appear as functional requirements",
      });
    } else {
      score += 10;
    }

    if (report.traceabilityRefs.length === 0) {
      findings.push({
        findingId: `rqw-f-${Date.now()}-trace`,
        category: "traceability",
        severity: "warning",
        message: "Missing traceability references",
      });
    } else {
      score += 5;
    }

    const hasErrors = findings.some((f) => f.severity === "error");
    const passed = !hasErrors && report.approvedBusinessIntent.trim().length > 0;

    return {
      passed,
      summary: passed
        ? "Self-review passed — requirements trace to approved intent with assumptions distinguished"
        : "Self-review incomplete — resolve findings before submission",
      qualityReview: passed
        ? "Requirements are structural, traceable, and distinct from assumptions"
        : "Quality review flagged incomplete or conflated requirements",
      complianceReview:
        "No architecture design, application code, or deployment performed by Requirements Worker",
      findings,
      confidenceScore: Math.min(100, score),
      researchCompliance: passed ? "compliant" : report.approvedBusinessIntent ? "partial" : "non_compliant",
      researchComplianceNotes: passed
        ? "Requirements aligned to approved business intent"
        : "Requirements incomplete or missing approved intent",
      intentAvailable: report.approvedBusinessIntent.trim().length > 0,
    };
  }

  private resolveIntent(input: RequirementsWorkerInput, context: RequirementsContext): string {
    return (
      input.approvedBusinessIntent?.trim() ||
      context.approvedBusinessIntent?.trim() ||
      input.businessObjective?.trim() ||
      context.businessObjective?.trim() ||
      ""
    );
  }

  private step(stepType: string, title: string, order: number, summary?: string): RequirementsStep {
    return {
      stepId: `rqw-step-${stepType}-${order}`,
      stepType,
      title,
      order,
      summary,
    };
  }

  private lockReport(report: Omit<RequirementsReport, keyof BoundaryFlags> & Partial<BoundaryFlags>): RequirementsReport {
    return {
      ...report,
      metadataVersion: report.metadataVersion || RQW_METADATA_VERSION,
      neverDesignArchitecture: true,
      neverWriteApplicationCode: true,
      neverDeploySoftware: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverInventUnsupportedBusinessRequirements: true,
      neverImplementQ603OrLater: true,
      followApprovedBusinessIntent: true,
      preserveCompleteTraceability: true,
      distinguishRequirementsFromAssumptions: true,
      validateCompletenessBeforeSubmission: true,
      preserveAuditHistory: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
    } as RequirementsReport;
  }
}

type BoundaryFlags = Pick<
  RequirementsReport,
  | "neverDesignArchitecture"
  | "neverWriteApplicationCode"
  | "neverDeploySoftware"
  | "neverOverridePillow"
  | "neverOverrideGrandKing"
  | "neverInventUnsupportedBusinessRequirements"
  | "neverImplementQ603OrLater"
  | "followApprovedBusinessIntent"
  | "preserveCompleteTraceability"
  | "distinguishRequirementsFromAssumptions"
  | "validateCompletenessBeforeSubmission"
  | "preserveAuditHistory"
  | "structuralSignalOnly"
  | "maskSensitiveValues"
>;

function cloneReport(report: RequirementsReport): RequirementsReport {
  return {
    ...report,
    requirementsSteps: report.requirementsSteps.map((s) => ({ ...s })),
    supportedRequirementTypes: [...report.supportedRequirementTypes],
    functionalRequirements: report.functionalRequirements.map((r) => ({ ...r })),
    nonFunctionalRequirements: report.nonFunctionalRequirements.map((r) => ({ ...r })),
    userStories: report.userStories.map((s) => ({ ...s })),
    useCases: report.useCases.map((u) => ({ ...u })),
    acceptanceCriteria: report.acceptanceCriteria.map((a) => ({ ...a })),
    assumptions: [...report.assumptions],
    constraints: [...report.constraints],
    technicalConstraints: [...report.technicalConstraints],
    regulatoryConstraints: [...report.regulatoryConstraints],
    risks: report.risks.map((r) => ({ ...r })),
    businessRules: report.businessRules.map((b) => ({ ...b })),
    stakeholders: [...report.stakeholders],
    selfReviewFindings: report.selfReviewFindings.map((f) => ({ ...f })),
    traceabilityRefs: [...report.traceabilityRefs],
    preservedDecisions: report.preservedDecisions.map((d) => ({ ...d })),
  };
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

export function resetRequirementsSequenceForTesting() {
  requirementsSequence = 0;
}
