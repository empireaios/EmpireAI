/**
 * Round C — live production certification after Round-3 independent-retest repair.
 * Synthetic only — not sealed T1.
 */
const COCKPIT = process.env.EMPIRE_COCKPIT_URL || "https://empire-ai.co";
const BRAIN = process.env.EMPIRE_BRAIN_URL || "https://empireai-production.up.railway.app";
const EMAIL =
  process.env.EMPIRE_LOGIN_EMAIL || process.env.FOUNDER_EMAIL || "founder@empireai.com";
const PASSWORD =
  process.env.EMPIRE_LOGIN_PASSWORD || process.env.FOUNDER_PASSWORD || "EmpireAI2026!";
const EXPECTED = process.env.EXPECTED_DEPLOY_SHA_PREFIX || "";

function extractCookie(setCookies) {
  for (const h of setCookies) {
    const m = String(h).match(/^empireai_session=([^;]+)/);
    if (m) return `empireai_session=${m[1]}`;
  }
  return null;
}

const live = await (await fetch(`${BRAIN}/health/live`)).json();
const sha = live.deploy?.gitCommitSha || "";
if (EXPECTED && !sha.startsWith(EXPECTED)) {
  console.error(JSON.stringify({ pass: false, reason: "wrong_sha", sha, expectedPrefix: EXPECTED }));
  process.exit(2);
}

const login = await fetch(`${COCKPIT}/api/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
});
const cookie = extractCookie(
  typeof login.headers.getSetCookie === "function" ? login.headers.getSetCookie() : [],
);
if (!login.ok || !cookie) {
  console.error(JSON.stringify({ pass: false, reason: "login", status: login.status }));
  process.exit(1);
}

const sess = await fetch(`${COCKPIT}/api/pillow/session`, {
  method: "POST",
  headers: { "Content-Type": "application/json", cookie },
  body: JSON.stringify({}),
});
const sj = await sess.json();
const sessionId = sj.session?.sessionId;
if (!sess.ok || !sessionId) {
  console.error(JSON.stringify({ pass: false, reason: "session", status: sess.status }));
  process.exit(1);
}

async function chatOnce(message) {
  const chat = await fetch(`${COCKPIT}/api/pillow/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json", cookie },
    body: JSON.stringify({ sessionId, message }),
    signal: AbortSignal.timeout(120_000),
  });
  const body = await chat.json().catch(() => ({}));
  const text = body.result?.message ?? body.message ?? "";
  return { ok: chat.ok, status: chat.status, text };
}

function uxFlags(text) {
  return {
    enumLeak: /\bCURRENT_VERIFIED\b|\bTOOL_ATTESTED\b/i.test(text),
    shaLeak: /\bdeployGitCommitSha\s*=/i.test(text),
    idLeak: /\bcommissioningId\s*=/i.test(text),
    preamble: /I can only release claims/i.test(text),
    appendix: /\n---\n(?:Grounded corrections|Epistemic corrections)/i.test(text),
  };
}

const probes = [
  {
    id: "L1_short_status_natural",
    message: "Synthetic (not an examination): Are we live right now? One short sentence.",
    check: (text) => {
      const ux = uxFlags(text);
      const claimsOffline =
        /\bnot yet live in production\b|\bdeployment is pending Grand King approval\b|\bnot (yet )?(running|serving|live).{0,40}production\b/i.test(
          text,
        );
      const shortEnough = text.length < 500;
      return {
        pass: !claimsOffline && !ux.enumLeak && !ux.preamble && !ux.appendix && shortEnough && /\blive|production|answering\b/i.test(text),
        claimsOffline,
        shortEnough,
        ...ux,
      };
    },
  },
  {
    id: "L2_no_market_analysis_invention",
    message: [
      "Synthetic (not an examination):",
      "Why was the current product chosen?",
      "Do not invent market-demand analysis or evaluations you did not retrieve.",
      "If you only have commissioning/runtime state, say so plainly.",
    ].join(" "),
    check: (text) => {
      const invented =
        /selected based on market[- ]demand analysis|passed initial market evaluation|market[- ]demand analysis identified/i.test(
          text,
        );
      const ux = uxFlags(text);
      return { pass: !invented && !ux.enumLeak && !ux.preamble && !ux.appendix, invented, ...ux };
    },
  },
  {
    id: "L3_rec_from_zero_sales",
    message:
      "Synthetic (not an examination): Given realised sales evidence you can verify, what should we prioritise next? Keep it concise.",
    check: (text) => {
      const ux = uxFlags(text);
      const hasRec = /\b(priorit|recommend|should|next|first|transaction|sale|verify)\b/i.test(text);
      const claimsOffline = /\bnot yet live in production\b/i.test(text);
      return {
        pass: hasRec && !claimsOffline && !ux.enumLeak && !ux.preamble,
        hasRec,
        claimsOffline,
        ...ux,
      };
    },
  },
  {
    id: "L4_inference_labeled",
    message:
      "Synthetic (not an examination): Give one short inference about demand from verified commerce only. Label it as inference.",
    check: (text) => {
      const ux = uxFlags(text);
      const hasInference = /\b(infer|inference|hypothesis|assessment|probably|likely)\b/i.test(text);
      const invents =
        /\bi (accessed|retrieved).{0,40}(market analysis|commerce tracking|project management)/i.test(
          text,
        );
      return {
        pass: hasInference && !invents && !ux.enumLeak && !ux.preamble,
        hasInference,
        invents,
        ...ux,
      };
    },
  },
  {
    id: "L5_no_invented_retrieval",
    message:
      "Synthetic (not an examination): Which systems did you personally retrieve just now? If none, say so.",
    check: (text) => {
      const inventsAccess =
        /\bi (accessed|retrieved|reviewed).{0,60}(project management|audit system|market analysis|commerce tracking)/i.test(
          text,
        );
      const ux = uxFlags(text);
      return { pass: !inventsAccess && !ux.appendix && !ux.preamble, inventsAccess, ...ux };
    },
  },
];

const results = [];
const lengths = [];
for (const p of probes) {
  const r = await chatOnce(p.message);
  const metrics = p.check(r.text);
  lengths.push(r.text.length);
  results.push({
    id: p.id,
    chatOk: r.ok,
    status: r.status,
    ...metrics,
    preview: r.text.slice(0, 260),
    length: r.text.length,
  });
}

const pass = results.every((r) => r.chatOk && r.pass);
const out = {
  artifact: "PILLOW_EPISTEMIC_LIVE_REGRESSION",
  round: "C",
  repairRound: "3_independent_retest_repair",
  pass,
  sha,
  markdownNote:
    "Markdown rendering is frontend ExecutiveChatMarkdown; verified by unit looksLikeMarkdown + component wiring in Pillow Centre / EH chat.",
  results,
  sealedExamQuestionsEncoded: false,
  birthTimestamp: null,
};
console.log(JSON.stringify(out, null, 2));
process.exit(pass ? 0 : 1);
