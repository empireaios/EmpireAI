import type { SupplierNegotiationWorkerConfiguration } from "./configuration.js";
import {
  SNW_METADATA_VERSION,
  SUPPLIER_NEGOTIATION_REPORT_VERSION,
  SUPPLIER_NEGOTIATION_WORKER_IDENTITY,
} from "./paths.js";
import type {
  CandidateSupplierSummary,
  EvaluatedSupplierInput,
  EvidenceItem,
  IntegrationHandshake,
  NegotiationRecommendation,
  NegotiationTopicBlock,
  SupplierNegotiationReport,
  SupplierNegotiationWorkerCatalog,
  SupplierNegotiationWorkerInput,
} from "./types.js";

/** Pure Supplier Negotiation Worker helpers for Q3-06 — preparation only. */
export class NegotiationBuilder {
  buildCatalog(
    config: SupplierNegotiationWorkerConfiguration,
    negotiations: SupplierNegotiationReport[],
    integrations: IntegrationHandshake[],
  ): SupplierNegotiationWorkerCatalog {
    return {
      reportVersion: SUPPLIER_NEGOTIATION_REPORT_VERSION,
      workerId: config.workerId,
      negotiations: negotiations.map(cloneNegotiation),
      integrations: integrations.map((i) => ({ ...i })),
      metadataVersion: SNW_METADATA_VERSION,
      executiveAuthority: "pillow",
      neverContactSuppliers: true,
      neverCommitAgreements: true,
      neverPlaceOrders: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    };
  }

  resolveEvaluations(
    input: SupplierNegotiationWorkerInput,
    fromEvaluation: EvaluatedSupplierInput[] = [],
  ): EvaluatedSupplierInput[] {
    const evaluations: EvaluatedSupplierInput[] = [];
    if (input.evaluatedSupplier) evaluations.push(input.evaluatedSupplier);
    for (const e of input.evaluatedSuppliers ?? []) evaluations.push(e);
    if (input.evaluationId) {
      const match = fromEvaluation.find((e) => e.evaluationId === input.evaluationId);
      if (match) evaluations.push(match);
    }
    if (!evaluations.length && fromEvaluation.length) {
      if (input.productId) {
        const matches = fromEvaluation.filter((e) => e.productId === input.productId);
        if (matches.length) return matches;
      }
      return fromEvaluation.slice(-10);
    }
    return evaluations.filter((e) => e.supplierName?.trim() || e.supplierId?.trim());
  }

  negotiate(
    input: SupplierNegotiationWorkerInput,
    config: SupplierNegotiationWorkerConfiguration,
    evaluations: EvaluatedSupplierInput[],
  ): SupplierNegotiationReport {
    negotiationSequence += 1;
    const now = new Date().toISOString();
    const candidates = evaluations
      .map((e) => this.summarizeCandidate(e))
      .sort((a, b) => b.overallScore - a.overallScore);
    const preferred = this.selectPreferred(candidates, config);
    const productId =
      input.productId?.trim() ||
      evaluations.find((e) => e.productId?.trim())?.productId?.trim() ||
      preferred?.supplierId ||
      `prod-${negotiationSequence}`;
    const productName =
      input.productName?.trim() ||
      evaluations.find((e) => e.productName?.trim())?.productName?.trim() ||
      `product-${negotiationSequence}`;

    const moqNegotiation = this.buildMoqBlock(evaluations, preferred, input);
    const priceNegotiation = this.buildPriceBlock(evaluations, preferred, input);
    const shippingNegotiation = this.buildShippingBlock(evaluations, preferred, input);
    const fulfilmentQuestions = this.buildFulfilmentBlock(evaluations, preferred);
    const refundQuestions = this.buildRefundBlock(evaluations, preferred);
    const opportunities = this.identifyOpportunities(
      evaluations,
      preferred,
      moqNegotiation,
      priceNegotiation,
      shippingNegotiation,
    );
    const comparisonSummary = this.buildComparisonSummary(candidates, preferred);
    const draftNegotiationMessage = this.draftMessage(
      preferred,
      productName,
      moqNegotiation,
      priceNegotiation,
      shippingNegotiation,
      fulfilmentQuestions,
      refundQuestions,
      input,
    );
    const recommendation = this.recommend(preferred, candidates, config);
    const evidence = this.compileEvidence(
      evaluations,
      preferred,
      opportunities,
      input,
      now,
    );
    const confidenceScore = this.scoreConfidence(evaluations, evidence, preferred);

    return {
      negotiationId:
        input.negotiationId?.trim() || `snw-neg-${Date.now()}-${negotiationSequence}`,
      timestamp: now,
      productId,
      productName,
      candidateSuppliers: candidates,
      preferredSupplier: preferred,
      comparisonSummary,
      negotiationOpportunities: opportunities,
      moqNegotiation,
      priceNegotiation,
      shippingNegotiation,
      fulfilmentQuestions,
      refundQuestions,
      draftNegotiationMessage,
      recommendation,
      supportingEvidence: evidence,
      confidenceScore,
      evaluationIds: unique(
        evaluations.map((e) => e.evaluationId?.trim()).filter(Boolean) as string[],
      ),
      businessMissionId:
        evaluations.find((e) => e.businessMissionId?.trim())?.businessMissionId?.trim() ||
        null,
      metadataVersion: SNW_METADATA_VERSION,
      reportVersion: SUPPLIER_NEGOTIATION_REPORT_VERSION,
      submittedToExecutiveReporting: false,
      executiveReportId: null,
      workerId: config.workerId || SUPPLIER_NEGOTIATION_WORKER_IDENTITY.workerId,
      neverContactSuppliers: true,
      neverCommitAgreements: true,
      neverPlaceOrders: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverImplementQ307OrLater: true,
      preserveSupplierTraceability: true,
      preserveAuditHistory: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
    };
  }

  summarizeCandidate(evaluation: EvaluatedSupplierInput): CandidateSupplierSummary {
    const supplierName =
      evaluation.supplierName?.trim() ||
      evaluation.supplierId?.trim() ||
      "unnamed-supplier";
    const supplierId =
      evaluation.supplierId?.trim() || `sup-${slug(supplierName)}`;
    const overall = Number(evaluation.overallScore ?? 0);
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    if ((evaluation.reliabilityScore ?? 0) >= 70) strengths.push("strong reliability");
    else if ((evaluation.reliabilityScore ?? 0) > 0 && (evaluation.reliabilityScore ?? 0) < 50)
      weaknesses.push("weak reliability");
    if ((evaluation.priceScore ?? 0) >= 70) strengths.push("competitive pricing");
    else if ((evaluation.priceScore ?? 0) > 0 && (evaluation.priceScore ?? 0) < 50)
      weaknesses.push("weak pricing position");
    if ((evaluation.shippingScore ?? 0) >= 70) strengths.push("capable shipping");
    else if ((evaluation.shippingScore ?? 0) > 0 && (evaluation.shippingScore ?? 0) < 50)
      weaknesses.push("limited shipping");
    if ((evaluation.fulfilmentQualityScore ?? 0) >= 70) strengths.push("solid fulfilment");
    if ((evaluation.riskScore ?? 0) < 45) weaknesses.push("elevated operational risk");
    if ((evaluation.moq ?? 0) >= 200) weaknesses.push("high MOQ");
    if ((evaluation.moq ?? 0) > 0 && (evaluation.moq ?? 0) <= 10) strengths.push("flexible MOQ");
    return {
      supplierId,
      supplierName,
      evaluationId: evaluation.evaluationId?.trim() || null,
      discoveryId: evaluation.discoveryId?.trim() || null,
      overallScore: Number(overall.toFixed(1)),
      evaluationRecommendation: evaluation.recommendation?.trim() || null,
      strengths,
      weaknesses,
    };
  }

  selectPreferred(
    candidates: CandidateSupplierSummary[],
    config: SupplierNegotiationWorkerConfiguration,
  ): CandidateSupplierSummary | null {
    if (!candidates.length) return null;
    const approved = candidates.filter(
      (c) =>
        c.evaluationRecommendation === "Approve" ||
        c.overallScore >= config.preferThreshold,
    );
    return (approved[0] ?? candidates[0]) ?? null;
  }

  identifyOpportunities(
    evaluations: EvaluatedSupplierInput[],
    preferred: CandidateSupplierSummary | null,
    moq: NegotiationTopicBlock,
    price: NegotiationTopicBlock,
    shipping: NegotiationTopicBlock,
  ): string[] {
    const opportunities: string[] = [];
    if (evaluations.length >= 2) {
      opportunities.push(
        `Multi-supplier leverage across ${evaluations.length} evaluated candidates`,
      );
    }
    if (preferred?.weaknesses.includes("high MOQ")) {
      opportunities.push("MOQ reduction opportunity against preferred supplier");
    }
    if ((evaluations.find((e) => e.supplierId === preferred?.supplierId)?.priceScore ?? 100) < 75) {
      opportunities.push("Unit-price improvement opportunity versus evaluation baseline");
    }
    if (moq.opportunities.length) opportunities.push(...moq.opportunities);
    if (price.opportunities.length) opportunities.push(...price.opportunities);
    if (shipping.opportunities.length) opportunities.push(...shipping.opportunities);
    if (!opportunities.length) {
      opportunities.push("Clarify commercial terms before any supplier commitment");
    }
    return unique(opportunities);
  }

  buildMoqBlock(
    evaluations: EvaluatedSupplierInput[],
    preferred: CandidateSupplierSummary | null,
    input: SupplierNegotiationWorkerInput,
  ): NegotiationTopicBlock {
    const preferredEval = evaluations.find((e) => e.supplierId === preferred?.supplierId);
    const moq = preferredEval?.moq ?? null;
    const target = input.targetMoq ?? (moq != null && moq > 10 ? Math.max(1, Math.floor(moq / 2)) : 10);
    const opportunities: string[] = [];
    if (moq != null && moq > target) {
      opportunities.push(`Request MOQ reduction from ${moq} toward ${target}`);
    } else {
      opportunities.push("Confirm trial MOQ and reorder ladder");
    }
    return {
      topic: "MOQ",
      opportunities,
      questions: [
        `What is the lowest MOQ available for an initial trial order (target near ${target} units)?`,
        "Can MOQ be staged across the first 90 days with a reorder commitment?",
        "Are sample or pilot lots available before full MOQ?",
      ],
      targetOutcome: `Secure trial MOQ at or below ${target} units without quality concessions`,
    };
  }

  buildPriceBlock(
    evaluations: EvaluatedSupplierInput[],
    preferred: CandidateSupplierSummary | null,
    input: SupplierNegotiationWorkerInput,
  ): NegotiationTopicBlock {
    const preferredEval = evaluations.find((e) => e.supplierId === preferred?.supplierId);
    const cost = preferredEval?.productCost ?? null;
    const target =
      input.targetUnitPrice ??
      (cost != null ? Number((cost * 0.9).toFixed(2)) : null);
    const opportunities: string[] = [];
    if (cost != null && target != null && target < cost) {
      opportunities.push(`Seek unit-price concession from ${cost} toward ${target}`);
    } else {
      opportunities.push("Lock volume-tier pricing and payment terms");
    }
    const peers = evaluations
      .filter((e) => e.productCost != null)
      .map((e) => `${e.supplierName}: ${e.productCost}`);
    return {
      topic: "Pricing",
      opportunities,
      questions: [
        target != null
          ? `Can you meet a target unit price near ${target} for the first production run?`
          : "What is your best unit price for the first production run?",
        "What volume breaks apply at 100 / 500 / 1000 units?",
        peers.length > 1
          ? `How does your pricing compare with peer quotes (${peers.join("; ")})?`
          : "Please confirm currency, Incoterms base, and validity window for this quote.",
      ],
      targetOutcome:
        target != null
          ? `Negotiate unit price at or below ${target} with documented volume tiers`
          : "Obtain transparent volume-tier pricing with a clear validity window",
    };
  }

  buildShippingBlock(
    evaluations: EvaluatedSupplierInput[],
    preferred: CandidateSupplierSummary | null,
    input: SupplierNegotiationWorkerInput,
  ): NegotiationTopicBlock {
    const preferredEval = evaluations.find((e) => e.supplierId === preferred?.supplierId);
    const shipping = preferredEval?.shippingAvailability?.trim() || "standard freight";
    const preferredTerms =
      input.preferredShippingTerms?.trim() || "FOB with optional DDP for US/EU pilot";
    const opportunities = [
      `Clarify shipping terms beyond current availability (${shipping})`,
      `Pursue preferred terms: ${preferredTerms}`,
    ];
    return {
      topic: "Shipping",
      opportunities,
      questions: [
        `Can you support ${preferredTerms}?`,
        "What are lead times and carrier options for US and EU destinations?",
        "Are split shipments or warehouse staging available for pilot orders?",
      ],
      targetOutcome: `Confirm shipping coverage and commercial terms aligned to ${preferredTerms}`,
    };
  }

  buildFulfilmentBlock(
    evaluations: EvaluatedSupplierInput[],
    preferred: CandidateSupplierSummary | null,
  ): NegotiationTopicBlock {
    const preferredEval = evaluations.find((e) => e.supplierId === preferred?.supplierId);
    const fulfilment = preferredEval?.fulfilmentQualityScore ?? null;
    return {
      topic: "Fulfilment",
      opportunities: [
        fulfilment != null && fulfilment < 70
          ? "Strengthen fulfilment SLAs given evaluation score below 70"
          : "Document fulfilment SLAs and quality checkpoints",
      ],
      questions: [
        "What is your on-time delivery rate for the last 90 days?",
        "How do you handle defective units and replacement timelines?",
        "Can you share packaging specs and QC checkpoints for this SKU?",
      ],
      targetOutcome: "Document fulfilment capability, QC process, and replacement SLA",
    };
  }

  buildRefundBlock(
    evaluations: EvaluatedSupplierInput[],
    preferred: CandidateSupplierSummary | null,
  ): NegotiationTopicBlock {
    const preferredEval = evaluations.find((e) => e.supplierId === preferred?.supplierId);
    const refund = preferredEval?.refundPolicyScore ?? null;
    return {
      topic: "Refund & Warranty",
      opportunities: [
        refund != null && refund < 70
          ? "Clarify refund/warranty terms given evaluation score below 70"
          : "Confirm refund window and warranty coverage in writing",
      ],
      questions: [
        "What is your refund or return window for defective or mis-shipped goods?",
        "Is there a written warranty covering workmanship defects?",
        "How are chargebacks or credit notes processed for approved claims?",
      ],
      targetOutcome: "Obtain written refund/warranty clarifications before any order commitment",
    };
  }

  buildComparisonSummary(
    candidates: CandidateSupplierSummary[],
    preferred: CandidateSupplierSummary | null,
  ): string {
    if (!candidates.length) return "No evaluated suppliers available for comparison.";
    const ranked = candidates
      .map(
        (c, index) =>
          `${index + 1}. ${c.supplierName} (overall ${c.overallScore}` +
          `${c.evaluationRecommendation ? `, ${c.evaluationRecommendation}` : ""})`,
      )
      .join("; ");
    return preferred
      ? `Compared ${candidates.length} evaluated supplier(s). Preferred: ${preferred.supplierName}. Ranking: ${ranked}.`
      : `Compared ${candidates.length} evaluated supplier(s). Ranking: ${ranked}.`;
  }

  draftMessage(
    preferred: CandidateSupplierSummary | null,
    productName: string,
    moq: NegotiationTopicBlock,
    price: NegotiationTopicBlock,
    shipping: NegotiationTopicBlock,
    fulfilment: NegotiationTopicBlock,
    refund: NegotiationTopicBlock,
    input: SupplierNegotiationWorkerInput,
  ): string {
    const supplierName = preferred?.supplierName ?? "Supplier";
    const targetMoq = input.targetMoq != null ? ` near ${input.targetMoq} units` : "";
    const targetPrice =
      input.targetUnitPrice != null ? ` toward ${input.targetUnitPrice} per unit` : "";
    return [
      `Subject: Commercial inquiry — ${productName}`,
      "",
      `Dear ${supplierName} team,`,
      "",
      `We are preparing a commercial discussion for ${productName} based on our internal supplier evaluation. This message is a draft for approval and has not been sent.`,
      "",
      "To progress responsibly, please clarify the following:",
      "",
      "MOQ",
      ...moq.questions.map((q) => `- ${q}`),
      "",
      "Pricing",
      ...price.questions.map((q) => `- ${q}`),
      "",
      "Shipping",
      ...shipping.questions.map((q) => `- ${q}`),
      "",
      "Fulfilment",
      ...fulfilment.questions.map((q) => `- ${q}`),
      "",
      "Refund & Warranty",
      ...refund.questions.map((q) => `- ${q}`),
      "",
      `Our working targets include an initial MOQ${targetMoq || " suitable for a controlled pilot"} and pricing${targetPrice || " aligned to sustainable margins"}.`,
      "",
      "Kind regards,",
      "EmpireAI Commerce Factory (draft — awaiting Pillow approval; not transmitted)",
    ].join("\n");
  }

  recommend(
    preferred: CandidateSupplierSummary | null,
    candidates: CandidateSupplierSummary[],
    config: SupplierNegotiationWorkerConfiguration,
  ): NegotiationRecommendation {
    if (!preferred || preferred.overallScore < config.reviewThreshold) return "Defer";
    if (
      preferred.overallScore >= config.preferThreshold &&
      (preferred.evaluationRecommendation === "Approve" ||
        preferred.evaluationRecommendation === "Proceed" ||
        candidates.length === 1)
    ) {
      return "Prefer";
    }
    if (preferred.overallScore >= config.reviewThreshold) return "Review";
    return "Defer";
  }

  compileEvidence(
    evaluations: EvaluatedSupplierInput[],
    preferred: CandidateSupplierSummary | null,
    opportunities: string[],
    input: SupplierNegotiationWorkerInput,
    now: string,
  ): EvidenceItem[] {
    const items: EvidenceItem[] = [];
    let seq = 0;
    const add = (
      source: string,
      claim: string,
      kind: EvidenceItem["kind"],
      relatedTopic: string,
    ) => {
      seq += 1;
      items.push({
        evidenceId: `ev-${seq}`,
        source,
        claim,
        kind,
        relatedTopic,
        recordedAt: now,
      });
    };

    for (const raw of input.evidenceSources ?? []) {
      const claim = raw.claim?.trim();
      if (!claim) continue;
      add(
        raw.source?.trim() || "provided_source",
        claim,
        raw.kind === "fact" ? "fact" : "assumption",
        raw.relatedTopic?.trim() || "general",
      );
    }
    for (const evaluation of evaluations) {
      if (evaluation.evaluationId) {
        add(
          "supplier_evaluation_worker",
          `Traceable to supplier evaluation ${evaluation.evaluationId}` +
            (evaluation.discoveryId ? ` / discovery ${evaluation.discoveryId}` : ""),
          "fact",
          "traceability",
        );
      }
      if (evaluation.overallScore != null) {
        add(
          "evaluation_score",
          `${evaluation.supplierName ?? evaluation.supplierId}: overall ${evaluation.overallScore}` +
            (evaluation.recommendation ? ` (${evaluation.recommendation})` : ""),
          "fact",
          "comparison",
        );
      }
    }
    if (preferred) {
      add(
        "preferred_selection",
        `Preferred supplier candidate ${preferred.supplierName} at overall ${preferred.overallScore}`,
        "assumption",
        "recommendation",
      );
    }
    for (const opportunity of opportunities.slice(0, 3)) {
      add("negotiation_opportunity", opportunity, "assumption", "opportunity");
    }
    add(
      "boundary",
      "Preparation-only: does not contact suppliers, commit agreements, or place orders",
      "fact",
      "governance",
    );
    return items;
  }

  scoreConfidence(
    evaluations: EvaluatedSupplierInput[],
    evidence: EvidenceItem[],
    preferred: CandidateSupplierSummary | null,
  ): number {
    const facts = evidence.filter((e) => e.kind === "fact").length;
    let score = 0.35;
    score += Math.min(0.35, facts * 0.05);
    score += Math.min(0.15, evaluations.length * 0.05);
    if (preferred?.evaluationId) score += 0.1;
    if (preferred?.discoveryId) score += 0.05;
    if (evaluations.every((e) => e.overallScore != null)) score += 0.05;
    return Number(Math.max(0.05, Math.min(0.95, score)).toFixed(2));
  }
}

let negotiationSequence = 0;

export function resetNegotiationSequenceForTesting() {
  negotiationSequence = 0;
}

function slug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32);
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((v) => v.trim()).filter(Boolean)));
}

function cloneNegotiation(negotiation: SupplierNegotiationReport): SupplierNegotiationReport {
  return {
    ...negotiation,
    candidateSuppliers: negotiation.candidateSuppliers.map((c) => ({
      ...c,
      strengths: [...c.strengths],
      weaknesses: [...c.weaknesses],
    })),
    preferredSupplier: negotiation.preferredSupplier
      ? {
          ...negotiation.preferredSupplier,
          strengths: [...negotiation.preferredSupplier.strengths],
          weaknesses: [...negotiation.preferredSupplier.weaknesses],
        }
      : null,
    negotiationOpportunities: [...negotiation.negotiationOpportunities],
    moqNegotiation: {
      ...negotiation.moqNegotiation,
      opportunities: [...negotiation.moqNegotiation.opportunities],
      questions: [...negotiation.moqNegotiation.questions],
    },
    priceNegotiation: {
      ...negotiation.priceNegotiation,
      opportunities: [...negotiation.priceNegotiation.opportunities],
      questions: [...negotiation.priceNegotiation.questions],
    },
    shippingNegotiation: {
      ...negotiation.shippingNegotiation,
      opportunities: [...negotiation.shippingNegotiation.opportunities],
      questions: [...negotiation.shippingNegotiation.questions],
    },
    fulfilmentQuestions: {
      ...negotiation.fulfilmentQuestions,
      opportunities: [...negotiation.fulfilmentQuestions.opportunities],
      questions: [...negotiation.fulfilmentQuestions.questions],
    },
    refundQuestions: {
      ...negotiation.refundQuestions,
      opportunities: [...negotiation.refundQuestions.opportunities],
      questions: [...negotiation.refundQuestions.questions],
    },
    supportingEvidence: negotiation.supportingEvidence.map((e) => ({ ...e })),
    evaluationIds: [...negotiation.evaluationIds],
  };
}
