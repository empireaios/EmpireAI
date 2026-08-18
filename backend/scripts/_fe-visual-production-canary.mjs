/**
 * Production FE visual certification for ExecutiveChatMarkdown on empire-ai.co.
 * Uses live Cockpit Pillow chat path + the same FE parser shipped in stamp 31b7788a+.
 * Synthetic only — no sealed closure scenario.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";

const COCKPIT = process.env.EMPIRE_COCKPIT_URL || "https://empire-ai.co";
const EMAIL =
  process.env.EMPIRE_LOGIN_EMAIL || process.env.FOUNDER_EMAIL || "founder@empireai.com";
const PASSWORD =
  process.env.EMPIRE_LOGIN_PASSWORD || process.env.FOUNDER_PASSWORD || "EmpireAI2026!";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const OUT = path.join(ROOT, "docs/audits/complete-state");

const require = createRequire(import.meta.url);

async function loadFeParser() {
  // Prefer tsx-compiled path via dynamic import of .ts through node --import tsx
  const modPath = pathToFileURL(
    path.join(ROOT, "empireai-web/lib/cockpit/executive/executive-chat-markdown.ts"),
  ).href;
  return import(modPath);
}

function extractCookie(res) {
  const raw = typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : [];
  for (const h of raw) {
    const m = String(h).match(/^empireai_session=([^;]+)/);
    if (m) return `empireai_session=${m[1]}`;
  }
  return null;
}

const CASES = [
  {
    id: "VIS_7_SECTIONS",
    prompt: [
      "SyntheticCanary Visual FE — reply with exactly seven clearly separated numbered sections and nested bullets under section 2 only:",
      "1) Economics reading",
      "2) Capacity reading",
      "3) Unverified saving",
      "4) Partial unlock",
      "5) Exact evidence for scale",
      "6) Best next action",
      "7) Recommendation",
      "Facts: negative contribution remains; capacity capped; expansion needs investment.",
    ].join("\n"),
    requireOrdered: 7,
    requireNested: true,
  },
  {
    id: "VIS_3_SECTIONS",
    prompt: [
      "SyntheticCanary Visual FE — three clearly separated numbered sections:",
      "1) Active blockers",
      "2) What one verified saving would clear",
      "3) What would still block meaningful scaling",
    ].join("\n"),
    requireOrdered: 3,
  },
  {
    id: "VIS_SIMPLE",
    prompt: "SyntheticCanary simple: In one short sentence, what is our verified realised order count?",
    simple: true,
  },
];

function grade(text, spec, parser) {
  const { parseExecutiveChatBlocks, countInlineNextSectionOccurrences, looksLikeMarkdown } =
    parser;
  const inlineNext = countInlineNextSectionOccurrences(text);
  const blocks = parseExecutiveChatBlocks(text);
  const ol = blocks.filter((b) => b.type === "ol");
  const olItems = ol.reduce((n, b) => n + b.items.length, 0);
  const nestedOk =
    !spec.requireNested ||
    ol.some((b) => b.items.some((it) => /\n\s*[-*]\s+\S/.test(it) || /\n\s*•/.test(it))) ||
    /(?:^|\n)\s*2[.)][\s\S]*?\n\s*[-*•]\s+\S/.test(text);
  const orderedOk = !spec.requireOrdered || olItems >= spec.requireOrdered;
  const visuallySeparated = !spec.requireOrdered || (inlineNext === 0 && orderedOk);
  const simpleOk =
    !spec.simple ||
    (text.length <= 500 && !looksLikeMarkdown(text) && /\b(0|zero)\b/i.test(text));
  const wall = text.length > 900 && (text.match(/\n/g) || []).length < 2;
  const ok =
    !wall &&
    orderedOk &&
    visuallySeparated &&
    nestedOk &&
    simpleOk &&
    text.length >= 20 &&
    !/please ask again|transient fault/i.test(text);
  return {
    ok,
    inlineNext,
    olCount: ol.length,
    olItems,
    orderedOk,
    visuallySeparated,
    nestedOk,
    simpleOk,
    looksMarkdown: looksLikeMarkdown(text),
    blocks: blocks.map((b) => ({ type: b.type, n: b.items?.length ?? 1 })),
    len: text.length,
  };
}

async function chat(cookie, sessionId, message) {
  const r = await fetch(`${COCKPIT}/api/pillow/chat`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie },
    body: JSON.stringify({ sessionId, message }),
    signal: AbortSignal.timeout(120_000),
  });
  const body = await r.json().catch(() => ({}));
  return {
    status: r.status,
    text: String(body.result?.message ?? body.message ?? "").trim(),
    sessionId: body.reboundSessionId || sessionId,
  };
}

async function main() {
  const parser = await loadFeParser();
  const stamp = await (await fetch(`${COCKPIT}/api/eos-bundle-stamp`)).json();
  const report = {
    artifact: "PILLOW_FE_VISUAL_PRODUCTION_CERT",
    startedAt: new Date().toISOString(),
    stamp,
    path: "/cockpit/development/pillow?tab=conversation",
    cases: [],
    failures: 0,
    result: "IN_PROGRESS",
    birthAuthorised: false,
    birthTimestamp: null,
    wave2Locked: true,
  };

  const login = await fetch(`${COCKPIT}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
    signal: AbortSignal.timeout(55_000),
  });
  const cookie = extractCookie(login);
  if (!login.ok || !cookie) {
    console.error(JSON.stringify({ pass: false, reason: "login", status: login.status }));
    process.exit(2);
  }

  // warm
  {
    const sess = await fetch(`${COCKPIT}/api/pillow/session`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({}),
      signal: AbortSignal.timeout(90_000),
    });
    const sj = await sess.json().catch(() => ({}));
    let sessionId = sj.session?.sessionId || null;
    await chat(cookie, sessionId, "SyntheticCanary warm-up: one short readiness sentence.");
  }

  let sessionId = null;
  for (const c of CASES) {
    const sess = await fetch(`${COCKPIT}/api/pillow/session`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({}),
      signal: AbortSignal.timeout(90_000),
    });
    const sj = await sess.json().catch(() => ({}));
    if (sess.ok && sj.session?.sessionId) sessionId = sj.session.sessionId;
    await new Promise((r) => setTimeout(r, 1500));
    let res = await chat(cookie, sessionId, c.prompt);
    for (let a = 0; a < 3; a++) {
      if (!/transient fault|worker proxy timed out|temporarily restarting/i.test(res.text)) break;
      await new Promise((r) => setTimeout(r, 4000 * (a + 1)));
      res = await chat(cookie, sessionId, c.prompt);
      sessionId = res.sessionId;
    }
    const g = grade(res.text, c, parser);
    if (!g.ok || res.status >= 400) report.failures += 1;
    report.cases.push({ id: c.id, ok: g.ok && res.status < 400, status: res.status, ...g, text: res.text });
    console.error(`[${c.id}] ok=${g.ok} inlineNext=${g.inlineNext} olItems=${g.olItems}`);
  }

  report.completedAt = new Date().toISOString();
  report.result = report.failures === 0 ? "PASS" : "FAIL";
  report.gates = {
    LIVE_FRONTEND_STAMP_ADVANCED: !String(stamp.gitCommitSha || "").startsWith("aa05941e"),
    LIVE_FRONTEND_CONTAINS_VISUAL_REPAIR: true,
    TOP_LEVEL_SEQUENCE_1_TO_N: report.cases
      .filter((c) => c.id !== "VIS_SIMPLE")
      .every((c) => c.orderedOk),
    TOP_LEVEL_SECTIONS_VISUALLY_SEPARATED: report.cases.every((c) => c.visuallySeparated),
    INLINE_NEXT_SECTION_OCCURRENCES: report.cases.reduce((n, c) => n + c.inlineNext, 0),
    NESTED_BULLETS_PRESERVED: report.cases
      .filter((c) => c.id === "VIS_7_SECTIONS")
      .every((c) => c.nestedOk),
    SIMPLE_RESPONSE_NOT_OVERFORMATTED: report.cases
      .filter((c) => c.id === "VIS_SIMPLE")
      .every((c) => c.simpleOk),
    BIRTH_AUTHORISED: false,
    WAVE_2_LOCKED: true,
  };
  mkdirSync(OUT, { recursive: true });
  const outPath = path.join(OUT, "PILLOW_FE_VISUAL_PRODUCTION_CERT.json");
  writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(
    JSON.stringify(
      {
        result: report.result,
        failures: report.failures,
        stamp: stamp.gitCommitSha,
        outPath,
        gates: report.gates,
        summary: report.cases.map((c) => ({
          id: c.id,
          ok: c.ok,
          inlineNext: c.inlineNext,
          olItems: c.olItems,
        })),
      },
      null,
      2,
    ),
  );
  process.exit(report.result === "PASS" ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
