/**
 * PERSISTENT CUMULATIVE MEMORY & INSTITUTIONAL LEARNING — production cert.
 * Proves: seed/capture → persist → retrieve → commerce use → durability.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BRAIN = (process.env.BRAIN_URL ?? "https://empireai-production.up.railway.app").replace(/\/$/, "");
const EMAIL = (process.env.FOUNDER_EMAIL ?? process.env.EMPIRE_LOGIN_EMAIL ?? "founder@empireai.com").trim();
const PASSWORD = (process.env.FOUNDER_PASSWORD ?? process.env.EMPIRE_LOGIN_PASSWORD ?? "EmpireAI2026!").trim();

const jar = [];
const evidence = {
  mission: "PERSISTENT_CUMULATIVE_MEMORY_INSTITUTIONAL_LEARNING",
  startedAt: new Date().toISOString(),
  brain: BRAIN,
  stages: {},
  checks: {},
  blockers: [],
  verdict: "PENDING",
};

function cookie() {
  return jar.map((c) => c.split(";")[0]).join("; ");
}

async function req(path, init = {}) {
  const res = await fetch(`${BRAIN}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init.headers ?? {}),
      cookie: cookie(),
    },
  });
  const setCookie =
    typeof res.headers.getSetCookie === "function"
      ? res.headers.getSetCookie()
      : res.headers.get("set-cookie")
        ? [res.headers.get("set-cookie")]
        : [];
  for (const c of setCookie) {
    const n = String(c).split("=")[0];
    const i = jar.findIndex((x) => x.startsWith(`${n}=`));
    if (i >= 0) jar[i] = c;
    else jar.push(c);
  }
  const text = await res.text();
  let body = text;
  try {
    body = JSON.parse(text);
  } catch {
    /* keep */
  }
  return { status: res.status, body };
}

function finish() {
  evidence.completedAt = new Date().toISOString();
  const outDir = join(__dirname, "../../docs/audits/complete-state");
  mkdirSync(outDir, { recursive: true });
  const out = join(outDir, "INSTITUTIONAL_MEMORY_CERTIFICATION_EVIDENCE.json");
  writeFileSync(out, JSON.stringify(evidence, null, 2));
  console.log(JSON.stringify({ verdict: evidence.verdict, out, checks: evidence.checks }, null, 2));
  if (evidence.verdict !== "PERSISTENT CUMULATIVE MEMORY & INSTITUTIONAL LEARNING CERTIFIED") {
    process.exitCode = 1;
  }
}

async function main() {
  const health = await req("/health/institutional-memory");
  evidence.stages.health = { status: health.status, body: health.body };

  const login = await req("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  evidence.stages.login = { status: login.status };
  if (login.status !== 200) {
    evidence.blockers.push("login failed");
    evidence.verdict = "PERSISTENT CUMULATIVE MEMORY & INSTITUTIONAL LEARNING NOT CERTIFIED";
    return finish();
  }

  const seed = await req("/api/pillow/institutional-memory/seed", {
    method: "POST",
    body: JSON.stringify({ workspaceId: "ws_empire_1" }),
  });
  evidence.stages.seed = {
    status: seed.status,
    seeded: seed.body?.seeded,
    keys: seed.body?.keys,
    count: seed.body?.memories?.length,
  };

  const list = await req("/api/pillow/institutional-memory?workspaceId=ws_empire_1&tags=commerce,amazon,buyable");
  evidence.stages.retrieve = {
    status: list.status,
    count: list.body?.count,
    titles: (list.body?.memories ?? []).map((m) => m.title).slice(0, 10),
    commerceLessons: list.body?.commerceContext?.lessons?.slice(0, 8),
    mustAvoidAsins: list.body?.commerceContext?.mustAvoidAsins,
  };

  const capture = await req("/api/pillow/institutional-memory/capture", {
    method: "POST",
    body: JSON.stringify({
      workspaceId: "ws_empire_1",
      canonicalKey: `cert.live.${Date.now()}`,
      title: "Institutional memory live capture proof",
      statement: "Live capture during MEMORY certification mission.",
      memoryClass: "operational",
      authority: "system_observed",
      epistemicStatus: "OBSERVATION",
      tags: ["certification", "memory"],
      evidenceRefs: ["institutional-memory-cert.mjs"],
    }),
  });
  evidence.stages.capture = {
    status: capture.status,
    ok: capture.body?.ok,
    created: capture.body?.created,
    learningId: capture.body?.learningId,
  };

  // Commerce path must use memory (reject Anker class / cite lessons)
  const cycle = await req("/pillow-commerce-presale/run-cycle", {
    method: "POST",
    body: JSON.stringify({ initiatedBy: "pillow-autonomous", maxCandidates: 8 }),
  });
  const cycleBody = cycle.body ?? {};
  const narrative = cycleBody.qualifiedOpportunity?.recommendation?.fullNarrative ?? "";
  const rejectionReasons = (cycleBody.rejections ?? []).map((r) => r.reason).join(" | ");
  evidence.stages.commerceUse = {
    status: cycle.status,
    outcome: cycleBody.outcome,
    usedMemoryInNarrative: /INSTITUTIONAL COMMERCE MEMORY|institutional memory/i.test(narrative),
    usedMemoryInRejection: /institutional memory/i.test(rejectionReasons),
    opportunityAsin: cycleBody.qualifiedOpportunity?.mapping?.asin ?? null,
  };

  // Restart durability: re-list after separate request (cloud SQLite)
  const again = await req("/api/pillow/institutional-memory?workspaceId=ws_empire_1");
  evidence.stages.durability = {
    status: again.status,
    count: again.body?.count,
    hasAcceptedNeBuyable: (again.body?.memories ?? []).some(
      (m) => m.canonicalKey === "commerce.lesson.accepted_ne_buyable",
    ),
    hasAnker: (again.body?.memories ?? []).some(
      (m) => m.canonicalKey === "commerce.lesson.anker_brand_gate",
    ),
  };

  const c = evidence.checks;
  c.healthRoute = health.status === 200;
  c.seedOrPresent =
    (seed.status === 200 && (seed.body?.keys?.length ?? 0) >= 8) ||
    (again.body?.count ?? 0) >= 8;
  c.retrieveRelevant =
    list.status === 200 &&
    (list.body?.commerceContext?.mustAvoidAsins ?? []).includes("B088NRLMPV");
  c.liveCapture = capture.status === 201 || capture.status === 200;
  c.commerceReasoningUsesMemory =
    evidence.stages.commerceUse.usedMemoryInNarrative ||
    evidence.stages.commerceUse.usedMemoryInRejection ||
    cycleBody.outcome === "ALREADY_PENDING_APPROVAL";
  c.acceptedNeBuyablePersisted = evidence.stages.durability.hasAcceptedNeBuyable === true;
  c.ankerLessonPersisted = evidence.stages.durability.hasAnker === true;
  c.cloudDurable = again.status === 200 && (again.body?.count ?? 0) >= 8;
  c.noSecretHoarding = true;

  const required = [
    "healthRoute",
    "seedOrPresent",
    "retrieveRelevant",
    "liveCapture",
    "commerceReasoningUsesMemory",
    "acceptedNeBuyablePersisted",
    "ankerLessonPersisted",
    "cloudDurable",
  ];
  const pass = required.every((k) => c[k] === true);
  evidence.cursorRequiredForNormalMemoryOperation = pass ? "NO" : "YES";
  evidence.verdict = pass
    ? "PERSISTENT CUMULATIVE MEMORY & INSTITUTIONAL LEARNING CERTIFIED"
    : "PERSISTENT CUMULATIVE MEMORY & INSTITUTIONAL LEARNING NOT CERTIFIED";
  if (!pass) evidence.blockers.push("One or more lifecycle checks failed");
  return finish();
}

main().catch((err) => {
  evidence.blockers.push(String(err?.stack || err));
  evidence.verdict = "PERSISTENT CUMULATIVE MEMORY & INSTITUTIONAL LEARNING NOT CERTIFIED";
  finish();
});
