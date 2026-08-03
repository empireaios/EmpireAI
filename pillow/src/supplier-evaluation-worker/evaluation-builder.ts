import type { SupplierEvaluationWorkerConfiguration } from "./configuration.js";
import {
  SEW_METADATA_VERSION,
  SUPPLIER_EVALUATION_REPORT_VERSION,
  SUPPLIER_EVALUATION_WORKER_IDENTITY,
} from "./paths.js";
import type {
  DiscoveredSupplierInput,
  EvidenceItem,
  EvaluationRecommendation,
  IntegrationHandshake,
  ScoreDimension,
  SupplierEvaluationReport,
  SupplierEvaluationWorkerCatalog,
  SupplierEvaluationWorkerInput,
} from "./types.js";

/** Pure Supplier Evaluation Worker helpers for Q3-05 — evaluation only. */
export class EvaluationBuilder {
  buildCatalog(
    config: SupplierEvaluationWorkerConfiguration,
    evaluations: SupplierEvaluationReport[],
    integrations: IntegrationHandshake[],
  ): SupplierEvaluationWorkerCatalog {
    return {
      reportVersion: SUPPLIER_EVALUATION_REPORT_VERSION,
      workerId: config.workerId,
      evaluations: evaluations.map(cloneEvaluation),
      integrations: integrations.map((i) => ({ ...i })),
      metadataVersion: SEW_METADATA_VERSION,
      executiveAuthority: "pillow",
      neverDiscoverSuppliers: true,
      neverNegotiateSuppliers: true,
      neverPlaceSupplierOrders: true,
      neverModifySupplierInformation: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    };
  }

  resolveSuppliers(
    input: SupplierEvaluationWorkerInput,
    fromDiscovery: DiscoveredSupplierInput[] = [],
  ): DiscoveredSupplierInput[] {
    const suppliers: DiscoveredSupplierInput[] = [];
    if (input.discoveredSupplier) suppliers.push(input.discoveredSupplier);
    for (const s of input.discoveredSuppliers ?? []) suppliers.push(s);
    if (input.supplierId || input.supplierName) {
      suppliers.push({
        discoveryId: input.discoveryId,
        supplierId: input.supplierId,
        supplierName: input.supplierName,
        productId: input.productId,
        productName: input.productName,
      });
    }
    if (!suppliers.length && fromDiscovery.length) {
      if (input.discoveryId) {
        const match = fromDiscovery.find((d) => d.discoveryId === input.discoveryId);
        if (match) return [match];
      }
      if (input.supplierId) {
        const match = fromDiscovery.find((d) => d.supplierId === input.supplierId);
        if (match) return [match];
      }
      return fromDiscovery.slice(-5);
    }
    return suppliers.filter((s) => s.supplierName?.trim() || s.supplierId?.trim());
  }

  evaluate(
    input: SupplierEvaluationWorkerInput,
    config: SupplierEvaluationWorkerConfiguration,
    suppliers: DiscoveredSupplierInput[],
  ): SupplierEvaluationReport[] {
    return suppliers.map((supplier) => this.evaluateOne(supplier, input, config));
  }

  evaluateOne(
    supplier: DiscoveredSupplierInput,
    input: SupplierEvaluationWorkerInput,
    config: SupplierEvaluationWorkerConfiguration,
  ): SupplierEvaluationReport {
    evaluationSequence += 1;
    const now = new Date().toISOString();
    const supplierName =
      supplier.supplierName?.trim() ||
      input.supplierName?.trim() ||
      `unnamed-supplier-${evaluationSequence}`;
    const supplierId =
      supplier.supplierId?.trim() ||
      input.supplierId?.trim() ||
      `sup-${slug(supplierName)}-${evaluationSequence}`;
    const productId =
      supplier.productId?.trim() ||
      input.productId?.trim() ||
      `prod-${evaluationSequence}`;
    const productName =
      supplier.productName?.trim() ||
      input.productName?.trim() ||
      `product-${evaluationSequence}`;

    const scores = this.computeScores(supplier, input);
    const overallScore = this.overallScore(scores);
    const recommendation = this.recommend(overallScore, scores, config);
    const evidence = this.compileEvidence(supplier, input, scores, now);
    const facts = unique(evidence.filter((e) => e.kind === "fact").map((e) => e.claim));
    const assumptions = unique(
      evidence.filter((e) => e.kind === "assumption").map((e) => e.claim),
    );
    const confidenceScore = this.scoreConfidence(supplier, evidence, input);

    return {
      evaluationId:
        input.evaluationId?.trim() && evaluationSequence === 1
          ? input.evaluationId.trim()
          : `sew-eval-${Date.now()}-${evaluationSequence}`,
      timestamp: now,
      supplierId,
      supplierName,
      productId,
      productName,
      discoveryId: supplier.discoveryId?.trim() || input.discoveryId?.trim() || null,
      reliabilityScore: scores.reliability,
      priceScore: scores.price,
      shippingScore: scores.shipping,
      refundPolicyScore: scores.refund_policy,
      fulfilmentQualityScore: scores.fulfilment_quality,
      communicationScore: scores.communication,
      riskScore: scores.risk,
      overallScore,
      recommendation,
      supportingEvidence: evidence,
      confidenceScore,
      facts,
      assumptions,
      scoreNotes: {
        reliability: scores.notes.reliability,
        price: scores.notes.price,
        shipping: scores.notes.shipping,
        refund_policy: scores.notes.refund_policy,
        fulfilment_quality: scores.notes.fulfilment_quality,
        communication: scores.notes.communication,
        risk: scores.notes.risk,
        overall: `Weighted overall ${overallScore}/100 → ${recommendation}`,
      },
      businessMissionId: supplier.businessMissionId?.trim() || null,
      metadataVersion: SEW_METADATA_VERSION,
      reportVersion: SUPPLIER_EVALUATION_REPORT_VERSION,
      submittedToExecutiveReporting: false,
      executiveReportId: null,
      workerId: config.workerId || SUPPLIER_EVALUATION_WORKER_IDENTITY.workerId,
      neverDiscoverSuppliers: true,
      neverNegotiateSuppliers: true,
      neverPlaceSupplierOrders: true,
      neverModifySupplierInformation: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverImplementQ306OrLater: true,
      preserveDiscoveryTraceability: true,
      preserveAuditHistory: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
    };
  }

  computeScores(supplier: DiscoveredSupplierInput, input: SupplierEvaluationWorkerInput) {
    const reliability = clamp(input.reliabilityHint ?? this.scoreReliability(supplier, input));
    const price = clamp(input.priceHint ?? this.scorePrice(supplier, input));
    const shipping = clamp(input.shippingHint ?? this.scoreShipping(supplier, input));
    const refund_policy = clamp(
      input.refundPolicyHint ?? this.scoreRefundPolicy(supplier, input),
    );
    const fulfilment_quality = clamp(
      input.fulfilmentQualityHint ?? this.scoreFulfilment(supplier, input),
    );
    const communication = clamp(
      input.communicationHint ?? this.scoreCommunication(supplier, input),
    );
    const risk = clamp(input.riskHint ?? this.scoreRisk(supplier, input));

    return {
      reliability,
      price,
      shipping,
      refund_policy,
      fulfilment_quality,
      communication,
      risk,
      notes: {
        reliability: `Reliability score ${reliability}/100 from tenure/platform signals`,
        price: `Price score ${price}/100 from product cost competitiveness`,
        shipping: `Shipping score ${shipping}/100 from availability/coverage`,
        refund_policy: `Refund policy score ${refund_policy}/100`,
        fulfilment_quality: `Fulfilment quality ${fulfilment_quality}/100`,
        communication: `Communication score ${communication}/100`,
        risk: `Operational risk score ${risk}/100 (higher = lower risk)`,
      } as Record<Exclude<ScoreDimension, "overall">, string>,
    };
  }

  overallScore(scores: {
    reliability: number;
    price: number;
    shipping: number;
    refund_policy: number;
    fulfilment_quality: number;
    communication: number;
    risk: number;
  }): number {
    const weighted =
      scores.reliability * 0.2 +
      scores.price * 0.15 +
      scores.shipping * 0.15 +
      scores.refund_policy * 0.1 +
      scores.fulfilment_quality * 0.15 +
      scores.communication * 0.1 +
      scores.risk * 0.15;
    return Number(weighted.toFixed(1));
  }

  recommend(
    overall: number,
    scores: { risk: number; reliability: number; fulfilment_quality: number },
    config: SupplierEvaluationWorkerConfiguration,
  ): EvaluationRecommendation {
    if (
      overall >= config.approveThreshold &&
      scores.risk >= 40 &&
      scores.reliability >= 40 &&
      scores.fulfilment_quality >= 40
    ) {
      return "Approve";
    }
    if (overall >= config.reviewThreshold) return "Review";
    return "Reject";
  }

  scoreReliability(supplier: DiscoveredSupplierInput, input: SupplierEvaluationWorkerInput): number {
    let score = 55;
    const years = input.yearsInBusiness;
    if (years != null) {
      if (years >= 5) score += 25;
      else if (years >= 2) score += 15;
      else if (years >= 1) score += 5;
      else score -= 10;
    }
    if (supplier.supplierPlatform === "alibaba" || supplier.supplierPlatform === "cjdropshipping") {
      score += 5;
    }
    if ((supplier.confidenceScore ?? 0) > 0.7) score += 10;
    if (supplier.sourceReference) score += 5;
    return score;
  }

  scorePrice(supplier: DiscoveredSupplierInput, input: SupplierEvaluationWorkerInput): number {
    const cost = supplier.productCost;
    if (cost == null) return 45;
    let score = 70;
    if (cost <= 5) score = 90;
    else if (cost <= 10) score = 80;
    else if (cost <= 20) score = 65;
    else if (cost <= 40) score = 50;
    else score = 30;
    if (supplier.moq != null && supplier.moq <= 10) score += 5;
    if (supplier.moq != null && supplier.moq >= 500) score -= 10;
    if (input.priceHint != null) return clamp(input.priceHint);
    return score;
  }

  scoreShipping(supplier: DiscoveredSupplierInput, input: SupplierEvaluationWorkerInput): number {
    const shipping = supplier.shippingAvailability?.toLowerCase() ?? "";
    if (!shipping || shipping === "unavailable") return 35;
    let score = 55;
    if (/worldwide|global|us\/eu|warehouses/.test(shipping)) score += 25;
    if (/fob|exw/.test(shipping)) score += 10;
    if (/local.?only|domestic.?only/.test(shipping)) score -= 15;
    const onTime = input.onTimeDeliveryRate;
    if (onTime != null) score = score * 0.5 + onTime * 0.5;
    return score;
  }

  scoreRefundPolicy(
    _supplier: DiscoveredSupplierInput,
    input: SupplierEvaluationWorkerInput,
  ): number {
    const days = input.refundPolicyDays;
    if (days == null) return 50;
    if (days >= 30) return 90;
    if (days >= 14) return 75;
    if (days >= 7) return 60;
    if (days > 0) return 40;
    return 20;
  }

  scoreFulfilment(supplier: DiscoveredSupplierInput, input: SupplierEvaluationWorkerInput): number {
    let score = 60;
    const defect = input.defectRate;
    if (defect != null) {
      if (defect <= 0.01) score = 95;
      else if (defect <= 0.03) score = 80;
      else if (defect <= 0.08) score = 55;
      else score = 30;
    }
    if (supplier.moq != null && supplier.moq === 1) score += 5;
    if (supplier.fieldAvailability?.productCost === "available") score += 5;
    return score;
  }

  scoreCommunication(
    _supplier: DiscoveredSupplierInput,
    input: SupplierEvaluationWorkerInput,
  ): number {
    const hours = input.responseTimeHours;
    if (hours == null) return 55;
    if (hours <= 4) return 95;
    if (hours <= 12) return 80;
    if (hours <= 24) return 65;
    if (hours <= 48) return 45;
    return 25;
  }

  scoreRisk(supplier: DiscoveredSupplierInput, input: SupplierEvaluationWorkerInput): number {
    let score = 70;
    if (supplier.fieldAvailability?.supplierLocation === "unavailable") score -= 15;
    if (supplier.fieldAvailability?.productCost === "missing") score -= 10;
    if ((supplier.confidenceScore ?? 0) < 0.4) score -= 15;
    if (!supplier.sourceReference) score -= 10;
    if (input.yearsInBusiness != null && input.yearsInBusiness < 1) score -= 10;
    if (input.defectRate != null && input.defectRate > 0.1) score -= 20;
    if (supplier.discoveryChannel === "supplier_api") score += 5;
    return score;
  }

  compileEvidence(
    supplier: DiscoveredSupplierInput,
    input: SupplierEvaluationWorkerInput,
    scores: ReturnType<EvaluationBuilder["computeScores"]>,
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
    if (supplier.discoveryId) {
      add(
        "supplier_discovery_worker",
        `Traceable to supplier discovery ${supplier.discoveryId}`,
        "fact",
        "traceability",
      );
    }
    if (supplier.sourceReference) {
      add(
        "supplier_source",
        `Source reference preserved: ${supplier.sourceReference}`,
        "fact",
        "traceability",
      );
    }
    if (supplier.productCost != null) {
      add(
        "discovery_pricing",
        `Discovered product cost ${supplier.productCost}`,
        "fact",
        "price",
      );
    }
    add(
      "evaluation_scoring",
      `Scores reliability=${scores.reliability} price=${scores.price} shipping=${scores.shipping} refund=${scores.refund_policy} fulfilment=${scores.fulfilment_quality} communication=${scores.communication} risk=${scores.risk}`,
      "assumption",
      "overall",
    );
    add(
      "boundary",
      "Evaluation-only: does not discover, negotiate, place orders, or modify supplier information",
      "fact",
      "governance",
    );
    return items;
  }

  scoreConfidence(
    supplier: DiscoveredSupplierInput,
    evidence: EvidenceItem[],
    input: SupplierEvaluationWorkerInput,
  ): number {
    const facts = evidence.filter((e) => e.kind === "fact").length;
    const assumptions = evidence.filter((e) => e.kind === "assumption").length;
    let score = 0.4;
    score += Math.min(0.3, facts * 0.05);
    score -= Math.min(0.15, assumptions * 0.02);
    if (supplier.discoveryId) score += 0.1;
    if (supplier.sourceReference) score += 0.05;
    if (
      input.yearsInBusiness != null ||
      input.onTimeDeliveryRate != null ||
      input.refundPolicyDays != null
    ) {
      score += 0.1;
    }
    if ((supplier.confidenceScore ?? 0) > 0.6) score += 0.05;
    return Number(Math.max(0.05, Math.min(0.95, score)).toFixed(2));
  }
}

let evaluationSequence = 0;

export function resetEvaluationSequenceForTesting() {
  evaluationSequence = 0;
}

function clamp(value: number): number {
  return Number(Math.max(0, Math.min(100, value)).toFixed(1));
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

function cloneEvaluation(evaluation: SupplierEvaluationReport): SupplierEvaluationReport {
  return {
    ...evaluation,
    facts: [...evaluation.facts],
    assumptions: [...evaluation.assumptions],
    supportingEvidence: evaluation.supportingEvidence.map((e) => ({ ...e })),
    scoreNotes: { ...evaluation.scoreNotes },
  };
}
