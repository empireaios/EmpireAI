/**
 * Bounded production soak — Brain liveness under load (no Birth, no spend).
 * Prefer /health/live (Railway probe). Optional EMPIRE_LOGIN_* for auth path.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const BRAIN = process.env.EMPIRE_BRAIN_URL || "https://empireai-production.up.railway.app";
const COCKPIT = process.env.EMPIRE_COCKPIT_URL || "https://empire-ai.co";
const EMAIL = process.env.EMPIRE_LOGIN_EMAIL || process.env.FOUNDER_EMAIL;
const PASSWORD = process.env.EMPIRE_LOGIN_PASSWORD || process.env.FOUNDER_PASSWORD;
const ROUNDS = Math.min(30, Math.max(5, Number(process.env.SOAK_ROUNDS || 12)));
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const OUT = path.join(ROOT, "docs/audits/complete-state");

async function timed(label, fn) {
  const t0 = Date.now();
  try {
    const value = await fn();
    return { label, ok: true, ms: Date.now() - t0, value };
  } catch (error) {
    return { label, ok: false, ms: Date.now() - t0, error: String(error) };
  }
}

async function main() {
  const samples = [];
  for (let i = 0; i < ROUNDS; i++) {
    samples.push(
      await timed(`live#${i}`, async () => {
        const r = await fetch(`${BRAIN}/health/live`, { signal: AbortSignal.timeout(8_000) });
        const body = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(`status ${r.status}`);
        return { status: r.status, lag: body.eventLoopLagMs, sqlite: body.sqlite };
      }),
    );
    await new Promise((r) => setTimeout(r, 1500));
  }

  const liveOk = samples.filter((s) => s.ok).length;
  const liveMs = samples.filter((s) => s.ok).map((s) => s.ms);
  const p95 = liveMs.length
    ? liveMs.sort((a, b) => a - b)[Math.min(liveMs.length - 1, Math.floor(liveMs.length * 0.95))]
    : null;

  let auth = { status: "BLOCKED", note: "EMPIRE_LOGIN_EMAIL/PASSWORD unset" };
  if (EMAIL && PASSWORD) {
    auth = await timed("login", async () => {
      const r = await fetch(`${COCKPIT}/api/auth/login`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
        signal: AbortSignal.timeout(55_000),
      });
      const body = await r.json().catch(() => ({}));
      return { status: r.status, error: body.error ?? null, role: body.user?.role ?? null };
    });
  }

  const statusProbe = await timed("commissioning-status", async () => {
    const r = await fetch(`${BRAIN}/health/live`, { signal: AbortSignal.timeout(8_000) });
    if (!r.ok) throw new Error(`live ${r.status}`);
    return r.status;
  });

  const out = {
    artifact: "PRODUCTION_RELIABILITY_SOAK",
    completedAt: new Date().toISOString(),
    brain: BRAIN,
    rounds: ROUNDS,
    healthLive: {
      okCount: liveOk,
      failCount: ROUNDS - liveOk,
      p95Ms: p95,
      samples: samples.map((s) => ({
        ok: s.ok,
        ms: s.ms,
        lag: s.value?.lag ?? null,
        error: s.error ?? null,
      })),
    },
    auth,
    statusProbe,
    brainStable: liveOk === ROUNDS && (p95 ?? 99999) < 5000,
  };

  mkdirSync(OUT, { recursive: true });
  writeFileSync(path.join(OUT, "PRODUCTION_RELIABILITY_SOAK_EVIDENCE.json"), JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
  process.exit(out.brainStable ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
