import {
  buildDecisionCaseState,
  extractNamedCandidateBlocks,
} from "../../../../../backend/src/orchestration/pillow-host/executive-decision-case-state.ts";

const msg = `SYNTHETIC. Rank by contribution.
Alpha: contribution US$4950 stock 2000 delivery 3 days approval granted.
Beta: contribution US$5000 stock 2000 delivery 3 days approval granted.
Eligibility: contribution at least US$8 stock at least 1000 delivery no more than 6 days approval granted.
Select highest contribution among eligible.`;

const blocks = extractNamedCandidateBlocks(msg);
const d = buildDecisionCaseState(msg);
console.log(
  JSON.stringify(
    {
      blocks,
      candidates: d?.candidates.map((c) => ({
        name: c.displayName,
        metric: c.supportedMetric,
        eligible: c.currentlyEligible,
      })),
      rec: d?.recommendation,
    },
    null,
    2,
  ),
);
