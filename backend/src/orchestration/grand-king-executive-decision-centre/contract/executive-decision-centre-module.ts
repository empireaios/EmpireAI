/**
 * G7-04 — Grand King Executive Decision Centre Brain module contract.
 */

export const GRAND_KING_EXECUTIVE_DECISION_CENTRE_MODULE_ID = "grand-king-executive-decision-centre" as const;

export type GrandKingExecutiveDecisionCentreCapability =
  | "grand-king-executive-decision-centre.overview"
  | "grand-king-executive-decision-centre.health"
  | "grand-king-executive-decision-centre.decisions"
  | "grand-king-executive-decision-centre.recommendations"
  | "grand-king-executive-decision-centre.blockers"
  | "grand-king-executive-decision-centre.opportunities"
  | "grand-king-executive-decision-centre.notifications"
  | "grand-king-executive-decision-centre.timeline"
  | "grand-king-executive-decision-centre.summary";

export const GRAND_KING_EXECUTIVE_DECISION_CENTRE_CAPABILITIES: GrandKingExecutiveDecisionCentreCapability[] = [
  "grand-king-executive-decision-centre.overview",
  "grand-king-executive-decision-centre.health",
  "grand-king-executive-decision-centre.decisions",
  "grand-king-executive-decision-centre.recommendations",
  "grand-king-executive-decision-centre.blockers",
  "grand-king-executive-decision-centre.opportunities",
  "grand-king-executive-decision-centre.notifications",
  "grand-king-executive-decision-centre.timeline",
  "grand-king-executive-decision-centre.summary",
];

export type GrandKingExecutiveDecisionCentreModuleContract = {
  moduleId: typeof GRAND_KING_EXECUTIVE_DECISION_CENTRE_MODULE_ID;
  capabilities: GrandKingExecutiveDecisionCentreCapability[];
  missionId: "G7-04";
  programmeStatus: "executive-decision-centre-established";
  integratesWith: [
    "grand-king-business-automation-operations",
    "grand-king-commerce-operations",
    "grand-king-production-workspace",
    "grand-king-live-operations",
    "production-certification",
    "cockpit",
    "pillow",
    "ekls",
    "brain",
    "registry",
  ];
};

export function createGrandKingExecutiveDecisionCentreModuleContract(): GrandKingExecutiveDecisionCentreModuleContract {
  return {
    moduleId: GRAND_KING_EXECUTIVE_DECISION_CENTRE_MODULE_ID,
    capabilities: GRAND_KING_EXECUTIVE_DECISION_CENTRE_CAPABILITIES,
    missionId: "G7-04",
    programmeStatus: "executive-decision-centre-established",
    integratesWith: [
      "grand-king-business-automation-operations",
      "grand-king-commerce-operations",
      "grand-king-production-workspace",
      "grand-king-live-operations",
      "production-certification",
      "cockpit",
      "pillow",
      "ekls",
      "brain",
      "registry",
    ],
  };
}
