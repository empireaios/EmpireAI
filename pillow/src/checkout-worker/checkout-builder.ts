import type { CheckoutWorkerConfiguration } from "./configuration.js";
import type { EnrichmentContext } from "./integrations.js";
import {
  CHECKOUT_FLOW_TYPES,
  CHECKOUT_WORKER_IDENTITY,
  CHECKOUT_WORKER_REPORT_VERSION,
  CKW_METADATA_VERSION,
  FEATURES,
  PAYMENT_PROVIDERS,
  PRODUCT_TYPES,
} from "./paths.js";
import type {
  CheckoutContext,
  CheckoutFeature,
  CheckoutFlow,
  CheckoutFlowStep,
  CheckoutFlowType,
  CheckoutReport,
  CheckoutWorkerCatalog,
  CheckoutWorkerInput,
  ConfirmationWorkflow,
  IntegrationHandshake,
  OrderSummary,
  PaymentProvider,
  PaymentProviderConfiguration,
  ProductType,
  SelfReviewFinding,
  SelfReviewResult,
} from "./types.js";

/** Pure Checkout Worker helpers for Q5-09 — checkout preparation (structural signals). */
export class CheckoutBuilder {
  buildCatalog(
    config: CheckoutWorkerConfiguration,
    checkouts: CheckoutReport[],
    integrations: IntegrationHandshake[],
  ): CheckoutWorkerCatalog {
    return {
      reportVersion: CHECKOUT_WORKER_REPORT_VERSION,
      workerId: config.workerId,
      checkouts: checkouts.map(cloneReport),
      integrations: integrations.map((i) => ({ ...i })),
      metadataVersion: CKW_METADATA_VERSION,
      executiveAuthority: "pillow",
      neverChargeCustomers: true,
      neverExecutePaymentTransactions: true,
      neverDeliverProducts: true,
      neverPublishStorefronts: true,
      neverStoreSensitivePaymentCredentials: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    };
  }

  mergeContext(
    input: CheckoutWorkerInput,
    context: CheckoutContext,
    enrichment?: EnrichmentContext | null,
  ): CheckoutContext {
    const receivedProductInformation =
      context.receivedProductInformation ||
      Boolean(input.researchReportId?.trim()) ||
      Boolean(enrichment?.researchReportId?.trim()) ||
      Boolean(input.researchTopic?.trim()) ||
      Boolean(enrichment?.researchTopic?.trim()) ||
      Boolean(input.productTitle?.trim()) ||
      Boolean(enrichment?.productTitle?.trim());
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
      salesPageId: input.salesPageId ?? enrichment?.salesPageId ?? context.salesPageId ?? null,
      productTitle:
        input.productTitle ?? enrichment?.productTitle ?? context.productTitle ?? null,
      productType: this.normalizeProductType(
        input.productType ?? enrichment?.productType ?? context.productType,
      ),
      checkoutFlowType: this.normalizeCheckoutFlow(
        input.checkoutFlowType ?? enrichment?.checkoutFlowType ?? context.checkoutFlowType,
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
      productDescription:
        input.productDescription ??
        enrichment?.productDescription ??
        context.productDescription ??
        null,
      pricingHint: input.pricingHint ?? context.pricingHint ?? null,
      currency: input.currency ?? enrichment?.currency ?? context.currency ?? null,
      preferredProviders:
        (input.preferredProviders as PaymentProvider[] | null | undefined) ??
        context.preferredProviders ??
        null,
      receivedProductInformation,
    };
  }

  canBuildCheckout(context: CheckoutContext): { ready: boolean; reason?: string } {
    if (
      !context.receivedProductInformation &&
      !context.researchReportId &&
      !context.researchTopic &&
      !context.productTitle
    ) {
      return {
        ready: false,
        reason:
          "Approved digital product information required (researchReportId, researchTopic, or productTitle)",
      };
    }
    return { ready: true };
  }

  createCheckoutShell(
    input: CheckoutWorkerInput,
    config: CheckoutWorkerConfiguration,
    context: CheckoutContext,
  ): CheckoutReport {
    checkoutSequence += 1;
    const now = new Date().toISOString();
    const checkoutFlowType = this.normalizeCheckoutFlow(
      input.checkoutFlowType ?? context.checkoutFlowType ?? config.defaultCheckoutFlow,
    );
    const productType = this.normalizeProductType(
      input.productType ?? context.productType ?? config.defaultProductType,
    );
    const productTitle = this.resolveTitle(context, input);
    const checkoutId =
      input.checkoutId?.trim() || `ckw-chk-${Date.now()}-${checkoutSequence}`;
    const productId = input.productId?.trim() || `ckw-prd-${Date.now()}-${checkoutSequence}`;
    const businessId =
      input.businessId?.trim() || context.businessId?.trim() || `dbiz-ckw-${checkoutSequence}`;
    const factoryMissionId =
      input.factoryMissionId?.trim() ||
      context.factoryMissionId?.trim() ||
      `dpf-ckw-${checkoutSequence}`;

    return {
      checkoutId,
      timestamp: now,
      productId,
      productTitle,
      checkoutFlow: {
        flowType: checkoutFlowType,
        label: `${checkoutFlowType} (pending workflow generation)`,
        steps: [],
      },
      paymentProviderConfiguration: null,
      orderSummary: null,
      customerInformationRequirements: [],
      deliveryHandoffStatus: "not_prepared",
      validationResults: {
        summary: "Shell created — checkout stages pending",
        errors: [],
        warnings: [],
        purchaseInformationValid: false,
        checkoutReady: false,
      },
      confidenceScore: 40,
      metadataVersion: CKW_METADATA_VERSION,
      researchReportId: context.researchReportId ?? input.researchReportId ?? null,
      opportunityId: context.opportunityId ?? input.opportunityId ?? null,
      businessId,
      factoryMissionId,
      salesPageId: context.salesPageId ?? input.salesPageId ?? null,
      checkoutFlowType,
      productType,
      checkoutFlowSteps: [],
      supportedProviders: [],
      supportedFeatures: [...FEATURES] as CheckoutFeature[],
      confirmationWorkflow: null,
      purchaseInformationValid: false,
      checkoutReady: false,
      handoffTarget: "digital-delivery-worker",
      handoffTargetWorkerId: "wkr-digital-delivery-01",
      selfReviewPassed: false,
      selfReviewFindings: [],
      selfReviewSummary: "Shell created — checkout preparation stages pending",
      qualityReview: "",
      complianceReview:
        "Pending — no charging, payment execution, delivery, storefront publishing, or credential storage in scope.",
      researchCompliance: "partial",
      researchComplianceNotes:
        "Awaiting checkout workflow preparation from approved product information",
      workerId: config.workerId || CHECKOUT_WORKER_IDENTITY.workerId,
      reportVersion: CHECKOUT_WORKER_REPORT_VERSION,
      traceabilityRefs: unique([
        `checkout:${checkoutId}`,
        `product:${productId}`,
        `business:${businessId}`,
        `mission:${factoryMissionId}`,
        ...(context.researchReportId ? [`research:${context.researchReportId}`] : []),
        ...(context.salesPageId ? [`salesPage:${context.salesPageId}`] : []),
        `flow:${checkoutFlowType}`,
      ]),
      preservedDecisions: [
        {
          decisionId: `ckw-dec-${checkoutSequence}-shell`,
          topic: productTitle,
          decision:
            "Materialized fresh checkout shell from approved product information — preparation only, no charging/payment execution/delivery/storefront publishing",
          recordedAt: now,
        },
      ],
      submittedToExecutiveReporting: false,
      executiveReportId: null,
      neverChargeCustomers: true,
      neverExecutePaymentTransactions: true,
      neverDeliverProducts: true,
      neverPublishStorefronts: true,
      neverStoreSensitivePaymentCredentials: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverImplementQ510OrLater: true,
      followApprovedProductInformation: true,
      preserveCompleteTraceability: true,
      validateCheckoutIntegrityBeforeSubmission: true,
      preserveAuditHistory: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
    };
  }

  generateCheckoutWorkflow(context: CheckoutContext, config: CheckoutWorkerConfiguration): CheckoutFlow {
    const title = this.resolveTitle(context);
    const flowType = this.normalizeCheckoutFlow(
      context.checkoutFlowType ?? config.defaultCheckoutFlow,
    );
    const stepDefs: Array<{ stepType: string; title: string; summary: string }> = [
      {
        stepType: "product_review",
        title: "Review Product Offer",
        summary: `Customer reviews '${title}' offer details before purchase commitment.`,
      },
      {
        stepType: "customer_information",
        title: "Collect Customer Information",
        summary: "Capture required purchase fields (email, name, billing country) — never card data.",
      },
      {
        stepType: "order_summary",
        title: "Confirm Order Summary",
        summary: "Present line items, subtotal, currency, and discount/coupon placeholders.",
      },
      {
        stepType: "payment_method_selection",
        title: "Select Payment Method",
        summary:
          "Structural payment-method selection via provider abstraction — Checkout Worker never charges.",
      },
      {
        stepType: "confirmation",
        title: "Customer Confirmation",
        summary: "Confirm purchase intent and display confirmation workflow steps.",
      },
      {
        stepType: "post_payment_handoff",
        title: "Prepare Delivery Handoff",
        summary:
          "Signal readiness for Digital Delivery Worker (wkr-digital-delivery-01) — no delivery execution.",
      },
    ];
    if (flowType === "lead_to_checkout") {
      stepDefs.unshift({
        stepType: "lead_capture",
        title: "Lead Capture Gate",
        summary: `Lead-to-checkout path for '${title}' — capture interest before checkout commitment.`,
      });
    }
    if (flowType === "subscription_ready_placeholder") {
      stepDefs.splice(3, 0, {
        stepType: "subscription_placeholder",
        title: "Subscription Readiness Placeholder",
        summary:
          "Structural subscription-ready placeholder — not live billing or recurring charge execution.",
      });
    }
    const steps: CheckoutFlowStep[] = stepDefs.map((def, i) => ({
      stepId: `ckw-step-${checkoutSequence || 1}-${i + 1}`,
      stepType: def.stepType,
      title: def.title,
      order: i + 1,
      summary: def.summary,
    }));
    return {
      flowType,
      label: `${flowType} workflow for ${title}`,
      steps,
    };
  }

  preparePaymentProviderConfiguration(
    context: CheckoutContext,
    config: CheckoutWorkerConfiguration,
    provider?: PaymentProvider | string | null,
  ): PaymentProviderConfiguration {
    const resolved = this.normalizeProvider(
      provider ?? context.preferredProviders?.[0] ?? "stripe_ready",
    );
    const currency = (context.currency?.trim() || config.defaultCurrency || "USD").toUpperCase();
    const providerName = resolved.replace(/_ready$/, "").replace(/_/g, " ");
    return {
      provider: resolved,
      providerName: providerName.charAt(0).toUpperCase() + providerName.slice(1),
      mode: resolved === "manual_invoice_ready" ? "manual" : "test_ready",
      currency,
      webhookEndpointPlaceholder: `https://checkout.empireai.local/webhooks/${resolved}`,
      supportedMethods:
        resolved === "manual_invoice_ready"
          ? ["invoice", "bank_transfer_placeholder"]
          : ["card_placeholder", "wallet_placeholder"],
      apiKeyPresent: false,
      secretsPresent: false,
    };
  }

  generateOrderSummary(
    context: CheckoutContext,
    config: CheckoutWorkerConfiguration,
  ): OrderSummary {
    const title = this.resolveTitle(context);
    const currency = (context.currency?.trim() || config.defaultCurrency || "USD").toUpperCase();
    const unitAmount = this.parsePricingHint(context.pricingHint) ?? 49;
    const lineItems = [
      {
        lineItemId: `ckw-line-${checkoutSequence || 1}-1`,
        label: title,
        quantity: 1,
        unitAmount,
        currency,
      },
      {
        lineItemId: `ckw-line-${checkoutSequence || 1}-2`,
        label: `${title} — Digital access packaging`,
        quantity: 1,
        unitAmount: 0,
        currency,
      },
    ];
    const subtotal = lineItems.reduce((sum, item) => sum + item.unitAmount * item.quantity, 0);
    return {
      lineItems,
      subtotal,
      currency,
      discountPlaceholder: "discount_code_placeholder",
      couponPlaceholder: "coupon_code_placeholder",
      taxPlaceholder: "tax_configuration_placeholder",
      notes:
        "Order summary is a structural checkout signal only — Checkout Worker never charges customers or executes payment transactions.",
    };
  }

  generateCustomerConfirmationWorkflow(context: CheckoutContext): ConfirmationWorkflow {
    const title = this.resolveTitle(context);
    const steps = [
      {
        stepId: `ckw-conf-${checkoutSequence || 1}-1`,
        title: "Purchase Intent Confirmed",
        body: `Customer confirms intent to purchase '${title}' under the prepared checkout workflow.`,
        order: 1,
      },
      {
        stepId: `ckw-conf-${checkoutSequence || 1}-2`,
        title: "Order Summary Acknowledged",
        body: "Customer acknowledges line items, currency, and any discount/coupon placeholders.",
        order: 2,
      },
      {
        stepId: `ckw-conf-${checkoutSequence || 1}-3`,
        title: "Payment Method Selected (Structural)",
        body: "Customer selects a payment method via provider abstraction — no charge is executed by this worker.",
        order: 3,
      },
      {
        stepId: `ckw-conf-${checkoutSequence || 1}-4`,
        title: "Delivery Handoff Prepared",
        body: "Post-payment handoff signal prepared for Digital Delivery Worker — delivery is not executed here.",
        order: 4,
      },
    ];
    return {
      workflowId: `ckw-conf-wf-${checkoutSequence || 1}`,
      steps,
      customerFacingSummary: `Confirmation workflow for '${title}' — structural checkout preparation only.`,
    };
  }

  validateRequiredPurchaseInformation(context: CheckoutContext): {
    requirements: string[];
    purchaseInformationValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const requirements = [
      "email",
      "full_name",
      "billing_country",
      "product_acceptance",
      "terms_acknowledgement",
    ];
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!context.productTitle?.trim() && !context.researchTopic?.trim()) {
      errors.push("Product title required for purchase information validation");
    }
    if (!context.receivedProductInformation && !context.researchReportId) {
      warnings.push("Approved product information signal is thin — validate before submission");
    }
    const purchaseInformationValid = errors.length === 0;
    return { requirements, purchaseInformationValid, errors, warnings };
  }

  preparePostPaymentHandoff(report: Pick<CheckoutReport, "checkoutId" | "productTitle" | "purchaseInformationValid">): {
    deliveryHandoffStatus: "prepared" | "ready_for_handoff" | "blocked";
    handoffTarget: "digital-delivery-worker";
    handoffTargetWorkerId: "wkr-digital-delivery-01";
    notes: string;
  } {
    if (!report.purchaseInformationValid) {
      return {
        deliveryHandoffStatus: "blocked",
        handoffTarget: "digital-delivery-worker",
        handoffTargetWorkerId: "wkr-digital-delivery-01",
        notes: `Handoff blocked for '${report.productTitle}' — purchase information not yet valid. Signal only; no delivery.`,
      };
    }
    return {
      deliveryHandoffStatus: "ready_for_handoff",
      handoffTarget: "digital-delivery-worker",
      handoffTargetWorkerId: "wkr-digital-delivery-01",
      notes: `Post-payment handoff prepared for checkout ${report.checkoutId} → digital-delivery-worker (wkr-digital-delivery-01). Structural signal only — Checkout Worker never delivers products.`,
    };
  }

  configurePaymentProviderAbstraction(
    context: CheckoutContext,
    config: CheckoutWorkerConfiguration,
  ): {
    supportedProviders: PaymentProvider[];
    adapters: PaymentProviderConfiguration[];
  } {
    const preferred = (context.preferredProviders ?? []).map((p) => this.normalizeProvider(p));
    const defaults: PaymentProvider[] = [
      "stripe_ready",
      "paypal_ready",
      "paddle_ready",
      "manual_invoice_ready",
    ];
    const supportedProviders = unique([...preferred, ...defaults]).map((p) =>
      this.normalizeProvider(p),
    ) as PaymentProvider[];
    const adapters = supportedProviders
      .filter((p) => p !== "unknown")
      .map((provider) => this.preparePaymentProviderConfiguration(context, config, provider));
    return { supportedProviders, adapters };
  }

  validateCheckoutReadiness(
    report: Pick<
      CheckoutReport,
      | "checkoutFlow"
      | "paymentProviderConfiguration"
      | "orderSummary"
      | "confirmationWorkflow"
      | "customerInformationRequirements"
      | "purchaseInformationValid"
      | "deliveryHandoffStatus"
      | "neverChargeCustomers"
      | "neverExecutePaymentTransactions"
      | "neverStoreSensitivePaymentCredentials"
    >,
  ): {
    checkoutReady: boolean;
    errors: string[];
    warnings: string[];
    summary: string;
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!report.checkoutFlow.steps.length) errors.push("Checkout workflow steps missing");
    if (!report.paymentProviderConfiguration) {
      errors.push("Payment provider configuration not prepared");
    } else {
      if (report.paymentProviderConfiguration.apiKeyPresent) {
        errors.push("Payment provider configuration must never include API keys");
      }
      if (report.paymentProviderConfiguration.secretsPresent) {
        errors.push("Payment provider configuration must never include secrets");
      }
    }
    if (!report.orderSummary?.lineItems.length) errors.push("Order summary line items missing");
    if (!report.confirmationWorkflow?.steps.length) {
      errors.push("Customer confirmation workflow missing");
    }
    if (!report.customerInformationRequirements.length) {
      errors.push("Customer information requirements missing");
    }
    if (!report.purchaseInformationValid) {
      warnings.push("Purchase information not yet marked valid");
    }
    if (
      report.deliveryHandoffStatus !== "prepared" &&
      report.deliveryHandoffStatus !== "ready_for_handoff"
    ) {
      warnings.push("Post-payment handoff not yet ready");
    }
    if (!report.neverChargeCustomers || !report.neverExecutePaymentTransactions) {
      errors.push("Checkout boundaries must force-lock neverCharge/neverExecute");
    }
    if (!report.neverStoreSensitivePaymentCredentials) {
      errors.push("Checkout must never store sensitive payment credentials");
    }
    const checkoutReady = errors.length === 0;
    return {
      checkoutReady,
      errors,
      warnings,
      summary: checkoutReady
        ? "Checkout readiness validated — structural preparation complete; no charging or delivery executed."
        : `Checkout readiness incomplete — ${errors.join("; ")}`,
    };
  }

  performQualityReview(
    report: Pick<
      CheckoutReport,
      | "productTitle"
      | "checkoutFlow"
      | "paymentProviderConfiguration"
      | "orderSummary"
      | "confirmationWorkflow"
      | "customerInformationRequirements"
      | "purchaseInformationValid"
      | "checkoutReady"
      | "deliveryHandoffStatus"
      | "researchReportId"
      | "neverChargeCustomers"
      | "neverExecutePaymentTransactions"
      | "neverStoreSensitivePaymentCredentials"
    >,
    context: CheckoutContext,
  ): SelfReviewResult {
    const findings: SelfReviewFinding[] = [];
    let score = 70;
    if (!report.checkoutFlow.steps.length) {
      findings.push({
        findingId: `ckw-f-${checkoutSequence}-workflow`,
        category: "workflow",
        severity: "error",
        message: "No checkout workflow steps present",
      });
      score -= 20;
    } else {
      score += 8;
    }
    if (!report.paymentProviderConfiguration) {
      findings.push({
        findingId: `ckw-f-${checkoutSequence}-payments`,
        category: "payments",
        severity: "warning",
        message: "Payment provider configuration not yet prepared",
      });
      score -= 5;
    } else {
      score += 5;
      if (
        report.paymentProviderConfiguration.apiKeyPresent ||
        report.paymentProviderConfiguration.secretsPresent
      ) {
        findings.push({
          findingId: `ckw-f-${checkoutSequence}-secrets`,
          category: "security",
          severity: "error",
          message: "Payment provider configuration must never include secrets or API keys",
        });
        score -= 25;
      }
    }
    if (!report.orderSummary?.lineItems.length) {
      findings.push({
        findingId: `ckw-f-${checkoutSequence}-order`,
        category: "order_summary",
        severity: "warning",
        message: "Order summary not yet generated",
      });
      score -= 4;
    } else {
      score += 4;
    }
    if (!report.confirmationWorkflow?.steps.length) {
      findings.push({
        findingId: `ckw-f-${checkoutSequence}-confirmation`,
        category: "confirmation",
        severity: "warning",
        message: "Customer confirmation workflow not yet generated",
      });
      score -= 4;
    } else {
      score += 4;
    }
    if (!report.customerInformationRequirements.length) {
      findings.push({
        findingId: `ckw-f-${checkoutSequence}-purchase-info`,
        category: "purchase_information",
        severity: "warning",
        message: "Customer information requirements not yet validated",
      });
      score -= 4;
    } else {
      score += 4;
    }
    if (!report.purchaseInformationValid) {
      findings.push({
        findingId: `ckw-f-${checkoutSequence}-purchase-valid`,
        category: "purchase_information",
        severity: "warning",
        message: "Purchase information not marked valid",
      });
      score -= 3;
    } else {
      score += 3;
    }
    if (
      report.deliveryHandoffStatus !== "prepared" &&
      report.deliveryHandoffStatus !== "ready_for_handoff"
    ) {
      findings.push({
        findingId: `ckw-f-${checkoutSequence}-handoff`,
        category: "handoff",
        severity: "warning",
        message: "Post-payment handoff not yet prepared",
      });
      score -= 3;
    } else {
      score += 4;
    }
    if (!report.checkoutReady) {
      findings.push({
        findingId: `ckw-f-${checkoutSequence}-ready`,
        category: "readiness",
        severity: "warning",
        message: "Checkout readiness not yet validated",
      });
      score -= 4;
    } else {
      score += 5;
    }
    if (!report.researchReportId && !context.researchReportId) {
      findings.push({
        findingId: `ckw-f-${checkoutSequence}-research`,
        category: "research_compliance",
        severity: "warning",
        message: "No researchReportId bound; intent derived from available context",
      });
      score -= 4;
    } else {
      score += 6;
    }

    const confidenceScore = clamp(score, 0, 100);
    const hasCore =
      report.checkoutFlow.steps.length > 0 &&
      Boolean(report.paymentProviderConfiguration) &&
      Boolean(report.orderSummary?.lineItems.length);
    const passed = findings.every((f) => f.severity !== "error") && hasCore;
    const researchCompliance =
      report.researchReportId || context.researchReportId
        ? passed
          ? ("compliant" as const)
          : ("partial" as const)
        : ("partial" as const);
    const complianceReview =
      "Compliance review: no customer charging; no payment transaction execution; no product delivery; no storefront publishing; no sensitive payment credentials stored; structural checkout preparation only; approved product information followed.";
    const summary = passed
      ? `Quality review passed for '${report.productTitle}' with confidence ${confidenceScore}/100. Checkout preparation is ready as structural signals only.`
      : `Quality review incomplete for '${report.productTitle}' (confidence ${confidenceScore}/100). Resolve findings before executive submission.`;
    const qualityReview = passed
      ? `Quality review: workflowSteps=${report.checkoutFlow.steps.length}, provider=${report.paymentProviderConfiguration?.provider ?? "none"}, orderLines=${report.orderSummary?.lineItems.length ?? 0}, confirmationSteps=${report.confirmationWorkflow?.steps.length ?? 0}, purchaseValid=${report.purchaseInformationValid}, checkoutReady=${report.checkoutReady}, handoff=${report.deliveryHandoffStatus}; researchCompliance=${researchCompliance}.`
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
          ? "Checkout follows approved digital product information"
          : "Checkout partially aligned to available product information signals",
      purchaseInformationValid: report.purchaseInformationValid,
      checkoutReady: report.checkoutReady,
    };
  }

  buildCheckoutReport(
    input: CheckoutWorkerInput,
    config: CheckoutWorkerConfiguration,
    context: CheckoutContext,
  ): CheckoutReport {
    checkoutSequence += 1;
    const now = new Date().toISOString();
    const checkoutFlowType = this.normalizeCheckoutFlow(
      input.checkoutFlowType ?? context.checkoutFlowType ?? config.defaultCheckoutFlow,
    );
    const productType = this.normalizeProductType(
      input.productType ?? context.productType ?? config.defaultProductType,
    );
    const productTitle = this.resolveTitle(context, input);
    const checkoutId =
      input.checkoutId?.trim() || `ckw-chk-${Date.now()}-${checkoutSequence}`;
    const productId = input.productId?.trim() || `ckw-prd-${Date.now()}-${checkoutSequence}`;
    const businessId =
      input.businessId?.trim() || context.businessId?.trim() || `dbiz-ckw-${checkoutSequence}`;
    const factoryMissionId =
      input.factoryMissionId?.trim() ||
      context.factoryMissionId?.trim() ||
      `dpf-ckw-${checkoutSequence}`;

    const ctx = { ...context, productTitle, checkoutFlowType, productType };
    const checkoutFlow = this.generateCheckoutWorkflow(ctx, config);
    const paymentProviderConfiguration = this.preparePaymentProviderConfiguration(ctx, config);
    const orderSummary = this.generateOrderSummary(ctx, config);
    const confirmationWorkflow = this.generateCustomerConfirmationWorkflow(ctx);
    const purchaseInfo = this.validateRequiredPurchaseInformation(ctx);
    const handoff = this.preparePostPaymentHandoff({
      checkoutId,
      productTitle,
      purchaseInformationValid: purchaseInfo.purchaseInformationValid,
    });
    const abstraction = this.configurePaymentProviderAbstraction(ctx, config);
    const readiness = this.validateCheckoutReadiness({
      checkoutFlow,
      paymentProviderConfiguration,
      orderSummary,
      confirmationWorkflow,
      customerInformationRequirements: purchaseInfo.requirements,
      purchaseInformationValid: purchaseInfo.purchaseInformationValid,
      deliveryHandoffStatus: handoff.deliveryHandoffStatus,
      neverChargeCustomers: true,
      neverExecutePaymentTransactions: true,
      neverStoreSensitivePaymentCredentials: true,
    });
    const draftForReview = {
      productTitle,
      checkoutFlow,
      paymentProviderConfiguration,
      orderSummary,
      confirmationWorkflow,
      customerInformationRequirements: purchaseInfo.requirements,
      purchaseInformationValid: purchaseInfo.purchaseInformationValid,
      checkoutReady: readiness.checkoutReady,
      deliveryHandoffStatus: handoff.deliveryHandoffStatus,
      researchReportId: context.researchReportId ?? input.researchReportId ?? null,
      neverChargeCustomers: true as const,
      neverExecutePaymentTransactions: true as const,
      neverStoreSensitivePaymentCredentials: true as const,
    };
    const review = this.performQualityReview(draftForReview, context);
    const confidenceScore =
      input.confidenceScore != null && Number.isFinite(input.confidenceScore)
        ? clamp(input.confidenceScore, 0, 100)
        : review.confidenceScore;

    return {
      checkoutId,
      timestamp: now,
      productId,
      productTitle,
      checkoutFlow,
      paymentProviderConfiguration,
      orderSummary,
      customerInformationRequirements: purchaseInfo.requirements,
      deliveryHandoffStatus: handoff.deliveryHandoffStatus,
      validationResults: {
        summary: readiness.summary,
        errors: [...purchaseInfo.errors, ...readiness.errors],
        warnings: [...purchaseInfo.warnings, ...readiness.warnings],
        purchaseInformationValid: purchaseInfo.purchaseInformationValid,
        checkoutReady: readiness.checkoutReady,
      },
      confidenceScore,
      metadataVersion: CKW_METADATA_VERSION,
      researchReportId: context.researchReportId ?? input.researchReportId ?? null,
      opportunityId: context.opportunityId ?? input.opportunityId ?? null,
      businessId,
      factoryMissionId,
      salesPageId: context.salesPageId ?? input.salesPageId ?? null,
      checkoutFlowType,
      productType,
      checkoutFlowSteps: checkoutFlow.steps.map((s) => ({ ...s })),
      supportedProviders: abstraction.supportedProviders,
      supportedFeatures: [...FEATURES] as CheckoutFeature[],
      confirmationWorkflow,
      purchaseInformationValid: purchaseInfo.purchaseInformationValid,
      checkoutReady: readiness.checkoutReady,
      handoffTarget: "digital-delivery-worker",
      handoffTargetWorkerId: "wkr-digital-delivery-01",
      selfReviewPassed: review.passed,
      selfReviewFindings: review.findings,
      selfReviewSummary: review.summary,
      qualityReview: review.qualityReview,
      complianceReview: review.complianceReview,
      researchCompliance: review.researchCompliance,
      researchComplianceNotes: review.researchComplianceNotes,
      workerId: config.workerId || CHECKOUT_WORKER_IDENTITY.workerId,
      reportVersion: CHECKOUT_WORKER_REPORT_VERSION,
      traceabilityRefs: unique([
        `checkout:${checkoutId}`,
        `product:${productId}`,
        `business:${businessId}`,
        `mission:${factoryMissionId}`,
        ...(context.researchReportId ? [`research:${context.researchReportId}`] : []),
        ...(context.opportunityId ? [`opportunity:${context.opportunityId}`] : []),
        ...(context.salesPageId ? [`salesPage:${context.salesPageId}`] : []),
        `flow:${checkoutFlowType}`,
        `handoff:${handoff.handoffTarget}`,
      ]),
      preservedDecisions: [
        {
          decisionId: `ckw-dec-${checkoutSequence}-pack`,
          topic: productTitle,
          decision: `Built checkout pack (${checkoutFlow.steps.length} workflow steps, ${abstraction.supportedProviders.length} provider adapters) for ${checkoutFlowType} — preparation only, no charging/payment execution/delivery`,
          recordedAt: now,
        },
        {
          decisionId: `ckw-dec-${checkoutSequence}-handoff`,
          topic: productTitle,
          decision: handoff.notes,
          recordedAt: now,
        },
      ],
      submittedToExecutiveReporting: false,
      executiveReportId: null,
      neverChargeCustomers: true,
      neverExecutePaymentTransactions: true,
      neverDeliverProducts: true,
      neverPublishStorefronts: true,
      neverStoreSensitivePaymentCredentials: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverImplementQ510OrLater: true,
      followApprovedProductInformation: true,
      preserveCompleteTraceability: true,
      validateCheckoutIntegrityBeforeSubmission: true,
      preserveAuditHistory: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
    };
  }

  normalizeCheckoutFlow(
    type: string | CheckoutFlowType | null | undefined,
  ): CheckoutFlowType {
    const raw = type?.trim() ?? "";
    if (raw && (CHECKOUT_FLOW_TYPES as readonly string[]).includes(raw)) {
      return raw as CheckoutFlowType;
    }
    const lower = raw.toLowerCase();
    switch (lower) {
      case "one_time":
      case "onetime":
      case "purchase":
        return "one_time_purchase";
      case "subscription":
      case "subscription_ready":
      case "subscription_placeholder":
        return "subscription_ready_placeholder";
      case "lead":
      case "lead_checkout":
        return "lead_to_checkout";
      default:
        return raw ? "unknown" : "one_time_purchase";
    }
  }

  normalizeProductType(type: string | ProductType | null | undefined): ProductType {
    const raw = type?.trim() ?? "";
    if (raw && (PRODUCT_TYPES as readonly string[]).includes(raw)) {
      return raw as ProductType;
    }
    const lower = raw.toLowerCase();
    switch (lower) {
      case "coupon":
      case "coupons":
        return "coupon_enabled";
      case "discount":
      case "discounts":
        return "discount_enabled";
      case "tax":
      case "taxes":
        return "tax_configuration";
      case "currency":
      case "multi-currency":
        return "multi_currency";
      case "payment":
      case "providers":
        return "payment_provider_abstraction";
      case "confirmation":
        return "confirmation_workflow";
      case "one_time":
      case "purchase":
        return "one_time_purchase";
      default:
        return raw ? "unknown" : "one_time_purchase";
    }
  }

  normalizeProvider(provider: string | PaymentProvider | null | undefined): PaymentProvider {
    const raw = provider?.trim() ?? "";
    if (raw && (PAYMENT_PROVIDERS as readonly string[]).includes(raw)) {
      return raw as PaymentProvider;
    }
    const lower = raw.toLowerCase();
    if (lower.includes("stripe")) return "stripe_ready";
    if (lower.includes("paypal")) return "paypal_ready";
    if (lower.includes("paddle")) return "paddle_ready";
    if (lower.includes("invoice") || lower.includes("manual")) return "manual_invoice_ready";
    return raw ? "unknown" : "stripe_ready";
  }

  private resolveTitle(context: CheckoutContext, input?: CheckoutWorkerInput): string {
    return (
      input?.productTitle?.trim() ||
      context.productTitle?.trim() ||
      context.researchTopic?.trim() ||
      "Digital Product Offer"
    );
  }

  private parsePricingHint(hint?: string | null): number | null {
    if (!hint?.trim()) return null;
    const match = hint.match(/(\d+(?:\.\d+)?)/);
    if (!match) return null;
    const value = Number.parseFloat(match[1]!);
    return Number.isFinite(value) ? value : null;
  }
}

let checkoutSequence = 0;

export function resetCheckoutSequenceForTesting() {
  checkoutSequence = 0;
}

function cloneReport(report: CheckoutReport): CheckoutReport {
  return {
    ...report,
    checkoutFlow: {
      ...report.checkoutFlow,
      steps: report.checkoutFlow.steps.map((s) => ({ ...s })),
    },
    paymentProviderConfiguration: report.paymentProviderConfiguration
      ? {
          ...report.paymentProviderConfiguration,
          supportedMethods: [...report.paymentProviderConfiguration.supportedMethods],
          apiKeyPresent: false as const,
          secretsPresent: false as const,
        }
      : null,
    orderSummary: report.orderSummary
      ? {
          ...report.orderSummary,
          lineItems: report.orderSummary.lineItems.map((l) => ({ ...l })),
        }
      : null,
    customerInformationRequirements: [...report.customerInformationRequirements],
    validationResults: {
      ...report.validationResults,
      errors: [...report.validationResults.errors],
      warnings: [...report.validationResults.warnings],
    },
    checkoutFlowSteps: report.checkoutFlowSteps.map((s) => ({ ...s })),
    supportedProviders: [...report.supportedProviders],
    supportedFeatures: [...report.supportedFeatures],
    confirmationWorkflow: report.confirmationWorkflow
      ? {
          ...report.confirmationWorkflow,
          steps: report.confirmationWorkflow.steps.map((s) => ({ ...s })),
        }
      : null,
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
