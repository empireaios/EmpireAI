import type { ProductDiscoveryWorkerConfiguration } from "./configuration.js";
import {
  PDW_METADATA_VERSION,
  PRODUCT_DISCOVERY_REPORT_VERSION,
  PRODUCT_DISCOVERY_WORKER_IDENTITY,
} from "./paths.js";
import type {
  DiscoverySource,
  EvidenceItem,
  IntegrationHandshake,
  MarketplaceCandidateInput,
  ProductCategory,
  ProductDiscoveryReport,
  ProductDiscoveryWorkerCatalog,
  ProductDiscoveryWorkerInput,
  SupplierCandidateInput,
  TrendDirection,
} from "./types.js";

type DraftCandidate = {
  productName: string;
  productId?: string | null;
  discoverySource: DiscoverySource;
  marketplace?: string | null;
  supplier?: string | null;
  category?: string | null;
  searchTrendSignals?: string[];
  customerDemandSignals?: string[];
  discoveryReason: string;
  seasonalTag?: string | null;
  trendDirection?: TrendDirection;
  evidenceClaims?: Array<{ source: string; claim: string; kind: "fact" | "assumption"; topic: string }>;
};

/** Pure Product Discovery Worker helpers for Q3-02 — discovery only. */
export class DiscoveryBuilder {
  buildCatalog(
    config: ProductDiscoveryWorkerConfiguration,
    discoveries: ProductDiscoveryReport[],
    integrations: IntegrationHandshake[],
  ): ProductDiscoveryWorkerCatalog {
    return {
      reportVersion: PRODUCT_DISCOVERY_REPORT_VERSION,
      workerId: config.workerId,
      discoveries: discoveries.map(cloneDiscovery),
      integrations: integrations.map((i) => ({ ...i })),
      metadataVersion: PDW_METADATA_VERSION,
      executiveAuthority: "pillow",
      neverEvaluateProducts: true,
      neverRankProducts: true,
      neverSelectSuppliers: true,
      neverBuildListings: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    };
  }

  discover(
    input: ProductDiscoveryWorkerInput,
    config: ProductDiscoveryWorkerConfiguration,
    mode:
      | "marketplaces"
      | "suppliers"
      | "search_trends"
      | "customer_demand"
      | "seasonal"
      | "emerging"
      | "declining"
      | "categorize"
      | "full" = "full",
  ): ProductDiscoveryReport[] {
    const drafts: DraftCandidate[] = [];
    if (mode === "marketplaces" || mode === "full" || mode === "categorize") {
      drafts.push(...this.fromMarketplaces(input, config));
    }
    if (mode === "suppliers" || mode === "full" || mode === "categorize") {
      drafts.push(...this.fromSuppliers(input, config));
    }
    if (mode === "search_trends" || mode === "full" || mode === "categorize") {
      drafts.push(...this.fromSearchTrends(input));
    }
    if (mode === "customer_demand" || mode === "full" || mode === "categorize") {
      drafts.push(...this.fromCustomerDemand(input));
    }
    if (mode === "seasonal" || mode === "full" || mode === "categorize") {
      drafts.push(...this.fromSeasonal(input));
    }
    if (mode === "emerging" || mode === "full" || mode === "categorize") {
      drafts.push(...this.fromEmerging(input));
    }
    if (mode === "declining" || mode === "full" || mode === "categorize") {
      drafts.push(...this.fromDeclining(input));
    }

    if (!drafts.length && input.productName?.trim()) {
      drafts.push({
        productName: input.productName.trim(),
        productId: input.productId,
        discoverySource: (input.discoverySource as DiscoverySource) || "aggregated",
        marketplace: input.marketplace,
        supplier: input.supplier,
        category: input.category,
        searchTrendSignals: (input.searchTrendSignals ?? []).map((s) => s.trim()).filter(Boolean),
        customerDemandSignals: (input.customerDemandSignals ?? [])
          .map((s) => s.trim())
          .filter(Boolean),
        discoveryReason: "Direct product discovery input",
        trendDirection: "unclear",
      });
    }

    const built = drafts.map((draft) => this.toReport(draft, input, config));
    const categorized = built.map((d) => ({
      ...d,
      category: this.categorize(d.productName, d.category, config, input.category),
    }));
    return this.dedupe(categorized);
  }

  categorize(
    productName: string,
    existing: string | null | undefined,
    config: ProductDiscoveryWorkerConfiguration,
    override?: string | null,
  ): ProductCategory {
    if (override?.trim()) {
      const normalized = normalizeToken(override);
      if (config.productCategories.includes(normalized)) return normalized;
      return normalized;
    }
    if (existing?.trim() && existing !== "unknown") {
      const normalized = normalizeToken(existing);
      if (config.productCategories.includes(normalized)) return normalized;
      return normalized;
    }
    const text = productName.toLowerCase();
    const rules: Array<{ category: string; patterns: RegExp[] }> = [
      { category: "electronics", patterns: [/\bearbuds?\b/, /\bcharger\b/, /\bgadget\b/, /\busb\b/, /\bhdmi\b/] },
      { category: "apparel", patterns: [/\bshirt\b/, /\bdress\b/, /\bhoodie\b/, /\bsneaker\b/, /\bjacket\b/] },
      { category: "beauty", patterns: [/\bserum\b/, /\bskincare\b/, /\bmakeup\b/, /\blipstick\b/] },
      { category: "health", patterns: [/\bvitamin\b/, /\bsupplement\b/, /\bwelfare\b/, /\bfitness.?band\b/] },
      { category: "sports", patterns: [/\byoga\b/, /\bdumbbell\b/, /\bsport\b/, /\bcycling\b/] },
      { category: "toys", patterns: [/\btoy\b/, /\bpuzzle\b/, /\blego\b/, /\bdoll\b/] },
      { category: "pet", patterns: [/\bdog\b/, /\bcat\b/, /\bpet\b/, /\bleash\b/] },
      { category: "food_beverage", patterns: [/\btea\b/, /\bcoffee\b/, /\bsnack\b/, /\bbeverage\b/] },
      { category: "office", patterns: [/\bdesk\b/, /\bnotebook\b/, /\bstapler\b/, /\boffice\b/] },
      { category: "automotive", patterns: [/\bcar\b/, /\bauto\b/, /\bdashboard\b/, /\btire\b/] },
      { category: "home_goods", patterns: [/\borganizer\b/, /\bkitchen\b/, /\blamp\b/, /\bhome\b/, /\bcandle\b/] },
    ];
    for (const rule of rules) {
      if (!config.productCategories.includes(rule.category)) continue;
      if (rule.patterns.some((p) => p.test(text))) return rule.category;
    }
    return "unknown";
  }

  dedupe(discoveries: ProductDiscoveryReport[]): ProductDiscoveryReport[] {
    const seen = new Map<string, ProductDiscoveryReport>();
    const result: ProductDiscoveryReport[] = [];
    for (const discovery of discoveries) {
      const key = `${normalizeToken(discovery.productName)}|${normalizeToken(String(discovery.category))}`;
      const existing = seen.get(key);
      if (!existing) {
        seen.set(key, discovery);
        result.push(discovery);
        continue;
      }
      const merged = this.mergeDuplicates(existing, discovery);
      const idx = result.findIndex((d) => d.discoveryId === existing.discoveryId);
      if (idx >= 0) result[idx] = merged;
      seen.set(key, merged);
    }
    return result;
  }

  private fromMarketplaces(
    input: ProductDiscoveryWorkerInput,
    config: ProductDiscoveryWorkerConfiguration,
  ): DraftCandidate[] {
    const approved = new Set(
      (input.approvedMarketplaces?.length
        ? input.approvedMarketplaces
        : config.approvedMarketplaces
      ).map(normalizeToken),
    );
    const drafts: DraftCandidate[] = [];
    const candidates = input.marketplaceCandidates?.length
      ? input.marketplaceCandidates
      : input.marketplace && input.productName
        ? [
            {
              productName: input.productName,
              productId: input.productId,
              marketplace: input.marketplace,
              category: input.category,
              signals: input.searchTrendSignals,
              reason: "Marketplace discovery input",
            } satisfies MarketplaceCandidateInput,
          ]
        : [];

    for (const candidate of candidates) {
      const name = candidate.productName?.trim();
      const marketplace = normalizeToken(candidate.marketplace ?? "");
      if (!name || !marketplace) continue;
      if (!approved.has(marketplace)) continue;
      drafts.push({
        productName: name,
        productId: candidate.productId,
        discoverySource: "marketplace",
        marketplace,
        category: candidate.category,
        searchTrendSignals: (candidate.signals ?? []).map((s) => s.trim()).filter(Boolean),
        discoveryReason:
          candidate.reason?.trim() ||
          `Discovered on approved marketplace ${marketplace}`,
        trendDirection: "stable",
        evidenceClaims: [
          {
            source: `marketplace:${marketplace}`,
            claim: `Product ${name} observed on ${marketplace}`,
            kind: "fact",
            topic: "marketplace_discovery",
          },
        ],
      });
    }
    return drafts;
  }

  private fromSuppliers(
    input: ProductDiscoveryWorkerInput,
    config: ProductDiscoveryWorkerConfiguration,
  ): DraftCandidate[] {
    const approved = new Set(
      (input.approvedSupplierPlatforms?.length
        ? input.approvedSupplierPlatforms
        : config.approvedSupplierPlatforms
      ).map(normalizeToken),
    );
    const drafts: DraftCandidate[] = [];
    const candidates = input.supplierCandidates?.length
      ? input.supplierCandidates
      : input.supplier && input.productName
        ? [
            {
              productName: input.productName,
              productId: input.productId,
              supplier: input.supplier,
              category: input.category,
              signals: input.customerDemandSignals,
              reason: "Supplier discovery input",
            } satisfies SupplierCandidateInput,
          ]
        : [];

    for (const candidate of candidates) {
      const name = candidate.productName?.trim();
      const supplier = normalizeToken(candidate.supplier ?? "");
      if (!name || !supplier) continue;
      if (!approved.has(supplier)) continue;
      drafts.push({
        productName: name,
        productId: candidate.productId,
        discoverySource: "supplier",
        supplier,
        category: candidate.category,
        customerDemandSignals: (candidate.signals ?? []).map((s) => s.trim()).filter(Boolean),
        discoveryReason:
          candidate.reason?.trim() || `Discovered on approved supplier platform ${supplier}`,
        trendDirection: "stable",
        evidenceClaims: [
          {
            source: `supplier:${supplier}`,
            claim: `Product ${name} available from ${supplier}`,
            kind: "fact",
            topic: "supplier_discovery",
          },
        ],
      });
    }
    return drafts;
  }

  private fromSearchTrends(input: ProductDiscoveryWorkerInput): DraftCandidate[] {
    const signals = (input.searchTrendSignals ?? []).map((s) => s.trim()).filter(Boolean);
    if (!signals.length) return [];
    return signals.map((signal, index) => {
      const productName =
        extractProductHint(signal) ||
        input.productName?.trim() ||
        `search-trend-opportunity-${index + 1}`;
      return {
        productName,
        discoverySource: "search_trend" as const,
        searchTrendSignals: [signal],
        discoveryReason: `Search trend signal: ${signal}`,
        trendDirection: /declin|down|falling/i.test(signal)
          ? ("declining" as const)
          : /emerg|rising|spike|viral/i.test(signal)
            ? ("emerging" as const)
            : ("stable" as const),
        evidenceClaims: [
          {
            source: "search_trend_source",
            claim: signal,
            kind: "fact" as const,
            topic: "search_trend",
          },
        ],
      };
    });
  }

  private fromCustomerDemand(input: ProductDiscoveryWorkerInput): DraftCandidate[] {
    const signals = (input.customerDemandSignals ?? []).map((s) => s.trim()).filter(Boolean);
    if (!signals.length) return [];
    return signals.map((signal, index) => {
      const productName =
        extractProductHint(signal) ||
        input.productName?.trim() ||
        `customer-demand-opportunity-${index + 1}`;
      return {
        productName,
        discoverySource: "customer_demand" as const,
        customerDemandSignals: [signal],
        discoveryReason: `Customer demand signal: ${signal}`,
        trendDirection: "emerging" as const,
        evidenceClaims: [
          {
            source: "customer_demand_source",
            claim: signal,
            kind: "fact" as const,
            topic: "customer_demand",
          },
        ],
      };
    });
  }

  private fromSeasonal(input: ProductDiscoveryWorkerInput): DraftCandidate[] {
    const signals = (input.seasonalSignals ?? []).map((s) => s.trim()).filter(Boolean);
    if (!signals.length) return [];
    return signals.map((signal, index) => {
      const productName =
        extractProductHint(signal) ||
        input.productName?.trim() ||
        `seasonal-opportunity-${index + 1}`;
      const seasonalTag =
        signal.match(/\b(spring|summer|fall|autumn|winter|holiday|christmas|back.?to.?school)\b/i)?.[1] ??
        "seasonal";
      return {
        productName,
        discoverySource: "seasonal" as const,
        seasonalTag: normalizeToken(seasonalTag),
        searchTrendSignals: [signal],
        discoveryReason: `Seasonal opportunity: ${signal}`,
        trendDirection: "emerging" as const,
        evidenceClaims: [
          {
            source: "seasonal_calendar",
            claim: signal,
            kind: "assumption" as const,
            topic: "seasonal",
          },
        ],
      };
    });
  }

  private fromEmerging(input: ProductDiscoveryWorkerInput): DraftCandidate[] {
    const signals = (input.emergingTrendSignals ?? []).map((s) => s.trim()).filter(Boolean);
    if (!signals.length) return [];
    return signals.map((signal, index) => {
      const productName =
        extractProductHint(signal) ||
        input.productName?.trim() ||
        `emerging-trend-${index + 1}`;
      return {
        productName,
        discoverySource: "emerging_trend" as const,
        searchTrendSignals: [signal],
        discoveryReason: `Emerging product trend: ${signal}`,
        trendDirection: "emerging" as const,
        evidenceClaims: [
          {
            source: "emerging_trend_detector",
            claim: signal,
            kind: "assumption" as const,
            topic: "emerging_trend",
          },
        ],
      };
    });
  }

  private fromDeclining(input: ProductDiscoveryWorkerInput): DraftCandidate[] {
    const signals = (input.decliningProductSignals ?? []).map((s) => s.trim()).filter(Boolean);
    if (!signals.length) return [];
    return signals.map((signal, index) => {
      const productName =
        extractProductHint(signal) ||
        input.productName?.trim() ||
        `declining-product-${index + 1}`;
      return {
        productName,
        discoverySource: "declining_signal" as const,
        searchTrendSignals: [signal],
        discoveryReason: `Declining product signal: ${signal}`,
        trendDirection: "declining" as const,
        evidenceClaims: [
          {
            source: "declining_product_detector",
            claim: signal,
            kind: "fact" as const,
            topic: "declining_product",
          },
        ],
      };
    });
  }

  private toReport(
    draft: DraftCandidate,
    input: ProductDiscoveryWorkerInput,
    config: ProductDiscoveryWorkerConfiguration,
  ): ProductDiscoveryReport {
    discoverySequence += 1;
    const now = new Date().toISOString();
    const missionId =
      input.businessMissionId?.trim() ||
      input.commerceBuildMissionId?.trim() ||
      `cmf-cbm-${Date.now()}-${discoverySequence}`;
    const category = this.categorize(draft.productName, draft.category, config, input.category);
    const evidence = this.compileEvidence(draft, input, now);
    const facts = unique(evidence.filter((e) => e.kind === "fact").map((e) => e.claim));
    const assumptions = unique(
      evidence.filter((e) => e.kind === "assumption").map((e) => e.claim),
    );
    const confidenceScore = this.scoreConfidence(draft, evidence);

    return {
      discoveryId:
        input.discoveryId?.trim() && discoverySequence === 1
          ? input.discoveryId.trim()
          : `pdw-discovery-${Date.now()}-${discoverySequence}`,
      timestamp: now,
      businessMissionId: missionId,
      productId:
        draft.productId?.trim() ||
        `prod-${normalizeToken(draft.productName).slice(0, 32)}-${discoverySequence}`,
      productName: draft.productName,
      category,
      discoverySource: draft.discoverySource,
      marketplace: draft.marketplace?.trim() || null,
      supplier: draft.supplier?.trim() || null,
      searchTrendSignals: unique(draft.searchTrendSignals ?? []),
      customerDemandSignals: unique(draft.customerDemandSignals ?? []),
      discoveryReason: draft.discoveryReason,
      confidenceScore,
      supportingEvidence: evidence,
      trendDirection: draft.trendDirection ?? "unclear",
      seasonalTag: draft.seasonalTag ?? null,
      isDuplicateOf: null,
      facts,
      assumptions,
      metadataVersion: PDW_METADATA_VERSION,
      reportVersion: PRODUCT_DISCOVERY_REPORT_VERSION,
      commerceBuildMissionId: input.commerceBuildMissionId?.trim() || null,
      submittedToExecutiveReporting: false,
      executiveReportId: null,
      workerId: config.workerId || PRODUCT_DISCOVERY_WORKER_IDENTITY.workerId,
      neverEvaluateProducts: true,
      neverRankProducts: true,
      neverSelectSuppliers: true,
      neverBuildListings: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverImplementQ303OrLater: true,
      preserveSourceTraceability: true,
      preserveAuditHistory: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
    };
  }

  private compileEvidence(
    draft: DraftCandidate,
    input: ProductDiscoveryWorkerInput,
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
    for (const claim of draft.evidenceClaims ?? []) {
      add(claim.source, claim.claim, claim.kind, claim.topic);
    }
    add(
      "discovery_worker",
      `Candidate product discovered: ${draft.productName}`,
      "fact",
      "discovery",
    );
    add(
      "boundary",
      "Discovery-only: product is a candidate for downstream evaluation workers",
      "assumption",
      "governance",
    );
    return items;
  }

  private scoreConfidence(draft: DraftCandidate, evidence: EvidenceItem[]): number {
    const facts = evidence.filter((e) => e.kind === "fact").length;
    const assumptions = evidence.filter((e) => e.kind === "assumption").length;
    let score = 0.4;
    score += Math.min(0.3, facts * 0.06);
    score -= Math.min(0.15, assumptions * 0.02);
    if (draft.marketplace || draft.supplier) score += 0.1;
    if ((draft.searchTrendSignals?.length ?? 0) + (draft.customerDemandSignals?.length ?? 0) > 0) {
      score += 0.1;
    }
    if (draft.trendDirection === "declining") score -= 0.05;
    return Number(Math.max(0.05, Math.min(0.95, score)).toFixed(2));
  }

  private mergeDuplicates(
    primary: ProductDiscoveryReport,
    secondary: ProductDiscoveryReport,
  ): ProductDiscoveryReport {
    return {
      ...primary,
      searchTrendSignals: unique([
        ...primary.searchTrendSignals,
        ...secondary.searchTrendSignals,
      ]),
      customerDemandSignals: unique([
        ...primary.customerDemandSignals,
        ...secondary.customerDemandSignals,
      ]),
      supportingEvidence: [
        ...primary.supportingEvidence,
        ...secondary.supportingEvidence.map((e) => ({
          ...e,
          evidenceId: `${e.evidenceId}-merged`,
        })),
      ],
      facts: unique([...primary.facts, ...secondary.facts]),
      assumptions: unique([...primary.assumptions, ...secondary.assumptions]),
      marketplace: primary.marketplace || secondary.marketplace,
      supplier: primary.supplier || secondary.supplier,
      discoverySource:
        primary.discoverySource === secondary.discoverySource
          ? primary.discoverySource
          : "aggregated",
      discoveryReason: `${primary.discoveryReason}; also ${secondary.discoveryReason}`,
      confidenceScore: Number(
        Math.min(0.95, Math.max(primary.confidenceScore, secondary.confidenceScore) + 0.05).toFixed(
          2,
        ),
      ),
      isDuplicateOf: secondary.discoveryId,
      seasonalTag: primary.seasonalTag || secondary.seasonalTag,
    };
  }
}

let discoverySequence = 0;

export function resetDiscoverySequenceForTesting() {
  discoverySequence = 0;
}

function normalizeToken(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "_");
}

function extractProductHint(signal: string): string | null {
  const quoted = signal.match(/["']([^"']+)["']/);
  if (quoted?.[1]) return quoted[1].trim();
  const forMatch = signal.match(/\b(?:for|product|item)\s+([A-Za-z0-9][\w\s-]{2,40})/i);
  if (forMatch?.[1]) return forMatch[1].trim();
  return null;
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((v) => v.trim()).filter(Boolean)));
}

function cloneDiscovery(discovery: ProductDiscoveryReport): ProductDiscoveryReport {
  return {
    ...discovery,
    searchTrendSignals: [...discovery.searchTrendSignals],
    customerDemandSignals: [...discovery.customerDemandSignals],
    facts: [...discovery.facts],
    assumptions: [...discovery.assumptions],
    supportingEvidence: discovery.supportingEvidence.map((e) => ({ ...e })),
  };
}
