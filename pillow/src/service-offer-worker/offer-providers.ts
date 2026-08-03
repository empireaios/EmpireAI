import type { LocalMarketResearchReport } from "../local-market-research-worker/types.js";
import type {
  EvidenceClass,
  FulfilmentRequirement,
  Guarantee,
  OfferContext,
  PackageType,
  PricingRecommendation,
  ResearchFixture,
  ServiceCatalogueItem,
  ServicePackage,
} from "./types.js";

function asResearch(research: LocalMarketResearchReport | ResearchFixture | null) {
  return research;
}

function isFullReport(
  research: LocalMarketResearchReport | ResearchFixture | null,
): research is LocalMarketResearchReport {
  return (
    !!research &&
    "competitorProfiles" in research &&
    Array.isArray((research as LocalMarketResearchReport).competitorProfiles) &&
    "demandFindings" in research &&
    "consumableByQ703" in research
  );
}

function readPricing(ctx: OfferContext) {
  const research = ctx.marketResearch;
  if (!research) return null;
  if (isFullReport(research)) return research.pricingFindings;
  return research.pricingFindings ?? null;
}

function evidenceClassFrom(value: string | undefined | null, fallback: EvidenceClass): EvidenceClass {
  if (
    value === "verified" ||
    value === "estimated" ||
    value === "inference" ||
    value === "unknown" ||
    value === "assumption"
  ) {
    return value;
  }
  return fallback;
}

function midpointFromRange(typical: string | null, currency: string): string | null {
  if (!typical) return null;
  const nums = typical.match(/(\d+(?:\.\d+)?)/g)?.map(Number) ?? [];
  if (!nums.length) return null;
  const mid =
    nums.length === 1 ? nums[0]! : (nums[0]! + nums[nums.length - 1]!) / 2;
  return `${currency} ${Math.round(mid)}`;
}

function scalePrice(base: string | null, factor: number, currency: string): string | null {
  if (!base) return null;
  const num = Number(base.replace(/[^\d.]/g, ""));
  if (!Number.isFinite(num)) return null;
  return `${currency} ${Math.round(num * factor)}`;
}

export function provideServiceCatalogue(ctx: OfferContext): ServiceCatalogueItem[] {
  const research = asResearch(ctx.marketResearch);
  const items: ServiceCatalogueItem[] = [];
  const category = ctx.serviceCategory || "local_service";
  const coverage = ctx.targetServiceArea || "unspecified";
  const segments = ctx.customerSegments.length ? ctx.customerSegments : ["general"];

  const competitorServices = new Set<string>();
  if (isFullReport(research)) {
    for (const c of research.competitorProfiles) {
      for (const s of c.services) if (s.trim()) competitorServices.add(s.trim());
    }
  } else if (research?.competitors) {
    for (const c of research.competitors) {
      for (const s of c.services ?? []) if (s.trim()) competitorServices.add(s.trim());
    }
  }

  const serviceNames = competitorServices.size
    ? [...competitorServices]
    : [`${category} — standard visit`, `${category} — deep service`];

  let index = 0;
  for (const name of serviceNames.slice(0, 6)) {
    index += 1;
    items.push({
      serviceId: `sow-svc-${String(index).padStart(3, "0")}`,
      name,
      description: `${name} offer derived from Q7-02 local market research for ${coverage}`,
      category,
      targetSegments: [...segments],
      geographicCoverage: coverage,
      evidenceClass: competitorServices.size ? "estimated" : "assumption",
      sourceResearchRefs: [ctx.sourceResearchId],
    });
  }

  if (isFullReport(research)) {
    for (const gap of research.serviceGaps.slice(0, 2)) {
      index += 1;
      items.push({
        serviceId: `sow-svc-${String(index).padStart(3, "0")}`,
        name: gap.unmetNeed || gap.description,
        description: `Gap-driven service: ${gap.description}`,
        category,
        targetSegments: [...segments],
        geographicCoverage: gap.geographicArea || coverage,
        evidenceClass: gap.evidenceClass === "unknown" ? "assumption" : gap.evidenceClass,
        sourceResearchRefs: [ctx.sourceResearchId, gap.gapId],
      });
    }
  } else if (research?.gaps?.length) {
    for (const gap of research.gaps.slice(0, 2)) {
      index += 1;
      items.push({
        serviceId: `sow-svc-${String(index).padStart(3, "0")}`,
        name: gap.unmetNeed || gap.description,
        description: `Gap-driven service: ${gap.description}`,
        category,
        targetSegments: [...segments],
        geographicCoverage: coverage,
        evidenceClass: "assumption",
        sourceResearchRefs: [ctx.sourceResearchId],
      });
    }
  }

  return items;
}

const DEFAULT_PACKAGE_BLUEPRINTS: Array<{
  packageType: PackageType;
  nameSuffix: string;
  priceFactor: number;
  duration: string;
  costFactor: number;
  marginHint: string;
}> = [
  {
    packageType: "basic",
    nameSuffix: "Basic",
    priceFactor: 0.85,
    duration: "2-3 hours",
    costFactor: 0.45,
    marginHint: "~35-45%",
  },
  {
    packageType: "premium",
    nameSuffix: "Premium",
    priceFactor: 1.15,
    duration: "3-4 hours",
    costFactor: 0.5,
    marginHint: "~40-50%",
  },
  {
    packageType: "recurring",
    nameSuffix: "Recurring Weekly",
    priceFactor: 0.95,
    duration: "2-3 hours / visit",
    costFactor: 0.42,
    marginHint: "~40-48%",
  },
  {
    packageType: "emergency",
    nameSuffix: "Emergency / Same-Day",
    priceFactor: 1.35,
    duration: "1-2 hours rush",
    costFactor: 0.55,
    marginHint: "~30-40%",
  },
];

export function provideServicePackages(
  ctx: OfferContext,
  catalogue: ServiceCatalogueItem[],
): ServicePackage[] {
  const pricing = readPricing(ctx);
  const currency =
    (pricing && "currency" in pricing && pricing.currency) || ctx.currency || "USD";
  const typical =
    pricing && "typicalPriceRange" in pricing && pricing.typicalPriceRange
      ? String(pricing.typicalPriceRange.value)
      : null;
  const basePrice = midpointFromRange(typical, currency);
  const pricingAvailable = ctx.pricingEvidenceAvailable && !!basePrice;
  const requestedTypes = new Set(ctx.packageTypes);
  const blueprints = DEFAULT_PACKAGE_BLUEPRINTS.filter((b) =>
    requestedTypes.has(b.packageType),
  );
  const useBlueprints = blueprints.length ? blueprints : DEFAULT_PACKAGE_BLUEPRINTS.slice(0, 2);
  const primaryService = catalogue[0]?.name ?? ctx.serviceCategory;
  const targetCustomer = ctx.customerSegments[0] ?? "local customers";
  const coverage = ctx.targetServiceArea || "unspecified";

  return useBlueprints.map((bp, index) => {
    const recommended = pricingAvailable
      ? scalePrice(basePrice, bp.priceFactor, currency)
      : null;
    const evidenceClass: EvidenceClass = pricingAvailable ? "estimated" : "unknown";
    const assumptions = pricingAvailable
      ? [
          `Anchored to Q7-02 typicalPriceRange (${typical})`,
          `${bp.nameSuffix} factor ${bp.priceFactor} applied structurally`,
        ]
      : [
          "Q7-02 pricing findings missing or incomplete — recommendedPrice unknown",
          "Do not fabricate pricing evidence",
        ];
    const inclusions =
      bp.packageType === "premium"
        ? ["core service", "premium consumables", "priority scheduling window"]
        : bp.packageType === "emergency"
          ? ["core service", "same-day slot preference", "rush coordination"]
          : bp.packageType === "recurring"
            ? ["core service", "scheduled repeats", "loyalty discount eligibility"]
            : ["core service", "standard consumables"];
    const exclusions =
      bp.packageType === "basic"
        ? ["specialist equipment", "after-hours surcharge coverage"]
        : ["unrelated specialty work", "third-party permit fees"];

    return {
      packageId: `sow-pkg-${String(index + 1).padStart(3, "0")}`,
      name: `${primaryService} — ${bp.nameSuffix}`,
      targetCustomer,
      pricingModel:
        bp.packageType === "recurring"
          ? "recurring_visit"
          : bp.packageType === "emergency"
            ? "call_out_plus_service"
            : "fixed_package",
      recommendedPrice: {
        value: recommended ?? "unknown — awaiting Q7-02 pricing evidence",
        evidenceClass,
        source: pricingAvailable ? "research" : "unknown",
        explanation: pricingAvailable
          ? "Derived from Q7-02 pricing findings; not a fabricated price"
          : "Pricing evidence unavailable — marked unknown honestly",
      },
      pricingAssumptions: assumptions,
      estimatedDuration: bp.duration,
      estimatedOperationalCost: {
        value: pricingAvailable
          ? scalePrice(recommended, bp.costFactor, currency) ?? "unknown"
          : "unknown",
        evidenceClass: pricingAvailable ? "inference" : "unknown",
        source: pricingAvailable ? "assumption" : "unknown",
      },
      estimatedGrossMargin: {
        value: pricingAvailable ? bp.marginHint : "unknown",
        evidenceClass: pricingAvailable ? "inference" : "unknown",
        source: "assumption",
      },
      optionalExtras:
        bp.packageType === "premium"
          ? ["eco upgrade", "appliance wipe-down"]
          : ["addon deep zone", "materials top-up"],
      renewalOptions:
        bp.packageType === "recurring"
          ? ["weekly", "biweekly", "monthly"]
          : ["one-off", "convert_to_recurring"],
      packageType: bp.packageType,
      inclusions,
      exclusions,
      geographicCoverage: coverage,
      sourceResearchRefs: [ctx.sourceResearchId],
    };
  });
}

export function providePricingRecommendations(
  ctx: OfferContext,
  packages: ServicePackage[],
): PricingRecommendation[] {
  const pricing = readPricing(ctx);
  const currency =
    (pricing && "currency" in pricing && pricing.currency) || ctx.currency || "USD";
  const typical =
    pricing && "typicalPriceRange" in pricing && pricing.typicalPriceRange
      ? String(pricing.typicalPriceRange.value)
      : null;
  const min =
    pricing && "minObservedPrice" in pricing && pricing.minObservedPrice
      ? String(pricing.minObservedPrice.value)
      : null;
  const max =
    pricing && "maxObservedPrice" in pricing && pricing.maxObservedPrice
      ? String(pricing.maxObservedPrice.value)
      : null;

  return packages.map((pkg, index) => ({
    recommendationId: `sow-prc-${String(index + 1).padStart(3, "0")}`,
    packageId: pkg.packageId,
    recommendedPrice: { ...pkg.recommendedPrice },
    currency,
    pricingModel: pkg.pricingModel,
    researchTypicalRange: typical,
    researchMinObserved: min,
    researchMaxObserved: max,
    pricingAssumptions: [...pkg.pricingAssumptions],
    evidenceClass: pkg.recommendedPrice.evidenceClass,
    referencesQ702PricingFindings: true,
    sourceResearchId: ctx.sourceResearchId,
  }));
}

export function providePackageInclusions(
  packages: ServicePackage[],
): Array<{ packageId: string; inclusions: string[] }> {
  return packages.map((p) => ({ packageId: p.packageId, inclusions: [...p.inclusions] }));
}

export function providePackageExclusions(
  packages: ServicePackage[],
): Array<{ packageId: string; exclusions: string[] }> {
  return packages.map((p) => ({ packageId: p.packageId, exclusions: [...p.exclusions] }));
}

export function provideGuarantees(
  ctx: OfferContext,
  packages: ServicePackage[],
): Guarantee[] {
  const pricing = readPricing(ctx);
  let refundPractice: string | null = null;
  if (pricing && "refundGuaranteePractices" in pricing && pricing.refundGuaranteePractices?.length) {
    const first = pricing.refundGuaranteePractices[0];
    refundPractice =
      typeof first === "object" && first && "value" in first
        ? String(first.value)
        : null;
  }

  return packages.map((pkg, index) => {
    const supported = !!refundPractice || pkg.packageType !== "unknown";
    return {
      guaranteeId: `sow-gua-${String(index + 1).padStart(3, "0")}`,
      packageId: pkg.packageId,
      satisfaction: supported ? "Satisfaction revisit within agreed window when defects reported" : undefined,
      workmanship: supported ? "Workmanship rework for covered scope defects" : undefined,
      responseTime: pkg.packageType === "emergency" ? "same-day acknowledgement target" : "next-business-day acknowledgement",
      arrivalWindow: pkg.packageType === "emergency" ? "priority arrival window" : "scheduled arrival window",
      warrantyPeriod: supported ? "24-48h post-completion defect window" : undefined,
      refundConditions: refundPractice
        ? `Aligned to observed research practice: ${refundPractice}`
        : supported
          ? "Refund only for documented non-delivery of contracted scope (assumption)"
          : undefined,
      reworkConditions: supported ? "One complimentary rework pass for covered defects" : undefined,
      evidenceClass: refundPractice ? "estimated" : "assumption",
      supported,
    };
  });
}

export function provideFulfilmentRequirements(
  ctx: OfferContext,
  packages: ServicePackage[],
): FulfilmentRequirement[] {
  const category = ctx.serviceCategory || "local_service";
  return packages.map((pkg, index) => ({
    fulfilmentId: `sow-ful-${String(index + 1).padStart(3, "0")}`,
    packageId: pkg.packageId,
    skills: [`${category}_execution`, "customer_communication", "quality_check"],
    equipment: pkg.packageType === "premium" ? ["standard kit", "premium tools"] : ["standard kit"],
    materials: pkg.packageType === "premium" ? ["premium consumables"] : ["standard consumables"],
    licences: ["local_operating_permission_if_required"],
    estimatedManpower: pkg.packageType === "enterprise" ? "2-3 techs" : "1-2 techs",
    workflowPrerequisites: [
      "confirmed service scope",
      "access arrangements",
      "Q7-03 offer accepted structurally (booking is Q7-04)",
    ],
    customerPreparation: ["clear access path", "secure valuables", "confirm on-site contact"],
    completionCriteria: [
      "scope checklist complete",
      "customer walkthrough offered",
      "defects logged if any",
    ],
    evidenceClass: "assumption",
  }));
}

export function provideOperationalAssumptions(ctx: OfferContext): string[] {
  const research = ctx.marketResearch;
  const fromResearch =
    research && "assumptions" in research && Array.isArray(research.assumptions)
      ? research.assumptions.map(String)
      : [];
  return [
    ...fromResearch,
    "Service offers are structural signals only — no booking, CRM, launch, or job execution",
    "Pricing recommendations reference Q7-02 findings and never fabricate evidence",
  ];
}

export function provideRisks(ctx: OfferContext): string[] {
  const research = ctx.marketResearch;
  const fromResearch =
    research && "risks" in research && Array.isArray(research.risks)
      ? research.risks.map(String)
      : [];
  const risks = [...fromResearch];
  if (!ctx.pricingEvidenceAvailable) {
    risks.push("pricing_evidence_incomplete_offer_prices_marked_unknown");
  }
  risks.push("fulfilment_capacity_not_validated_in_q7_03");
  return risks;
}

export function provideOutstandingQuestions(ctx: OfferContext): string[] {
  const research = ctx.marketResearch;
  const unknowns =
    research && "unknowns" in research && Array.isArray(research.unknowns)
      ? research.unknowns.map(String)
      : [];
  const questions = [...unknowns];
  if (!ctx.pricingEvidenceAvailable) {
    questions.push("Obtain complete Q7-02 pricing findings before treating recommended prices as estimated");
  }
  questions.push("Confirm licensing and insurance requirements before operations (out of Q7-03 scope)");
  return questions;
}

export { evidenceClassFrom };
