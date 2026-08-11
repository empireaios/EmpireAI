/**
 * Canonical Pillow continuous executive operating loop — types.
 * Stages are runtime-executed, not prompt doctrine alone.
 */

export type ExecutiveLoopStage =
  | "OBSERVE"
  | "DIAGNOSE"
  | "CRITIQUE"
  | "GENERATE_ALTERNATIVES"
  | "INVESTIGATE"
  | "COMPARE"
  | "DECIDE"
  | "ACT_WITHIN_AUTHORITY"
  | "ESCALATE"
  | "MONITOR"
  | "LEARN"
  | "UPDATE_STRATEGY"
  | "CONTINUE";

export type IntelligenceTierUsed = "TIER_0" | "TIER_1" | "TIER_2" | "TIER_3";

export type WorkAuthority =
  | "pillow_autonomous"
  | "requires_grand_king"
  | "blocked_governance";

export type StrategicHypothesisKind =
  | "logistics_fulfilment"
  | "pricing_competition"
  | "demand_evidence"
  | "supplier_sourcing"
  | "warehouse_route"
  | "marketplace_corridor"
  | "product_substitute"
  | "margin_economics"
  | "quality_returns"
  | "scale_expansion"
  | "abandon_opportunity"
  | "owner_authority"
  | "other";

export type StrategicHypothesis = {
  id: string;
  kind: StrategicHypothesisKind;
  question: string;
  investigation: string;
  expectedSignal: string;
  estimatedInvestigationCost: "cheap" | "moderate" | "expensive";
  tier: IntelligenceTierUsed;
  priorityScore: number;
  requiresOwnerAuthority: boolean;
};

export type OwnerEscalationPackage = {
  whatIFound: string;
  whyItMatters: string;
  whatIInvestigated: string[];
  options: Array<{ id: string; summary: string; tradeoff: string }>;
  recommendation: string;
  whatINeedYouToDecide: string;
  whatIWillDoNext: string;
  authorityGate: string;
};

export type OutcomeRecord = {
  id: string;
  workspaceId: string;
  initiativeId: string;
  hypothesis: string;
  expectedResult: string;
  actualResult: string | null;
  variance: string | null;
  diagnosis: string | null;
  nextStrategy: string | null;
  lesson: string | null;
  lessonConfidence: "low" | "medium" | "high" | null;
  lessonConditions: string | null;
  status: "OPEN" | "MONITORED" | "CLOSED";
  createdAt: string;
  updatedAt: string;
};

export type PrioritisedWorkItem = {
  id: string;
  title: string;
  kind: StrategicHypothesisKind | "monitor" | "learn" | "escalate";
  economicUpside: number;
  economicDownside: number;
  urgency: number;
  confidence: number;
  customerImpact: number;
  strategicValue: number;
  risk: number;
  investigationCost: number;
  requiredAuthority: WorkAuthority;
  priorityScore: number;
  hypothesisId?: string;
};

export type CommercialSituation = {
  situationId: string;
  productName: string;
  corridor: string;
  ourPriceUsd: number | null;
  lowestCompetitorUsd: number | null;
  pricePremiumPct: number | null;
  expectedProfitUsd: number | null;
  expectedProfitStatus: "ESTIMATED" | "VERIFIED" | "UNKNOWN";
  demandEvidence: "PRESENT" | "UNKNOWN" | "WEAK";
  supplierCanMeetDelivery: "YES" | "NO" | "UNKNOWN";
  /** Origin→destination delivery profile; never invents warehouses. */
  fulfilmentProfile: {
    originRegion: string;
    destinationMarketplace: string;
    estimatedTransitDays: number | null;
    shippingCostUsd: number | null;
    warehouseRegionKnown: boolean;
    warehouseRegion: string | null;
  };
  published: boolean;
  buyable: "YES" | "NO" | "UNKNOWN";
  orders: number;
  realisedRevenueUsd: number;
  supplierCostChangePct: number | null;
  priorRecommendation: "APPROVE" | "REJECT" | "HOLD" | "INVESTIGATE" | "TEST" | "WAIT" | null;
  gatedSpendRequiredUsd: number | null;
  spendAuthorityLimitUsd: number | null;
  notes: string[];
  /** Fingerprint of last observed state for delta detection. */
  previousStateFingerprint?: string | null;
};

export type StageEvidence = {
  stage: ExecutiveLoopStage;
  at: string;
  tier: IntelligenceTierUsed;
  summary: string;
  artifacts: Record<string, unknown>;
};

export type ExecutiveCycleRecord = {
  cycleId: string;
  workspaceId: string;
  startedAt: string;
  completedAt: string;
  mode: "live" | "sandbox";
  situation: CommercialSituation;
  stages: StageEvidence[];
  hypotheses: StrategicHypothesis[];
  workQueue: PrioritisedWorkItem[];
  selectedWork: PrioritisedWorkItem | null;
  decision: {
    disposition: string;
    rationale: string;
    authority: WorkAuthority;
  };
  escalation: OwnerEscalationPackage | null;
  outcomeId: string | null;
  stateFingerprint: string;
  llmCallsUsed: number;
  cheapOperationsUsed: number;
  continued: boolean;
};
