#!/usr/bin/env node
/**
 * P0-1 — Production deploy verification harness (REAL-047 / B5 evidence).
 *
 * Usage:
 *   node scripts/verify-production-deploy.mjs
 *   node scripts/verify-production-deploy.mjs --build-only
 *   node scripts/verify-production-deploy.mjs --probe https://empireai-production.up.railway.app
 *   node scripts/verify-production-deploy.mjs --probe http://localhost:4000
 */

import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..", "..");

const args = process.argv.slice(2);
const buildOnly = args.includes("--build-only");
const probeIndex = args.indexOf("--probe");
const probeUrl = probeIndex >= 0 ? args[probeIndex + 1] : process.env.PRODUCTION_BACKEND_URL;

function run(command, cwd, label) {
  console.log(`\n▶ ${label}`);
  const result = spawnSync(command, {
    cwd,
    shell: true,
    stdio: "inherit",
    env: process.env,
  });
  if (result.status !== 0) {
    throw new Error(`${label} failed with exit code ${result.status}`);
  }
}

async function probeHealth(baseUrl) {
  const normalized = baseUrl.replace(/\/$/, "");
  const checks = [];

  async function get(path) {
    const res = await fetch(`${normalized}${path}`, { signal: AbortSignal.timeout(20_000) });
    const body = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, body };
  }

  const health = await get("/health");
  checks.push({
    name: "GET /health",
    pass: health.ok && health.body.brain === "online",
    detail: health.ok ? `redisMode=${health.body.redisMode}` : `status ${health.status}`,
  });

  const deploy = await get("/health/production-deploy");
  checks.push({
    name: "GET /health/production-deploy",
    pass: deploy.ok,
    detail: deploy.ok
      ? `b5Status=${deploy.body.b5Status} hostingConfigured=${deploy.body.hostingConfigured}`
      : `status ${deploy.status}`,
  });

  const v1 = await get("/health/version-1-activation");
  checks.push({
    name: "GET /health/version-1-activation",
    pass: v1.ok,
    detail: v1.ok ? `status=${v1.body.status} (B6 credentials may still block)` : `status ${v1.status}`,
  });

  return { baseUrl: normalized, checks, allPassed: checks.every((c) => c.pass) };
}

async function main() {
  const evidence = {
    mission: "P0-1",
    blockerId: "B5",
    verifiedAt: new Date().toISOString(),
    build: { backend: false, frontend: false },
    probe: null,
    b5Ready: false,
    notes: [
      "Set PRODUCTION_DEPLOY_VERIFIED=true on Railway after successful public probe.",
      "Keep LIVE_COMMERCE_INTEGRATION_MODE=sandbox until B6 credentials approved.",
    ],
  };

  try {
    run("npm run build", join(repoRoot, "backend"), "Backend production build");
    evidence.build.backend = true;

    run("npm run build", join(repoRoot, "empireai-web"), "empireai-web production build");
    evidence.build.frontend = true;

    if (buildOnly) {
      console.log("\n✔ Build-only verification passed");
    } else if (probeUrl) {
      console.log(`\n▶ Probing ${probeUrl}`);
      evidence.probe = await probeHealth(probeUrl);
      if (!evidence.probe.allPassed) {
        throw new Error("Production probe failed — see checks above");
      }
      evidence.b5Ready = evidence.probe.checks.every((c) => c.pass);
      console.log("\n✔ Production probe passed");
      console.log("  → Set PRODUCTION_DEPLOY_VERIFIED=true on Railway to close B5 in Cockpit");
    } else {
      console.log("\n⚠ No --probe URL provided. Builds passed; runtime verification pending.");
      console.log("  Example: node backend/scripts/verify-production-deploy.mjs --probe https://YOUR-RAILWAY-URL");
    }
  } catch (error) {
    evidence.error = error instanceof Error ? error.message : String(error);
    const outDir = join(repoRoot, "artifacts");
    mkdirSync(outDir, { recursive: true });
    const outPath = join(outDir, "b5-production-deploy-evidence.json");
    writeFileSync(outPath, JSON.stringify(evidence, null, 2));
    console.error(`\n✖ Verification failed: ${evidence.error}`);
    console.error(`  Evidence written to ${outPath}`);
    process.exit(1);
  }

  const outDir = join(repoRoot, "artifacts");
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, "b5-production-deploy-evidence.json");
  writeFileSync(outPath, JSON.stringify(evidence, null, 2));
  console.log(`\nEvidence: ${outPath}`);
}

void main();
