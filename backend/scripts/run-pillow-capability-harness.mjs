/**
 * Run Pillow Capability Tests A–H (sandbox) + birth readiness snapshot.
 * Usage: node --import tsx backend/scripts/run-pillow-capability-harness.mjs
 */
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

process.env.DATABASE_PATH = process.env.DATABASE_PATH || ":memory:capability-harness";

const { resetDatabaseInstance } = await import("../src/brain/database.ts");
resetDatabaseInstance();

const { runPillowCapabilityTests } = await import(
  "../src/orchestration/pillow-commissioning/executive-operating-loop/capability-harness.ts"
);
const { evaluateExecutiveBirthReadiness } = await import(
  "../src/orchestration/pillow-commissioning/executive-operating-loop/birth-readiness.ts"
);
const { runExecutiveOperatingCycle } = await import(
  "../src/orchestration/pillow-commissioning/executive-operating-loop/cycle-runner.ts"
);
const { ALL_CAPABILITY_SCENARIOS } = await import(
  "../src/orchestration/pillow-commissioning/executive-operating-loop/capability-scenarios.ts"
);

const workspaceId = "capability-harness-local";
const results = runPillowCapabilityTests(workspaceId);

// Also prove a live-mode cycle structure locally (still sandbox situation facts)
const liveProbe = runExecutiveOperatingCycle({
  workspaceId,
  situation: ALL_CAPABILITY_SCENARIOS.E,
  mode: "live",
  persist: true,
  recordFlight: false,
});

const readiness = evaluateExecutiveBirthReadiness(workspaceId);

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const outDir = path.join(root, "docs/audits/complete-state");
mkdirSync(outDir, { recursive: true });
const evidence = {
  artifact: "PILLOW_CAPABILITY_COMPLETION_PRE_BIRTH",
  completedAt: new Date().toISOString(),
  capabilityTests: results,
  liveProbeCycleId: liveProbe.cycleId,
  liveProbeDisposition: liveProbe.decision.disposition,
  liveProbeStages: liveProbe.stages.map((s) => s.stage),
  birthReadiness: readiness,
  birthTimestamp: null,
  birthAuthorised: false,
  thousandRelease: false,
  publicationAttempted: false,
  supplierSpendAttempted: false,
  cursorAuthoredPillowJudgment: false,
};
writeFileSync(
  path.join(outDir, "PILLOW_CAPABILITY_COMPLETION_EVIDENCE.json"),
  JSON.stringify(evidence, null, 2),
);

console.log(
  JSON.stringify(
    {
      summary: results.summary,
      results: results.results.map((r) => ({
        id: r.id,
        status: r.status,
        disposition: r.disposition,
        failedChecks: r.checks.filter((c) => !c.pass).map((c) => c.name),
      })),
      technicallyReadyForGrandKingAuthorisation:
        readiness.technicallyReadyForGrandKingAuthorisation,
      mandatoryStillOpen: readiness.mandatoryStillOpen,
      birthTimestamp: null,
    },
    null,
    2,
  ),
);

if (results.summary.failed > 0) process.exit(2);
