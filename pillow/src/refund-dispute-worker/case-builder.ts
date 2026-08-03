import type { RefundDisputeWorkerConfiguration } from "./configuration.js";
import {
  CASE_STATUSES,
  CASE_TYPES,
  RDW_METADATA_VERSION,
  REFUND_DISPUTE_REPORT_VERSION,
  REFUND_DISPUTE_WORKER_IDENTITY,
} from "./paths.js";
import type {
  CaseAction,
  CaseEscalation,
  CaseRequestInput,
  CaseResolution,
  CaseStatus,
  CaseType,
  CustomerCommunication,
  EvidenceItem,
  HistoryEvent,
  IntegrationHandshake,
  PolicyDecision,
  PolicyEvaluation,
  RefundDisputeReport,
  RefundDisputeWorkerCatalog,
  RefundDisputeWorkerInput,
  SupplierCoordination,
} from "./types.js";

/** Pure Refund & Dispute Worker helpers for Q3-12 — case workflow tracking only. */
export class CaseBuilder {
  buildCatalog(
    config: RefundDisputeWorkerConfiguration,
    cases: RefundDisputeReport[],
    integrations: IntegrationHandshake[],
  ): RefundDisputeWorkerCatalog {
    return {
      reportVersion: REFUND_DISPUTE_REPORT_VERSION,
      workerId: config.workerId,
      cases: cases.map(cloneReport),
      integrations: integrations.map((i) => ({ ...i })),
      metadataVersion: RDW_METADATA_VERSION,
      executiveAuthority: "pillow",
      neverModifyFinancialLedgersDirectly: true,
      neverOverrideMarketplacePolicies: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverAuthorizeOutsideAuthorityMatrix: true,
    };
  }

  resolveCase(input: RefundDisputeWorkerInput): CaseRequestInput {
    const base = input.caseRequest ?? {};
    return {
      caseId: input.caseId ?? base.caseId,
      orderId: input.orderId ?? base.orderId,
      customerId: input.customerId ?? base.customerId,
      productId: input.productId ?? base.productId,
      productName: input.productName ?? base.productName,
      supplierId: input.supplierId ?? base.supplierId,
      supplierName: input.supplierName ?? base.supplierName,
      caseType: input.caseType ?? base.caseType,
      reason: input.reason ?? base.reason,
      requestedAmount: input.requestedAmount ?? base.requestedAmount,
      policyId: input.policyId ?? base.policyId,
      currentStatus: input.currentStatus ?? base.currentStatus,
      requireSupplierCoordination:
        input.requireSupplierCoordination ?? base.requireSupplierCoordination,
      orderAgeDays: input.orderAgeDays ?? base.orderAgeDays,
      orderReportId: input.orderReportId ?? base.orderReportId,
      evaluationId: input.evaluationId ?? base.evaluationId,
      discoveryId: input.discoveryId ?? base.discoveryId,
      businessMissionId: input.businessMissionId ?? base.businessMissionId,
      resolutionOutcome: input.resolutionOutcome ?? base.resolutionOutcome,
    };
  }

  buildReport(
    input: RefundDisputeWorkerInput,
    config: RefundDisputeWorkerConfiguration,
    caseRequest: CaseRequestInput,
    orderContext?: {
      orderReportId?: string | null;
      orderId?: string | null;
      customerId?: string | null;
      productId?: string | null;
      productName?: string | null;
      supplierId?: string | null;
      supplierName?: string | null;
      orderStatus?: string | null;
      fulfilmentStatus?: string | null;
      shippingStatus?: string | null;
      evaluationId?: string | null;
      discoveryId?: string | null;
      businessMissionId?: string | null;
    } | null,
    receiveHint?: CaseType | null,
    recordFinal = false,
  ): RefundDisputeReport {
    caseSequence += 1;
    const now = new Date().toISOString();
    const caseId =
      caseRequest.caseId?.trim() ||
      input.caseId?.trim() ||
      `rdw-case-${Date.now()}-${caseSequence}`;
    const orderId =
      caseRequest.orderId?.trim() ||
      orderContext?.orderId?.trim() ||
      `ord-case-${caseSequence}`;
    const customerId =
      caseRequest.customerId?.trim() ||
      orderContext?.customerId?.trim() ||
      `cust-case-${caseSequence}`;
    const productId =
      caseRequest.productId?.trim() || orderContext?.productId?.trim() || null;
    const productName =
      caseRequest.productName?.trim() || orderContext?.productName?.trim() || null;
    const supplierId =
      caseRequest.supplierId?.trim() || orderContext?.supplierId?.trim() || null;
    const supplierName =
      caseRequest.supplierName?.trim() || orderContext?.supplierName?.trim() || null;

    const caseType = this.classifyCaseType(
      caseRequest.caseType ?? input.caseType ?? receiveHint ?? null,
      receiveHint ?? null,
    );
    const reason =
      caseRequest.reason?.trim() ||
      input.reason?.trim() ||
      `Customer ${caseType} request recorded`;

    const requestedAmount =
      caseRequest.requestedAmount != null &&
      Number.isFinite(Number(caseRequest.requestedAmount))
        ? Number(caseRequest.requestedAmount)
        : null;

    const orderAgeDays =
      caseRequest.orderAgeDays != null && Number.isFinite(Number(caseRequest.orderAgeDays))
        ? Math.max(0, Number(caseRequest.orderAgeDays))
        : null;

    const policyEvaluation = this.evaluatePolicy(
      caseType,
      requestedAmount,
      orderAgeDays,
      config,
      caseRequest.policyId?.trim() || input.policyId?.trim() || null,
    );

    const requireSupplier =
      caseRequest.requireSupplierCoordination === true ||
      this.caseTypeRequiresSupplier(caseType);

    let currentStatus =
      this.normalizeCaseStatus(caseRequest.currentStatus ?? input.currentStatus) ??
      this.deriveStatusFromPolicy(policyEvaluation.decision);

    if (requireSupplier && currentStatus === "under_review") {
      currentStatus = "awaiting_supplier";
    }

    const actionsTaken = this.buildActionsTaken(
      caseType,
      policyEvaluation,
      currentStatus,
      now,
    );
    const customerCommunications = this.buildCustomerCommunications(
      caseType,
      currentStatus,
      policyEvaluation,
      now,
    );
    const supplierCoordination = requireSupplier
      ? this.buildSupplierCoordination(supplierId, caseType, now)
      : [];

    const withinAuthority = policyEvaluation.withinDelegatedAuthority;
    let escalationStatus: RefundDisputeReport["escalationStatus"] = "none";
    let escalations: CaseEscalation[] = [];
    if (!withinAuthority || policyEvaluation.decision === "escalate") {
      escalationStatus = "escalated_to_pillow";
      currentStatus = "escalated";
      escalations = [
        {
          escalationId: "rdw-esc-1",
          severity: "critical",
          reason: policyEvaluation.rationale,
          escalatedAt: now,
          target: "pillow",
        },
      ];
    }

    const resolution = this.buildResolution(
      currentStatus,
      caseRequest.resolutionOutcome?.trim() || input.resolutionOutcome?.trim() || null,
      policyEvaluation,
      recordFinal,
      now,
    );

    if (
      resolution.closed &&
      (currentStatus === "approved" ||
        currentStatus === "denied" ||
        currentStatus === "resolved")
    ) {
      /* keep status; closed via resolution */
    } else if (recordFinal && resolution.closed) {
      currentStatus = currentStatus === "denied" ? "denied" : "resolved";
    }

    const caseHistory = this.buildCaseHistory(currentStatus, policyEvaluation, now);
    const recommendedAction = this.buildRecommendedAction(
      caseType,
      currentStatus,
      policyEvaluation,
      requireSupplier,
    );

    const orderReportId =
      caseRequest.orderReportId?.trim() ||
      orderContext?.orderReportId?.trim() ||
      null;

    const evidence = this.compileEvidence(
      caseRequest,
      caseId,
      orderId,
      customerId,
      caseType,
      policyEvaluation,
      currentStatus,
      orderReportId,
      input,
      orderContext,
      now,
    );

    const confidenceScore = this.scoreConfidence(
      orderId,
      customerId,
      caseType,
      policyEvaluation.decision,
      orderReportId,
      evidence,
    );

    return {
      caseId,
      timestamp: now,
      orderId,
      customerId,
      productId,
      productName,
      supplierId,
      supplierName,
      caseType,
      reason,
      policyEvaluation,
      currentStatus,
      actionsTaken,
      customerCommunications,
      resolution,
      escalationStatus,
      escalations,
      supplierCoordination,
      caseHistory,
      recommendedAction,
      confidenceScore,
      orderReportId,
      evaluationId:
        caseRequest.evaluationId?.trim() ||
        orderContext?.evaluationId?.trim() ||
        null,
      discoveryId:
        caseRequest.discoveryId?.trim() || orderContext?.discoveryId?.trim() || null,
      businessMissionId:
        caseRequest.businessMissionId?.trim() ||
        orderContext?.businessMissionId?.trim() ||
        null,
      supportingEvidence: evidence,
      metadataVersion: RDW_METADATA_VERSION,
      reportVersion: REFUND_DISPUTE_REPORT_VERSION,
      submittedToExecutiveReporting: false,
      executiveReportId: null,
      workerId: config.workerId || REFUND_DISPUTE_WORKER_IDENTITY.workerId,
      neverModifyFinancialLedgersDirectly: true,
      neverOverrideMarketplacePolicies: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverImplementQ313OrLater: true,
      neverAuthorizeOutsideAuthorityMatrix: true,
      followApprovedPolicies: true,
      preserveCaseTraceability: true,
      preserveSupplierReferences: true,
      preserveCustomerCommunicationHistory: true,
      preserveAuditHistory: true,
      escalateBeyondDelegatedAuthority: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
    };
  }

  classifyCaseType(
    value: unknown,
    receiveHint: CaseType | null = null,
  ): CaseType {
    if (typeof value === "string" && value.trim()) {
      const trimmed = value.trim().toLowerCase().replace(/\s+/g, "_");
      if ((CASE_TYPES as readonly string[]).includes(trimmed)) {
        return trimmed as (typeof CASE_TYPES)[number];
      }
      return trimmed;
    }
    if (receiveHint) return receiveHint;
    return "general_support";
  }

  normalizeCaseStatus(value: unknown): CaseStatus | null {
    if (typeof value !== "string" || !value.trim()) return null;
    const trimmed = value.trim().toLowerCase().replace(/\s+/g, "_");
    if ((CASE_STATUSES as readonly string[]).includes(trimmed)) {
      return trimmed as (typeof CASE_STATUSES)[number];
    }
    return trimmed;
  }

  evaluatePolicy(
    caseType: CaseType,
    requestedAmount: number | null,
    orderAgeDays: number | null,
    config: RefundDisputeWorkerConfiguration,
    policyIdOverride: string | null,
  ): PolicyEvaluation {
    const policyId = policyIdOverride || config.defaultPolicyId;
    const override = config.policies[caseType] ?? config.policies[String(caseType)];
    const maxAmount = config.maxDelegatedRefundAmount ?? 100;
    const returnWindow = config.defaultReturnWindowDays ?? 30;

    if (override?.decision) {
      const within =
        override.decision !== "escalate" &&
        !(caseType === "refund" && requestedAmount != null && requestedAmount > maxAmount);
      return {
        policyId: override.policyId || policyId,
        policyName: override.policyName || `RDW policy for ${caseType}`,
        decision: within ? override.decision : "escalate",
        rationale:
          override.decision === "escalate" || !within
            ? `Policy for ${caseType} requires escalation beyond delegated authority`
            : `Configured policy decision ${override.decision} for ${caseType}`,
        authorityLevel: within
          ? REFUND_DISPUTE_WORKER_IDENTITY.authorityLevel
          : "pillow_authorization_required",
        withinDelegatedAuthority: within,
        marketplaceRuleRefs: override.marketplaceRuleRefs ?? [
          `rule-${caseType}`,
          policyId,
        ],
      };
    }

    switch (caseType) {
      case "refund": {
        const within =
          requestedAmount == null || requestedAmount <= maxAmount;
        return {
          policyId,
          policyName: "Delegated refund authority policy",
          decision: within ? "allow" : "escalate",
          rationale: within
            ? requestedAmount == null
              ? "Refund request within delegated authority (amount not specified — structural review allowed)"
              : `Refund amount ${requestedAmount} within max delegated amount ${maxAmount}`
            : `Refund amount ${requestedAmount} exceeds max delegated amount ${maxAmount} — escalate to Pillow`,
          authorityLevel: within
            ? REFUND_DISPUTE_WORKER_IDENTITY.authorityLevel
            : "pillow_authorization_required",
          withinDelegatedAuthority: within,
          marketplaceRuleRefs: ["rule-refund-delegated-limit", policyId],
        };
      }
      case "return":
      case "exchange": {
        if (orderAgeDays == null) {
          return {
            policyId,
            policyName: "Return/exchange window policy",
            decision: "review",
            rationale: `Order age unknown — ${caseType} held for review within ${returnWindow}-day return window policy`,
            authorityLevel: REFUND_DISPUTE_WORKER_IDENTITY.authorityLevel,
            withinDelegatedAuthority: true,
            marketplaceRuleRefs: ["rule-return-window", policyId],
          };
        }
        const withinWindow = orderAgeDays <= returnWindow;
        return {
          policyId,
          policyName: "Return/exchange window policy",
          decision: withinWindow ? "allow" : "deny",
          rationale: withinWindow
            ? `${caseType} within ${returnWindow}-day return window (order age ${orderAgeDays} days)`
            : `${caseType} outside ${returnWindow}-day return window (order age ${orderAgeDays} days)`,
          authorityLevel: REFUND_DISPUTE_WORKER_IDENTITY.authorityLevel,
          withinDelegatedAuthority: true,
          marketplaceRuleRefs: ["rule-return-window", policyId],
        };
      }
      case "chargeback":
      case "customer_dispute":
        return {
          policyId,
          policyName: "Dispute/chargeback escalation policy",
          decision: "escalate",
          rationale: `${caseType} is beyond delegated authority by default — escalate to Pillow`,
          authorityLevel: "pillow_authorization_required",
          withinDelegatedAuthority: false,
          marketplaceRuleRefs: ["rule-dispute-escalation", policyId],
        };
      case "damaged_product":
      case "missing_item":
        return {
          policyId,
          policyName: "Damaged/missing item policy",
          decision: "allow",
          rationale: `${caseType} allowed with supplier coordination — no ledger modification`,
          authorityLevel: REFUND_DISPUTE_WORKER_IDENTITY.authorityLevel,
          withinDelegatedAuthority: true,
          marketplaceRuleRefs: ["rule-damaged-missing", policyId],
        };
      case "supplier_issue":
      case "shipping_issue":
        return {
          policyId,
          policyName: "Supplier/shipping issue review policy",
          decision: "review",
          rationale: `${caseType} requires review with supplier coordination`,
          authorityLevel: REFUND_DISPUTE_WORKER_IDENTITY.authorityLevel,
          withinDelegatedAuthority: true,
          marketplaceRuleRefs: ["rule-supplier-shipping-review", policyId],
        };
      case "general_support":
        return {
          policyId,
          policyName: "General support policy",
          decision: "allow",
          rationale: "General support case allowed within delegated operational authority",
          authorityLevel: REFUND_DISPUTE_WORKER_IDENTITY.authorityLevel,
          withinDelegatedAuthority: true,
          marketplaceRuleRefs: ["rule-general-support", policyId],
        };
      default:
        return {
          policyId,
          policyName: "Extensible case-type review policy",
          decision: "review",
          rationale: `Unknown/future case type ${caseType} held for policy review`,
          authorityLevel: REFUND_DISPUTE_WORKER_IDENTITY.authorityLevel,
          withinDelegatedAuthority: true,
          marketplaceRuleRefs: ["rule-extensible-case-review", policyId],
        };
    }
  }

  deriveStatusFromPolicy(decision: PolicyDecision): CaseStatus {
    switch (decision) {
      case "escalate":
        return "escalated";
      case "deny":
        return "denied";
      case "allow":
        return "approved";
      case "review":
        return "under_review";
      default:
        return "received";
    }
  }

  caseTypeRequiresSupplier(caseType: CaseType): boolean {
    return (
      caseType === "damaged_product" ||
      caseType === "missing_item" ||
      caseType === "supplier_issue" ||
      caseType === "shipping_issue" ||
      caseType === "return" ||
      caseType === "exchange"
    );
  }

  buildActionsTaken(
    caseType: CaseType,
    policy: PolicyEvaluation,
    status: CaseStatus,
    now: string,
  ): CaseAction[] {
    return [
      {
        actionId: "rdw-act-1",
        action: "receive",
        note: `Received ${caseType} case request`,
        recordedAt: now,
      },
      {
        actionId: "rdw-act-2",
        action: "policy_validate",
        note: `Policy ${policy.policyId} decision=${policy.decision} withinAuthority=${policy.withinDelegatedAuthority}`,
        recordedAt: now,
      },
      {
        actionId: "rdw-act-3",
        action: "status_update",
        note: `Case status set to ${status}`,
        recordedAt: now,
      },
    ];
  }

  buildCustomerCommunications(
    caseType: CaseType,
    status: CaseStatus,
    policy: PolicyEvaluation,
    now: string,
  ): CustomerCommunication[] {
    let message: string;
    if (status === "escalated" || policy.decision === "escalate") {
      message =
        "Your request has been recorded and escalated to Pillow for authorization. No payment or ledger changes have been executed.";
    } else if (status === "denied" || policy.decision === "deny") {
      message =
        "Your request has been reviewed and denied under approved marketplace policies. The request remains on record.";
    } else if (status === "approved" || policy.decision === "allow") {
      message = `Your ${caseType} request has been recorded and approved for operational processing. No financial ledger changes have been executed by this worker.`;
    } else if (status === "awaiting_supplier") {
      message =
        "Your request is under review while we coordinate with the supplier. Status updates will follow.";
    } else if (status === "awaiting_customer") {
      message =
        "Your request is under review and awaiting additional customer information.";
    } else if (status === "resolved" || status === "closed") {
      message = "Your support case has been resolved. Full case history has been preserved.";
    } else {
      message = `Your ${caseType} request has been recorded and is under review.`;
    }

    return [
      {
        communicationId: "rdw-comm-1",
        channel: "customer_notification",
        message,
        generatedAt: now,
        status: "generated",
      },
    ];
  }

  buildSupplierCoordination(
    supplierId: string | null,
    caseType: CaseType,
    now: string,
  ): SupplierCoordination[] {
    const id = supplierId?.trim() || "supplier-unassigned";
    return [
      {
        coordinationId: "rdw-sup-1",
        supplierId: id,
        action: "coordinate",
        note: `Supplier coordination initiated for ${caseType} — preserve supplier references; no ledger writes`,
        recordedAt: now,
      },
    ];
  }

  buildResolution(
    status: CaseStatus,
    resolutionOutcome: string | null,
    policy: PolicyEvaluation,
    recordFinal: boolean,
    now: string,
  ): CaseResolution {
    const terminal =
      status === "resolved" ||
      status === "closed" ||
      status === "denied" ||
      (status === "approved" && recordFinal);

    if (terminal || recordFinal) {
      const outcome =
        resolutionOutcome ||
        (status === "denied"
          ? "denied"
          : status === "escalated"
            ? "escalated"
            : status === "approved"
              ? "approved"
              : "resolved");
      return {
        outcome,
        summary: `Case ${outcome} per policy decision ${policy.decision}. Operational outcome recorded — never modify financial ledgers.`,
        recordedAt: now,
        closed: status !== "escalated",
      };
    }

    return {
      outcome: "open",
      summary: "Case open — awaiting further operational processing",
      recordedAt: null,
      closed: false,
    };
  }

  buildCaseHistory(
    status: CaseStatus,
    policy: PolicyEvaluation,
    now: string,
  ): HistoryEvent[] {
    return [
      {
        eventId: "rdw-ch-1",
        status: "received",
        note: "Case received by Refund & Dispute Worker",
        recordedAt: now,
      },
      {
        eventId: "rdw-ch-2",
        status: "policy_check",
        note: `Policy evaluation completed: ${policy.decision}`,
        recordedAt: now,
      },
      {
        eventId: "rdw-ch-3",
        status: String(status),
        note: `Case status resolved as ${status}`,
        recordedAt: now,
      },
    ];
  }

  buildRecommendedAction(
    caseType: CaseType,
    status: CaseStatus,
    policy: PolicyEvaluation,
    requireSupplier: boolean,
  ): string {
    if (!policy.withinDelegatedAuthority || policy.decision === "escalate") {
      return "Escalate case to Pillow for authorization — never modify financial ledgers or authorize outside Authority Matrix";
    }
    if (status === "denied" || policy.decision === "deny") {
      return "Preserve denied case outcome and customer communication history — take no ledger actions";
    }
    if (requireSupplier && (status === "awaiting_supplier" || status === "under_review")) {
      return `Continue supplier coordination for ${caseType}; preserve supplier references and case traceability`;
    }
    if (status === "approved") {
      return "Operational approval recorded — await authorized downstream execution; never modify financial ledgers directly";
    }
    if (status === "resolved" || status === "closed") {
      return "Preserve complete case, communication, and audit history; no further financial actions";
    }
    if (policy.decision === "review") {
      return "Continue policy review and case tracking under approved policies — escalate if beyond delegated authority";
    }
    return "Continue case workflow tracking, policy validation, and customer communications — never modify financial ledgers";
  }

  compileEvidence(
    caseRequest: CaseRequestInput,
    caseId: string,
    orderId: string,
    customerId: string,
    caseType: CaseType,
    policy: PolicyEvaluation,
    status: CaseStatus,
    orderReportId: string | null,
    input: RefundDisputeWorkerInput,
    orderContext:
      | {
          orderReportId?: string | null;
          orderStatus?: string | null;
        }
      | null
      | undefined,
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
    add(
      "case_request",
      `Case ${caseId} prepared for order ${orderId} / customer ${customerId}`,
      caseRequest.orderId?.trim() || caseRequest.customerId?.trim() ? "fact" : "assumption",
      "case",
    );
    add(
      "case_type",
      `Case type classified as ${caseType}`,
      caseRequest.caseType != null || input.caseType != null ? "fact" : "assumption",
      "classification",
    );
    add(
      "policy_evaluation",
      `Policy ${policy.policyId} decision=${policy.decision} withinAuthority=${policy.withinDelegatedAuthority}`,
      "fact",
      "policy",
    );
    add(
      "case_status",
      `Case status resolved as ${status}`,
      "fact",
      "status",
    );
    if (orderReportId) {
      add(
        "order_worker",
        `Traceable to Order Report ${orderReportId}`,
        "fact",
        "traceability",
      );
    }
    if (orderContext?.orderStatus) {
      add(
        "order_status",
        `Order Worker status observed as ${orderContext.orderStatus}`,
        "fact",
        "order",
      );
    }
    if (caseRequest.evaluationId) {
      add(
        "evaluation_reference",
        `Traceable to evaluation ${caseRequest.evaluationId}`,
        "fact",
        "traceability",
      );
    }
    add(
      "boundary",
      "Workflow-only: does not modify financial ledgers, override marketplace policies, authorize outside Authority Matrix, or override Pillow/Grand King",
      "fact",
      "governance",
    );
    return items;
  }

  scoreConfidence(
    orderId: string,
    customerId: string,
    caseType: CaseType,
    decision: PolicyDecision,
    orderReportId: string | null,
    evidence: EvidenceItem[],
  ): number {
    let score = 0.3;
    if (orderId && !orderId.startsWith("ord-case-")) score += 0.15;
    else if (orderId) score += 0.05;
    if (customerId && !customerId.startsWith("cust-case-")) score += 0.15;
    else if (customerId) score += 0.05;
    if ((CASE_TYPES as readonly string[]).includes(String(caseType))) score += 0.15;
    else if (caseType) score += 0.05;
    if (decision === "allow" || decision === "deny") score += 0.1;
    else if (decision === "escalate") score += 0.05;
    else score += 0.05;
    if (orderReportId?.trim()) score += 0.1;
    score += Math.min(0.1, evidence.filter((e) => e.kind === "fact").length * 0.02);
    return Number(Math.max(0.05, Math.min(0.95, score)).toFixed(2));
  }
}

let caseSequence = 0;

export function resetCaseSequenceForTesting() {
  caseSequence = 0;
}

function cloneReport(report: RefundDisputeReport): RefundDisputeReport {
  return {
    ...report,
    actionsTaken: report.actionsTaken.map((a) => ({ ...a })),
    customerCommunications: report.customerCommunications.map((c) => ({ ...c })),
    escalations: report.escalations.map((e) => ({ ...e })),
    supplierCoordination: report.supplierCoordination.map((s) => ({ ...s })),
    caseHistory: report.caseHistory.map((h) => ({ ...h })),
    supportingEvidence: report.supportingEvidence.map((e) => ({ ...e })),
    policyEvaluation: {
      ...report.policyEvaluation,
      marketplaceRuleRefs: [...report.policyEvaluation.marketplaceRuleRefs],
    },
    resolution: { ...report.resolution },
  };
}
