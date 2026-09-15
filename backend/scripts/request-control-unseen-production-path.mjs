/**
 * 20+ unseen production-path candidate-evaluation scenarios.
 * Uses the same admitAndExecuteShadowCeoFromChat entry as Pillow chat.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";

import { admitAndExecuteShadowCeoFromChat } from "../src/orchestration/shadow-ceo-integration/chat-admission.ts";
import { seedSyntheticAmazonUsCatalog } from "../src/orchestration/synthetic-commerce/index.ts";
import { openShadowCeoRepository, loadChain } from "../src/orchestration/shadow-ceo/index.ts";

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "req-ctrl-unseen-"));
process.env.SHADOW_CEO_DATA_DIR = tmpRoot;

function pack(opts) {
  const lines = [
    "Shadow CEO SYNTHETIC mode. Real commerce locked. Birth NOT_BORN.",
    "Permitted action: synthetic candidate evaluation only.",
    "Do not create fulfilment monitors, supplier spend, approvals, listings, or ledger movements.",
  ];
  if (opts.token) lines.push(`Checkpoint token: ${opts.token}`);
  if (opts.rank === "highest") lines.push("Select highest contribution among eligible.");
  lines.push("Candidates:");
  opts.names.forEach((n, i) => {
    lines.push(`${n}:`);
    lines.push(`- contribution: US$${opts.contrib[i]} per order`);
    lines.push(`- stock: ${opts.stock[i]}`);
    lines.push(`- delivery: ${opts.days[i]} days`);
    lines.push(`- approval: ${opts.approval[i]}`);
  });
  lines.push("Eligibility required:");
  lines.push(`- contribution at least US$${opts.rules.cMin}`);
  lines.push(`- stock at least ${opts.rules.sMin}`);
  lines.push(`- delivery no more than ${opts.rules.dMax} days`);
  lines.push("- approval granted");
  lines.push("Answer exactly 2 lines:");
  lines.push("Eligible candidates: ...");
  lines.push("Candidate selected: ...");
  return lines.join("\n");
}

function expectEligible(msg, eligible, selected) {
  const el = eligible.length ? eligible.join(", ") : "none";
  const sel = selected || "none";
  assert.equal(msg, `Eligible candidates: ${el}\nCandidate selected: ${sel}`);
}

const scenarios = [];
const names = [
  ["Auklet", "Bittern", "Curlew"],
  ["Dunlin", "Egret", "Fulmar"],
  ["Gannet", "Harrier", "Ibises"],
  ["Jacana", "Knotty", "Larkin"],
  ["Merlin", "Noddy", "Osprey"],
  ["Petrel", "Quailx", "Razorb"],
  ["Sander", "Ternox", "Upland"],
  ["Velvet", "Willet", "Yellow"],
  ["Anhing", "Boobyx"],
  ["Canvas"],
];

let n = 0;
function add(label, build, check) {
  scenarios.push({ id: `U${String(++n).padStart(2, "0")}_${label}`, build, check });
}

add("sole_eligible", () =>
  pack({
    names: names[0],
    contrib: [11, 13, 15],
    stock: [1200, 1500, 1300],
    days: [5, 8, 4],
    approval: ["granted", "granted", "pending"],
    rules: { cMin: 8, sMin: 1000, dMax: 6 },
  }), (m) => expectEligible(m, ["Auklet"], "Auklet"));

add("multi_highest", () =>
  pack({
    names: names[1],
    contrib: [10, 14, 12],
    stock: [2000, 2000, 2000],
    days: [3, 4, 5],
    approval: ["granted", "granted", "granted"],
    rules: { cMin: 8, sMin: 1000, dMax: 6 },
    rank: "highest",
  }), (m) => expectEligible(m, ["Dunlin", "Egret", "Fulmar"], "Egret"));

add("none_eligible", () =>
  pack({
    names: names[2],
    contrib: [5, 6, 7],
    stock: [100, 200, 300],
    days: [9, 10, 11],
    approval: ["pending", "pending", "pending"],
    rules: { cMin: 8, sMin: 1000, dMax: 6 },
  }), (m) => expectEligible(m, [], "none"));

add(
  "correction_delivery",
  () => `SYNTHETIC candidate evaluation.
${names[3][0]}:
- contribution: US$12
- stock: 1500
- earlier delivery: 9 days
- later corrected delivery: 4 days
- approval: granted
${names[3][1]}:
- contribution: US$11
- stock: 1500
- delivery: 5 days
- approval: granted
Eligibility: contribution at least US$8, stock at least 1000, delivery no more than 6 days, approval granted.
Answer exactly 2 lines:
Eligible candidates: ...
Candidate selected: ...
`,
  (m) => {
    assert.match(m, new RegExp(names[3][0]));
    assert.match(m, /Candidate selected:/);
  },
);

add("demo_present", () =>
  pack({
    names: names[4],
    contrib: [11, 9, 15],
    stock: [1200, 800, 1300],
    days: [5, 5, 4],
    approval: ["granted", "granted", "pending"],
    rules: { cMin: 8, sMin: 1000, dMax: 6 },
  }), (m) => {
  expectEligible(m, ["Merlin"], "Merlin");
  assert.ok(!/desk fan|cable organiser|prod-synth/i.test(m));
});

add("contrib_no_price", () =>
  pack({
    names: [names[5][0]],
    contrib: [12],
    stock: [1500],
    days: [4],
    approval: ["granted"],
    rules: { cMin: 8, sMin: 1000, dMax: 6 },
  }), (m) => expectEligible(m, ["Petrel"], "Petrel"));

add("approval_pending", () =>
  pack({
    names: [names[5][1], names[5][2]],
    contrib: [15, 10],
    stock: [1500, 1500],
    days: [3, 3],
    approval: ["pending", "granted"],
    rules: { cMin: 8, sMin: 1000, dMax: 6 },
  }), (m) => expectEligible(m, ["Razorb"], "Razorb"));

add("delivery_outside", () =>
  pack({
    names: names[6],
    contrib: [12, 12, 12],
    stock: [1500, 1500, 1500],
    days: [7, 5, 8],
    approval: ["granted", "granted", "granted"],
    rules: { cMin: 8, sMin: 1000, dMax: 6 },
  }), (m) => expectEligible(m, ["Ternox"], "Ternox"));

add("exact_two_lines", () =>
  pack({
    names: names[7],
    contrib: [11, 13, 15],
    stock: [1200, 1500, 1300],
    days: [5, 8, 4],
    approval: ["granted", "granted", "pending"],
    rules: { cMin: 8, sMin: 1000, dMax: 6 },
  }), (m) => {
  assert.equal(m.split("\n").length, 2);
  assert.ok(!/^#/m.test(m));
  assert.ok(!/^- /m.test(m));
});

add("token_owner", () =>
  pack({
    names: names[8],
    contrib: [11, 9],
    stock: [1200, 1200],
    days: [4, 4],
    approval: ["granted", "pending"],
    rules: { cMin: 8, sMin: 1000, dMax: 6 },
    token: "ORBIT-991",
  }), (m) => expectEligible(m, ["Anhing"], "Anhing"));

add("permit_only_eval", () =>
  pack({
    names: [names[9][0]],
    contrib: [10],
    stock: [2000],
    days: [2],
    approval: ["granted"],
    rules: { cMin: 8, sMin: 1000, dMax: 6 },
  }), (m, meta) => {
  expectEligible(m, ["Canvas"], "Canvas");
  const repo = openShadowCeoRepository({ dbPath: path.join(tmpRoot, "shadow-ceo.db") });
  const chain = loadChain(repo, meta.objectiveId);
  repo.close();
  assert.ok(chain);
  assert.equal(chain.tasks.length, 1);
  assert.equal(chain.approvals.length, 0);
  assert.ok(!chain.tasks.some((t) => /fulfilment|supplier spend/i.test(t.title)));
});

const extra = [
  { n: ["Xeric", "Yarrow", "Zircon"], c: [11, 13, 7], s: [1100, 900, 2000], d: [5, 5, 5], a: ["granted", "granted", "granted"], el: ["Xeric"], sel: "Xeric" },
  { n: ["Boreal", "Cypress", "Drift"], c: [20, 18, 16], s: [2000, 2000, 2000], d: [3, 3, 3], a: ["granted", "granted", "granted"], el: ["Boreal", "Cypress", "Drift"], sel: "Boreal", rank: "sole" },
  { n: ["Ember", "Flint"], c: [7, 12], s: [2000, 2000], d: [4, 4], a: ["granted", "granted"], el: ["Flint"], sel: "Flint" },
  { n: ["Glade"], c: [9], s: [999], d: [4], a: ["granted"], el: [], sel: "none" },
  { n: ["Heather", "Inlet", "Junco"], c: [10, 10, 10], s: [1500, 1500, 1500], d: [6, 6, 7], a: ["granted", "pending", "granted"], el: ["Heather"], sel: "Heather" },
  { n: ["Kelvin", "Lumenx"], c: [12, 16], s: [1500, 1500], d: [2, 2], a: ["granted", "granted"], el: ["Kelvin", "Lumenx"], sel: "Lumenx", rank: "highest" },
  { n: ["Moss", "Nimbus", "Opal"], c: [8, 9, 11], s: [1000, 1000, 1000], d: [6, 6, 6], a: ["granted", "granted", "granted"], el: ["Moss", "Nimbus", "Opal"], sel: "Opal", rank: "highest" },
  { n: ["Prairie"], c: [100], s: [5000], d: [1], a: ["granted"], el: ["Prairie"], sel: "Prairie" },
  { n: ["Quorra", "Riven", "Sylph"], c: [11, 13, 15], s: [1200, 1500, 1300], d: [5, 8, 4], a: ["granted", "granted", "pending"], el: ["Quorra"], sel: "Quorra" },
];

for (const e of extra) {
  add(`extra_${e.n[0]}`, () =>
    pack({
      names: e.n,
      contrib: e.c,
      stock: e.s,
      days: e.d,
      approval: e.a,
      rules: { cMin: 8, sMin: 1000, dMax: 6 },
      rank: e.rank === "highest" ? "highest" : undefined,
    }), (m) => {
    if (e.rank === "highest" && e.el.length > 1) {
      assert.match(m, new RegExp(`Candidate selected: ${e.sel}`));
      for (const name of e.el) assert.match(m, new RegExp(name));
    } else if (e.rank === "sole" && e.el.length > 1) {
      assert.match(m, /^Eligible candidates:/);
    } else {
      expectEligible(m, e.el, e.sel);
    }
  });
}

seedSyntheticAmazonUsCatalog();

const results = [];
let pass = 0;
let fail = 0;

for (const s of scenarios) {
  const message = s.build();
  const corr = randomUUID();
  const r = admitAndExecuteShadowCeoFromChat({
    message,
    workspaceId: "ws_unseen_prod_path",
    correlationId: corr,
  });
  try {
    assert.equal(r.admitted, true);
    assert.equal(r.blocked, false);
    if (!r.admitted || r.blocked) throw new Error("blocked");
    assert.equal(r.ledgerRealisedSyntheticNetProfitUsd, 0);
    assert.equal(r.financialEffect.ledgerMoved, false);
    assert.equal(r.syntheticCatalogProductCount, 0);
    assert.ok(!/6\.87|fulfilment|supplier spend|Executive Brief/i.test(r.message));
    s.check(r.message, { requestId: r.requestId, objectiveId: r.objectiveId });
    pass++;
    results.push({ id: s.id, ok: true, requestId: r.requestId, objectiveId: r.objectiveId, message: r.message });
  } catch (err) {
    fail++;
    results.push({
      id: s.id,
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      raw: r,
    });
  }
}

{
  const msg = scenarios[0].build();
  const a = admitAndExecuteShadowCeoFromChat({
    message: msg,
    workspaceId: "ws_unseen_prod_path",
    correlationId: randomUUID(),
  });
  const b = admitAndExecuteShadowCeoFromChat({
    message: msg,
    workspaceId: "ws_unseen_prod_path",
    correlationId: randomUUID(),
  });
  const ok =
    a.admitted &&
    !a.blocked &&
    b.admitted &&
    !b.blocked &&
    a.objectiveId === b.objectiveId &&
    a.requestId === b.requestId;
  if (ok) pass++;
  else fail++;
  results.push({
    id: "RETRY_IDEMPOTENT",
    ok,
    a: a.admitted && !a.blocked ? a.requestId : a,
    b: b.admitted && !b.blocked ? b.requestId : b,
  });
}

const out = {
  generatedAt: new Date().toISOString(),
  MISSION: "REQUEST_CONTROL_UNSEEN_PRODUCTION_PATH",
  scenarioCount: scenarios.length,
  pass,
  fail,
  WAVE_CREDIT: 0,
  SC01: "FROZEN",
  results,
};
const outPath = path.resolve(
  process.cwd(),
  "../docs/audits/capability-extraction/REQUEST_CONTROL_UNSEEN_PRODUCTION_PATH_RESULTS.json",
);
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
console.log(JSON.stringify({ pass, fail, scenarios: scenarios.length, outPath }, null, 2));
if (fail > 0) process.exit(1);
