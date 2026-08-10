/**
 * Mission 004 production certification helpers.
 * Usage (with founder session cookie or railway internal):
 *   node backend/scripts/pillow-commissioning-004-prod-cert.mjs
 *
 * Env:
 *   BRAIN_URL (default production Railway)
 *   EMPIREAI_SESSION_COOKIE (optional empireai_session=...)
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const BRAIN = (process.env.BRAIN_URL || "https://empireai-production.up.railway.app").replace(
  /\/$/,
  "",
);
const cookie = process.env.EMPIREAI_SESSION_COOKIE || "";
const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "../../docs/audits/complete-state");

async function brain(path, init = {}) {
  const headers = {
    ...(init.headers || {}),
    ...(cookie ? { cookie } : {}),
  };
  const res = await fetch(`${BRAIN}${path}`, { ...init, headers, cache: "no-store" });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text.slice(0, 500) };
  }
  return { status: res.status, json };
}

const evidence = {
  at: new Date().toISOString(),
  brain: BRAIN,
  authenticated: Boolean(cookie),
  steps: [],
};

async function step(name, fn) {
  try {
    const result = await fn();
    evidence.steps.push({ name, ok: true, result });
    console.log(`OK  ${name}`);
    return result;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    evidence.steps.push({ name, ok: false, error: msg });
    console.error(`FAIL ${name}: ${msg}`);
    return null;
  }
}

await step("health", async () => {
  const r = await brain("/health/pillow-commissioning");
  if (r.status !== 200) throw new Error(`status ${r.status}`);
  return r.json;
});

if (cookie) {
  await step("hard-stop-proof", async () => {
    const r = await brain("/pillow-commissioning/cost-guard/hard-stop-proof", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    if (r.status !== 200 || !r.json?.ok) throw new Error(JSON.stringify(r.json));
    return r.json;
  });

  await step("one-product-run", async () => {
    const r = await brain("/pillow-commissioning/one-product/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    return { status: r.status, body: r.json };
  });

  await step("status", async () => {
    const r = await brain("/pillow-commissioning/status");
    if (r.status !== 200) throw new Error(`status ${r.status}`);
    return r.json;
  });

  await step("cost-control", async () => {
    const r = await brain("/pillow-commissioning/cost-control");
    if (r.status !== 200) throw new Error(`status ${r.status}`);
    return {
      level: r.json?.costGuard?.level,
      blindSpots: r.json?.blindSpots?.length,
      forecastBasis: r.json?.scaleForecast?.basis,
    };
  });

  await step("birth", async () => {
    const r = await brain("/pillow-commissioning/birth");
    if (r.status !== 200) throw new Error(`status ${r.status}`);
    if (r.json?.birthTimestamp) throw new Error("Birth timestamp must not exist without GK auth");
    return {
      status: r.json?.status,
      technicallyReady: r.json?.technicallyReady,
      birthTimestamp: r.json?.birthTimestamp,
      gatesPassedCount: r.json?.gatesPassedCount,
      gatesTotal: r.json?.gatesTotal,
    };
  });
} else {
  evidence.steps.push({
    name: "authenticated-steps",
    ok: false,
    error: "EMPIREAI_SESSION_COOKIE not set — skipped founder-gated proofs",
  });
}

mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, "PILLOW_BIRTH_COMMISSIONING_004_EVIDENCE.json");
writeFileSync(outPath, JSON.stringify(evidence, null, 2));
console.log(`Wrote ${outPath}`);
