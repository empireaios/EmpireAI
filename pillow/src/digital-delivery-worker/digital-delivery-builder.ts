import type { DigitalDeliveryWorkerConfiguration } from "./configuration.js";
import type { EnrichmentContext } from "./integrations.js";
import {
  DELIVERY_METHODS,
  DELIVERY_TYPES,
  DIGITAL_DELIVERY_WORKER_IDENTITY,
  DIGITAL_DELIVERY_WORKER_REPORT_VERSION,
  DDW_METADATA_VERSION,
} from "./paths.js";
import type {
  AccessGrant,
  DeliveredAsset,
  DeliveryContext,
  DeliveryMethod,
  DeliveryStatus,
  DeliveryStep,
  DeliveryType,
  DigitalDeliveryReport,
  DigitalDeliveryWorkerCatalog,
  DigitalDeliveryWorkerInput,
  FulfilmentConfirmation,
  IntegrationHandshake,
  RetryStatus,
  SecureDownloadLink,
  SelfReviewFinding,
  SelfReviewResult,
} from "./types.js";

/** Pure Digital Delivery Worker helpers for Q5-10 — fulfilment (structural signals). */
export class DigitalDeliveryBuilder {
  buildCatalog(
    config: DigitalDeliveryWorkerConfiguration,
    deliveries: DigitalDeliveryReport[],
    integrations: IntegrationHandshake[],
  ): DigitalDeliveryWorkerCatalog {
    return {
      reportVersion: DIGITAL_DELIVERY_WORKER_REPORT_VERSION,
      workerId: config.workerId,
      deliveries: deliveries.map(cloneReport),
      integrations: integrations.map((i) => ({ ...i })),
      metadataVersion: DDW_METADATA_VERSION,
      executiveAuthority: "pillow",
      neverProcessPayments: true,
      neverCreateProducts: true,
      neverPublishStorefronts: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverImplementQ511OrLater: true,
      neverExposeUnauthorizedAccess: true,
    };
  }

  mergeContext(
    input: DigitalDeliveryWorkerInput,
    context: DeliveryContext,
    enrichment?: EnrichmentContext | null,
  ): DeliveryContext {
    const receivedValidatedCheckout =
      context.receivedValidatedCheckout ||
      input.checkoutCompletionValidated === true ||
      Boolean(input.checkoutId?.trim()) ||
      Boolean(input.orderId?.trim()) ||
      Boolean(enrichment?.checkoutId?.trim()) ||
      Boolean(enrichment?.orderId?.trim());
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
      checkoutId: input.checkoutId ?? enrichment?.checkoutId ?? context.checkoutId ?? null,
      orderId: input.orderId ?? enrichment?.orderId ?? context.orderId ?? null,
      productTitle:
        input.productTitle ?? enrichment?.productTitle ?? context.productTitle ?? null,
      productId: input.productId ?? enrichment?.productId ?? context.productId ?? null,
      deliveryType: this.normalizeDeliveryType(
        input.deliveryType ?? enrichment?.deliveryType ?? context.deliveryType,
      ),
      deliveryMethod: this.normalizeDeliveryMethod(
        input.deliveryMethod ?? enrichment?.deliveryMethod ?? context.deliveryMethod,
      ),
      customerReference:
        input.customerReference ??
        enrichment?.customerReference ??
        context.customerReference ??
        null,
      customerEmail:
        input.customerEmail ?? enrichment?.customerEmail ?? context.customerEmail ?? null,
      assetLabels: input.assetLabels ?? enrichment?.assetLabels ?? context.assetLabels ?? [],
      checkoutCompletionValidated:
        input.checkoutCompletionValidated ??
        enrichment?.checkoutCompletionValidated ??
        context.checkoutCompletionValidated ??
        receivedValidatedCheckout,
      purchaseInformationValid:
        input.purchaseInformationValid ??
        enrichment?.purchaseInformationValid ??
        context.purchaseInformationValid ??
        null,
      checkoutReady:
        input.checkoutReady ?? enrichment?.checkoutReady ?? context.checkoutReady ?? null,
      deliveryHandoffStatus:
        input.deliveryHandoffStatus ??
        enrichment?.deliveryHandoffStatus ??
        context.deliveryHandoffStatus ??
        null,
      receivedValidatedCheckout,
    };
  }

  canBuildDelivery(context: DeliveryContext): { ready: boolean; reason?: string } {
    if (
      !context.receivedValidatedCheckout &&
      !context.checkoutCompletionValidated &&
      !context.checkoutId &&
      !context.orderId
    ) {
      return {
        ready: false,
        reason:
          "Validated checkout completion required (checkoutId, orderId, or checkoutCompletionValidated)",
      };
    }
    return { ready: true };
  }

  createDeliveryShell(
    input: DigitalDeliveryWorkerInput,
    config: DigitalDeliveryWorkerConfiguration,
    context: DeliveryContext,
  ): DigitalDeliveryReport {
    deliverySequence += 1;
    const now = new Date().toISOString();
    const deliveryType = this.normalizeDeliveryType(
      input.deliveryType ?? context.deliveryType ?? config.defaultDeliveryType,
    );
    const deliveryMethod = this.normalizeDeliveryMethod(
      input.deliveryMethod ?? context.deliveryMethod ?? config.defaultDeliveryMethod,
    );
    const productTitle = this.resolveTitle(context, input);
    const deliveryId =
      input.deliveryId?.trim() || `ddw-dlv-${Date.now()}-${deliverySequence}`;
    const orderId = input.orderId?.trim() || `ddw-ord-${Date.now()}-${deliverySequence}`;
    const productId = input.productId?.trim() || `ddw-prd-${Date.now()}-${deliverySequence}`;
    const businessId =
      input.businessId?.trim() || context.businessId?.trim() || `dbiz-ddw-${deliverySequence}`;
    const factoryMissionId =
      input.factoryMissionId?.trim() ||
      context.factoryMissionId?.trim() ||
      `dpf-ddw-${deliverySequence}`;
    const customerReference =
      input.customerReference?.trim() ||
      context.customerReference?.trim() ||
      `cust-ref-${deliverySequence}`;

    return {
      deliveryId,
      timestamp: now,
      orderId,
      productId,
      customerReference,
      deliveredAssets: [],
      accessGranted: false,
      accessGrants: [],
      deliveryMethod,
      deliveryStatus: "pending",
      retryStatus: "not_required",
      fulfilmentConfirmation: {
        confirmed: false,
        confirmationId: "",
        customerFacingSummary: "",
        confirmedAt: "",
      },
      confidenceScore: 40,
      metadataVersion: DDW_METADATA_VERSION,
      researchReportId: context.researchReportId ?? input.researchReportId ?? null,
      opportunityId: context.opportunityId ?? input.opportunityId ?? null,
      businessId,
      factoryMissionId,
      checkoutId: context.checkoutId ?? input.checkoutId ?? null,
      productTitle,
      deliveryType,
      deliverySteps: [],
      supportedDeliveryMethods: [...DELIVERY_METHODS] as DeliveryMethod[],
      supportedDeliveryTypes: [...DELIVERY_TYPES] as DeliveryType[],
      secureDownloadLinks: [],
      eligibilityVerified: false,
      fulfilmentReady: false,
      selfReviewPassed: false,
      selfReviewFindings: [],
      selfReviewSummary: "Shell created — delivery fulfilment stages pending",
      qualityReview: "",
      complianceReview:
        "Pending — no payment processing, product creation, storefront publishing, or unauthorized access in scope.",
      researchCompliance: "partial",
      researchComplianceNotes:
        "Awaiting fulfilment eligibility verification from validated checkout completion",
      workerId: config.workerId || DIGITAL_DELIVERY_WORKER_IDENTITY.workerId,
      reportVersion: DIGITAL_DELIVERY_WORKER_REPORT_VERSION,
      traceabilityRefs: unique([
        `delivery:${deliveryId}`,
        `order:${orderId}`,
        `product:${productId}`,
        `business:${businessId}`,
        `mission:${factoryMissionId}`,
        ...(context.checkoutId ? [`checkout:${context.checkoutId}`] : []),
        ...(context.researchReportId ? [`research:${context.researchReportId}`] : []),
        `type:${deliveryType}`,
      ]),
      preservedDecisions: [
        {
          decisionId: `ddw-dec-${deliverySequence}-shell`,
          topic: productTitle,
          decision:
            "Materialized fresh delivery shell from validated checkout completion — fulfilment only, no payment processing/product creation/storefront publishing",
          recordedAt: now,
        },
      ],
      submittedToExecutiveReporting: false,
      executiveReportId: null,
      neverProcessPayments: true,
      neverCreateProducts: true,
      neverPublishStorefronts: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverImplementQ511OrLater: true,
      neverExposeUnauthorizedAccess: true,
      deliverOnlyVerifiedPurchases: true,
      protectCustomerAccess: true,
      preserveCompleteFulfilmentTraceability: true,
      validateSuccessfulDelivery: true,
      preserveAuditHistory: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
    };
  }

  verifyFulfilmentEligibility(
    context: DeliveryContext,
    report: Pick<
      DigitalDeliveryReport,
      "deliveryId" | "checkoutId" | "orderId" | "productTitle"
    >,
  ): {
    eligibilityVerified: boolean;
    deliveryStatus: DeliveryStatus;
    errors: string[];
    warnings: string[];
    steps: DeliveryStep[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!context.checkoutCompletionValidated && !context.checkoutId && !context.orderId) {
      errors.push("Checkout completion not validated — orderId or checkoutId required");
    }
    if (context.deliveryHandoffStatus === "blocked") {
      errors.push("Checkout handoff blocked — delivery not eligible");
    }
    if (context.purchaseInformationValid === false) {
      warnings.push("Purchase information not marked valid on checkout");
    }
    if (context.checkoutReady === false) {
      warnings.push("Checkout not marked ready — proceeding with caution");
    }
    const eligibilityVerified = errors.length === 0;
    const steps: DeliveryStep[] = [
      {
        stepId: `ddw-step-${deliverySequence || 1}-eligibility`,
        stepType: "eligibility_verification",
        title: "Verify Fulfilment Eligibility",
        order: 1,
        summary: eligibilityVerified
          ? `Purchase verified for '${report.productTitle}' — checkout ${report.checkoutId ?? report.orderId} eligible for delivery`
          : "Eligibility verification failed — delivery blocked",
      },
    ];
    return {
      eligibilityVerified,
      deliveryStatus: eligibilityVerified ? "eligible" : "blocked",
      errors,
      warnings,
      steps,
    };
  }

  deliverPurchasedDigitalAssets(
    context: DeliveryContext,
    report: Pick<DigitalDeliveryReport, "deliveryId" | "productTitle" | "deliveryMethod">,
  ): {
    deliveredAssets: DeliveredAsset[];
    deliveryStatus: DeliveryStatus;
    steps: DeliveryStep[];
  } {
    const labels =
      context.assetLabels && context.assetLabels.length > 0
        ? context.assetLabels
        : [
            `${report.productTitle} — Primary Digital Asset`,
            `${report.productTitle} — Bonus Resource Pack`,
          ];
    const deliveredAssets: DeliveredAsset[] = labels.map((label, i) => ({
      assetId: `ddw-ast-${deliverySequence || 1}-${i + 1}`,
      assetLabel: label,
      assetType: i === 0 ? "primary_digital_asset" : "bonus_resource",
      deliveryChannel: report.deliveryMethod,
    }));
    const steps: DeliveryStep[] = [
      {
        stepId: `ddw-step-${deliverySequence || 1}-assets`,
        stepType: "asset_delivery",
        title: "Deliver Purchased Digital Assets",
        order: 2,
        summary: `Delivered ${deliveredAssets.length} digital asset(s) for '${report.productTitle}' via ${report.deliveryMethod}`,
      },
    ];
    return {
      deliveredAssets,
      deliveryStatus: "delivering",
      steps,
    };
  }

  grantProductAccess(
    context: DeliveryContext,
    report: Pick<DigitalDeliveryReport, "deliveryId" | "productTitle" | "productId">,
  ): {
    accessGranted: boolean;
    accessGrants: AccessGrant[];
    deliveryStatus: DeliveryStatus;
    steps: DeliveryStep[];
  } {
    const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    const accessGrants: AccessGrant[] = [
      {
        grantId: `ddw-grant-${deliverySequence || 1}-1`,
        accessType: "product_access",
        scope: `product:${report.productId}`,
        expiresAtPlaceholder: expiresAt,
      },
    ];
    if (context.customerEmail) {
      accessGrants.push({
        grantId: `ddw-grant-${deliverySequence || 1}-2`,
        accessType: "customer_portal_access",
        scope: `customer:${context.customerReference ?? "verified"}`,
        expiresAtPlaceholder: expiresAt,
      });
    }
    const steps: DeliveryStep[] = [
      {
        stepId: `ddw-step-${deliverySequence || 1}-access`,
        stepType: "access_granting",
        title: "Grant Product Access",
        order: 3,
        summary: `Granted ${accessGrants.length} access grant(s) for '${report.productTitle}' — customer access protected`,
      },
    ];
    return {
      accessGranted: true,
      accessGrants,
      deliveryStatus: "access_granted",
      steps,
    };
  }

  generateSecureDownloadLinks(
    deliveredAssets: DeliveredAsset[],
  ): {
    secureDownloadLinks: SecureDownloadLink[];
    deliveryStatus: DeliveryStatus;
    steps: DeliveryStep[];
  } {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const secureDownloadLinks: SecureDownloadLink[] = deliveredAssets.map((asset, i) => ({
      linkId: `ddw-lnk-${deliverySequence || 1}-${i + 1}`,
      assetId: asset.assetId,
      urlPlaceholder: `https://delivery.empireai.local/dl/${asset.assetId}/placeholder`,
      expiresAtPlaceholder: expiresAt,
      authorized: true as const,
      tokenPresent: false as const,
    }));
    const steps: DeliveryStep[] = [
      {
        stepId: `ddw-step-${deliverySequence || 1}-links`,
        stepType: "download_link_generation",
        title: "Generate Secure Download Links",
        order: 4,
        summary: `Generated ${secureDownloadLinks.length} secure download link placeholder(s) — no live tokens or secrets`,
      },
    ];
    return {
      secureDownloadLinks,
      deliveryStatus: "links_generated",
      steps,
    };
  }

  trackDeliveryStatus(
    report: Pick<
      DigitalDeliveryReport,
      "deliveryStatus" | "deliveredAssets" | "accessGranted" | "secureDownloadLinks"
    >,
  ): {
    deliveryStatus: DeliveryStatus;
    summary: string;
    steps: DeliveryStep[];
  } {
    let status: DeliveryStatus = report.deliveryStatus;
    if (
      report.deliveredAssets.length > 0 &&
      report.accessGranted &&
      report.secureDownloadLinks.length > 0
    ) {
      status = "delivered";
    } else if (report.deliveredAssets.length > 0) {
      status = report.deliveryStatus === "links_generated" ? "links_generated" : "delivering";
    }
    const steps: DeliveryStep[] = [
      {
        stepId: `ddw-step-${deliverySequence || 1}-status`,
        stepType: "status_tracking",
        title: "Track Delivery Status",
        order: 5,
        summary: `Delivery status tracked: ${status} — assets=${report.deliveredAssets.length}, access=${report.accessGranted}, links=${report.secureDownloadLinks.length}`,
      },
    ];
    return {
      deliveryStatus: status,
      summary: `Delivery status: ${status}`,
      steps,
    };
  }

  handleDeliveryRetries(
    report: Pick<DigitalDeliveryReport, "deliveryStatus" | "retryStatus">,
    config: DigitalDeliveryWorkerConfiguration,
  ): {
    retryStatus: RetryStatus;
    deliveryStatus: DeliveryStatus;
    steps: DeliveryStep[];
    notes: string;
  } {
    const maxAttempts = config.retryPolicyAttempts;
    if (report.deliveryStatus === "failed") {
      return {
        retryStatus: "exhausted",
        deliveryStatus: "failed",
        steps: [
          {
            stepId: `ddw-step-${deliverySequence || 1}-retry`,
            stepType: "retry_workflow",
            title: "Handle Delivery Retries",
            order: 6,
            summary: "Retry attempts exhausted — manual intervention required",
          },
        ],
        notes: `Delivery retries exhausted after ${maxAttempts} attempts`,
      };
    }
    if (report.deliveryStatus === "retrying") {
      return {
        retryStatus: "in_progress",
        deliveryStatus: "retrying",
        steps: [
          {
            stepId: `ddw-step-${deliverySequence || 1}-retry`,
            stepType: "retry_workflow",
            title: "Handle Delivery Retries",
            order: 6,
            summary: `Retry in progress (max ${maxAttempts} attempts)`,
          },
        ],
        notes: `Delivery retry scheduled — up to ${maxAttempts} attempts`,
      };
    }
    return {
      retryStatus: "not_required",
      deliveryStatus: report.deliveryStatus,
      steps: [
        {
          stepId: `ddw-step-${deliverySequence || 1}-retry`,
          stepType: "retry_workflow",
          title: "Handle Delivery Retries",
          order: 6,
          summary: "No retry required — delivery proceeding normally",
        },
      ],
      notes: "No delivery retry required",
    };
  }

  detectFulfilmentFailures(
    report: Pick<
      DigitalDeliveryReport,
      "deliveryStatus" | "eligibilityVerified" | "deliveredAssets" | "accessGranted"
    >,
  ): {
    deliveryStatus: DeliveryStatus;
    failures: string[];
    steps: DeliveryStep[];
  } {
    const failures: string[] = [];
    if (!report.eligibilityVerified) {
      failures.push("Eligibility not verified");
    }
    if (report.deliveryStatus === "blocked") {
      failures.push("Delivery blocked due to eligibility failure");
    }
    if (report.eligibilityVerified && !report.deliveredAssets.length) {
      failures.push("No assets delivered despite eligibility");
    }
    if (report.deliveredAssets.length > 0 && !report.accessGranted) {
      failures.push("Assets delivered but access not granted");
    }
    const deliveryStatus: DeliveryStatus =
      failures.length > 0 && report.deliveryStatus !== "delivered"
        ? failures.some((f) => f.includes("blocked"))
          ? "blocked"
          : "failed"
        : report.deliveryStatus;
    const steps: DeliveryStep[] = [
      {
        stepId: `ddw-step-${deliverySequence || 1}-failures`,
        stepType: "failure_detection",
        title: "Detect Fulfilment Failures",
        order: 7,
        summary:
          failures.length > 0
            ? `Detected ${failures.length} fulfilment failure(s): ${failures.join("; ")}`
            : "No fulfilment failures detected",
      },
    ];
    return { deliveryStatus, failures, steps };
  }

  produceCustomerDeliveryConfirmations(
    report: Pick<
      DigitalDeliveryReport,
      "deliveryId" | "productTitle" | "deliveredAssets" | "deliveryStatus"
    >,
  ): {
    fulfilmentConfirmation: FulfilmentConfirmation;
    deliveryStatus: DeliveryStatus;
    steps: DeliveryStep[];
  } {
    const now = new Date().toISOString();
    const confirmed =
      report.deliveryStatus === "delivered" ||
      report.deliveryStatus === "confirmed" ||
      report.deliveryStatus === "links_generated";
    const fulfilmentConfirmation: FulfilmentConfirmation = {
      confirmed,
      confirmationId: confirmed ? `ddw-conf-${deliverySequence || 1}` : "",
      customerFacingSummary: confirmed
        ? `Your purchase of '${report.productTitle}' has been fulfilled. ${report.deliveredAssets.length} digital asset(s) are ready for access.`
        : "Delivery confirmation pending — fulfilment in progress.",
      confirmedAt: confirmed ? now : "",
    };
    const steps: DeliveryStep[] = [
      {
        stepId: `ddw-step-${deliverySequence || 1}-confirmation`,
        stepType: "delivery_confirmation",
        title: "Produce Customer Delivery Confirmation",
        order: 8,
        summary: confirmed
          ? `Customer delivery confirmation produced for '${report.productTitle}'`
          : "Customer delivery confirmation pending",
      },
    ];
    return {
      fulfilmentConfirmation,
      deliveryStatus: confirmed ? "confirmed" : report.deliveryStatus,
      steps,
    };
  }

  validateDeliveryReadiness(
    report: Pick<
      DigitalDeliveryReport,
      | "deliveredAssets"
      | "accessGranted"
      | "accessGrants"
      | "secureDownloadLinks"
      | "eligibilityVerified"
      | "fulfilmentConfirmation"
      | "neverProcessPayments"
      | "neverExposeUnauthorizedAccess"
    >,
  ): {
    fulfilmentReady: boolean;
    errors: string[];
    warnings: string[];
    summary: string;
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!report.eligibilityVerified) errors.push("Fulfilment eligibility not verified");
    if (!report.deliveredAssets.length) errors.push("No delivered assets");
    if (!report.accessGranted) errors.push("Product access not granted");
    if (!report.accessGrants.length) warnings.push("No access grants recorded");
    if (!report.secureDownloadLinks.length) warnings.push("No secure download links generated");
    for (const link of report.secureDownloadLinks) {
      if (link.tokenPresent) errors.push("Secure download links must never include live tokens");
    }
    if (!report.neverProcessPayments) {
      errors.push("Delivery boundaries must force-lock neverProcessPayments");
    }
    if (!report.neverExposeUnauthorizedAccess) {
      errors.push("Delivery must never expose unauthorized access");
    }
    const fulfilmentReady = errors.length === 0;
    return {
      fulfilmentReady,
      errors,
      warnings,
      summary: fulfilmentReady
        ? "Delivery readiness validated — structural fulfilment complete; no payment processing or unauthorized access."
        : `Delivery readiness incomplete — ${errors.join("; ")}`,
    };
  }

  performQualityReview(
    report: Pick<
      DigitalDeliveryReport,
      | "productTitle"
      | "deliveredAssets"
      | "accessGranted"
      | "accessGrants"
      | "secureDownloadLinks"
      | "eligibilityVerified"
      | "fulfilmentReady"
      | "fulfilmentConfirmation"
      | "deliveryStatus"
      | "researchReportId"
      | "neverProcessPayments"
      | "neverExposeUnauthorizedAccess"
    >,
    context: DeliveryContext,
  ): SelfReviewResult {
    const findings: SelfReviewFinding[] = [];
    let score = 70;
    if (!report.eligibilityVerified) {
      findings.push({
        findingId: `ddw-f-${deliverySequence}-eligibility`,
        category: "eligibility",
        severity: "error",
        message: "Fulfilment eligibility not verified",
      });
      score -= 20;
    } else {
      score += 8;
    }
    if (!report.deliveredAssets.length) {
      findings.push({
        findingId: `ddw-f-${deliverySequence}-assets`,
        category: "assets",
        severity: "warning",
        message: "No delivered assets yet",
      });
      score -= 5;
    } else {
      score += 5;
    }
    if (!report.accessGranted) {
      findings.push({
        findingId: `ddw-f-${deliverySequence}-access`,
        category: "access",
        severity: "warning",
        message: "Product access not yet granted",
      });
      score -= 5;
    } else {
      score += 5;
    }
    if (!report.secureDownloadLinks.length) {
      findings.push({
        findingId: `ddw-f-${deliverySequence}-links`,
        category: "download_links",
        severity: "warning",
        message: "Secure download links not yet generated",
      });
      score -= 4;
    } else {
      score += 4;
      for (const link of report.secureDownloadLinks) {
        if (link.tokenPresent) {
          findings.push({
            findingId: `ddw-f-${deliverySequence}-token`,
            category: "security",
            severity: "error",
            message: "Secure download links must never include live tokens",
          });
          score -= 25;
        }
      }
    }
    if (!report.fulfilmentConfirmation.confirmed) {
      findings.push({
        findingId: `ddw-f-${deliverySequence}-confirmation`,
        category: "confirmation",
        severity: "warning",
        message: "Customer delivery confirmation not yet produced",
      });
      score -= 3;
    } else {
      score += 4;
    }
    if (!report.fulfilmentReady) {
      findings.push({
        findingId: `ddw-f-${deliverySequence}-ready`,
        category: "readiness",
        severity: "warning",
        message: "Delivery readiness not yet validated",
      });
      score -= 4;
    } else {
      score += 5;
    }
    if (!report.researchReportId && !context.researchReportId) {
      findings.push({
        findingId: `ddw-f-${deliverySequence}-research`,
        category: "research_compliance",
        severity: "warning",
        message: "No researchReportId bound; intent derived from checkout context",
      });
      score -= 4;
    } else {
      score += 6;
    }

    const confidenceScore = clamp(score, 0, 100);
    const hasCore =
      report.eligibilityVerified &&
      report.deliveredAssets.length > 0 &&
      report.accessGranted &&
      report.secureDownloadLinks.length > 0;
    const passed = findings.every((f) => f.severity !== "error") && hasCore;
    const researchCompliance =
      report.researchReportId || context.researchReportId
        ? passed
          ? ("compliant" as const)
          : ("partial" as const)
        : ("partial" as const);
    const complianceReview =
      "Compliance review: no payment processing; no product creation; no storefront publishing; no unauthorized access exposure; structural digital delivery only; verified purchases only; customer access protected.";
    const summary = passed
      ? `Quality review passed for '${report.productTitle}' with confidence ${confidenceScore}/100. Digital delivery is ready as structural signals only.`
      : `Quality review incomplete for '${report.productTitle}' (confidence ${confidenceScore}/100). Resolve findings before executive submission.`;
    const qualityReview = passed
      ? `Quality review: assets=${report.deliveredAssets.length}, access=${report.accessGranted}, links=${report.secureDownloadLinks.length}, eligibility=${report.eligibilityVerified}, ready=${report.fulfilmentReady}, status=${report.deliveryStatus}; researchCompliance=${researchCompliance}.`
      : `Quality review: gaps remain — ${findings.map((f) => f.message).join("; ")}.`;

    return {
      passed,
      summary,
      qualityReview,
      complianceReview,
      findings,
      confidenceScore,
      researchCompliance,
      researchComplianceNotes:
        researchCompliance === "compliant"
          ? "Delivery follows validated checkout completion"
          : "Delivery partially aligned to available checkout context signals",
      eligibilityVerified: report.eligibilityVerified,
      fulfilmentReady: report.fulfilmentReady,
    };
  }

  buildDigitalDeliveryReport(
    input: DigitalDeliveryWorkerInput,
    config: DigitalDeliveryWorkerConfiguration,
    context: DeliveryContext,
  ): DigitalDeliveryReport {
    deliverySequence += 1;
    const shell = this.createDeliveryShell(input, config, context);
    const eligibility = this.verifyFulfilmentEligibility(context, shell);
    const assets = this.deliverPurchasedDigitalAssets(context, shell);
    const access = this.grantProductAccess(context, shell);
    const links = this.generateSecureDownloadLinks(assets.deliveredAssets);
    const status = this.trackDeliveryStatus({
      deliveryStatus: links.deliveryStatus,
      deliveredAssets: assets.deliveredAssets,
      accessGranted: access.accessGranted,
      secureDownloadLinks: links.secureDownloadLinks,
    });
    const retries = this.handleDeliveryRetries(
      { deliveryStatus: status.deliveryStatus, retryStatus: shell.retryStatus },
      config,
    );
    const failures = this.detectFulfilmentFailures({
      deliveryStatus: status.deliveryStatus,
      eligibilityVerified: eligibility.eligibilityVerified,
      deliveredAssets: assets.deliveredAssets,
      accessGranted: access.accessGranted,
    });
    const confirmation = this.produceCustomerDeliveryConfirmations({
      deliveryId: shell.deliveryId,
      productTitle: shell.productTitle,
      deliveredAssets: assets.deliveredAssets,
      deliveryStatus: failures.deliveryStatus,
    });
    const allSteps = [
      ...eligibility.steps,
      ...assets.steps,
      ...access.steps,
      ...links.steps,
      ...status.steps,
      ...retries.steps,
      ...failures.steps,
      ...confirmation.steps,
    ];
    const readiness = this.validateDeliveryReadiness({
      deliveredAssets: assets.deliveredAssets,
      accessGranted: access.accessGranted,
      accessGrants: access.accessGrants,
      secureDownloadLinks: links.secureDownloadLinks,
      eligibilityVerified: eligibility.eligibilityVerified,
      fulfilmentConfirmation: confirmation.fulfilmentConfirmation,
      neverProcessPayments: true,
      neverExposeUnauthorizedAccess: true,
    });
    const draftForReview = {
      productTitle: shell.productTitle,
      deliveredAssets: assets.deliveredAssets,
      accessGranted: access.accessGranted,
      accessGrants: access.accessGrants,
      secureDownloadLinks: links.secureDownloadLinks,
      eligibilityVerified: eligibility.eligibilityVerified,
      fulfilmentReady: readiness.fulfilmentReady,
      fulfilmentConfirmation: confirmation.fulfilmentConfirmation,
      deliveryStatus: confirmation.deliveryStatus,
      researchReportId: shell.researchReportId,
      neverProcessPayments: true as const,
      neverExposeUnauthorizedAccess: true as const,
    };
    const review = this.performQualityReview(draftForReview, context);
    const confidenceScore =
      input.confidenceScore != null && Number.isFinite(input.confidenceScore)
        ? clamp(input.confidenceScore, 0, 100)
        : review.confidenceScore;

    return {
      ...shell,
      deliveredAssets: assets.deliveredAssets,
      accessGranted: access.accessGranted,
      accessGrants: access.accessGrants,
      secureDownloadLinks: links.secureDownloadLinks,
      deliveryStatus: confirmation.deliveryStatus,
      retryStatus: retries.retryStatus,
      fulfilmentConfirmation: confirmation.fulfilmentConfirmation,
      deliverySteps: allSteps,
      eligibilityVerified: eligibility.eligibilityVerified,
      fulfilmentReady: readiness.fulfilmentReady,
      confidenceScore,
      selfReviewPassed: review.passed,
      selfReviewFindings: review.findings,
      selfReviewSummary: review.summary,
      qualityReview: review.qualityReview,
      complianceReview: review.complianceReview,
      researchCompliance: review.researchCompliance,
      researchComplianceNotes: review.researchComplianceNotes,
      preservedDecisions: [
        ...shell.preservedDecisions,
        {
          decisionId: `ddw-dec-${deliverySequence}-pack`,
          topic: shell.productTitle,
          decision: `Built delivery pack (${allSteps.length} steps, ${assets.deliveredAssets.length} assets, ${links.secureDownloadLinks.length} links) — fulfilment only, no payment processing`,
          recordedAt: new Date().toISOString(),
        },
        {
          decisionId: `ddw-dec-${deliverySequence}-retry`,
          topic: shell.productTitle,
          decision: retries.notes,
          recordedAt: new Date().toISOString(),
        },
      ],
    };
  }

  normalizeDeliveryType(type: string | DeliveryType | null | undefined): DeliveryType {
    const raw = type?.trim() ?? "";
    if (raw && (DELIVERY_TYPES as readonly string[]).includes(raw)) {
      return raw as DeliveryType;
    }
    const lower = raw.toLowerCase();
    switch (lower) {
      case "download":
      case "file_download":
        return "secure_file_download";
      case "access":
      case "account":
        return "account_access";
      case "bundle":
        return "bundle_delivery";
      case "multiple":
      case "multi_asset":
        return "multiple_asset_delivery";
      default:
        return raw ? "unknown" : "secure_file_download";
    }
  }

  normalizeDeliveryMethod(
    method: string | DeliveryMethod | null | undefined,
  ): DeliveryMethod {
    const raw = method?.trim() ?? "";
    if (raw && (DELIVERY_METHODS as readonly string[]).includes(raw)) {
      return raw as DeliveryMethod;
    }
    const lower = raw.toLowerCase();
    switch (lower) {
      case "download":
      case "file_download":
        return "secure_file_download";
      case "access":
      case "account":
        return "account_access";
      case "bundle":
        return "bundle_delivery";
      case "multiple":
      case "multi_asset":
        return "multiple_asset_delivery";
      default:
        return raw ? "unknown" : "secure_file_download";
    }
  }

  private resolveTitle(context: DeliveryContext, input?: DigitalDeliveryWorkerInput): string {
    return (
      input?.productTitle?.trim() ||
      context.productTitle?.trim() ||
      "Digital Product Delivery"
    );
  }
}

let deliverySequence = 0;

export function resetDeliverySequenceForTesting() {
  deliverySequence = 0;
}

function cloneReport(report: DigitalDeliveryReport): DigitalDeliveryReport {
  return {
    ...report,
    deliveredAssets: report.deliveredAssets.map((a) => ({ ...a })),
    accessGrants: report.accessGrants.map((g) => ({ ...g })),
    deliverySteps: report.deliverySteps.map((s) => ({ ...s })),
    supportedDeliveryMethods: [...report.supportedDeliveryMethods],
    supportedDeliveryTypes: [...report.supportedDeliveryTypes],
    secureDownloadLinks: report.secureDownloadLinks.map((l) => ({
      ...l,
      authorized: true as const,
      tokenPresent: false as const,
    })),
    selfReviewFindings: report.selfReviewFindings.map((f) => ({ ...f })),
    traceabilityRefs: [...report.traceabilityRefs],
    preservedDecisions: report.preservedDecisions.map((d) => ({ ...d })),
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}
