import type { PromptProductWorkerConfiguration } from "./configuration.js";
import type { DprEnrichmentContext } from "./integrations.js";
import {
  EXPORT_FORMATS,
  PPW_METADATA_VERSION,
  PRODUCT_TYPES,
  PROMPT_PRODUCT_REPORT_VERSION,
  PROMPT_PRODUCT_WORKER_IDENTITY,
  TARGET_AI_PLATFORMS,
} from "./paths.js";
import type {
  ConsistencyValidationResult,
  ExportFormat,
  IntegrationHandshake,
  ProductType,
  PromptArchitecture,
  PromptLibraryEntry,
  PromptProductContext,
  PromptProductReport,
  PromptProductWorkerCatalog,
  PromptProductWorkerInput,
  SelfReviewFinding,
  StructuredPromptPack,
  TargetAiPlatform,
  WorkflowComponent,
} from "./types.js";

/** Pure Prompt Product Worker helpers for Q5-04 — prompt product creation only. */
export class PromptBuilder {
  buildCatalog(
    config: PromptProductWorkerConfiguration,
    products: PromptProductReport[],
    integrations: IntegrationHandshake[],
  ): PromptProductWorkerCatalog {
    return {
      reportVersion: PROMPT_PRODUCT_REPORT_VERSION,
      workerId: config.workerId,
      promptProducts: products.map(cloneProduct),
      integrations: integrations.map((i) => ({ ...i })),
      metadataVersion: PPW_METADATA_VERSION,
      executiveAuthority: "pillow",
      neverBuildSalesPages: true,
      neverProcessCustomerPayments: true,
      neverProcessPayments: true,
      neverDeliverProducts: true,
      neverPublishProductsDirectly: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    };
  }

  mergeContext(
    input: PromptProductWorkerInput,
    context: PromptProductContext,
    enrichment?: DprEnrichmentContext | null,
  ): PromptProductContext {
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
        input.productTitle ?? enrichment?.productTitle ?? context.productTitle ?? null,
      productType: this.normalizeProductType(
        input.productType ?? enrichment?.productType ?? context.productType,
      ),
      targetAudience:
        input.targetAudience ?? enrichment?.targetAudience ?? context.targetAudience ?? null,
      targetAiPlatforms: this.normalizePlatforms(
        input.targetAiPlatforms ?? context.targetAiPlatforms,
      ),
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

  canBuildPromptProduct(context: PromptProductContext): { ready: boolean; reason?: string } {
    if (
      !context.receivedResearch &&
      !context.researchReportId &&
      !context.researchTopic &&
      !context.productTitle
    ) {
      return {
        ready: false,
        reason:
          "Approved digital product research context required (researchReportId, researchTopic, or productTitle)",
      };
    }
    return { ready: true };
  }

  designPromptArchitecture(context: PromptProductContext): PromptArchitecture {
    const title = this.resolveTitle(context);
    const categories = this.defaultCategories(context);
    return {
      architectureId: `ppw-arch-${Date.now()}-${promptSequence + 1}`,
      title: `${title} Prompt Architecture`,
      layers: [
        "Intent framing layer — clarify role, audience, and outcome",
        "Context injection layer — supply domain facts and constraints",
        "Task decomposition layer — break work into ordered prompt steps",
        "Quality guardrail layer — enforce tone, structure, and verification",
        "Reuse packaging layer — templates, variables, and pack organization",
      ],
      categories,
      designPrinciples: [
        "Every prompt states role, goal, constraints, and output format",
        "Variables are explicit and reusable across platforms",
        "Workflows chain prompts with clear handoff artifacts",
        "Instructions remain platform-agnostic unless a platform hint is required",
        "Original prompt products only — no sales pages, payments, delivery, or publishing",
      ],
      platformStrategy: this.platformStrategy(context),
    };
  }

  createPromptLibraries(
    architecture: PromptArchitecture,
    context: PromptProductContext,
  ): PromptLibraryEntry[] {
    const title = this.resolveTitle(context);
    const audience = context.targetAudience?.trim() || "professionals using AI assistants";
    const pain =
      context.customerPainPoints?.[0] ??
      "inconsistent AI outputs and unstructured prompting practices";
    const platforms = this.normalizePlatforms(context.targetAiPlatforms);
    const platformHints = platforms.includes("multi_platform")
      ? ["chatgpt", "claude", "gemini", "copilot"]
      : platforms.filter((p) => p !== "unknown");

    return architecture.categories.map((category, index) => {
      const promptId = `ppw-prm-${Date.now()}-${index + 1}`;
      const promptTitle = `${category} Prompt — ${title}`;
      const variables = ["role", "audience", "goal", "constraints", "output_format", "context"];
      const template = [
        `You are a {{role}} helping {{audience}} with ${title}.`,
        ``,
        `Primary goal: {{goal}}`,
        `Category focus: ${category}`,
        `Problem to address: ${pain}`,
        ``,
        `Constraints:`,
        `- {{constraints}}`,
        `- Stay aligned to approved product intent for ${title}`,
        `- Produce original, actionable guidance (no sales pages or payment flows)`,
        ``,
        `Context:`,
        `{{context}}`,
        ``,
        `Output format: {{output_format}}`,
        ``,
        `Respond with:`,
        `1. A concise framing of the task`,
        `2. Step-by-step actions tailored to ${audience}`,
        `3. A reusable checklist or decision table`,
        `4. One verification question the user should ask next`,
      ].join("\n");
      return {
        promptId,
        title: promptTitle,
        category,
        template,
        variables,
        platformHints: platformHints.length ? platformHints : ["multi_platform"],
      };
    });
  }

  createReusablePromptTemplates(
    library: PromptLibraryEntry[],
    context: PromptProductContext,
  ): PromptLibraryEntry[] {
    const title = this.resolveTitle(context);
    const metaTemplates: PromptLibraryEntry[] = [
      {
        promptId: `ppw-tpl-${Date.now()}-refine`,
        title: `${title} — Refinement Template`,
        category: "templates",
        template: [
          `Refine the following draft for ${title}.`,
          ``,
          `Draft:`,
          `{{draft}}`,
          ``,
          `Improvement goals: {{improvement_goals}}`,
          `Keep: clarity, specificity, and actionable structure.`,
          `Remove: filler, vague claims, and non-exportable delivery/payment language.`,
          ``,
          `Return an improved version plus a short change log.`,
        ].join("\n"),
        variables: ["draft", "improvement_goals"],
        platformHints: ["multi_platform"],
      },
      {
        promptId: `ppw-tpl-${Date.now()}-critique`,
        title: `${title} — Critique Template`,
        category: "templates",
        template: [
          `Critique this ${title} artifact as a rigorous reviewer.`,
          ``,
          `Artifact:`,
          `{{artifact}}`,
          ``,
          `Evaluate against:`,
          `- Clarity of intent`,
          `- Completeness for {{audience}}`,
          `- Consistency of terminology`,
          `- Export readiness (documentation quality only)`,
          ``,
          `Provide findings as severity-tagged bullets and a rewrite recommendation.`,
        ].join("\n"),
        variables: ["artifact", "audience"],
        platformHints: ["multi_platform"],
      },
    ];
    return [...library, ...metaTemplates];
  }

  createAiWorkflowProducts(
    library: PromptLibraryEntry[],
    context: PromptProductContext,
  ): WorkflowComponent[] {
    const title = this.resolveTitle(context);
    const steps = [
      {
        name: "Frame Intent",
        description: `Establish role, audience, and outcome for ${title} using the intent-framing prompts.`,
      },
      {
        name: "Inject Context",
        description: `Supply domain constraints, pain points, and approved research signals into the working prompt.`,
      },
      {
        name: "Generate Draft",
        description: `Run the primary category prompt to produce the first structured draft for ${title}.`,
      },
      {
        name: "Refine Output",
        description: `Apply the reusable refinement template to tighten clarity and actionability.`,
      },
      {
        name: "Validate Consistency",
        description: `Critique terminology, category alignment, and documentation readiness before packaging.`,
      },
    ];
    return steps.map((step, index) => ({
      componentId: `ppw-wf-${Date.now()}-${index + 1}`,
      name: step.name,
      description: `${step.description} Related prompts: ${library
        .slice(0, 2)
        .map((p) => p.promptId)
        .join(", ") || "library-pending"}.`,
      stepOrder: index + 1,
    }));
  }

  organizePromptsIntoStructuredPacks(
    library: PromptLibraryEntry[],
    architecture: PromptArchitecture | null,
    context: PromptProductContext,
  ): StructuredPromptPack[] {
    const title = this.resolveTitle(context);
    const categories = architecture?.categories ?? this.defaultCategories(context);
    const packs: StructuredPromptPack[] = categories.map((category, index) => {
      const promptIds = library.filter((p) => p.category === category).map((p) => p.promptId);
      return {
        packId: `ppw-pack-${Date.now()}-${index + 1}`,
        name: `${title} — ${category} Pack`,
        category,
        promptIds,
        description: `Structured pack grouping ${promptIds.length} ${category} prompts for ${title}.`,
      };
    });
    const templateIds = library.filter((p) => p.category === "templates").map((p) => p.promptId);
    if (templateIds.length) {
      packs.push({
        packId: `ppw-pack-${Date.now()}-templates`,
        name: `${title} — Reusable Templates Pack`,
        category: "templates",
        promptIds: templateIds,
        description: `Reusable refinement and critique templates for ${title}.`,
      });
    }
    return packs;
  }

  generateUserInstructions(
    product: Pick<
      PromptProductReport,
      | "productTitle"
      | "promptLibrary"
      | "workflowComponents"
      | "structuredPacks"
      | "targetAiPlatforms"
      | "promptArchitecture"
    >,
    context: PromptProductContext,
  ): string {
    const audience = context.targetAudience?.trim() || "end users of AI assistants";
    const platforms = product.targetAiPlatforms.join(", ") || "multi_platform";
    const workflow = product.workflowComponents
      .slice()
      .sort((a, b) => (a.stepOrder ?? 0) - (b.stepOrder ?? 0))
      .map((w) => `${w.stepOrder ?? "?"}. ${w.name} — ${w.description}`)
      .join("\n");
    return [
      `# User Instructions — ${product.productTitle}`,
      ``,
      `Audience: ${audience}`,
      `Target AI platforms: ${platforms}`,
      ``,
      `## How to use this prompt product`,
      `1. Choose the structured pack that matches your task.`,
      `2. Copy a prompt template and fill every {{variable}}.`,
      `3. Run the AI workflow components in step order.`,
      `4. Use the refinement/critique templates before finalizing your output.`,
      ``,
      `## Prompt library overview`,
      `This product includes ${product.promptLibrary.length} prompts across ${
        product.promptArchitecture?.categories.length ?? product.structuredPacks.length
      } categories.`,
      ...product.promptLibrary.slice(0, 6).map(
        (p) => `- **${p.title}** (\`${p.promptId}\`) — category: ${p.category}`,
      ),
      ``,
      `## Recommended workflow`,
      workflow || "Workflow components will appear after createAiWorkflowProducts runs.",
      ``,
      `## Quality tips`,
      `- Keep role, goal, constraints, and output format explicit.`,
      `- Reuse variables consistently across packs.`,
      `- Treat export formats as documentation readiness signals only — this worker never publishes or delivers products.`,
      ``,
      `## Boundaries`,
      `These prompts are for productivity and creation workflows. They do not build sales pages, process payments, deliver products, or publish products directly.`,
    ].join("\n");
  }

  prepareExportFormats(): ExportFormat[] {
    return [...EXPORT_FORMATS];
  }

  validatePromptConsistency(
    product: Pick<
      PromptProductReport,
      | "productTitle"
      | "promptLibrary"
      | "workflowComponents"
      | "structuredPacks"
      | "userInstructions"
      | "promptArchitecture"
      | "exportFormats"
      | "researchReportId"
      | "promptCategories"
    >,
    context: PromptProductContext,
  ): ConsistencyValidationResult {
    const findings: SelfReviewFinding[] = [];
    let score = 70;
    if (!product.promptArchitecture) {
      findings.push({
        findingId: `ppw-f-${promptSequence}-architecture`,
        category: "architecture",
        severity: "error",
        message: "Prompt architecture missing",
      });
      score -= 20;
    } else {
      score += 8;
    }
    if (!product.promptLibrary.length) {
      findings.push({
        findingId: `ppw-f-${promptSequence}-library`,
        category: "library",
        severity: "error",
        message: "Prompt library is empty",
      });
      score -= 25;
    } else {
      score += 10;
      const emptyTemplates = product.promptLibrary.filter((p) => !p.template?.trim());
      if (emptyTemplates.length) {
        findings.push({
          findingId: `ppw-f-${promptSequence}-empty-templates`,
          category: "library",
          severity: "error",
          message: `${emptyTemplates.length} prompts have empty templates`,
        });
        score -= 15;
      }
    }
    if (!product.workflowComponents.length) {
      findings.push({
        findingId: `ppw-f-${promptSequence}-workflow`,
        category: "workflow",
        severity: "warning",
        message: "AI workflow components not yet created",
      });
      score -= 6;
    } else {
      score += 6;
    }
    if (!product.structuredPacks.length) {
      findings.push({
        findingId: `ppw-f-${promptSequence}-packs`,
        category: "packs",
        severity: "warning",
        message: "Structured packs not yet organized",
      });
      score -= 5;
    } else {
      score += 5;
    }
    if (!product.userInstructions?.trim()) {
      findings.push({
        findingId: `ppw-f-${promptSequence}-instructions`,
        category: "documentation",
        severity: "warning",
        message: "User instructions missing",
      });
      score -= 8;
    } else {
      score += 8;
    }
    if (!product.researchReportId && !context.researchReportId) {
      findings.push({
        findingId: `ppw-f-${promptSequence}-research`,
        category: "research_compliance",
        severity: "warning",
        message: "No researchReportId bound; product intent derived from available context",
      });
      score -= 4;
    } else {
      score += 6;
    }
    const categories = new Set(product.promptCategories);
    const libraryCategories = new Set(product.promptLibrary.map((p) => p.category));
    const drift = [...categories].filter((c) => c !== "templates" && !libraryCategories.has(c));
    if (drift.length) {
      findings.push({
        findingId: `ppw-f-${promptSequence}-category-drift`,
        category: "consistency",
        severity: "warning",
        message: `Category drift detected: ${drift.join(", ")}`,
      });
      score -= 4;
    } else if (product.promptLibrary.length) {
      score += 4;
    }

    const confidenceScore = clamp(score, 0, 100);
    const passed =
      findings.every((f) => f.severity !== "error") &&
      product.promptLibrary.length > 0 &&
      Boolean(product.promptArchitecture);
    const consistencyValidated = passed;
    const researchCompliance =
      product.researchReportId || context.researchReportId
        ? passed
          ? ("compliant" as const)
          : ("partial" as const)
        : ("partial" as const);
    const summary = passed
      ? `Consistency validation passed for '${product.productTitle}' with confidence ${confidenceScore}/100. Architecture, library, and documentation signals are export-ready (structural only).`
      : `Consistency validation incomplete for '${product.productTitle}' (confidence ${confidenceScore}/100). Resolve findings before executive submission.`;
    const qualityReview = passed
      ? `Quality review: original prompt products present (${product.promptLibrary.length} prompts, ${product.workflowComponents.length} workflow components, ${product.structuredPacks.length} packs); user docs=${product.userInstructions ? "included" : "pending"}; consistencyValidated=${consistencyValidated}; researchCompliance=${researchCompliance}.`
      : `Quality review: gaps remain — ${findings.map((f) => f.message).join("; ")}.`;

    return {
      passed,
      consistencyValidated,
      summary,
      qualityReview,
      findings,
      confidenceScore,
      researchCompliance,
      researchComplianceNotes:
        researchCompliance === "compliant"
          ? "Prompt product follows approved digital product research intent"
          : "Prompt product partially aligned to available research/product intent signals",
    };
  }

  buildPromptProduct(
    input: PromptProductWorkerInput,
    config: PromptProductWorkerConfiguration,
    context: PromptProductContext,
  ): PromptProductReport {
    promptSequence += 1;
    const now = new Date().toISOString();
    const productType = this.normalizeProductType(
      input.productType ?? context.productType ?? config.defaultProductType,
    );
    const productTitle = this.resolveTitle(context, input);
    const promptProductId =
      input.promptProductId?.trim() || `ppw-ppt-${Date.now()}-${promptSequence}`;
    const productId = input.productId?.trim() || `ppw-prd-${Date.now()}-${promptSequence}`;
    const businessId =
      input.businessId?.trim() || context.businessId?.trim() || `dbiz-ppw-${promptSequence}`;
    const factoryMissionId =
      input.factoryMissionId?.trim() ||
      context.factoryMissionId?.trim() ||
      `dpf-ppw-${promptSequence}`;
    const platforms = this.normalizePlatforms(
      input.targetAiPlatforms ??
        context.targetAiPlatforms ?? [config.defaultTargetAiPlatform as TargetAiPlatform],
    );

    const promptArchitecture = this.designPromptArchitecture({
      ...context,
      productTitle,
      productType,
      targetAiPlatforms: platforms,
    });
    let promptLibrary = this.createPromptLibraries(promptArchitecture, {
      ...context,
      productTitle,
      productType,
      targetAiPlatforms: platforms,
    });
    promptLibrary = this.createReusablePromptTemplates(promptLibrary, {
      ...context,
      productTitle,
    });
    const workflowComponents = this.createAiWorkflowProducts(promptLibrary, {
      ...context,
      productTitle,
    });
    const structuredPacks = this.organizePromptsIntoStructuredPacks(
      promptLibrary,
      promptArchitecture,
      { ...context, productTitle },
    );
    const promptCategories = unique([
      ...promptArchitecture.categories,
      ...promptLibrary.map((p) => p.category),
    ]);
    const draft = {
      productTitle,
      promptLibrary,
      workflowComponents,
      structuredPacks,
      targetAiPlatforms: platforms,
      promptArchitecture,
      userInstructions: "",
      exportFormats: [] as string[],
      researchReportId: context.researchReportId ?? input.researchReportId ?? null,
      promptCategories,
    };
    draft.userInstructions = this.generateUserInstructions(draft, {
      ...context,
      productTitle,
      targetAudience: context.targetAudience,
    });
    const exportFormats = this.prepareExportFormats();
    draft.exportFormats = exportFormats;
    const review = this.validatePromptConsistency(draft, context);
    const confidenceScore =
      input.confidenceScore != null && Number.isFinite(input.confidenceScore)
        ? clamp(input.confidenceScore, 0, 100)
        : review.confidenceScore;

    const traceabilityRefs = unique([
      `promptProduct:${promptProductId}`,
      `product:${productId}`,
      `business:${businessId}`,
      `mission:${factoryMissionId}`,
      ...(context.researchReportId ? [`research:${context.researchReportId}`] : []),
      ...(context.opportunityId ? [`opportunity:${context.opportunityId}`] : []),
      `type:${productType}`,
    ]);
    const preservedDecisions = [
      {
        decisionId: `ppw-dec-${promptSequence}-architecture`,
        topic: productTitle,
        decision: `Designed prompt architecture with ${promptArchitecture.categories.length} categories — prompt product only, no sales/publish/delivery`,
        recordedAt: now,
      },
      {
        decisionId: `ppw-dec-${promptSequence}-export`,
        topic: productTitle,
        decision: `Packaged structural export signals (${exportFormats.join(", ")}) without publishing or delivering`,
        recordedAt: now,
      },
    ];

    return {
      promptProductId,
      timestamp: now,
      productId,
      productTitle,
      targetAiPlatforms: platforms,
      promptCategories,
      promptLibrary,
      workflowComponents,
      userInstructions: draft.userInstructions,
      qualityReview: review.qualityReview,
      exportFormats,
      confidenceScore,
      metadataVersion: PPW_METADATA_VERSION,
      researchReportId: context.researchReportId ?? input.researchReportId ?? null,
      opportunityId: context.opportunityId ?? input.opportunityId ?? null,
      businessId,
      factoryMissionId,
      productType,
      promptArchitecture,
      structuredPacks,
      consistencyValidated: review.consistencyValidated,
      selfReviewPassed: review.passed,
      selfReviewFindings: review.findings,
      selfReviewSummary: review.summary,
      researchCompliance: review.researchCompliance,
      researchComplianceNotes: review.researchComplianceNotes,
      workerId: config.workerId || PROMPT_PRODUCT_WORKER_IDENTITY.workerId,
      reportVersion: PROMPT_PRODUCT_REPORT_VERSION,
      traceabilityRefs,
      preservedDecisions,
      submittedToExecutiveReporting: false,
      executiveReportId: null,
      neverBuildSalesPages: true,
      neverProcessCustomerPayments: true,
      neverProcessPayments: true,
      neverDeliverProducts: true,
      neverPublishProductsDirectly: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverImplementQ505OrLater: true,
      followApprovedProductResearch: true,
      followApprovedProductIntent: true,
      produceOriginalPromptProducts: true,
      preserveCompleteTraceability: true,
      validatePromptQuality: true,
      includeUserDocumentation: true,
      preserveAuditHistory: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
    };
  }

  /** Minimal shell created on research receive — stages fill remaining fields. */
  buildFreshPromptProductShell(
    input: PromptProductWorkerInput,
    config: PromptProductWorkerConfiguration,
    context: PromptProductContext,
  ): PromptProductReport {
    promptSequence += 1;
    const now = new Date().toISOString();
    const productType = this.normalizeProductType(
      input.productType ?? context.productType ?? config.defaultProductType,
    );
    const productTitle = this.resolveTitle(context, input);
    const promptProductId =
      input.promptProductId?.trim() || `ppw-ppt-${Date.now()}-${promptSequence}`;
    const productId = input.productId?.trim() || `ppw-prd-${Date.now()}-${promptSequence}`;
    const businessId =
      input.businessId?.trim() || context.businessId?.trim() || `dbiz-ppw-${promptSequence}`;
    const factoryMissionId =
      input.factoryMissionId?.trim() ||
      context.factoryMissionId?.trim() ||
      `dpf-ppw-${promptSequence}`;
    const platforms = this.normalizePlatforms(
      input.targetAiPlatforms ??
        context.targetAiPlatforms ?? [config.defaultTargetAiPlatform as TargetAiPlatform],
    );
    return {
      promptProductId,
      timestamp: now,
      productId,
      productTitle,
      targetAiPlatforms: platforms,
      promptCategories: [],
      promptLibrary: [],
      workflowComponents: [],
      userInstructions: "",
      qualityReview: "Pending prompt product stages after approved research intake.",
      exportFormats: [],
      confidenceScore: 40,
      metadataVersion: PPW_METADATA_VERSION,
      researchReportId: context.researchReportId ?? input.researchReportId ?? null,
      opportunityId: context.opportunityId ?? input.opportunityId ?? null,
      businessId,
      factoryMissionId,
      productType,
      promptArchitecture: null,
      structuredPacks: [],
      consistencyValidated: false,
      selfReviewPassed: false,
      selfReviewFindings: [],
      selfReviewSummary: "Awaiting architecture, library, workflows, packs, and validation stages.",
      researchCompliance: context.researchReportId ? "partial" : "partial",
      researchComplianceNotes: "Research identity captured; prompt product construction pending.",
      workerId: config.workerId || PROMPT_PRODUCT_WORKER_IDENTITY.workerId,
      reportVersion: PROMPT_PRODUCT_REPORT_VERSION,
      traceabilityRefs: unique([
        `promptProduct:${promptProductId}`,
        `product:${productId}`,
        `business:${businessId}`,
        `mission:${factoryMissionId}`,
        ...(context.researchReportId ? [`research:${context.researchReportId}`] : []),
        ...(context.opportunityId ? [`opportunity:${context.opportunityId}`] : []),
        `type:${productType}`,
      ]),
      preservedDecisions: [
        {
          decisionId: `ppw-dec-${promptSequence}-receive`,
          topic: productTitle,
          decision:
            "Received approved digital product research and opened a fresh prompt product shell",
          recordedAt: now,
        },
      ],
      submittedToExecutiveReporting: false,
      executiveReportId: null,
      neverBuildSalesPages: true,
      neverProcessCustomerPayments: true,
      neverProcessPayments: true,
      neverDeliverProducts: true,
      neverPublishProductsDirectly: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverImplementQ505OrLater: true,
      followApprovedProductResearch: true,
      followApprovedProductIntent: true,
      produceOriginalPromptProducts: true,
      preserveCompleteTraceability: true,
      validatePromptQuality: true,
      includeUserDocumentation: true,
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
      case "ebook":
      case "guide":
      case "manual":
        return "prompt_pack";
      case "toolkit":
      case "template":
        return "ai_productivity_kit";
      case "workbook":
        return "prompt_collection";
      case "sop_collection":
        return "business_prompt_pack";
      case "software_tool":
        return "ai_workflow_system";
      default:
        return raw ? "unknown" : "prompt_pack";
    }
  }

  normalizePlatforms(
    platforms: Array<TargetAiPlatform | string> | TargetAiPlatform[] | null | undefined,
  ): TargetAiPlatform[] {
    if (!platforms?.length) return ["multi_platform"];
    const normalized = platforms
      .map((p) => String(p).trim())
      .filter(Boolean)
      .map((p) =>
        (TARGET_AI_PLATFORMS as readonly string[]).includes(p)
          ? (p as TargetAiPlatform)
          : ("unknown" as TargetAiPlatform),
      );
    return normalized.length ? unique(normalized) as TargetAiPlatform[] : ["multi_platform"];
  }

  private resolveTitle(context: PromptProductContext, input?: PromptProductWorkerInput): string {
    return (
      input?.productTitle?.trim() ||
      context.productTitle?.trim() ||
      context.researchTopic?.trim() ||
      "Digital Prompt Product Pack"
    );
  }

  private defaultCategories(context: PromptProductContext): string[] {
    const productType = this.normalizeProductType(context.productType);
    switch (productType) {
      case "business_prompt_pack":
        return ["strategy", "operations", "communication", "analysis"];
      case "creative_prompt_pack":
        return ["ideation", "drafting", "revision", "presentation"];
      case "technical_prompt_pack":
        return ["requirements", "implementation", "debugging", "documentation"];
      case "ai_workflow_system":
        return ["intake", "planning", "execution", "review"];
      case "ai_productivity_kit":
        return ["planning", "execution", "summarization", "follow_up"];
      default:
        return ["fundamentals", "application", "optimization", "quality_control"];
    }
  }

  private platformStrategy(context: PromptProductContext): string {
    const platforms = this.normalizePlatforms(context.targetAiPlatforms);
    if (platforms.includes("multi_platform") || platforms.length > 1) {
      return "Author platform-neutral prompts with optional platformHints for ChatGPT, Claude, Gemini, and Copilot.";
    }
    return `Optimize prompt wording and output cues for ${platforms[0]} while keeping variables portable.`;
  }
}

let promptSequence = 0;

export function resetPromptSequenceForTesting() {
  promptSequence = 0;
}

function cloneProduct(product: PromptProductReport): PromptProductReport {
  return {
    ...product,
    targetAiPlatforms: [...product.targetAiPlatforms],
    promptCategories: [...product.promptCategories],
    promptLibrary: product.promptLibrary.map((p) => ({
      ...p,
      variables: p.variables ? [...p.variables] : undefined,
      platformHints: p.platformHints ? [...p.platformHints] : undefined,
    })),
    workflowComponents: product.workflowComponents.map((w) => ({ ...w })),
    exportFormats: [...product.exportFormats],
    structuredPacks: product.structuredPacks.map((s) => ({
      ...s,
      promptIds: [...s.promptIds],
    })),
    promptArchitecture: product.promptArchitecture
      ? {
          ...product.promptArchitecture,
          layers: [...product.promptArchitecture.layers],
          categories: [...product.promptArchitecture.categories],
          designPrinciples: [...product.promptArchitecture.designPrinciples],
        }
      : null,
    selfReviewFindings: product.selfReviewFindings.map((f) => ({ ...f })),
    traceabilityRefs: [...product.traceabilityRefs],
    preservedDecisions: product.preservedDecisions.map((d) => ({ ...d })),
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}
