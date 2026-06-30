import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import type { EsisProductionReport } from "../models/esis-inspection.js";
import {
  BACKEND_ROOT,
  ESIS_CACHE_PATH,
  FRONTEND_SRC,
  REPO_ROOT,
  extractValidationSuites,
  readJson,
  scanPlaceholdersInDir,
  writeJson,
} from "./repo-scanner.js";

export type ProductionInspectOptions = {
  runValidation?: boolean;
  skipSlowTests?: boolean;
};

function runCommand(cwd: string, command: string, timeoutMs = 600_000): { ok: boolean; output: string } {
  try {
    const output = execSync(command, {
      cwd,
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
      timeout: timeoutMs,
      env: { ...process.env, FORCE_COLOR: "0" },
    });
    return { ok: true, output: output.slice(-4000) };
  } catch (error) {
    const err = error as { stdout?: string; stderr?: string; message?: string };
    const output = [err.stdout ?? "", err.stderr ?? "", err.message ?? ""].join("\n").slice(-4000);
    return { ok: false, output };
  }
}

function parseTestResults(output: string): { passed: number; failed: number; total: number } {
  const passMatch = output.match(/ℹ pass (\d+)/);
  const failMatch = output.match(/ℹ fail (\d+)/);
  const totalMatch = output.match(/ℹ tests (\d+)/);
  return {
    passed: passMatch ? Number(passMatch[1]) : 0,
    failed: failMatch ? Number(failMatch[1]) : 0,
    total: totalMatch ? Number(totalMatch[1]) : 0,
  };
}

export function inspectProduction(options: ProductionInspectOptions = {}): EsisProductionReport {
  const cached = readJson<{ production: EsisProductionReport; generatedAt: string }>(ESIS_CACHE_PATH);
  if (!options.runValidation && cached?.production) {
    return cached.production;
  }

  const placeholders = scanPlaceholdersInDir(path.join(REPO_ROOT, "backend", "src"));
  const validationSuites = extractValidationSuites();

  let typecheck = { status: "SKIPPED", detail: "Run with runValidation: true" };
  let tests = { status: "SKIPPED", passed: 0, failed: 0, total: validationSuites.length, detail: undefined as string | undefined };
  let build = { status: "SKIPPED", detail: undefined as string | undefined };
  let frontendTypecheck = { status: "SKIPPED", detail: undefined as string | undefined };

  if (options.runValidation) {
    const tc = runCommand(BACKEND_ROOT, "npm run typecheck", 600_000);
    typecheck = tc.ok
      ? { status: "PASS", detail: "Backend typecheck passed" }
      : { status: "FAIL", detail: tc.output };

    if (!options.skipSlowTests) {
      const testRun = runCommand(BACKEND_ROOT, "npm test", 1_200_000);
      const parsed = parseTestResults(testRun.output);
      tests = testRun.ok
        ? { status: "PASS", ...parsed, detail: `${parsed.passed}/${parsed.total} tests passed` }
        : { status: "FAIL", ...parsed, detail: testRun.output };
    } else {
      tests = { status: "SKIPPED", passed: 0, failed: 0, total: validationSuites.length, detail: "skipSlowTests enabled" };
    }

    const beBuild = runCommand(BACKEND_ROOT, "npm run build", 600_000);
    build = beBuild.ok
      ? { status: "PASS", detail: "Backend build passed" }
      : { status: "FAIL", detail: beBuild.output };

    const feTc = runCommand(path.join(REPO_ROOT, "frontend"), "npm run typecheck", 300_000);
    frontendTypecheck = feTc.ok
      ? { status: "PASS", detail: "Frontend typecheck passed" }
      : { status: "FAIL", detail: feTc.output };
  } else if (cached?.production) {
    return cached.production;
  } else {
    const distExists = fs.existsSync(path.join(BACKEND_ROOT, "dist"));
    typecheck = { status: "UNKNOWN", detail: "Run npm run empire:review for live validation" };
    tests = { status: "UNKNOWN", passed: 0, failed: 0, total: validationSuites.length, detail: `${validationSuites.length} test suites registered` };
    build = distExists
      ? { status: "LIKELY_PASS", detail: "backend/dist exists" }
      : { status: "UNKNOWN", detail: "No dist/ — run build" };
  }

  const productionBlockers: string[] = [];
  const securityBlockers: string[] = [];
  const commercialBlockers: string[] = [];
  const firstDollarBlockers: string[] = [];
  const technicalDebt: string[] = [];

  if (typecheck.status === "FAIL") productionBlockers.push("Backend typecheck failing");
  if (frontendTypecheck.status === "FAIL") productionBlockers.push("Frontend typecheck failing");
  if (tests.status === "FAIL") productionBlockers.push("Test suite failing");
  if (build.status === "FAIL") productionBlockers.push("Build failing");

  if (placeholders.some((p) => p.includes("executionBlocked"))) {
    commercialBlockers.push("Connector executionBlocked — no live commerce execution");
  }
  if (placeholders.some((p) => p.includes("publishBlocked"))) {
    commercialBlockers.push("publishBlocked — no live marketplace publishing");
  }
  if (placeholders.some((p) => p.includes("SCOUT_MOCK"))) {
    commercialBlockers.push("Product discovery uses mock catalog");
  }

  firstDollarBlockers.push("FIRST_SALE requires live Stripe webhook wiring");
  firstDollarBlockers.push("FIRST_LISTING_CREATED requires marketplace publish adapter");

  if (placeholders.length > 10) {
    technicalDebt.push(`${placeholders.length} placeholder patterns detected in backend/src`);
  }
  technicalDebt.push("No automated test coverage reporting configured");
  if (!fs.existsSync(path.join(REPO_ROOT, ".git"))) {
    securityBlockers.push("No git repository detected at project root");
  }

  const report: EsisProductionReport = {
    typecheck,
    tests,
    coverage: { status: "NOT_CONFIGURED", detail: "No coverage script in package.json" },
    build,
    productionBlockers: [...new Set(productionBlockers)].sort(),
    securityBlockers: [...new Set(securityBlockers)].sort(),
    commercialBlockers: [...new Set(commercialBlockers)].sort(),
    firstDollarBlockers: [...new Set(firstDollarBlockers)].sort(),
    technicalDebt: [...new Set(technicalDebt)].sort(),
  };

  if (options.runValidation) {
    writeJson(ESIS_CACHE_PATH, {
      generatedAt: new Date().toISOString(),
      production: report,
      frontendTypecheck,
    });
  }

  return report;
}

export function getCachedProductionTimestamp(): string | null {
  const cached = readJson<{ generatedAt: string }>(ESIS_CACHE_PATH);
  return cached?.generatedAt ?? null;
}
