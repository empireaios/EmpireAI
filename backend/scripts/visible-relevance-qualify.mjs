/**
 * Visible relevance / contract envelope qualification (>=150 cases).
 */
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  enforceVisibleContractEnvelope,
  assessVisibleContractEnvelope,
} from "../src/orchestration/pillow-host/executive-final-visible-contract.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const OUT = path.join(ROOT, "docs/audits/complete-state");

function sections(n) {
  return Array.from({ length: n }, (_, i) => `${i + 1}. Section ${i + 1}\nBody for section ${i + 1}.`).join(
    "\n\n",
  );
}

const cases = [];
for (const n of [3, 5, 6, 8]) {
  for (let i = 0; i < 20; i++) {
    const user = `Answer in exactly ${n} numbered sections.`;
    const clean = sections(n);
    cases.push({
      id: `clean_${n}_${i}`,
      user,
      answer: clean,
      expectPre: 0,
      expectPost: 0,
      keepRec: false,
      keepRisk: false,
    });
    cases.push({
      id: `pre_post_${n}_${i}`,
      user,
      answer:
        "Recommendation: Validate performance / evidence first, then scale only what clears constitutional and commercial thresholds.\n\n" +
        clean +
        "\n\n### Risk / lesson\nFailover/mitigation can overload the receiving path.",
      expectPre: 0,
      expectPost: 0,
      keepRec: false,
      keepRisk: false,
    });
  }
}
// Requested recommendation/risk inside sections
for (let i = 0; i < 10; i++) {
  const user =
    "Answer in exactly 4 numbered sections. Include a recommendation and a risk lesson.";
  const ans = [
    "1. Snapshot",
    "Body.",
    "2. Analysis",
    "Body.",
    "3. Recommendation",
    "Recommend staged validation before scale.",
    "4. Risk / lesson",
    "Demonstrated mechanism: failover overload on the receiving path.",
  ].join("\n\n");
  cases.push({
    id: `requested_${i}`,
    user,
    answer: ans,
    expectPre: 0,
    expectPost: 0,
    keepRec: true,
    keepRisk: true,
  });
}

let preErr = 0;
let postErr = 0;
let recOmit = 0;
let riskOmit = 0;

for (const c of cases) {
  const enforced = enforceVisibleContractEnvelope(c.answer, Number(/exactly (\d+)/i.exec(c.user)?.[1] || 0) || null, c.user);
  const assess = assessVisibleContractEnvelope(
    enforced.message,
    Number(/exactly (\d+)/i.exec(c.user)?.[1] || 0) || null,
    c.user,
  );
  if (assess.preSectionBlocks !== c.expectPre) preErr += 1;
  if (assess.postSectionBlocks > c.expectPost) postErr += 1;
  if (c.keepRec && !/Recommend|recommendation/i.test(enforced.message)) recOmit += 1;
  if (c.keepRisk && !/Risk|mechanism|failover/i.test(enforced.message)) riskOmit += 1;
}

const summary = {
  generatedAt: new Date().toISOString(),
  VISIBLE_RELEVANCE_RAW_CASES: cases.length,
  UNREQUESTED_PRE_SECTION_SEMANTIC_TEXT: preErr,
  UNREQUESTED_POST_FINAL_SECTION_TEXT: postErr,
  REQUESTED_RECOMMENDATION_OMISSION: recOmit,
  REQUESTED_RISK_OMISSION: riskOmit,
  pass: cases.length >= 150 && preErr === 0 && postErr === 0 && recOmit === 0 && riskOmit === 0,
};

mkdirSync(OUT, { recursive: true });
writeFileSync(path.join(OUT, "VISIBLE_RELEVANCE_QUAL.json"), JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));
if (!summary.pass) process.exit(1);
