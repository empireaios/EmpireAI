import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  configureValidationEnvironment,
  createValidationBrain,
  isRedisAvailable,
  teardownBrain,
} from "./harness.js";
import { buildSubsystemChecklist } from "./subsystem-checklist.js";
import type { ValidationReport } from "./types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, "../..");
const reportPath = path.join(backendRoot, "phase25-report.json");

async function main(): Promise<void> {
  configureValidationEnvironment();
  const startedAt = new Date().toISOString();
  const notes: string[] = [];

  const typecheckRun = spawnSync("npm", ["run", "typecheck"], {
    cwd: backendRoot,
    encoding: "utf8",
    shell: true,
    env: {
      ...process.env,
      GUARDIAN_ENABLED: "true",
    },
  });

  const testRun = spawnSync(
    process.execPath,
    [
      "--import",
      "tsx",
      "--test",
      "src/validation/tests/guardian.test.ts",
      "src/validation/tests/subsystems.test.ts",
      "src/validation/tests/scheduler-workers.test.ts",
      "src/validation/tests/domain.test.ts",
      "src/validation/tests/foundation.test.ts",
    ],
    {
      cwd: backendRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        REDIS_OPTIONAL: process.env.REDIS_OPTIONAL ?? "true",
        GUARDIAN_ENABLED: "true",
      },
    },
  );

  const brain = await createValidationBrain();
  let guardianHealth: ValidationReport["guardianHealth"] = { skipped: "not run" };
  let dispatchProbe: ValidationReport["dispatchProbe"] = { skipped: "not run" };
  const dbReport = brain.guardian.dbGuardian.verifyIntegrity();
  let redisAvailable = false;

  try {
    redisAvailable = await isRedisAvailable(brain.redis);
    if (!redisAvailable) {
      notes.push("Redis unavailable: integration checks skipped");
      guardianHealth = { skipped: "Redis unavailable" };
      dispatchProbe = { skipped: "Redis unavailable" };
    } else {
      guardianHealth = (await brain.guardian.checkHealth(
        brain,
      )) as unknown as Record<string, unknown>;

      try {
        const result = await brain.orchestrator.dispatch({
          module: "dashboard",
          action: "load",
          workspaceId: "ws_validation_run",
          payload: {},
          correlationId: "validation:dispatch-probe",
        });
        dispatchProbe = result as unknown as Record<string, unknown>;
      } catch (error) {
        dispatchProbe = {
          skipped: "dispatch failed",
          error: error instanceof Error ? error.message : String(error),
        };
        notes.push("Dispatch probe failed — see dispatchProbe.error");
      }
    }
  } finally {
    await teardownBrain(brain);
  }

  const finishedAt = new Date().toISOString();
  const typecheckPassed = typecheckRun.status === 0;
  const testsPassed = testRun.status === 0;

  const healthOverall =
    typeof guardianHealth === "object" &&
    guardianHealth !== null &&
    "overall" in guardianHealth
      ? guardianHealth.overall
      : "skipped";

  let overall: ValidationReport["overall"] = "pass";
  if (!typecheckPassed || !testsPassed || !dbReport.ok) overall = "fail";
  else if (
    !redisAvailable ||
    healthOverall === "degraded" ||
    healthOverall === "failed" ||
    "error" in dispatchProbe
  ) {
    overall = "degraded";
  }

  const partialReport = {
    phase: "2.5" as const,
    startedAt,
    finishedAt,
    typecheck: {
      exitCode: typecheckRun.status,
      passed: typecheckPassed,
      output: `${typecheckRun.stdout}\n${typecheckRun.stderr}`.trim(),
    },
    tests: {
      exitCode: testRun.status,
      passed: testsPassed,
      output: `${testRun.stdout}\n${testRun.stderr}`.trim(),
    },
    guardianHealth,
    dispatchProbe,
    databaseIntegrity: {
      ok: dbReport.ok,
      integrityCheck: dbReport.integrityCheck,
      missingTables: dbReport.missingTables,
    },
    redisAvailable,
    notes,
    overall: "fail" as const,
  };

  const report: ValidationReport = {
    ...partialReport,
    overall,
    subsystemChecklist: buildSubsystemChecklist(partialReport),
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf8");

  console.log(JSON.stringify(report, null, 2));
  console.log(`\nReport written to ${reportPath}`);
  process.exit(overall === "fail" ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
