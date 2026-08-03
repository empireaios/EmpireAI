import type { TemplateBuilderWorkerConfiguration } from "./configuration.js";
import type { DprEnrichmentContext } from "./integrations.js";
import {
  EXPORT_FORMATS,
  PRODUCT_TYPES,
  SUPPORTED_ASSET_FORMATS,
  TBW_METADATA_VERSION,
  TEMPLATE_BUILDER_REPORT_VERSION,
  TEMPLATE_BUILDER_WORKER_IDENTITY,
} from "./paths.js";
import type {
  ExportFormat,
  IntegrationHandshake,
  ProductType,
  PromptLibraryEntry,
  ReusableTemplateAsset,
  SelfReviewFinding,
  SelfReviewResult,
  SupportedAssetFormat,
  TemplateBuilderReport,
  TemplateBuilderWorkerCatalog,
  TemplateBuilderWorkerInput,
  TemplateChecklist,
  TemplateContext,
  TemplateContract,
  TemplateForm,
  TemplatePlanner,
  TemplateSpreadsheet,
} from "./types.js";

/** Pure Template Builder Worker helpers for Q5-06 — reusable template products only. */
export class TemplateBuilder {
  buildCatalog(
    config: TemplateBuilderWorkerConfiguration,
    templateProducts: TemplateBuilderReport[],
    integrations: IntegrationHandshake[],
  ): TemplateBuilderWorkerCatalog {
    return {
      reportVersion: TEMPLATE_BUILDER_REPORT_VERSION,
      workerId: config.workerId,
      templateProducts: templateProducts.map(cloneProduct),
      integrations: integrations.map((i) => ({ ...i })),
      metadataVersion: TBW_METADATA_VERSION,
      executiveAuthority: "pillow",
      neverBuildSalesPages: true,
      neverProcessPayments: true,
      neverDeliverProductsToCustomers: true,
      neverPublishProductsDirectly: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    };
  }

  mergeContext(
    input: TemplateBuilderWorkerInput,
    context: TemplateContext,
    enrichment?: DprEnrichmentContext | null,
  ): TemplateContext {
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

  canBuildTemplateProduct(context: TemplateContext): { ready: boolean; reason?: string } {
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

  createTemplateProductShell(
    input: TemplateBuilderWorkerInput,
    config: TemplateBuilderWorkerConfiguration,
    context: TemplateContext,
  ): TemplateBuilderReport {
    templateSequence += 1;
    const now = new Date().toISOString();
    const productType = this.normalizeProductType(
      input.productType ?? context.productType ?? config.defaultProductType,
    );
    const productTitle = this.resolveTitle(context, input);
    const templateProductId =
      input.templateProductId?.trim() || `tbw-tpl-${Date.now()}-${templateSequence}`;
    const productId = input.productId?.trim() || `tbw-prd-${Date.now()}-${templateSequence}`;
    const businessId =
      input.businessId?.trim() || context.businessId?.trim() || `dbiz-tbw-${templateSequence}`;
    const factoryMissionId =
      input.factoryMissionId?.trim() ||
      context.factoryMissionId?.trim() ||
      `dpf-tbw-${templateSequence}`;
    const targetAudience =
      input.targetAudience?.trim() ||
      context.targetAudience?.trim() ||
      "Operators seeking reusable template packs";
    const productCategory =
      input.productCategory?.trim() || this.humanizeCategory(productType);

    return {
      templateProductId,
      timestamp: now,
      productId,
      productTitle,
      productCategory,
      templateTypes: [],
      includedAssets: [],
      targetAudience,
      supportedFormats: [],
      qualityReview: "",
      exportFormats: [],
      confidenceScore: 40,
      metadataVersion: TBW_METADATA_VERSION,
      researchReportId: context.researchReportId ?? input.researchReportId ?? null,
      opportunityId: context.opportunityId ?? input.opportunityId ?? null,
      businessId,
      factoryMissionId,
      productType,
      templates: [],
      planners: [],
      spreadsheets: [],
      contracts: [],
      forms: [],
      checklists: [],
      promptLibrary: [],
      usabilityValidated: false,
      selfReviewPassed: false,
      selfReviewFindings: [],
      selfReviewSummary: "Shell created — content stages pending",
      researchCompliance: "partial",
      researchComplianceNotes: "Awaiting reusable asset generation from approved research intent",
      workerId: config.workerId || TEMPLATE_BUILDER_WORKER_IDENTITY.workerId,
      reportVersion: TEMPLATE_BUILDER_REPORT_VERSION,
      traceabilityRefs: unique([
        `templateProduct:${templateProductId}`,
        `product:${productId}`,
        `business:${businessId}`,
        `mission:${factoryMissionId}`,
        ...(context.researchReportId ? [`research:${context.researchReportId}`] : []),
        `type:${productType}`,
      ]),
      preservedDecisions: [
        {
          decisionId: `tbw-dec-${templateSequence}-shell`,
          topic: productTitle,
          decision:
            "Materialized fresh template product shell from approved research — no sales/publish/delivery",
          recordedAt: now,
        },
      ],
      submittedToExecutiveReporting: false,
      executiveReportId: null,
      neverBuildSalesPages: true,
      neverProcessPayments: true,
      neverDeliverProductsToCustomers: true,
      neverPublishProductsDirectly: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverImplementQ507OrLater: true,
      followApprovedProductResearch: true,
      followApprovedProductIntent: true,
      produceOriginalReusableAssets: true,
      preserveCompleteTraceability: true,
      validateUsabilityBeforeSubmission: true,
      performSelfReview: true,
      preserveAuditHistory: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
    };
  }

  generateReusableTemplates(
    context: TemplateContext,
    assetCount: number,
  ): ReusableTemplateAsset[] {
    const title = this.resolveTitle(context);
    const audience = context.targetAudience?.trim() || "operators";
    const pain =
      context.customerPainPoints?.[0] ??
      "fragmented reusable assets and inconsistent operating docs";
    const templates: ReusableTemplateAsset[] = [];
    for (let i = 1; i <= assetCount; i++) {
      const templateType = this.templateTypeForIndex(i, context.productType);
      const assetTitle = `${title} — ${this.humanizeCategory(templateType)} ${i}`;
      const sections = [
        {
          heading: "Purpose",
          content: `Reusable ${templateType} asset for ${audience} aligned to ${title}.`,
        },
        {
          heading: "How to use",
          content: `Copy this template, replace bracketed fields, and adapt sections to the operator workflow addressing ${pain}.`,
        },
        {
          heading: "Fields",
          content:
            "[Owner] [Date] [Objective] [Constraints] [Success criteria] [Next review date]",
        },
        {
          heading: "Notes",
          content: context.researchReportId
            ? `Follows approved research ${context.researchReportId}. Structural signal only — not a sales or delivery channel.`
            : `Follows approved product intent for ${title}. Structural signal only.`,
        },
      ];
      templates.push({
        assetId: `tbw-asset-tpl-${templateSequence || 1}-${i}`,
        title: assetTitle,
        templateType,
        description: `Original reusable ${templateType} template for ${audience}.`,
        body: sections.map((s) => `## ${s.heading}\n\n${s.content}`).join("\n\n"),
        sections,
      });
    }
    return templates;
  }

  generatePlanners(context: TemplateContext, assetCount: number): TemplatePlanner[] {
    const title = this.resolveTitle(context);
    const weeksCount = Math.min(4, Math.max(2, assetCount));
    const weeks = Array.from({ length: weeksCount }, (_, index) => {
      const weekNumber = index + 1;
      return {
        weekNumber,
        theme: weekNumber === 1 ? `Kickoff — ${title}` : `Execution week ${weekNumber}`,
        tasks: [
          {
            taskId: `tbw-task-${templateSequence || 1}-w${weekNumber}-1`,
            title: `Define week ${weekNumber} outcomes for ${title}`,
            description: `Clarify deliverables and owners for week ${weekNumber}.`,
            dueOffsetDays: weekNumber * 7 - 5,
          },
          {
            taskId: `tbw-task-${templateSequence || 1}-w${weekNumber}-2`,
            title: `Complete reusable asset checkpoints`,
            description: "Validate completeness of templates and planners for this week.",
            dueOffsetDays: weekNumber * 7 - 2,
          },
          {
            taskId: `tbw-task-${templateSequence || 1}-w${weekNumber}-3`,
            title: `Review and capture improvements`,
            description: "Log findings without publishing or delivering products.",
            dueOffsetDays: weekNumber * 7,
          },
        ],
      };
    });
    return [
      {
        assetId: `tbw-asset-pln-${templateSequence || 1}`,
        title: `${title} Project Planner`,
        description: `Week-by-week planner for executing ${title} reusable assets.`,
        weeks,
      },
    ];
  }

  generateSpreadsheets(
    context: TemplateContext,
    assetCount: number,
  ): TemplateSpreadsheet[] {
    const title = this.resolveTitle(context);
    const sheets: TemplateSpreadsheet[] = [
      {
        assetId: `tbw-asset-xls-${templateSequence || 1}-tracker`,
        title: `${title} Asset Tracker`,
        description: "Track reusable template assets through creation and review.",
        columns: ["Asset", "Owner", "Status", "Priority", "ReviewDate", "Notes"],
        rows: Array.from({ length: Math.max(3, assetCount) }, (_, i) => ({
          Asset: `${title} asset ${i + 1}`,
          Owner: "Operator",
          Status: i === 0 ? "draft" : "ready_for_review",
          Priority: i < 2 ? "high" : "medium",
          ReviewDate: `Day ${(i + 1) * 3}`,
          Notes: "Structural spreadsheet schema only",
        })),
      },
    ];
    if (assetCount >= 3) {
      sheets.push({
        assetId: `tbw-asset-xls-${templateSequence || 1}-budget`,
        title: `${title} Lightweight Budget Sheet`,
        description: "Simple financial planning columns for template product operations.",
        columns: ["Category", "Planned", "Actual", "Variance", "Notes"],
        rows: [
          { Category: "Research", Planned: 500, Actual: 0, Variance: 500, Notes: "Placeholder" },
          { Category: "Creation", Planned: 1200, Actual: 0, Variance: 1200, Notes: "Placeholder" },
          { Category: "Review", Planned: 300, Actual: 0, Variance: 300, Notes: "Placeholder" },
        ],
      });
    }
    return sheets;
  }

  generateContractsAndDocumentTemplates(context: TemplateContext): TemplateContract[] {
    const title = this.resolveTitle(context);
    return [
      {
        assetId: `tbw-asset-ctr-${templateSequence || 1}`,
        title: `${title} Service Agreement Outline`,
        description: `Document template outline for ${title} engagements (not a live contract).`,
        clauses: [
          {
            clauseId: `tbw-clause-${templateSequence || 1}-1`,
            title: "Parties",
            body: "[Provider Name] and [Client Name] enter this outline for reusable template delivery scope only.",
          },
          {
            clauseId: `tbw-clause-${templateSequence || 1}-2`,
            title: "Scope of Work",
            body: `Provider prepares reusable assets related to ${title}. No payment processing or customer product delivery occurs in this outline.`,
          },
          {
            clauseId: `tbw-clause-${templateSequence || 1}-3`,
            title: "Deliverables",
            body: "Export-ready structural packages (markdown/csv/xlsx/docx/zip readiness signals).",
          },
          {
            clauseId: `tbw-clause-${templateSequence || 1}-4`,
            title: "Acceptance",
            body: "Acceptance is based on usability and completeness review, not publication or live fulfillment.",
          },
          {
            clauseId: `tbw-clause-${templateSequence || 1}-5`,
            title: "Limitations",
            body: "This document is a template outline. It does not publish products, process payments, or override governance.",
          },
        ],
      },
    ];
  }

  generateBusinessFormsAndChecklists(context: TemplateContext): {
    forms: TemplateForm[];
    checklists: TemplateChecklist[];
  } {
    const title = this.resolveTitle(context);
    const forms: TemplateForm[] = [
      {
        assetId: `tbw-asset-frm-${templateSequence || 1}`,
        title: `${title} Intake Form`,
        description: "Business intake form for capturing reusable template requirements.",
        fields: [
          {
            fieldId: `tbw-field-${templateSequence || 1}-1`,
            label: "Requester name",
            fieldType: "text",
            required: true,
          },
          {
            fieldId: `tbw-field-${templateSequence || 1}-2`,
            label: "Business objective",
            fieldType: "textarea",
            required: true,
            helperText: "Describe the operating outcome this template pack should support",
          },
          {
            fieldId: `tbw-field-${templateSequence || 1}-3`,
            label: "Preferred asset types",
            fieldType: "multiselect",
            required: false,
          },
          {
            fieldId: `tbw-field-${templateSequence || 1}-4`,
            label: "Deadline",
            fieldType: "date",
            required: false,
          },
        ],
      },
    ];
    const checklists: TemplateChecklist[] = [
      {
        assetId: `tbw-asset-chk-${templateSequence || 1}`,
        title: `${title} Completeness Checklist`,
        description: "Checklist to confirm reusable pack usability before submission.",
        items: [
          {
            itemId: `tbw-item-${templateSequence || 1}-1`,
            label: "Reusable templates include body sections",
            completedDefault: false,
          },
          {
            itemId: `tbw-item-${templateSequence || 1}-2`,
            label: "Planner weeks and tasks are present",
            completedDefault: false,
          },
          {
            itemId: `tbw-item-${templateSequence || 1}-3`,
            label: "Spreadsheet columns and sample rows exist",
            completedDefault: false,
          },
          {
            itemId: `tbw-item-${templateSequence || 1}-4`,
            label: "Contract outline clauses are complete",
            completedDefault: false,
          },
          {
            itemId: `tbw-item-${templateSequence || 1}-5`,
            label: "Forms, checklists, and prompt library are included",
            completedDefault: false,
          },
          {
            itemId: `tbw-item-${templateSequence || 1}-6`,
            label: "No sales, payment, publish, or delivery boundaries crossed",
            completedDefault: false,
          },
        ],
      },
    ];
    return { forms, checklists };
  }

  generateReusablePromptLibraries(context: TemplateContext): PromptLibraryEntry[] {
    const title = this.resolveTitle(context);
    const audience = context.targetAudience?.trim() || "operators";
    const pain =
      context.customerPainPoints?.[0] ?? "inconsistent reusable documentation";
    return [
      {
        promptId: `tbw-prompt-${templateSequence || 1}-1`,
        title: `${title} Outline Prompt`,
        category: "structure",
        prompt: `Create a reusable template outline for ${title} targeted at ${audience}. Address ${pain}. Include Purpose, How to use, Fields, and Notes sections.`,
        usageNotes: "Use for drafting new reusable assets; do not generate sales copy.",
      },
      {
        promptId: `tbw-prompt-${templateSequence || 1}-2`,
        title: `${title} Planner Prompt`,
        category: "planning",
        prompt: `Draft a 4-week planner for implementing ${title}. Each week needs a theme and three concrete tasks with owners left as placeholders.`,
        usageNotes: "Supports planner generation stage only.",
      },
      {
        promptId: `tbw-prompt-${templateSequence || 1}-3`,
        title: `${title} Checklist Prompt`,
        category: "qa",
        prompt: `Produce a usability checklist for a reusable template pack named ${title}. Focus on completeness, clarity, and governance boundaries.`,
        usageNotes: "Supports self-review and usability validation.",
      },
      {
        promptId: `tbw-prompt-${templateSequence || 1}-4`,
        title: `${title} Spreadsheet Schema Prompt`,
        category: "data",
        prompt: `Design a spreadsheet schema for tracking ${title} assets with columns for Asset, Owner, Status, Priority, ReviewDate, and Notes. Provide three sample rows.`,
        usageNotes: "Structural schema only — not a live workbook publish.",
      },
    ];
  }

  prepareExportFormats(): ExportFormat[] {
    return [...EXPORT_FORMATS];
  }

  prepareSupportedFormats(): SupportedAssetFormat[] {
    return [...SUPPORTED_ASSET_FORMATS];
  }

  validateUsabilityAndCompleteness(
    product: Pick<
      TemplateBuilderReport,
      | "productTitle"
      | "templates"
      | "planners"
      | "spreadsheets"
      | "contracts"
      | "forms"
      | "checklists"
      | "promptLibrary"
      | "templateTypes"
      | "includedAssets"
      | "exportFormats"
      | "supportedFormats"
      | "researchReportId"
    >,
    context: TemplateContext,
  ): SelfReviewResult {
    const findings: SelfReviewFinding[] = [];
    let score = 70;
    if (!product.templates.length) {
      findings.push({
        findingId: `tbw-f-${templateSequence}-templates`,
        category: "content",
        severity: "error",
        message: "No reusable templates present",
      });
      score -= 20;
    } else {
      score += 8;
    }
    if (!product.planners.length) {
      findings.push({
        findingId: `tbw-f-${templateSequence}-planners`,
        category: "planners",
        severity: "warning",
        message: "Planners not yet included",
      });
      score -= 5;
    } else {
      score += 5;
    }
    if (!product.spreadsheets.length) {
      findings.push({
        findingId: `tbw-f-${templateSequence}-spreadsheets`,
        category: "spreadsheets",
        severity: "warning",
        message: "Spreadsheets not yet included",
      });
      score -= 5;
    } else {
      score += 5;
    }
    if (!product.contracts.length) {
      findings.push({
        findingId: `tbw-f-${templateSequence}-contracts`,
        category: "contracts",
        severity: "warning",
        message: "Contracts/document templates not yet included",
      });
      score -= 4;
    } else {
      score += 4;
    }
    if (!product.forms.length && !product.checklists.length) {
      findings.push({
        findingId: `tbw-f-${templateSequence}-forms`,
        category: "forms",
        severity: "warning",
        message: "Forms and checklists not yet included",
      });
      score -= 4;
    } else {
      score += 4;
    }
    if (!product.promptLibrary.length) {
      findings.push({
        findingId: `tbw-f-${templateSequence}-prompts`,
        category: "prompts",
        severity: "warning",
        message: "Prompt library not yet included",
      });
      score -= 4;
    } else {
      score += 4;
    }
    if (!product.exportFormats.length || !product.supportedFormats.length) {
      findings.push({
        findingId: `tbw-f-${templateSequence}-export`,
        category: "export",
        severity: "warning",
        message: "Export/supported formats incomplete",
      });
      score -= 4;
    } else {
      score += 4;
    }
    if (!product.researchReportId && !context.researchReportId) {
      findings.push({
        findingId: `tbw-f-${templateSequence}-research`,
        category: "research_compliance",
        severity: "warning",
        message: "No researchReportId bound; intent derived from available context",
      });
      score -= 4;
    } else {
      score += 6;
    }

    const confidenceScore = clamp(score, 0, 100);
    const passed =
      findings.every((f) => f.severity !== "error") && product.templates.length > 0;
    const usabilityValidated = passed;
    const researchCompliance =
      product.researchReportId || context.researchReportId
        ? passed
          ? ("compliant" as const)
          : ("partial" as const)
        : ("partial" as const);
    const summary = passed
      ? `Usability validated for '${product.productTitle}' with confidence ${confidenceScore}/100. Templates, planners, spreadsheets, contracts, forms/checklists, and prompt libraries are export-ready as structural signals only.`
      : `Usability incomplete for '${product.productTitle}' (confidence ${confidenceScore}/100). Resolve findings before executive submission.`;
    const qualityReview = passed
      ? `Quality review: original reusable assets present (templates=${product.templates.length}, planners=${product.planners.length}, spreadsheets=${product.spreadsheets.length}, contracts=${product.contracts.length}, forms=${product.forms.length}, checklists=${product.checklists.length}, prompts=${product.promptLibrary.length}); usabilityValidated=${usabilityValidated}; researchCompliance=${researchCompliance}.`
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
          ? "Template pack follows approved digital product research intent"
          : "Template pack partially aligned to available research/product intent signals",
      usabilityValidated,
    };
  }

  buildTemplateProduct(
    input: TemplateBuilderWorkerInput,
    config: TemplateBuilderWorkerConfiguration,
    context: TemplateContext,
  ): TemplateBuilderReport {
    templateSequence += 1;
    const now = new Date().toISOString();
    const assetCount = clamp(input.assetCount ?? config.defaultAssetCount ?? 4, 2, 10);
    const productType = this.normalizeProductType(
      input.productType ?? context.productType ?? config.defaultProductType,
    );
    const productTitle = this.resolveTitle(context, input);
    const templateProductId =
      input.templateProductId?.trim() || `tbw-tpl-${Date.now()}-${templateSequence}`;
    const productId = input.productId?.trim() || `tbw-prd-${Date.now()}-${templateSequence}`;
    const businessId =
      input.businessId?.trim() || context.businessId?.trim() || `dbiz-tbw-${templateSequence}`;
    const factoryMissionId =
      input.factoryMissionId?.trim() ||
      context.factoryMissionId?.trim() ||
      `dpf-tbw-${templateSequence}`;
    const targetAudience =
      input.targetAudience?.trim() ||
      context.targetAudience?.trim() ||
      "Operators seeking reusable template packs";
    const productCategory =
      input.productCategory?.trim() || this.humanizeCategory(productType);

    const templates = this.generateReusableTemplates(context, assetCount);
    const planners = this.generatePlanners(context, assetCount);
    const spreadsheets = this.generateSpreadsheets(context, assetCount);
    const contracts = this.generateContractsAndDocumentTemplates(context);
    const { forms, checklists } = this.generateBusinessFormsAndChecklists(context);
    const promptLibrary = this.generateReusablePromptLibraries(context);
    const exportFormats = this.prepareExportFormats();
    const supportedFormats = this.prepareSupportedFormats();
    const templateTypes = unique(templates.map((t) => t.templateType));
    const includedAssets = [
      ...templates.map((t) => t.assetId),
      ...planners.map((p) => p.assetId),
      ...spreadsheets.map((s) => s.assetId),
      ...contracts.map((c) => c.assetId),
      ...forms.map((f) => f.assetId),
      ...checklists.map((c) => c.assetId),
      ...promptLibrary.map((p) => p.promptId),
    ];
    const draftForReview = {
      productTitle,
      templates,
      planners,
      spreadsheets,
      contracts,
      forms,
      checklists,
      promptLibrary,
      templateTypes,
      includedAssets,
      exportFormats,
      supportedFormats,
      researchReportId: context.researchReportId ?? input.researchReportId ?? null,
    };
    const review = this.validateUsabilityAndCompleteness(draftForReview, context);
    const confidenceScore =
      input.confidenceScore != null && Number.isFinite(input.confidenceScore)
        ? clamp(input.confidenceScore, 0, 100)
        : review.confidenceScore;

    const traceabilityRefs = unique([
      `templateProduct:${templateProductId}`,
      `product:${productId}`,
      `business:${businessId}`,
      `mission:${factoryMissionId}`,
      ...(context.researchReportId ? [`research:${context.researchReportId}`] : []),
      ...(context.opportunityId ? [`opportunity:${context.opportunityId}`] : []),
      `type:${productType}`,
    ]);
    const preservedDecisions = [
      {
        decisionId: `tbw-dec-${templateSequence}-pack`,
        topic: productTitle,
        decision: `Built reusable template pack (${assetCount} core templates) for ${productType} — assets only, no sales/publish/delivery`,
        recordedAt: now,
      },
      {
        decisionId: `tbw-dec-${templateSequence}-export`,
        topic: productTitle,
        decision: `Prepared structural export signals (${exportFormats.join(", ")}) without publishing or delivering products`,
        recordedAt: now,
      },
    ];

    return {
      templateProductId,
      timestamp: now,
      productId,
      productTitle,
      productCategory,
      templateTypes,
      includedAssets,
      targetAudience,
      supportedFormats,
      qualityReview: review.qualityReview,
      exportFormats,
      confidenceScore,
      metadataVersion: TBW_METADATA_VERSION,
      researchReportId: context.researchReportId ?? input.researchReportId ?? null,
      opportunityId: context.opportunityId ?? input.opportunityId ?? null,
      businessId,
      factoryMissionId,
      productType,
      templates,
      planners,
      spreadsheets,
      contracts,
      forms,
      checklists,
      promptLibrary,
      usabilityValidated: review.usabilityValidated,
      selfReviewPassed: review.passed,
      selfReviewFindings: review.findings,
      selfReviewSummary: review.summary,
      researchCompliance: review.researchCompliance,
      researchComplianceNotes: review.researchComplianceNotes,
      workerId: config.workerId || TEMPLATE_BUILDER_WORKER_IDENTITY.workerId,
      reportVersion: TEMPLATE_BUILDER_REPORT_VERSION,
      traceabilityRefs,
      preservedDecisions,
      submittedToExecutiveReporting: false,
      executiveReportId: null,
      neverBuildSalesPages: true,
      neverProcessPayments: true,
      neverDeliverProductsToCustomers: true,
      neverPublishProductsDirectly: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverImplementQ507OrLater: true,
      followApprovedProductResearch: true,
      followApprovedProductIntent: true,
      produceOriginalReusableAssets: true,
      preserveCompleteTraceability: true,
      validateUsabilityBeforeSubmission: true,
      performSelfReview: true,
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
    const lower = raw.toLowerCase();
    switch (lower) {
      case "business":
      case "business_template":
      case "ops_templates":
        return "business_templates";
      case "spreadsheet":
      case "spreadsheets":
      case "xlsx":
      case "excel":
        return "spreadsheet_templates";
      case "financial":
      case "finance":
      case "budget":
        return "financial_templates";
      case "planner":
      case "project_planner":
      case "roadmap":
        return "project_planners";
      case "calendar":
      case "schedule":
        return "calendars";
      case "contract":
      case "agreement":
      case "legal":
        return "contracts";
      case "checklist":
      case "todo":
        return "checklists";
      case "sop":
      case "standard_operating_procedure":
      case "playbook":
        return "sop_templates";
      case "form":
      case "intake_form":
        return "forms";
      case "prompt":
      case "prompt_pack":
      case "prompt_library":
        return "prompt_templates";
      case "ebook":
      case "course":
      case "guide":
        return "business_templates";
      default:
        return raw ? "unknown" : "business_templates";
    }
  }

  humanizeCategory(productType: ProductType | string): string {
    return String(productType)
      .split("_")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }

  private resolveTitle(context: TemplateContext, input?: TemplateBuilderWorkerInput): string {
    return (
      input?.productTitle?.trim() ||
      context.productTitle?.trim() ||
      context.researchTopic?.trim() ||
      "Reusable Template Pack"
    );
  }

  private templateTypeForIndex(index: number, productType?: ProductType | null): string {
    const cycle = [
      productType && productType !== "unknown" ? productType : "business_templates",
      "sop_templates",
      "checklists",
      "forms",
      "project_planners",
      "prompt_templates",
    ];
    return cycle[(index - 1) % cycle.length]!;
  }
}

let templateSequence = 0;

export function resetTemplateSequenceForTesting() {
  templateSequence = 0;
}

function cloneProduct(product: TemplateBuilderReport): TemplateBuilderReport {
  return {
    ...product,
    templateTypes: [...product.templateTypes],
    includedAssets: [...product.includedAssets],
    supportedFormats: [...product.supportedFormats],
    exportFormats: [...product.exportFormats],
    templates: product.templates.map((t) => ({
      ...t,
      sections: t.sections ? t.sections.map((s) => ({ ...s })) : undefined,
    })),
    planners: product.planners.map((p) => ({
      ...p,
      weeks: p.weeks.map((w) => ({
        ...w,
        tasks: w.tasks.map((task) => ({ ...task })),
      })),
    })),
    spreadsheets: product.spreadsheets.map((s) => ({
      ...s,
      columns: [...s.columns],
      rows: s.rows.map((r) => ({ ...r })),
    })),
    contracts: product.contracts.map((c) => ({
      ...c,
      clauses: c.clauses.map((clause) => ({ ...clause })),
    })),
    forms: product.forms.map((f) => ({
      ...f,
      fields: f.fields.map((field) => ({ ...field })),
    })),
    checklists: product.checklists.map((c) => ({
      ...c,
      items: c.items.map((item) => ({ ...item })),
    })),
    promptLibrary: product.promptLibrary.map((p) => ({ ...p })),
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
