/**
 * Pillow Executive Conversation Certification
 * Usage: node backend/scripts/pillow-executive-conversation-cert.mjs
 */
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const BASE = process.env.EMPIRE_COCKPIT_URL ?? "https://empire-ai.co";
const EMAIL = process.env.EMPIRE_LOGIN_EMAIL ?? "founder@empireai.com";
const PASSWORD = process.env.EMPIRE_LOGIN_PASSWORD ?? "EmpireAI2026!";
const ARTIFACT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../artifacts/pillow-executive-conversation-certification.json",
);

const EXECUTIVE_HOME_CONTEXT = {
  screenPath: "/cockpit",
  screenId: "SCR-001",
  screenTitle: "Executive Home",
  module: "executive-home",
  workflow: "executive-operating",
  purpose: "Grand King daily operating screen",
  currentBusiness: "EmpireAI",
  currentMission: "Pillow Executive Conversation Certification",
  recommendations: ["Validate conversational intelligence across executive scenarios"],
  risks: ["Conversation memory gaps", "Robotic template prefixes"],
};

const FORBIDDEN_PATTERNS = [
  /B6-01a — Inject shared LWA/i,
  /Executive Home: B6-01a/i,
];

const ROBOTIC_PATTERNS = [
  /^\[Repository Fact\]/m,
  /^\[General Knowledge\]/m,
  /^\[Web Search Report\]/m,
];

/** @type {Array<{id:string,category:string,message:string,multiTurn?:boolean,followUp?:string,shouldMatch?:RegExp,mustNotMatch?:RegExp,expectMemory?:RegExp}>} */
const SCENARIOS = [
  {
    id: "casual_greeting",
    category: "Executive Conversation",
    message: "Good morning Pillow — quick check-in before I start the day.",
    shouldMatch: /morning|day|help|ready|Grand King|executive/i,
    mustNotMatch: /B6-01a/i,
  },
  {
    id: "screen_what_am_i_looking_at",
    category: "Screen Discussion",
    message: "What am I looking at?",
    shouldMatch: /Executive Home|screen|page|looking at|cockpit/i,
    mustNotMatch: /B6-01a/i,
  },
  {
    id: "screen_explain_page",
    category: "Screen Discussion",
    message: "Explain this page to me in plain English.",
    shouldMatch: /Executive Home|page|screen|purpose|operating/i,
  },
  {
    id: "screen_what_to_click",
    category: "Screen Discussion",
    message: "What should I click first on this screen?",
    shouldMatch: /click|start|first|panel|action|recommend/i,
  },
  {
    id: "cursor_help",
    category: "Cursor Assistance",
    message: "Can you help me with Cursor?",
    shouldMatch: /Cursor|mission|build|engineering|Pillow/i,
    mustNotMatch: /B6-01a/i,
  },
  {
    id: "cursor_mission_explain",
    category: "Cursor Assistance",
    message: "Explain this mission to me like I'm planning the day, not debugging code.",
    shouldMatch: /mission|objective|certification|executive|plan/i,
  },
  {
    id: "strategic_blocker",
    category: "Executive Reasoning",
    message: "What is the biggest blocker right now?",
    shouldMatch: /blocker|priority|action|risk|B6|credential|next/i,
  },
  {
    id: "strategic_next_action",
    category: "Executive Reasoning",
    message: "What should I do next?",
    shouldMatch: /next|recommend|action|priority|because|why|risk/i,
  },
  {
    id: "strategic_compare",
    category: "Executive Reasoning",
    message: "Should I focus on deployment fixes or conversational certification first? Compare both briefly.",
    shouldMatch: /deploy|certification|conversational|first|because|trade|priority|versus|vs|or/i,
  },
  {
    id: "technical_plain",
    category: "Technical Explanation",
    message: "Explain what Pillow does in this app without jargon.",
    shouldMatch: /Pillow|EmpireAI|assistant|operating|executive/i,
    mustNotMatch: /undefined is not/i,
  },
  {
    id: "technical_error",
    category: "Technical Explanation",
    message: "If deployment fails with EISDIR on DATABASE_PATH, what does that mean and what should Cursor do?",
    shouldMatch: /directory|path|database|EISDIR|fix|Cursor|file/i,
  },
  {
    id: "memory_codeword",
    category: "Executive Memory",
    message: "Remember this codeword for our chat only: purple-rabbit-42. Acknowledge briefly.",
    multiTurn: true,
    followUp: "What codeword did I give you? Reply with just the codeword.",
    expectMemory: /purple-rabbit-42/i,
  },
  {
    id: "memory_focus_echo",
    category: "Executive Memory",
    message: "Let's track one thing: our focus today is conversational certification, not new features.",
    multiTurn: true,
    followUp: "What did I say our focus is today?",
    expectMemory: /conversational certification|not new features/i,
  },
  {
    id: "follow_up_depth",
    category: "Executive Conversation",
    message: "Summarise everything important on this page.",
    multiTurn: true,
    followUp: "Make that shorter — three bullets only.",
    shouldMatch: /Executive Home|bullet|•|- /i,
  },
  {
    id: "follow_up_why",
    category: "Executive Conversation",
    message: "What is the biggest blocker right now?",
    multiTurn: true,
    followUp: "Why is that the top priority?",
    shouldMatch: /blocker|priority|B6|credential|action/i,
    followUpMatch: /because|priority|blocker|reason|risk|B6|credential|top/i,
  },
  {
    id: "follow_up_simplify",
    category: "Executive Conversation",
    message: "Explain what Pillow does in this app without jargon.",
    multiTurn: true,
    followUp: "Can you simplify that in one sentence?",
    shouldMatch: /Pillow|EmpireAI|assistant|operating|executive/i,
    followUpMatch: /Pillow|assistant|EmpireAI|operating|executive|sentence|one/i,
  },
  {
    id: "clarification_ambiguous",
    category: "Executive Conversation",
    message: "Fix it.",
    shouldMatch: /clarif|which|what|need|specify|mean|help|blocker|mission|screen|fix|refer/i,
    mustNotMatch: /\[Web Search Report\]/i,
  },
  {
    id: "alert_meaning",
    category: "Screen Discussion",
    message: "What does this alert mean?",
    shouldMatch: /alert|notification|risk|blocker|approval|explain/i,
  },
];

function extractCookie(setCookies) {
  for (const header of setCookies) {
    const match = header.match(/^empireai_session=([^;]+)/);
    if (match) return `empireai_session=${match[1]}`;
  }
  return null;
}

function getSetCookies(headers) {
  if (typeof headers.getSetCookie === "function") return headers.getSetCookie();
  const single = headers.get("set-cookie");
  return single ? [single] : [];
}

async function login() {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Login failed: HTTP ${res.status} ${JSON.stringify(body)}`);
  const cookie = extractCookie(getSetCookies(res.headers));
  if (!cookie) throw new Error("No session cookie");
  return cookie;
}

async function createPillowSession(cookie) {
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    const res = await fetch(`${BASE}/api/pillow/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie },
      body: JSON.stringify({}),
    });
    const body = await res.json().catch(() => ({}));
    if (res.ok && body.session) return body.session;
    if (res.status === 503 && body.lifecycle === "starting") {
      await new Promise((r) => setTimeout(r, 5000));
      continue;
    }
    throw new Error(`Pillow session failed: HTTP ${res.status} ${JSON.stringify(body).slice(0, 300)}`);
  }
  throw new Error("Pillow session timed out");
}

async function askPillow(cookie, sessionId, message) {
  const res = await fetch(`${BASE}/api/pillow/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json", cookie },
    body: JSON.stringify({
      message,
      sessionId,
      workspaceContext: EXECUTIVE_HOME_CONTEXT,
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Pillow chat failed: HTTP ${res.status} ${JSON.stringify(body).slice(0, 400)}`);
  return body.result ?? null;
}

function evaluateResponse(text, scenario, turnLabel = "primary") {
  const notes = [];
  let pass = Boolean(text?.trim());

  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(text)) {
      pass = false;
      notes.push(`Forbidden template: ${pattern}`);
    }
  }

  if (scenario.mustNotMatch && scenario.mustNotMatch.test(text)) {
    pass = false;
    notes.push("Matched mustNotMatch pattern");
  }

  const matchPattern =
    turnLabel === "followUp" && scenario.expectMemory
      ? scenario.expectMemory
      : scenario.shouldMatch;

  if (matchPattern && !matchPattern.test(text)) {
    pass = false;
    notes.push(`Missing expected content (${turnLabel})`);
  }

  if (ROBOTIC_PATTERNS.some((p) => p.test(text))) {
    pass = false;
    notes.push("Robotic source-label prefix detected");
  }

  return { pass, notes };
}

async function runScenario(cookie, sessionId, scenario) {
  const turns = [];

  const first = await askPillow(cookie, sessionId, scenario.message);
  const firstText = first?.message ?? "";
  const firstEval = evaluateResponse(firstText, scenario, "primary");
  turns.push({
    turn: "primary",
    message: scenario.message,
    response: firstText.slice(0, 600),
    kind: first?.kind ?? null,
    trace: first?.trace ?? null,
    pass: firstEval.pass,
    notes: firstEval.notes,
  });

  if (scenario.multiTurn && scenario.followUp) {
    await new Promise((r) => setTimeout(r, 1500));
    const second = await askPillow(cookie, sessionId, scenario.followUp);
    const secondText = second?.message ?? "";
    const followUpPattern =
      scenario.expectMemory ?? scenario.followUpMatch ?? scenario.shouldMatch;
    const secondEval = evaluateResponse(
      secondText,
      { ...scenario, shouldMatch: followUpPattern },
      "followUp",
    );
    turns.push({
      turn: "followUp",
      message: scenario.followUp,
      response: secondText.slice(0, 600),
      kind: second?.kind ?? null,
      trace: second?.trace ?? null,
      pass: secondEval.pass,
      notes: secondEval.notes,
    });
    return {
      ...scenario,
      pass: firstEval.pass && secondEval.pass,
      notes: [...firstEval.notes, ...secondEval.notes],
      turns,
    };
  }

  return {
    ...scenario,
    pass: firstEval.pass,
    notes: firstEval.notes,
    turns,
  };
}

function summariseCapabilities(results) {
  const categories = [...new Set(results.map((r) => r.category))];
  return categories.map((category) => {
    const items = results.filter((r) => r.category === category);
    return {
      category,
      pass: items.every((r) => r.pass),
      passed: items.filter((r) => r.pass).length,
      total: items.length,
    };
  });
}

async function main() {
  console.log(`Pillow Executive Conversation Certification — ${BASE}`);
  const startedAt = new Date().toISOString();
  const cookie = await login();
  console.log(`Using fresh session per scenario for memory isolation where needed`);

  const results = [];
  for (const scenario of SCENARIOS) {
    console.log(`\n→ [${scenario.category}] ${scenario.message}`);
    const session = await createPillowSession(cookie);
    const result = await runScenario(cookie, session.sessionId, scenario);
    for (const turn of result.turns) {
      console.log(`  ${turn.turn}: ${turn.response.slice(0, 160).replace(/\s+/g, " ")}`);
      console.log(`  ${turn.pass ? "PASS" : "FAIL"} ${turn.notes.join("; ")}`);
    }
    results.push(result);
  }

  const capabilitySummary = summariseCapabilities(results);
  const passCount = results.filter((r) => r.pass).length;
  const overallPass = passCount === results.length;

  const artifact = {
    validatedAt: startedAt,
    baseUrl: BASE,
    sessionId: results[0]?.turns?.[0] ? "per-scenario" : null,
    passCount,
    total: results.length,
    overallPass,
    capabilitySummary,
    results,
  };

  mkdirSync(path.dirname(ARTIFACT), { recursive: true });
  writeFileSync(ARTIFACT, JSON.stringify(artifact, null, 2));

  console.log("\n=== Capability Summary ===");
  for (const row of capabilitySummary) {
    console.log(`${row.pass ? "PASS" : "FAIL"} ${row.category}: ${row.passed}/${row.total}`);
  }
  console.log(`\nOverall: ${passCount}/${results.length} scenarios passed`);
  console.log(`Artifact: ${ARTIFACT}`);
  if (!overallPass) process.exit(1);
}

main().catch((error) => {
  console.error("Certification failed:", error.message);
  process.exit(1);
});
