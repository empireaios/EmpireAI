import type { SupplierDiscoveryWorkerConfiguration } from "./configuration.js";
import {
  SDW_METADATA_VERSION,
  SUPPLIER_DISCOVERY_REPORT_VERSION,
  SUPPLIER_DISCOVERY_WORKER_IDENTITY,
} from "./paths.js";
import type {
  ApprovedProductInput,
  DiscoveryChannel,
  FieldAvailability,
  InformationStatus,
  IntegrationHandshake,
  SupplierCandidateInput,
  SupplierDiscoveryReport,
  SupplierDiscoveryWorkerCatalog,
  SupplierDiscoveryWorkerInput,
} from "./types.js";

type DraftCandidate = {
  channel: DiscoveryChannel;
  candidate: SupplierCandidateInput;
  product: ApprovedProductInput;
};

/** Pure Supplier Discovery Worker helpers for Q3-04 — discovery only. */
export class DiscoveryBuilder {
  buildCatalog(
    config: SupplierDiscoveryWorkerConfiguration,
    discoveries: SupplierDiscoveryReport[],
    integrations: IntegrationHandshake[],
  ): SupplierDiscoveryWorkerCatalog {
    return {
      reportVersion: SUPPLIER_DISCOVERY_REPORT_VERSION,
      workerId: config.workerId,
      discoveries: discoveries.map(cloneDiscovery),
      integrations: integrations.map((i) => ({ ...i })),
      metadataVersion: SDW_METADATA_VERSION,
      executiveAuthority: "pillow",
      neverEvaluateSuppliers: true,
      neverNegotiateSuppliers: true,
      neverSelectSuppliers: true,
      neverPlaceOrders: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    };
  }

  resolveProducts(
    input: SupplierDiscoveryWorkerInput,
    fromEvaluation: ApprovedProductInput[] = [],
  ): ApprovedProductInput[] {
    const products: ApprovedProductInput[] = [];
    if (input.approvedProduct) products.push(input.approvedProduct);
    for (const p of input.approvedProducts ?? []) products.push(p);
    if (input.productId || input.productName) {
      products.push({
        evaluationId: input.evaluationId,
        productId: input.productId,
        productName: input.productName,
        category: input.category,
        recommendation: "Proceed",
      });
    }
    if (!products.length && fromEvaluation.length) {
      if (input.evaluationId) {
        const match = fromEvaluation.find((e) => e.evaluationId === input.evaluationId);
        if (match) return [match];
      }
      return fromEvaluation.filter(
        (p) => !p.recommendation || p.recommendation.toLowerCase() === "proceed",
      );
    }
    return products.filter((p) => p.productName?.trim() || p.productId?.trim());
  }

  discover(
    input: SupplierDiscoveryWorkerInput,
    config: SupplierDiscoveryWorkerConfiguration,
    products: ApprovedProductInput[],
    mode: "platforms" | "apis" | "all" = "all",
  ): SupplierDiscoveryReport[] {
    const drafts: DraftCandidate[] = [];
    for (const product of products) {
      if (mode === "platforms" || mode === "all") {
        drafts.push(...this.fromPlatforms(input, config, product));
      }
      if (mode === "apis" || mode === "all") {
        drafts.push(...this.fromApis(input, config, product));
      }
    }
    if (!drafts.length) {
      for (const product of products) {
        drafts.push(...this.defaultCandidates(product, config, mode));
      }
    }
    return drafts.map((d) => this.toReport(d, input, config));
  }

  private fromPlatforms(
    input: SupplierDiscoveryWorkerInput,
    config: SupplierDiscoveryWorkerConfiguration,
    product: ApprovedProductInput,
  ): DraftCandidate[] {
    const approved = new Set(
      (input.approvedSupplierPlatforms?.length
        ? input.approvedSupplierPlatforms
        : config.approvedSupplierPlatforms
      ).map(normalizeToken),
    );
    const candidates = [
      ...(input.platformCandidates ?? []),
      ...(input.supplierCandidates ?? []).filter((c) => c.supplierPlatform && !c.supplierApi),
    ];
    const drafts: DraftCandidate[] = [];
    for (const candidate of candidates) {
      const platform = normalizeToken(candidate.supplierPlatform ?? "");
      if (!platform || !approved.has(platform)) continue;
      if (!candidate.supplierName?.trim() && !candidate.supplierId?.trim()) continue;
      drafts.push({ channel: "supplier_platform", candidate, product });
    }
    return drafts;
  }

  private fromApis(
    input: SupplierDiscoveryWorkerInput,
    config: SupplierDiscoveryWorkerConfiguration,
    product: ApprovedProductInput,
  ): DraftCandidate[] {
    const approved = new Set(
      (input.approvedSupplierApis?.length
        ? input.approvedSupplierApis
        : config.approvedSupplierApis
      ).map(normalizeToken),
    );
    const candidates = [
      ...(input.apiCandidates ?? []),
      ...(input.supplierCandidates ?? []).filter((c) => c.supplierApi),
    ];
    const drafts: DraftCandidate[] = [];
    for (const candidate of candidates) {
      const api = normalizeToken(candidate.supplierApi ?? "");
      if (!api || !approved.has(api)) continue;
      if (!candidate.supplierName?.trim() && !candidate.supplierId?.trim()) continue;
      drafts.push({ channel: "supplier_api", candidate, product });
    }
    return drafts;
  }

  private defaultCandidates(
    product: ApprovedProductInput,
    config: SupplierDiscoveryWorkerConfiguration,
    mode: "platforms" | "apis" | "all",
  ): DraftCandidate[] {
    const drafts: DraftCandidate[] = [];
    const name = product.productName?.trim() || "approved product";
    if (mode === "platforms" || mode === "all") {
      const platform = config.approvedSupplierPlatforms[0] ?? "alibaba";
      drafts.push({
        channel: "supplier_platform",
        product,
        candidate: {
          supplierId: `sup-${platform}-default`,
          supplierName: `${platform} catalog supplier`,
          supplierPlatform: platform,
          productCost: null,
          moq: null,
          shippingAvailability: "unavailable",
          supplierLocation: null,
          sourceReference: `${platform}://search?q=${encodeURIComponent(name)}`,
        },
      });
    }
    if (mode === "apis" || mode === "all") {
      const api = config.approvedSupplierApis[0] ?? "alibaba_open_api";
      drafts.push({
        channel: "supplier_api",
        product,
        candidate: {
          supplierId: `sup-api-${api}-default`,
          supplierName: `${api} matched supplier`,
          supplierPlatform: platformFromApi(api),
          supplierApi: api,
          productCost: null,
          moq: null,
          shippingAvailability: null,
          supplierLocation: "unavailable",
          sourceReference: `api://${api}/products?q=${encodeURIComponent(name)}`,
        },
      });
    }
    return drafts;
  }

  private toReport(
    draft: DraftCandidate,
    input: SupplierDiscoveryWorkerInput,
    config: SupplierDiscoveryWorkerConfiguration,
  ): SupplierDiscoveryReport {
    discoverySequence += 1;
    const now = new Date().toISOString();
    const { candidate, product, channel } = draft;
    const supplierName =
      candidate.supplierName?.trim() ||
      `supplier-${discoverySequence}`;
    const supplierId =
      candidate.supplierId?.trim() ||
      `sup-${normalizeToken(supplierName).slice(0, 24)}-${discoverySequence}`;
    const platform =
      normalizeToken(candidate.supplierPlatform ?? "") ||
      platformFromApi(candidate.supplierApi ?? "") ||
      "unknown";
    const productId =
      product.productId?.trim() ||
      input.productId?.trim() ||
      `prod-${discoverySequence}`;
    const productName =
      product.productName?.trim() ||
      input.productName?.trim() ||
      `product-${discoverySequence}`;

    const fieldAvailability = this.assessAvailability(candidate);
    const confidenceScore = this.scoreConfidence(candidate, fieldAvailability, channel);

    return {
      discoveryId:
        input.discoveryId?.trim() && discoverySequence === 1
          ? input.discoveryId.trim()
          : `sdw-discovery-${Date.now()}-${discoverySequence}`,
      timestamp: now,
      productId,
      productName,
      supplierId,
      supplierName,
      supplierPlatform: platform,
      productCost: candidate.productCost ?? null,
      moq: candidate.moq ?? null,
      shippingAvailability: candidate.shippingAvailability?.trim() || null,
      supplierLocation: candidate.supplierLocation?.trim() || null,
      sourceReference:
        candidate.sourceReference?.trim() ||
        `${channel}://${platform}/${supplierId}`,
      confidenceScore,
      discoveryChannel: channel,
      supplierApi: candidate.supplierApi?.trim() || null,
      productSku: candidate.productSku?.trim() || null,
      fieldAvailability,
      evaluationId: product.evaluationId?.trim() || input.evaluationId?.trim() || null,
      businessMissionId: product.businessMissionId?.trim() || null,
      metadataVersion: SDW_METADATA_VERSION,
      reportVersion: SUPPLIER_DISCOVERY_REPORT_VERSION,
      submittedToExecutiveReporting: false,
      executiveReportId: null,
      workerId: config.workerId || SUPPLIER_DISCOVERY_WORKER_IDENTITY.workerId,
      neverEvaluateSuppliers: true,
      neverNegotiateSuppliers: true,
      neverSelectSuppliers: true,
      neverPlaceOrders: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverImplementQ305OrLater: true,
      neverModifySupplierData: true,
      preserveSupplierTraceability: true,
      preserveAuditHistory: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
    };
  }

  assessAvailability(candidate: SupplierCandidateInput): FieldAvailability {
    return {
      productCost: statusOf(candidate.productCost),
      moq: statusOf(candidate.moq),
      shippingAvailability: statusOfString(candidate.shippingAvailability),
      supplierLocation: statusOfString(candidate.supplierLocation),
    };
  }

  scoreConfidence(
    candidate: SupplierCandidateInput,
    availability: FieldAvailability,
    channel: DiscoveryChannel,
  ): number {
    let score = 0.35;
    const availableCount = Object.values(availability).filter((s) => s === "available").length;
    score += availableCount * 0.1;
    if (candidate.sourceReference?.trim()) score += 0.1;
    if (candidate.supplierId?.trim() && candidate.supplierName?.trim()) score += 0.1;
    if (channel === "supplier_api") score += 0.05;
    if (channel === "supplier_platform") score += 0.05;
    const unavailable = Object.values(availability).filter((s) => s === "unavailable").length;
    score -= unavailable * 0.02;
    return Number(Math.max(0.05, Math.min(0.95, score)).toFixed(2));
  }
}

let discoverySequence = 0;

export function resetDiscoverySequenceForTesting() {
  discoverySequence = 0;
}

function statusOf(value: number | null | undefined): InformationStatus {
  if (value == null) return "missing";
  if (Number.isNaN(value)) return "unavailable";
  return "available";
}

function statusOfString(value: string | null | undefined): InformationStatus {
  if (value == null || !value.trim()) return "missing";
  if (/^unavailable$/i.test(value.trim())) return "unavailable";
  return "available";
}

function normalizeToken(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "_");
}

function platformFromApi(api: string): string {
  const token = normalizeToken(api);
  if (token.includes("alibaba")) return "alibaba";
  if (token.includes("cj")) return "cjdropshipping";
  if (token.includes("spocket")) return "spocket";
  return "api_catalog";
}

function cloneDiscovery(discovery: SupplierDiscoveryReport): SupplierDiscoveryReport {
  return {
    ...discovery,
    fieldAvailability: { ...discovery.fieldAvailability },
  };
}
