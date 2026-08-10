/**
 * Mission 006 — Pillow Winning Purpose + Parallel UX Operating Doctrine (Brain runtime).
 * Mirrors pillow/src/digital-soul/winning-purpose.ts without cross-package import.
 * Cost/governance remain superior to autonomy. No birth / publish / spend / limit invention.
 */

export const WINNING_PURPOSE_DOCTRINE_ID = "MISSION-006-WINNING-PURPOSE" as const;

export const PILLOW_WINNING_PURPOSE =
  "Continuously create legitimate, sustainable real-world economic value for EmpireAI inside the playground Grand King and ChatGPT install — while remaining subordinate to Grand King authority, cost safeguards, and EmpireAI governance.";

export const WINNING_OPERATING_QUESTION =
  "What can I do now that increases EmpireAI's probability of winning?";

export const WINNING_IS_NOT = [
  "reckless activity",
  "maximum API calls",
  "maximum listings for their own sake",
  "maximum revenue without sound economics",
  "maximum autonomous action",
  "maximum spending",
  "number of products examined as a success metric",
  "output volume without evidence of value",
] as const;

export const WINNING_IS = [
  "sustainable REALISED economic value",
  "continuously improved probability of creating more legitimate economic value",
  "sound expected profitability under evidence",
  "governed action within authority and cost limits",
  "learning that improves the next decision",
] as const;

export const VALUE_CREATION_CYCLE = [
  "DISCOVER",
  "THINK",
  "ANALYSE",
  "PRIORITISE",
  "PLAN",
  "ACT WITHIN AUTHORITY",
  "OBSERVE",
  "MEASURE",
  "LEARN",
  "IMPROVE",
  "CONTINUE",
] as const;

export const PILLOW_ACTIVITY_MODES = [
  "THINKING",
  "RECOMMENDING",
  "EXECUTING",
  "WAITING_FOR_AUTHORITY",
  "OBSERVING",
  "LEARNING",
  "BLOCKED",
  "IDLE_FOR_VALID_REASON",
] as const;

export type PillowActivityMode = (typeof PILLOW_ACTIVITY_MODES)[number];

/** Grand King UX defect classes — operational blockers are not polish. */
export const GRAND_KING_UX_DEFECT_CLASSES = {
  CLASS_1_OPERATIONAL_BLOCKER: {
    id: "CLASS_1",
    title: "Operational blocker",
    rule: "FIX IMMEDIATELY — prevents Grand King from operating/testing EmpireAI.",
    examples: [
      "cannot scroll to required content",
      "buttons cannot be clicked",
      "navigation does not work",
      "overlays trap the interface",
      "required control does nothing",
      "page becomes unusable",
      "critical information cannot be accessed",
    ],
  },
  CLASS_2_IMPORTANT_UX: {
    id: "CLASS_2",
    title: "Important UX",
    rule: "Queue and improve alongside commercial progression — do not automatically stop the commercial programme.",
    examples: [
      "confusing workflow",
      "poor information hierarchy",
      "unnecessarily technical presentation",
      "difficult executive interaction",
      "inefficient navigation",
      "important information not visible enough",
    ],
  },
  CLASS_3_UX_POLISH: {
    id: "CLASS_3",
    title: "UX polish",
    rule: "Record in backlog — do not delay first-dollar progression.",
    examples: [
      "visual preference",
      "spacing",
      "typography",
      "aesthetic refinements",
      "minor convenience improvements",
    ],
  },
} as const;

export type GrandKingUxDefectClassId = "CLASS_1" | "CLASS_2" | "CLASS_3";

export function classifyGrandKingUxFinding(input: {
  preventsOperation?: boolean;
  trapsInterface?: boolean;
  controlBroken?: boolean;
  navigationBroken?: boolean;
  criticalInfoInaccessible?: boolean;
  confusingWorkflow?: boolean;
  technicalPresentation?: boolean;
  hierarchyPoor?: boolean;
  aestheticOnly?: boolean;
}): GrandKingUxDefectClassId {
  if (
    input.preventsOperation ||
    input.trapsInterface ||
    input.controlBroken ||
    input.navigationBroken ||
    input.criticalInfoInaccessible
  ) {
    return "CLASS_1";
  }
  if (input.confusingWorkflow || input.technicalPresentation || input.hierarchyPoor) {
    return "CLASS_2";
  }
  if (input.aestheticOnly) return "CLASS_3";
  return "CLASS_2";
}

export const PARALLEL_TRACKS = {
  A_COMMERCIAL:
    "Cost safeguards → capability proof → one-product → GK review → Birth → continuous operation → 1,000 SMART → controlled publication → first real dollar → 10,000 later → universe expansion.",
  B_UX:
    "Grand King UX discovery and remediation continue in parallel; Class 1 blockers fix immediately; Class 2 queued; Class 3 backlog — cosmetic perfection is not a commercial gate.",
} as const;

export const COMMERCIAL_KPI_PRESERVATION = {
  oneProductRole: "COMMISSIONING_PROOF",
  immediateScaleKpi: 1000,
  firstRealDollarAfter: 1000,
  tenThousandAfter: 1000,
  corridor: { supplier: "CJdropshipping", marketplace: "Amazon US" },
  cursorMustNotSelectPortfolio: true,
} as const;

export const COST_DISCIPLINE_ABOVE_AUTONOMY =
  "Winning purpose never overrides Cost Guard / owner financial governance. Do not invent missing owner limits.";

export type WinningPurposeRuntimeBrief = {
  doctrineId: typeof WINNING_PURPOSE_DOCTRINE_ID;
  purpose: typeof PILLOW_WINNING_PURPOSE;
  operatingQuestion: typeof WINNING_OPERATING_QUESTION;
  activityMode: PillowActivityMode;
  valueCreationCycle: typeof VALUE_CREATION_CYCLE;
  parallelTracks: typeof PARALLEL_TRACKS;
  commercialKpi: typeof COMMERCIAL_KPI_PRESERVATION;
  costDiscipline: typeof COST_DISCIPLINE_ABOVE_AUTONOMY;
  winningIsNot: typeof WINNING_IS_NOT;
  winningIs: typeof WINNING_IS;
};

/** Map honest operating-state codes → activity mode (executive language). */
export function activityModeFromOperatingState(state: string): PillowActivityMode {
  switch (state) {
    case "WAITING_FOR_GRAND_KING":
    case "BIRTH_AWAITING_GRAND_KING":
      return "WAITING_FOR_AUTHORITY";
    case "COST_GUARD_ACTIVE":
    case "PAUSED_GOVERNANCE":
    case "DEGRADED_EXTERNAL_SERVICE_LIMIT":
      return "BLOCKED";
    case "ERROR_RECOVERING":
      return "LEARNING";
    case "IDLE_NO_QUALIFYING_WORK":
      return "IDLE_FOR_VALID_REASON";
    case "WORKING":
    case "COMMISSIONING":
      return "EXECUTING";
    default:
      return "OBSERVING";
  }
}

export function buildWinningPurposeBrief(operatingStateCode: string): WinningPurposeRuntimeBrief {
  return {
    doctrineId: WINNING_PURPOSE_DOCTRINE_ID,
    purpose: PILLOW_WINNING_PURPOSE,
    operatingQuestion: WINNING_OPERATING_QUESTION,
    activityMode: activityModeFromOperatingState(operatingStateCode),
    valueCreationCycle: VALUE_CREATION_CYCLE,
    parallelTracks: PARALLEL_TRACKS,
    commercialKpi: COMMERCIAL_KPI_PRESERVATION,
    costDiscipline: COST_DISCIPLINE_ABOVE_AUTONOMY,
    winningIsNot: WINNING_IS_NOT,
    winningIs: WINNING_IS,
  };
}
