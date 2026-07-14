import type { AcceptanceVerdict, TripleAcceptanceModel } from "./types.js";

/** Mission completion requires PASS · PASS · PASS (P4-06). */
export function evaluateTripleAcceptance(input: {
  repositoryAcceptance: AcceptanceVerdict;
  productionAcceptance: AcceptanceVerdict;
  grandKingAcceptance: AcceptanceVerdict;
}): TripleAcceptanceModel {
  const { repositoryAcceptance, productionAcceptance, grandKingAcceptance } = input;
  const missionComplete =
    repositoryAcceptance === "PASS" &&
    productionAcceptance === "PASS" &&
    grandKingAcceptance === "PASS";

  const parts = [
    `Repository Acceptance: ${repositoryAcceptance}`,
    `Production Acceptance: ${productionAcceptance}`,
    `Grand King Acceptance: ${grandKingAcceptance}`,
  ];

  return {
    repositoryAcceptance,
    productionAcceptance,
    grandKingAcceptance,
    missionComplete,
    summary: missionComplete
      ? "Triple acceptance PASS — mission may complete"
      : `Mission blocked — ${parts.join(" · ")}`,
  };
}

export function formatAcceptanceBlock(acceptance: TripleAcceptanceModel): string {
  return [
    "## Browser Truth Acceptance (P4-06 — mandatory)",
    "",
    "| Tier | Status |",
    "|------|--------|",
    `| Repository Acceptance | **${acceptance.repositoryAcceptance}** |`,
    `| Production Acceptance | **${acceptance.productionAcceptance}** |`,
    `| Grand King Acceptance | **${acceptance.grandKingAcceptance}** |`,
    "",
    `**Mission Complete:** ${acceptance.missionComplete ? "YES" : "NO"} — requires PASS · PASS · PASS`,
    "",
    acceptance.summary,
    "",
  ].join("\n");
}
