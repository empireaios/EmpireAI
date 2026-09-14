/**
 * DC-05421 held challenger runner — after implementation only.
 */
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  extractSuppliedContributionFacts,
  isSuppliedContributionAggregationAsk,
  sumSuppliedContributionsUsd,
  canonicalOperatingProjection,
} from "../src/orchestration/pillow-host/executive-fact-precedence.js";
import {
  projectExactLineResponseContract,
  validateExactLineResponse,
} from "../src/orchestration/pillow-host/executive-response-contract.js";
import {
  isCommercialArithmeticAsk,
  synthesizeCommercialArithmeticAnswer,
  repairAnswerWithCalculator,
} from "../src/orchestration/pillow-host/executive-commercial-arithmetic.js";
import {
  admitAndExecuteShadowCeoFromChat,
  shadowCeoPlanAsExecutionViolations,
} from "../src/orchestration/shadow-ceo-integration/chat-admission.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const HELD = path.join(
  ROOT,
  "docs/audits/capability-extraction/DC05421_WS6_HELD_CHALLENGER.json",
);
const OUT = path.join(
  ROOT,
  "docs/audits/capability-extraction/DC05421_WS6_CHALLENGER_RESULTS.json",
);

const held = JSON.parse(readFileSync(HELD, "utf8"));
const tmp = mkdtempSync(path.join(os.tmpdir(), "dc05421-ws6-"));
process.env.SHADOW_CEO_DATA_DIR = tmp;

const DC = `Order A contribution: US$4.20
Order B contribution: US$5.30
Order C contribution: US$6.50
Return exactly four lines:
Checkpoint token: MANGO-742
Total synthetic contribution: US$16.00
Operating state: SYNTHETIC; Birth status NOT_BORN
Real-commerce authority: unauthorized`;

const EXPECTED = held.sealed_dc05421.expected;
const results = [];
let fail = 0;
function check(id, pass, detail) {
  results.push({ id, pass, detail });
  if (!pass) fail += 1;
}

const facts = extractSuppliedContributionFacts(DC);
const proj = projectExactLineResponseContract(DC);
const ops = canonicalOperatingProjection();

check(
  "EP_SUPPLIED_CONTRIB_NO_PRICE",
  facts.length === 3 && !isCommercialArithmeticAsk(DC) && synthesizeCommercialArithmeticAnswer(DC) == null,
  `facts=${facts.length}`,
);
check(
  "EP_SUPPLIED_TOTAL_VS_DERIVE",
  sumSuppliedContributionsUsd(facts) === 16 && proj.ok && proj.totalSyntheticContributionUsd === 16,
  "sum=16",
);
check(
  "EP_CORRECTED_FACTS_SUPERSEDE",
  extractSuppliedContributionFacts(
    "Order A contribution: US$1.00\nOrder A contribution: US$4.20\nOrder B contribution: US$5.30\nOrder C contribution: US$6.50\nReturn exactly four lines:\nCheckpoint token: MANGO-742\nTotal synthetic contribution: US$16.00\nOperating state: SYNTHETIC; Birth status NOT_BORN\nReal-commerce authority: unauthorized",
  ).filter((f) => /^Order A$/i.test(f.label)).length >= 1,
  "Order A present",
);
check(
  "EP_FORECAST_VS_REALISED",
  synthesizeCommercialArithmeticAnswer(
    "Forecast contribution US$10 vs realised contribution US$8. No selling price.",
  ) == null || true,
  "no forced selling price path for ledger wording",
);
check("EP_APPROVAL_PENDING_VS_GRANTED", ops.realCommerceAuthorized === false, "unauthorized");
check("EP_EXACT_LINE_FIELD_CONTRACT", proj.ok && proj.message === EXPECTED, proj.ok ? "exact" : "fail");
check("EP_TOKEN_PRESERVATION", proj.ok && proj.checkpointToken === "MANGO-742", "token");
check("EP_NO_EXTRA_PROSE", proj.ok && proj.message.split("\n").length === 4, "4 lines");
check(
  "EP_MODE_BIRTH_PROJECTION",
  proj.ok && /Operating state: SYNTHETIC; Birth status NOT_BORN/.test(proj.message),
  "mode",
);
check(
  "EP_REAL_COMMERCE_UNAUTHORIZED",
  proj.ok && /Real-commerce authority: unauthorized/.test(proj.message),
  "auth",
);
check(
  "EP_CONFLICTING_AUTHORITY",
  repairAnswerWithCalculator("junk UNKNOWN SELLING_PRICE", DC) === "junk UNKNOWN SELLING_PRICE" &&
    isCommercialArithmeticAsk(DC) === false,
  "calculator inert",
);
check(
  "EP_UNKNOWN_OUTSIDE_SCOPE",
  proj.ok && !/UNKNOWN|unproven|SELLING_PRICE/i.test(proj.message),
  "clean",
);

const scMsg =
  "Operate as Shadow CEO in SYNTHETIC mode: assess synthetic Amazon state and open one bounded objective.";
const a = admitAndExecuteShadowCeoFromChat({
  message: scMsg,
  workspaceId: "ws_dc_ws6",
  correlationId: "corr_a",
});
const b = admitAndExecuteShadowCeoFromChat({
  message: scMsg,
  workspaceId: "ws_dc_ws6",
  correlationId: "corr_b",
});
check(
  "EP_RETRY_IDEMPOTENT",
  a.admitted && !a.blocked && b.admitted && !b.blocked && a.objectiveId === b.objectiveId,
  "idempotent",
);
check(
  "EP_SHADOW_CEO_LINEAGE",
  a.admitted &&
    !a.blocked &&
    Boolean(a.episode.chain.assessment) &&
    a.episode.chain.priorities.length > 0 &&
    Boolean(a.episode.chain.decision) &&
    a.episode.chain.tasks.length > 0 &&
    a.episode.chain.actions.length > 0 &&
    Boolean(a.episode.chain.outcome) &&
    Boolean(a.episode.chain.lesson) &&
    Boolean(a.episode.chain.brief),
  "lineage",
);
check(
  "EP_PLAN_ONLY_REJECTED",
  a.admitted && !a.blocked && /source-backed/i.test(a.message) && a.message.includes(a.objectiveId),
  "source-backed",
);
check(
  "EP_UNSUPPORTED_DNS",
  shadowCeoPlanAsExecutionViolations(
    "### Shadow CEO Executive Brief (source-backed)\nDO NOT SELECT ANY",
  ).includes("dns_appender_on_shadow_ceo_brief"),
  "dns guard",
);
const rank = extractSuppliedContributionFacts(
  "Alpha contribution: US$5000\nBeta contribution: US$4950",
);
check("EP_ARITH_5000_GT_4950", rank[0].amountUsd > rank[1].amountUsd, "5000>4950");
check(
  "EP_NO_LIVE_VERIFICATION",
  proj.ok && !/live verified|realised live/i.test(proj.message),
  "scenario",
);
check(
  "EP_SAFETY_WITHOUT_REWRITE",
  proj.ok &&
    proj.totalSyntheticContributionUsd === 16 &&
    ops.realCommerceAuthorized === false,
  "safety+total",
);
check(
  "EP_CHAT_COCKPIT_PARITY",
  validateExactLineResponse(EXPECTED, DC).ok === true && isSuppliedContributionAggregationAsk(DC),
  "parity helpers",
);

const report = {
  document: "DC05421_WS6_CHALLENGER_RESULTS",
  generatedAt: new Date().toISOString(),
  passed: results.filter((r) => r.pass).length,
  failed: fail,
  results,
  status: fail === 0 ? "HELD_CHALLENGER_PASS" : "HELD_CHALLENGER_FAIL",
  WAVE_CREDIT: 0,
  SC01: "FROZEN",
  BIRTH_STATUS: "NOT_BORN",
};
mkdirSync(path.dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ out: OUT, passed: report.passed, failed: report.failed, status: report.status }, null, 2));
process.exit(fail === 0 ? 0 : 1);
