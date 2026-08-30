/**
 * Production ladder: case provenance + causal graph authority.
 * New sequential scenarios only — no sealed exam replay.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const COCKPIT = process.env.EMPIRE_COCKPIT_URL || "https://empire-ai.co";
const BRAIN = process.env.EMPIRE_BRAIN_URL || "https://empireai-production.up.railway.app";
const EMAIL =
  process.env.EMPIRE_LOGIN_EMAIL || process.env.FOUNDER_EMAIL || "founder@empireai.com";
const PASSWORD =
  process.env.EMPIRE_LOGIN_PASSWORD || process.env.FOUNDER_PASSWORD || "EmpireAI2026!";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const OUT = path.join(ROOT, "docs/audits/complete-state");

function extractCookie(res) {
  const raw = typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : [];
  for (const h of raw) {
    const m = String(h).match(/^empireai_session=([^;]+)/);
    if (m) return `empireai_session=${m[1]}`;
  }
  return null;
}

async function login() {
  const r = await fetch(`${COCKPIT}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
    signal: AbortSignal.timeout(60_000),
  });
  const cookie = extractCookie(r);
  if (!cookie) throw new Error(`login_failed status=${r.status}`);
  return cookie;
}

async function createSession(cookie) {
  const r = await fetch(`${COCKPIT}/api/pillow/session`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie },
    body: JSON.stringify({ forceNew: true }),
    signal: AbortSignal.timeout(60_000),
  });
  const body = await r.json().catch(() => ({}));
  return body.session?.sessionId || body.sessionId || `cprv-${Date.now()}`;
}

async function chat(cookie, sessionId, message, recentTurns = []) {
  const t0 = Date.now();
  const r = await fetch(`${COCKPIT}/api/pillow/chat`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie },
    body: JSON.stringify({
      sessionId,
      message,
      workspaceContext: {
        screenPath: "/cockpit/development/pillow",
        screenId: "pillow-centre",
        screenTitle: "Pillow Centre",
        module: "executive",
        recentConversationTurns: recentTurns.slice(-12),
      },
    }),
    signal: AbortSignal.timeout(300_000),
  });
  const body = await r.json().catch(() => ({}));
  const text =
    body.result?.message || body.message || body.reply || body.text || JSON.stringify(body);
  return { text: String(text || ""), ms: Date.now() - t0, status: r.status };
}

function hasAny(text, patterns) {
  return patterns.some((p) => p.test(text));
}

function verdictOf(text, claimNeedle) {
  const idx = text.toLowerCase().indexOf(claimNeedle.toLowerCase());
  const window = idx >= 0 ? text.slice(Math.max(0, idx - 80), idx + claimNeedle.length + 220) : text;
  if (/\bcontradicted\b/i.test(window)) return "contradicted";
  if (/\bsupported\b/i.test(window)) return "supported";
  if (/\bunproven\b|\bunknown\b/i.test(window)) return "unproven";
  return "missing";
}

async function main() {
  const health = await fetch(`${BRAIN}/health/live`, { signal: AbortSignal.timeout(20_000) }).then(
    (r) => r.json(),
  );
  const liveSha = String(health.deploy?.gitCommitSha || "");
  const cookie = await login();
  const sessionId = await createSession(cookie);
  const turns = [];
  const results = [];

  async function step(id, message, grade) {
    const out = await chat(cookie, sessionId, message, turns);
    turns.push({ role: "user", content: message });
    turns.push({ role: "assistant", content: out.text });
    const g = grade(out.text);
    const row = { id, ok: g.ok, ms: out.ms, status: out.status, detail: g.detail, head: out.text.slice(0, 280) };
    results.push(row);
    console.log(JSON.stringify(row));
    return row;
  }

  // CASE A — distinctive software/infra facts
  await step(
    "case_a_infra",
    [
      "SyntheticProvA — software infra only. Do not mention Mini Fan or Birth.",
      "Tuesday 10:20 Cobalt power-control module failed.",
      "At 10:40 Argon was healthy. Memory was cleared at 10:50.",
      "Clusters restored after 07:30 software deployment.",
      "Answer in exactly 3 numbered sections: 1. Snapshot 2. Mechanism 3. Closing.",
    ].join("\n"),
    (t) => ({
      ok: /Cobalt|power-control|Tuesday|10:20|cluster/i.test(t) && /1[\).:]/.test(t),
      detail: "case_a_mentions_own_facts",
    }),
  );

  // CASE B — new warehouse domain; must NOT import Case A specimen facts
  await step(
    "case_b_no_foreign",
    [
      "SyntheticProvB — warehouse only. New bounded case. Do not mention Mini Fan or Birth.",
      "NorthHub printer power-board failed.",
      "That power-board failure caused dispatch failure.",
      "Dispatch failure caused orders to be redirected to SouthHub.",
      "SouthHub packing-capacity exhaustion resulted from that redirected workload.",
      "500 delayed orders.",
      "Answer in exactly 4 numbered sections.",
      "1. Snapshot",
      "2. Causes",
      "3. Claim audit",
      "4. Closing",
      'Audit: "NorthHub\'s power-board failure directly caused SouthHub\'s packing-capacity exhaustion."',
      'Also: "NorthHub and SouthHub are causally connected."',
    ].join("\n"),
    (t) => {
      const foreign = hasAny(t, [
        /Tuesday\s*10:20/i,
        /power-control\s+module/i,
        /Memory was cleared/i,
        /07:30\s+software\s+deployment/i,
        /\bClusters restored\b/i,
        /\bCobalt\b/i,
        /\bArgon\b/i,
      ]);
      const direct = verdictOf(t, "directly caused");
      const connected = verdictOf(t, "causally connected");
      const ok =
        !foreign &&
        (direct === "contradicted" || /\bDIRECT\b.*\bINDIRECT\b|\bmulti[- ]?hop\b|\bpath\b/i.test(t)) &&
        connected !== "contradicted";
      return {
        ok,
        detail: `foreign=${foreign} direct=${direct} connected=${connected}`,
      };
    },
  );

  // CASE C — different domain again after B
  await step(
    "case_c_no_ab_facts",
    [
      "SyntheticProvC — hospitality only. New bounded case. Do not mention Mini Fan.",
      "Oak booking-engine failed. Work redirected to Pine. Pine room-slot exhaustion resulted.",
      "Answer in exactly 3 numbered sections: 1. Snapshot 2. Claim audit 3. Closing.",
      'Audit: "Oak\'s booking-engine failure directly caused Pine\'s room-slot exhaustion."',
    ].join("\n"),
    (t) => {
      const foreign = hasAny(t, [
        /NorthHub|SouthHub|power-board|packing-capacity|Tuesday 10:20|Cobalt|Argon|Clusters/i,
      ]);
      const direct = verdictOf(t, "directly caused");
      return { ok: !foreign && direct !== "supported", detail: `foreign=${foreign} direct=${direct}` };
    },
  );

  // Continuation positive control — new session branch after C is fine; use same session with continue cue
  await step(
    "continuation_ok",
    [
      "Continue the same case. Now reconsider if Pine capacity rises to 120.",
      "Answer in exactly 2 numbered sections: 1. Snapshot 2. Closing.",
      "Do not mention Mini Fan or Birth.",
    ].join("\n"),
    (t) => {
      const keeps = /Pine|Oak|room-slot|booking/i.test(t);
      const foreign = /NorthHub|SouthHub|Cobalt|Tuesday 10:20/i.test(t);
      return { ok: keeps && !foreign, detail: `keeps=${keeps} foreign=${foreign}` };
    },
  );

  // Explicit cross-case compare
  await step(
    "cross_case_compare",
    [
      "Compare the previous hospitality case with this new logistics case.",
      "SyntheticProvD — logistics only.",
      "Ridge seal failure redirected work to Harbor. Harbor slot shortage resulted.",
      "Answer in exactly 3 numbered sections: 1. Comparison 2. Claim audit 3. Closing.",
      'Audit: "Ridge\'s seal failure directly caused Harbor\'s slot shortage."',
    ].join("\n"),
    (t) => {
      // Authorized to mention Pine/Oak for comparison; must not invent Cobalt Tuesday facts.
      const foreign = /Tuesday 10:20|power-control module|Clusters restored/i.test(t);
      const mentionsCompare = /Pine|Oak|Ridge|Harbor|compar/i.test(t);
      return { ok: !foreign && mentionsCompare, detail: `foreign=${foreign} compare=${mentionsCompare}` };
    },
  );

  // Principle transfer without fact transfer (fresh session)
  const session2 = await createSession(cookie);
  const turns2 = [];
  async function step2(id, message, grade) {
    const out = await chat(cookie, session2, message, turns2);
    turns2.push({ role: "user", content: message });
    turns2.push({ role: "assistant", content: out.text });
    const g = grade(out.text);
    const row = { id, ok: g.ok, ms: out.ms, status: out.status, detail: g.detail, head: out.text.slice(0, 280) };
    results.push(row);
    console.log(JSON.stringify(row));
    return row;
  }

  await step2(
    "principle_seed",
    [
      "SyntheticPrincipleSeed — ops only. Do not mention Mini Fan.",
      "Lesson: different direct causes may still be indirectly connected via a path.",
      "Mesa thermal failure redirected work to Quay. Quay overloaded.",
      "Answer in exactly 2 numbered sections: 1. Snapshot 2. Lesson.",
    ].join("\n"),
    (t) => ({ ok: /Mesa|Quay|indirect|path|connected/i.test(t), detail: "principle_seeded" }),
  );

  await step2(
    "principle_transfer_no_facts",
    [
      "SyntheticPrincipleApply — manufacturing only. New bounded case. Do not mention Mini Fan.",
      "Volt breaker failure redirected work to Grid. Grid feeder overload resulted.",
      "Answer in exactly 3 numbered sections: 1. Snapshot 2. Claim audit 3. Closing.",
      'Audit: "Volt\'s breaker failure directly caused Grid\'s feeder overload."',
      'Also: "Volt and Grid are causally connected."',
    ].join("\n"),
    (t) => {
      const foreign = /Mesa|Quay|thermal/i.test(t);
      const direct = verdictOf(t, "directly caused");
      const connected = verdictOf(t, "causally connected");
      return {
        ok: !foreign && direct !== "supported" && connected !== "contradicted",
        detail: `foreign=${foreign} direct=${direct} connected=${connected}`,
      };
    },
  );

  // Transport / exact-N smoke on new session
  const session3 = await createSession(cookie);
  const five = await chat(
    cookie,
    session3,
    [
      "SyntheticExactN — ops only. Do not mention Mini Fan or Birth.",
      "North overloaded. Failover to East. PeerNode overloaded.",
      "Answer in exactly 5 numbered sections.",
      "1. Snapshot",
      "2. Direct causes",
      "3. Claim audit",
      "4. Path",
      "5. Closing",
      'Audit these 2 claims: "North\'s failure directly caused PeerNode\'s overload." "North and PeerNode are causally connected."',
    ].join("\n"),
    [],
  );
  const fiveOk =
    (five.text.match(/^\s*\d+[\).:]/gm) || []).length >= 5 &&
    !/Risk\/Lesson|My recommendation/i.test(five.text.slice(0, 120));
  results.push({
    id: "exact_n_envelope",
    ok: fiveOk,
    ms: five.ms,
    status: five.status,
    detail: "exact_5_sections",
    head: five.text.slice(0, 280),
  });
  console.log(JSON.stringify(results[results.length - 1]));

  const passCount = results.filter((r) => r.ok).length;
  const summary = {
    generatedAt: new Date().toISOString(),
    LIVE_SHA: liveSha,
    sessionId,
    passCount,
    total: results.length,
    PRODUCTION_CASE_PROVENANCE_PASS: passCount === results.length ? "PASS" : "FAIL",
    CASE_A_FACTS_IN_B: results.find((r) => r.id === "case_b_no_foreign")?.ok ? 0 : 1,
    CASE_CONTINUATION_CONTEXT_PRESERVED: results.find((r) => r.id === "continuation_ok")?.ok
      ? "YES"
      : "NO",
    EXPLICIT_CROSS_CASE_REFERENCE_SUPPORTED: results.find((r) => r.id === "cross_case_compare")?.ok
      ? "YES"
      : "NO",
    PRINCIPLE_TRANSFER_PRESERVED: results.find((r) => r.id === "principle_transfer_no_facts")?.ok
      ? "YES"
      : "NO",
    results,
  };
  mkdirSync(OUT, { recursive: true });
  writeFileSync(
    path.join(OUT, "CASE_PROVENANCE_CAUSAL_GRAPH_PRODUCTION.json"),
    JSON.stringify(summary, null, 2),
  );
  console.log(JSON.stringify({ PRODUCTION_CASE_PROVENANCE_PASS: summary.PRODUCTION_CASE_PROVENANCE_PASS, passCount, total: results.length, LIVE_SHA: liveSha }));
  if (passCount !== results.length) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
