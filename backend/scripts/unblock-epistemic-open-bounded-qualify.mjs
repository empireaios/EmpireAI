/**
 * DEV_FULL qualify: demote epistemic Unsupported as open/bounded answer writer.
 * Deterministic local — no LLM, no sealed Wave exams, no Grand King courier.
 *
 * Targets: EC18 open ≥50, warm live→bounded ≥50, EC24 ≥50, commercial short ≥75,
 * live negative controls, PRESERVE synthesizer smoke.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const OUT = path.join(ROOT, "docs/audits/capability-extraction");

const {
  isOpenExecutiveReasoningAsk,
  isClaimEvidenceAuditAsk,
  isGenericEpistemicStubSurface,
  shouldAuthorWithEvidenceStructureAudit,
  synthesizeOpenExecutiveReasoning,
  isLiveEmpireAiFactQuery,
  detectRequestExecutionMode,
} = await import("../src/orchestration/pillow-host/executive-request-execution-plan.ts");
const { synthesizeEvidenceStructureAudit } = await import(
  "../src/orchestration/pillow-host/executive-scoped-reasoning.ts"
);
const {
  parseExecutiveTaskContract,
  synthesizeTaskUnitAnswer,
  buildContractAwareReconstruct,
} = await import("../src/orchestration/pillow-host/executive-task-contract.ts");
const { buildDecisionCaseState } = await import(
  "../src/orchestration/pillow-host/executive-decision-case-state.ts"
);

const truth = {
  birth: { birthTimestamp: null },
  product: { productName: "Mini Fan", asin: null },
  financial: { orders: 0, revenue: 0 },
  deploy: { serviceOnlineHint: "assume_online_if_answering" },
};

const OPEN_VERBS = [
  "What would you do first?",
  "Decompose this objective into an executable plan.",
  "Design a synthetic supplier-selection process.",
  "How should we approach this?",
  "Break this down into first moves.",
];
const OPEN_GOALS = [
  "Build a profitable synthetic Amazon-US business using supplier feeds",
  "Find a profitable synthetic Supplier × Marketplace opportunity",
  "Stand up a synthetic corridor from supplier feed to marketplace listing",
  "Create a synthetic portfolio test plan for 10 candidates",
  "Launch a synthetic marketplace business without claiming live access",
];

const SUPPLIER_A = [
  "NEXO", "PICO", "MIST", "HAZE", "CEDAR", "BIRCH", "MAPLE", "OAK", "PINE", "ELM",
  "RIVER", "STONE", "HILL", "LAKE", "FORD", "DALE", "GLEN", "MOOR", "BAY", "CAPE",
  "NORD", "SUD", "PEAK", "VALE", "RIDGE", "CREEK", "MARSH", "PORT", "QUILL", "EMBER",
  "FLINT", "CORAL", "IVY", "JADE", "KELP", "LUMEN", "NOVA", "ORBIT", "PRISM", "QUARTZ",
  "RADIX", "SOLAR", "TIDE", "ULTRA", "VISTA", "WISP", "XENON", "YARROW", "ZEPHYR", "ATLAS",
];

function fail(msg) {
  console.error("FAIL:", msg);
  process.exit(1);
}

function checkOpen(prompt) {
  const c = parseExecutiveTaskContract(prompt);
  const unit = synthesizeTaskUnitAnswer(c.tasks[0] || { kind: "general", subject: prompt, text: prompt }, truth, {
    userMessage: prompt,
  });
  const rec = buildContractAwareReconstruct(truth, c);
  if (isGenericEpistemicStubSurface(unit) || isGenericEpistemicStubSurface(rec)) {
    return { ok: false, reason: "stub_takeover", unit, rec };
  }
  if (/Unverified assertion|Unsupported as established fact/i.test(unit) && !/Recommended first moves/i.test(unit)) {
    return { ok: false, reason: "unsupported_visible", unit };
  }
  if (!/Recommended first moves|ASSUMPTIONS|EVIDENCE_NEEDED|Current action:\s*SELECT/i.test(unit + rec)) {
    return { ok: false, reason: "no_decomposition", unit };
  }
  if (/Mini Fan|realised orders remain zero|Birth has not been authorised/i.test(unit + rec) && /synthetic/i.test(prompt)) {
    // live leak into synthetic open answer
    return { ok: false, reason: "live_leak", unit };
  }
  return { ok: true, unit };
}

let ec18 = 0;
let ec18Fail = 0;
for (let i = 0; i < 50; i++) {
  const prompt = `${OPEN_GOALS[i % OPEN_GOALS.length]}. ${OPEN_VERBS[i % OPEN_VERBS.length]} Do not claim live access you do not have. CaseTag=OPEN${i}.`;
  if (!isOpenExecutiveReasoningAsk(prompt)) {
    ec18Fail++;
    console.error("open_not_classified", i, prompt.slice(0, 80));
    continue;
  }
  const r = checkOpen(prompt);
  if (!r.ok) {
    ec18Fail++;
    console.error("ec18_fail", i, r.reason);
  } else ec18++;
}
if (ec18 < 50 || ec18Fail > 0) fail(`EC18_SHORT_OPEN_CASES pass=${ec18} fail=${ec18Fail}`);

let warmOk = 0;
let warmFail = 0;
for (let i = 0; i < 50; i++) {
  const a = SUPPLIER_A[i % SUPPLIER_A.length];
  const b = SUPPLIER_A[(i + 17) % SUPPLIER_A.length];
  // Simulate prior live ask classification then bounded ask (request-local)
  const livePrior = "How many realised orders has EmpireAI received?";
  if (!isLiveEmpireAiFactQuery(livePrior)) fail("live_prior_not_live");
  const bounded = `Synthetic new case WARM${i} after live discussion. Eligible if approval granted. ${a} granted. ${b} pending. Select the currently eligible supplier.`;
  if (isLiveEmpireAiFactQuery(bounded)) {
    warmFail++;
    continue;
  }
  const mode = detectRequestExecutionMode(bounded);
  if (mode === "LIVE_EMPIREAI_FACT_QUERY" || mode === "LIVE_EMPIREAI_DECISION") {
    warmFail++;
    console.error("warm_mode_error", i, mode);
    continue;
  }
  const d = buildDecisionCaseState(bounded);
  const c = parseExecutiveTaskContract(bounded);
  const unit = synthesizeTaskUnitAnswer(c.tasks[0] || { kind: "general", subject: bounded, text: bounded }, truth, {
    userMessage: bounded,
  });
  const rec = buildContractAwareReconstruct(truth, c);
  if (!d || !d.eligibleSet.includes(a) || d.eligibleSet.includes(b)) {
    warmFail++;
    console.error("warm_eligible", i, d?.eligibleSet);
    continue;
  }
  if (isGenericEpistemicStubSurface(unit) || isGenericEpistemicStubSurface(rec)) {
    warmFail++;
    console.error("warm_stub", i);
    continue;
  }
  if (!/SELECT|Eligible|currently eligible/i.test(unit + rec)) {
    warmFail++;
    continue;
  }
  warmOk++;
}
if (warmOk < 50 || warmFail > 0) fail(`LIVE_TO_BOUNDED pass=${warmOk} fail=${warmFail}`);

let b2lOk = 0;
for (let i = 0; i < 50; i++) {
  const bounded = `Synthetic case B2L${i}. Eligible if approval granted. ${SUPPLIER_A[i]} granted. ${SUPPLIER_A[(i + 3) % 50]} pending.`;
  const live = "What is EmpireAI's current realised order count? Do not invent.";
  if (isLiveEmpireAiFactQuery(bounded)) fail("bounded_misclassified_live");
  if (!isLiveEmpireAiFactQuery(live)) fail("live_restore_failed");
  b2lOk++;
}
if (b2lOk < 50) fail(`BOUNDED_TO_LIVE=${b2lOk}`);

let ec24 = 0;
let ec24Fail = 0;
for (let i = 0; i < 50; i++) {
  const a = SUPPLIER_A[i % SUPPLIER_A.length];
  const b = SUPPLIER_A[(i + 9) % SUPPLIER_A.length];
  const prompt = `Synthetic principle case P${i}. Rule: pending approval is not currently eligible. ${a}: approval granted. ${b}: approval PENDING. Apply the principle and select. Foreign prior case VOLT facts must not appear.`;
  const d = buildDecisionCaseState(prompt);
  const c = parseExecutiveTaskContract(prompt);
  const unit = synthesizeTaskUnitAnswer(c.tasks[0] || { kind: "general", subject: prompt, text: prompt }, truth, {
    userMessage: prompt,
  });
  if (!d || !d.eligibleSet.includes(a) || d.eligibleSet.includes(b)) {
    ec24Fail++;
    continue;
  }
  if (isGenericEpistemicStubSurface(unit)) {
    ec24Fail++;
    continue;
  }
  if (/\bVOLT\b/i.test(unit)) {
    ec24Fail++;
    continue;
  }
  ec24++;
}
if (ec24 < 50 || ec24Fail > 0) fail(`EC24_CASES pass=${ec24} fail=${ec24Fail}`);

let commercial = 0;
let commercialFail = 0;
for (let i = 0; i < 75; i++) {
  const a = SUPPLIER_A[i % SUPPLIER_A.length];
  const b = SUPPLIER_A[(i + 11) % SUPPLIER_A.length];
  const c = SUPPLIER_A[(i + 23) % SUPPLIER_A.length];
  const kind = i % 3;
  let prompt;
  if (kind === 0) {
    prompt = [
      `Synthetic supplier pack C${i}.`,
      "Rule: eligible only if cost <= 400000 AND delivery >= 94% AND approval granted.",
      `${a}: cost 350000 PASS; delivery 96% PASS; approval granted PASS.`,
      `${b}: cost 360000 PASS; delivery 95% PASS; approval PENDING FAIL.`,
      `${c}: cost 340000 PASS; delivery 93% FAIL; approval granted PASS.`,
      "Select the currently eligible supplier.",
    ].join(" ");
  } else if (kind === 1) {
    prompt = `Synthetic product pick C${i}. Hard gate: returns <= 8%. ProductA returns 12%. ProductB returns 5%. Select eligible product.`;
  } else {
    prompt = `Synthetic corridor C${i}. Eligible corridors require policy clear AND stock available. CORRIDOR_A: policy clear; stock available. CORRIDOR_B: policy blocked; stock available. Select.`;
  }
  const contract = parseExecutiveTaskContract(prompt);
  const unit = synthesizeTaskUnitAnswer(
    contract.tasks[0] || { kind: "general", subject: prompt, text: prompt },
    truth,
    { userMessage: prompt },
  );
  const rec = buildContractAwareReconstruct(truth, contract);
  if (isGenericEpistemicStubSurface(unit) || isGenericEpistemicStubSurface(rec)) {
    commercialFail++;
    continue;
  }
  if (/verify first before irreversible|Verification-first next step/i.test(unit) && !/SELECT|eligible|returns|corridor/i.test(unit)) {
    commercialFail++;
    continue;
  }
  commercial++;
}
if (commercial < 75 || commercialFail > 0) {
  fail(`COMMERCIAL_SHORT_CASES pass=${commercial} fail=${commercialFail}`);
}

// Live epistemic controls — classifier + audit still available for genuine claims
const liveControls = [
  "How many realised orders has EmpireAI received?",
  "What is our current realised revenue?",
  "What is EmpireAI current supplier stock right now?",
];
for (const q of liveControls) {
  if (!isLiveEmpireAiFactQuery(q)) fail(`live_control_misclass ${q}`);
  if (isOpenExecutiveReasoningAsk(q)) fail(`live_open_misclass ${q}`);
}
const supplierAssert = synthesizeEvidenceStructureAudit(
  "supplier says demand proven",
  "A supplier says corridor demand is already proven.",
);
if (!/Unverified assertion/i.test(supplierAssert)) fail("live_claim_audit_regressed");

// PRESERVE smoke — decision packs still SELECT without Unsupported
const preservePack = [
  "Acme has three suppliers. Choose one using these rules.",
  "Rule: eligible only if cost <= 400000 AND delivery >= 94% AND approval granted.",
  "RIVER: cost 350000 PASS; delivery 96% PASS; approval granted PASS.",
  "STONE: cost 360000 PASS; delivery 95% PASS; approval PENDING FAIL.",
  "HILL: cost 340000 PASS; delivery 93% FAIL; approval granted PASS.",
  "1. Snapshot",
  "2. Eligible set",
  "3. Recommendation",
].join("\n");
const pd = buildDecisionCaseState(preservePack);
if (!pd || pd.recommendation.selectedId !== "RIVER") fail("preserve_multigate");
const pc = parseExecutiveTaskContract(preservePack);
const prec = buildContractAwareReconstruct(truth, pc);
if (/Unsupported as established fact/i.test(prec)) fail("preserve_unsupported");

const summary = {
  generatedAt: new Date().toISOString(),
  DEV_FULL_PASS: true,
  EC18_SHORT_OPEN_CASES: ec18,
  LIVE_TO_BOUNDED: warmOk,
  BOUNDED_TO_LIVE: b2lOk,
  EC24_CASES: ec24,
  COMMERCIAL_SHORT_CASES: commercial,
  OPEN_UNSUPPORTED_STUB_TAKEOVER: 0,
  WARM_BOUNDED_UNSUPPORTED_TAKEOVER: 0,
  LIVE_FACT_FABRICATION: 0,
  FOREIGN_CASE_FACT_LEAK: 0,
  MODE_TRANSITION_ERROR: 0,
  PRESERVE_MATERIAL_REGRESSION: 0,
  LIVE_EPISTEMIC_CAUTION_PRESERVED: true,
  EPISTEMIC_WRITERS_NOTE:
    "synthesizeEvidenceStructureAudit demoted from default general/multipart full-answer; retained for claim audit kinds",
};

mkdirSync(OUT, { recursive: true });
writeFileSync(path.join(OUT, "UNBLOCK_EPISTEMIC_DEV_FULL_QUAL.json"), JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));
console.log("DEV_FULL_PASS=YES");
