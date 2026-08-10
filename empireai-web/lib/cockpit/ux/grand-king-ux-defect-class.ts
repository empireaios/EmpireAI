/**
 * Mission 006 — Grand King UX defect classification (web).
 * Class 1 = operational blockers (fix immediately).
 * Class 2 = important UX (queue alongside commerce).
 * Class 3 = polish (backlog; do not delay first dollar).
 */

export type GrandKingUxDefectClassId = "CLASS_1" | "CLASS_2" | "CLASS_3";

export const GRAND_KING_UX_DEFECT_CLASSES = {
  CLASS_1: {
    id: "CLASS_1" as const,
    title: "Operational blocker",
    rule: "FIX IMMEDIATELY — prevents Grand King from operating/testing EmpireAI.",
  },
  CLASS_2: {
    id: "CLASS_2" as const,
    title: "Important UX",
    rule: "Queue and improve alongside commercial progression.",
  },
  CLASS_3: {
    id: "CLASS_3" as const,
    title: "UX polish",
    rule: "Record in backlog — do not delay first-dollar progression.",
  },
} as const;

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

/** Historical: Executive Home scroll prison was Class 1 — fixed under CQ-03. */
export const KNOWN_CLASS_1_EXAMPLES = [
  "cannot scroll to required content",
  "buttons cannot be clicked",
  "navigation does not work",
  "overlays trap the interface",
] as const;
