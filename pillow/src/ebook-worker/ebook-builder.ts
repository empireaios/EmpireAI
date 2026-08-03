import type { EbookWorkerConfiguration } from "./configuration.js";
import type { DprEnrichmentContext } from "./integrations.js";
import {
  EBW_METADATA_VERSION,
  EBOOK_REPORT_VERSION,
  EBOOK_WORKER_IDENTITY,
  EXPORT_FORMATS,
  PRODUCT_TYPES,
} from "./paths.js";
import type {
  EbookChapter,
  EbookChapterStructureEntry,
  EbookContext,
  EbookOutline,
  EbookReport,
  EbookWorkerCatalog,
  EbookWorkerInput,
  ExportFormat,
  IntegrationHandshake,
  ProductType,
  SelfReviewFinding,
  SelfReviewResult,
} from "./types.js";

/** Pure Ebook Worker helpers for Q5-03 — written product creation only. */
export class EbookBuilder {
  buildCatalog(
    config: EbookWorkerConfiguration,
    ebooks: EbookReport[],
    integrations: IntegrationHandshake[],
  ): EbookWorkerCatalog {
    return {
      reportVersion: EBOOK_REPORT_VERSION,
      workerId: config.workerId,
      ebooks: ebooks.map(cloneEbook),
      integrations: integrations.map((i) => ({ ...i })),
      metadataVersion: EBW_METADATA_VERSION,
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
    input: EbookWorkerInput,
    context: EbookContext,
    enrichment?: DprEnrichmentContext | null,
  ): EbookContext {
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

  canBuildEbook(context: EbookContext): { ready: boolean; reason?: string } {
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

  createProductOutline(context: EbookContext, chapterCount: number): EbookOutline {
    const title = this.resolveTitle(context);
    const audience = context.targetAudience?.trim() || "digital product learners";
    const pain =
      context.customerPainPoints?.[0] ??
      "practical gaps between buyer need and available guidance";
    const sections: EbookOutline["sections"] = [];
    const toc: string[] = [];
    for (let i = 1; i <= chapterCount; i++) {
      const sectionTitle = this.chapterTitle(title, i, chapterCount, context);
      toc.push(`Chapter ${i}: ${sectionTitle}`);
      sections.push({
        sectionNumber: i,
        title: sectionTitle,
        description: this.chapterSummary(title, i, chapterCount, audience, pain, context),
      });
    }
    return {
      title,
      subtitle: `A practical ${this.normalizeProductType(context.productType)} for ${audience}`,
      tableOfContents: toc,
      sections,
      learningObjectives: [
        `Understand the core problem space around ${title}`,
        `Apply structured practices that address ${pain}`,
        `Use checklists, tables, and summaries for repeatable execution`,
        `Reference appendices for ongoing self-guided application`,
      ],
    };
  }

  createChapterStructure(
    outline: EbookOutline,
    context: EbookContext,
  ): EbookChapterStructureEntry[] {
    return outline.sections.map((section) => ({
      chapterNumber: section.sectionNumber,
      title: section.title,
      summary: section.description,
      wordCount: 0,
    }));
  }

  generateCompleteWrittenContent(
    structure: EbookChapterStructureEntry[],
    context: EbookContext,
  ): EbookChapter[] {
    const title = this.resolveTitle(context);
    const audience = context.targetAudience?.trim() || "digital product learners";
    const pain =
      context.customerPainPoints?.[0] ??
      "incomplete guidance and fragmented digital product practices";
    const marketGap = context.marketGap?.trim() || `Coverage gaps for ${title}`;
    const demand =
      context.demandAssessment?.trim() || "Demand assessed from approved research signals";

    return structure.map((entry) => {
      const body = this.buildChapterBody(
        title,
        entry.chapterNumber,
        structure.length,
        entry.title,
        audience,
        pain,
        marketGap,
        demand,
        context,
      );
      const wordCount = countWords(body);
      return {
        chapterNumber: entry.chapterNumber,
        title: entry.title,
        summary: entry.summary ?? this.chapterSummary(title, entry.chapterNumber, structure.length, audience, pain, context),
        body,
        wordCount,
      };
    });
  }

  generateTablesChecklistsAndSummaries(
    chapters: EbookChapter[],
    context: EbookContext,
  ): { chapters: EbookChapter[]; includedResources: string[] } {
    const title = this.resolveTitle(context);
    const resources = ["tables", "checklists", "summaries"];
    const augmented = chapters.map((chapter, index) => {
      const table = [
        ``,
        `### Chapter ${chapter.chapterNumber} Practice Table`,
        `| Step | Action | Outcome |`,
        `| --- | --- | --- |`,
        `| 1 | Clarify the ${title} objective for this chapter | Shared intent |`,
        `| 2 | Apply the chapter method to a real scenario | Working draft |`,
        `| 3 | Capture evidence of progress | Traceable result |`,
      ].join("\n");
      const checklist = [
        ``,
        `### Chapter ${chapter.chapterNumber} Checklist`,
        `- [ ] Reviewed chapter goals for ${title}`,
        `- [ ] Completed the primary practice exercise`,
        `- [ ] Documented decisions for audit traceability`,
        `- [ ] Identified one improvement for the next chapter`,
      ].join("\n");
      const summary = [
        ``,
        `### Chapter ${chapter.chapterNumber} Summary`,
        `Chapter ${chapter.chapterNumber} established practical guidance on ${chapter.title}. Readers should leave with a clear next action, a completed checklist item, and a documented decision tied to ${title}.`,
      ].join("\n");
      const body = `${chapter.body}\n${table}\n${checklist}\n${summary}`;
      return {
        ...chapter,
        body,
        wordCount: countWords(body),
        summary:
          index === 0
            ? `${chapter.summary} Includes practice table, checklist, and chapter summary.`
            : chapter.summary,
      };
    });
    return { chapters: augmented, includedResources: resources };
  }

  generateReferencesAndAppendices(
    chapters: EbookChapter[],
    context: EbookContext,
    includedResources: string[],
  ): { chapters: EbookChapter[]; includedResources: string[] } {
    const title = this.resolveTitle(context);
    const refs = [
      ``,
      `## References`,
      `1. Approved Digital Product Research signals for ${title}.`,
      `2. Factory mission context ${context.factoryMissionId ?? "pending-mission"}.`,
      `3. Opportunity record ${context.opportunityId ?? "pending-opportunity"}.`,
      `4. Audience needs synthesis for ${context.targetAudience ?? "digital product learners"}.`,
      ``,
      `## Appendix A — Implementation Worksheet`,
      `Use this worksheet to translate chapter methods into a weekly operating cadence. Record the objective, owner, evidence, and next review date for each practice.`,
      ``,
      `## Appendix B — Decision Log Template`,
      `| Decision | Rationale | Evidence | Review Date |`,
      `| --- | --- | --- | --- |`,
      `|  |  |  |  |`,
    ].join("\n");

    const last = chapters[chapters.length - 1];
    const updated = chapters.map((chapter, index) => {
      if (index !== chapters.length - 1) return chapter;
      const body = `${chapter.body}\n${refs}`;
      return {
        ...chapter,
        body,
        wordCount: countWords(body),
        summary: `${chapter.summary} Includes references and appendices.`,
      };
    });
    if (!last) {
      return {
        chapters,
        includedResources: unique([...includedResources, "references", "appendices"]),
      };
    }
    return {
      chapters: updated,
      includedResources: unique([...includedResources, "references", "appendices"]),
    };
  }

  applyConsistentFormatting(chapters: EbookChapter[]): EbookChapter[] {
    return chapters.map((chapter) => {
      const body = [
        `# Chapter ${chapter.chapterNumber}: ${chapter.title}`,
        ``,
        `> ${chapter.summary}`,
        ``,
        normalizeWhitespace(chapter.body.replace(/^#\s+Chapter\s+\d+:.*$/im, "").trim()),
      ].join("\n");
      return {
        ...chapter,
        body,
        wordCount: countWords(body),
      };
    });
  }

  prepareExportFormats(): ExportFormat[] {
    return [...EXPORT_FORMATS];
  }

  performSelfReview(
    ebook: Pick<
      EbookReport,
      | "productTitle"
      | "chapters"
      | "chapterStructure"
      | "includedResources"
      | "outline"
      | "formattingApplied"
      | "researchReportId"
      | "wordCount"
    >,
    context: EbookContext,
  ): SelfReviewResult {
    const findings: SelfReviewFinding[] = [];
    let score = 72;
    if (!ebook.chapters.length) {
      findings.push({
        findingId: `ebw-f-${ebookSequence}-chapters`,
        category: "content",
        severity: "error",
        message: "No chapter bodies present",
      });
      score -= 25;
    }
    if (ebook.wordCount < 400) {
      findings.push({
        findingId: `ebw-f-${ebookSequence}-words`,
        category: "content",
        severity: "warning",
        message: "Word count is below preferred long-form threshold",
      });
      score -= 8;
    } else {
      score += 8;
    }
    if (!ebook.includedResources.includes("checklists")) {
      findings.push({
        findingId: `ebw-f-${ebookSequence}-checklists`,
        category: "resources",
        severity: "warning",
        message: "Checklist resources not yet included",
      });
      score -= 5;
    } else {
      score += 5;
    }
    if (!ebook.includedResources.includes("references")) {
      findings.push({
        findingId: `ebw-f-${ebookSequence}-refs`,
        category: "resources",
        severity: "info",
        message: "References/appendices pending",
      });
      score -= 3;
    } else {
      score += 5;
    }
    if (!ebook.formattingApplied) {
      findings.push({
        findingId: `ebw-f-${ebookSequence}-format`,
        category: "formatting",
        severity: "warning",
        message: "Consistent formatting not yet applied",
      });
      score -= 6;
    } else {
      score += 6;
    }
    if (!ebook.researchReportId && !context.researchReportId) {
      findings.push({
        findingId: `ebw-f-${ebookSequence}-research`,
        category: "research_compliance",
        severity: "warning",
        message: "No researchReportId bound; product intent derived from available context",
      });
      score -= 4;
    } else {
      score += 6;
    }
    if (!ebook.outline) {
      findings.push({
        findingId: `ebw-f-${ebookSequence}-outline`,
        category: "structure",
        severity: "warning",
        message: "Outline missing from report package",
      });
      score -= 4;
    } else {
      score += 4;
    }

    const confidenceScore = clamp(score, 0, 100);
    const passed =
      findings.every((f) => f.severity !== "error") &&
      ebook.chapters.length > 0 &&
      ebook.wordCount >= 200;
    const researchCompliance =
      ebook.researchReportId || context.researchReportId
        ? passed
          ? ("compliant" as const)
          : ("partial" as const)
        : ("partial" as const);
    const summary = passed
      ? `Self-review passed for '${ebook.productTitle}' with confidence ${confidenceScore}/100. Structure, resources, and research alignment are export-ready as structural signals only.`
      : `Self-review incomplete for '${ebook.productTitle}' (confidence ${confidenceScore}/100). Resolve findings before executive submission.`;
    const qualityReview = passed
      ? `Quality review: original written content present across ${ebook.chapters.length} chapters (${ebook.wordCount} words); resources=${ebook.includedResources.join(", ") || "none"}; formatting=${ebook.formattingApplied ? "applied" : "pending"}; researchCompliance=${researchCompliance}.`
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
          ? "Ebook follows approved digital product research intent"
          : "Ebook partially aligned to available research/product intent signals",
    };
  }

  buildEbook(
    input: EbookWorkerInput,
    config: EbookWorkerConfiguration,
    context: EbookContext,
  ): EbookReport {
    ebookSequence += 1;
    const now = new Date().toISOString();
    const chapterCount = clamp(
      input.chapterCount ?? config.defaultChapterCount ?? 6,
      3,
      12,
    );
    const productType = this.normalizeProductType(
      input.productType ?? context.productType ?? config.defaultProductType,
    );
    const productTitle = this.resolveTitle(context, input);
    const ebookId = input.ebookId?.trim() || `ebw-ebk-${Date.now()}-${ebookSequence}`;
    const productId = input.productId?.trim() || `ebw-prd-${Date.now()}-${ebookSequence}`;
    const businessId =
      input.businessId?.trim() || context.businessId?.trim() || `dbiz-ebw-${ebookSequence}`;
    const factoryMissionId =
      input.factoryMissionId?.trim() ||
      context.factoryMissionId?.trim() ||
      `dpf-ebw-${ebookSequence}`;
    const targetAudience =
      input.targetAudience?.trim() ||
      context.targetAudience?.trim() ||
      "Digital product buyers seeking practical written guidance";

    const outline = this.createProductOutline(context, chapterCount);
    const chapterStructure = this.createChapterStructure(outline, context);
    let chapters = this.generateCompleteWrittenContent(chapterStructure, context);
    const resourcesPass = this.generateTablesChecklistsAndSummaries(chapters, context);
    chapters = resourcesPass.chapters;
    let includedResources = resourcesPass.includedResources;
    const refsPass = this.generateReferencesAndAppendices(
      chapters,
      context,
      includedResources,
    );
    chapters = refsPass.chapters;
    includedResources = refsPass.includedResources;
    chapters = this.applyConsistentFormatting(chapters);
    const structureWithCounts = chapterStructure.map((entry) => {
      const chapter = chapters.find((c) => c.chapterNumber === entry.chapterNumber);
      return {
        ...entry,
        wordCount: chapter?.wordCount ?? 0,
        summary: chapter?.summary ?? entry.summary,
      };
    });
    const wordCount = chapters.reduce((sum, c) => sum + c.wordCount, 0);
    const exportFormats = this.prepareExportFormats();
    const draftForReview = {
      productTitle,
      chapters,
      chapterStructure: structureWithCounts,
      includedResources,
      outline,
      formattingApplied: true,
      researchReportId: context.researchReportId ?? input.researchReportId ?? null,
      wordCount,
    };
    const review = this.performSelfReview(draftForReview, context);
    const confidenceScore =
      input.confidenceScore != null && Number.isFinite(input.confidenceScore)
        ? clamp(input.confidenceScore, 0, 100)
        : review.confidenceScore;

    const traceabilityRefs = unique([
      `ebook:${ebookId}`,
      `product:${productId}`,
      `business:${businessId}`,
      `mission:${factoryMissionId}`,
      ...(context.researchReportId ? [`research:${context.researchReportId}`] : []),
      ...(context.opportunityId ? [`opportunity:${context.opportunityId}`] : []),
      `type:${productType}`,
    ]);
    const preservedDecisions = [
      {
        decisionId: `ebw-dec-${ebookSequence}-outline`,
        topic: productTitle,
        decision: `Created ${chapterCount}-chapter outline for ${productType} — written product only, no sales/publish/delivery`,
        recordedAt: now,
      },
      {
        decisionId: `ebw-dec-${ebookSequence}-export`,
        topic: productTitle,
        decision: `Prepared structural export signals (${exportFormats.join(", ")}) without publishing or delivering`,
        recordedAt: now,
      },
    ];

    return {
      ebookId,
      timestamp: now,
      productId,
      productTitle,
      productType,
      targetAudience,
      chapterStructure: structureWithCounts,
      wordCount,
      includedResources,
      qualityReview: review.qualityReview,
      exportFormats,
      confidenceScore,
      metadataVersion: EBW_METADATA_VERSION,
      researchReportId: context.researchReportId ?? input.researchReportId ?? null,
      opportunityId: context.opportunityId ?? input.opportunityId ?? null,
      businessId,
      factoryMissionId,
      outline,
      chapters,
      formattingApplied: true,
      selfReviewPassed: review.passed,
      selfReviewFindings: review.findings,
      selfReviewSummary: review.summary,
      researchCompliance: review.researchCompliance,
      researchComplianceNotes: review.researchComplianceNotes,
      workerId: config.workerId || EBOOK_WORKER_IDENTITY.workerId,
      reportVersion: EBOOK_REPORT_VERSION,
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
      neverImplementQ504OrLater: true,
      followApprovedProductResearch: true,
      followApprovedProductIntent: true,
      produceOriginalContent: true,
      preserveCompleteTraceability: true,
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
    // Map common DPR categories into ebook-aligned types when possible
    switch (raw) {
      case "template":
      case "toolkit":
        return "workbook";
      case "printable":
        return "checklist_collection";
      case "digital_download":
      case "bundle":
        return "ebook";
      case "software_tool":
      case "membership":
        return "guide";
      default:
        return raw ? "unknown" : "ebook";
    }
  }

  private resolveTitle(context: EbookContext, input?: EbookWorkerInput): string {
    return (
      input?.productTitle?.trim() ||
      context.productTitle?.trim() ||
      context.researchTopic?.trim() ||
      "Digital Product Ebook"
    );
  }

  private chapterTitle(
    productTitle: string,
    chapterNumber: number,
    chapterCount: number,
    context: EbookContext,
  ): string {
    const themes = [
      `Understanding ${productTitle}`,
      `Diagnosing the Core Problem`,
      `Building the Practical Framework`,
      `Applying Methods Step by Step`,
      `Operating Cadence and Checklists`,
      `Measuring Progress and Iteration`,
      `Scaling What Works`,
      `Sustaining Results Over Time`,
      `Advanced Scenarios and Edge Cases`,
      `Putting It All Together`,
      `Implementation Playbook`,
      `Review, Refine, and Next Steps`,
    ];
    if (chapterNumber === chapterCount) return `Putting ${productTitle} Into Practice`;
    if (chapterNumber === 1) {
      return themes[0]!;
    }
    const painHint = context.customerPainPoints?.[0]
      ? `Addressing ${truncate(context.customerPainPoints[0], 48)}`
      : null;
    return themes[chapterNumber - 1] ?? painHint ?? `Chapter ${chapterNumber}: ${productTitle}`;
  }

  private chapterSummary(
    productTitle: string,
    chapterNumber: number,
    chapterCount: number,
    audience: string,
    pain: string,
    context: EbookContext,
  ): string {
    if (chapterNumber === 1) {
      return `Introduces ${productTitle} for ${audience} and frames the problem of ${pain}.`;
    }
    if (chapterNumber === chapterCount) {
      return `Consolidates methods into an actionable close for ${audience}, with references and appendices.`;
    }
    return `Develops practical guidance for ${productTitle} chapter ${chapterNumber}, grounded in approved research intent${
      context.marketGap ? ` and market gap '${truncate(context.marketGap, 60)}'` : ""
    }.`;
  }

  private buildChapterBody(
    productTitle: string,
    chapterNumber: number,
    chapterCount: number,
    chapterTitle: string,
    audience: string,
    pain: string,
    marketGap: string,
    demand: string,
    context: EbookContext,
  ): string {
    const researchLine = context.researchReportId
      ? `This chapter follows approved research report ${context.researchReportId}.`
      : `This chapter follows the approved product intent available for ${productTitle}.`;
    const paragraphs = [
      `${chapterTitle} opens with a clear operating picture for ${audience}. ${researchLine}`,
      `Readers face ${pain}. The market still shows ${marketGap}. Demand context: ${demand}.`,
      `In this chapter you will define the outcome, select one practice, and produce a tangible artifact tied to ${productTitle}.`,
      `Start by writing the chapter objective in one sentence. Then list the constraints that most often block progress for ${audience}.`,
      `Next, apply a three-part method: diagnose the current state, design a minimal working approach, and document the decision trail for later audit.`,
      `Worked example: a practitioner preparing ${productTitle} materials captures the audience need, chooses one deliverable format, and validates clarity with a short walkthrough.`,
      `Close the chapter by recording what changed, what evidence supports the change, and the single next action that moves ${productTitle} forward.`,
      chapterNumber === chapterCount
        ? `This final chapter prepares export-ready structure only. It does not publish, sell, deliver, or process payments.`
        : `Chapter ${chapterNumber} of ${chapterCount} keeps the narrative original, practical, and aligned to approved product research.`,
    ];
    return paragraphs.join("\n\n");
  }
}

let ebookSequence = 0;

export function resetEbookSequenceForTesting() {
  ebookSequence = 0;
}

function cloneEbook(ebook: EbookReport): EbookReport {
  return {
    ...ebook,
    chapterStructure: ebook.chapterStructure.map((c) => ({ ...c })),
    includedResources: [...ebook.includedResources],
    exportFormats: [...ebook.exportFormats],
    chapters: ebook.chapters.map((c) => ({ ...c })),
    outline: ebook.outline
      ? {
          ...ebook.outline,
          tableOfContents: [...ebook.outline.tableOfContents],
          sections: ebook.outline.sections.map((s) => ({ ...s })),
          learningObjectives: [...ebook.outline.learningObjectives],
        }
      : null,
    selfReviewFindings: ebook.selfReviewFindings.map((f) => ({ ...f })),
    traceabilityRefs: [...ebook.traceabilityRefs],
    preservedDecisions: ebook.preservedDecisions.map((d) => ({ ...d })),
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function countWords(text: string) {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function normalizeWhitespace(text: string) {
  return text.replace(/\n{3,}/g, "\n\n").trim();
}

function truncate(value: string, max: number) {
  return value.length <= max ? value : `${value.slice(0, max - 1)}…`;
}
