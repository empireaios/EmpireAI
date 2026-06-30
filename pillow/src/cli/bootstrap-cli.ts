#!/usr/bin/env node
import { formatFailureReport } from "../bootstrap/failure.js";
import { runBootstrap } from "../bootstrap/engine.js";
import { isBootstrapReady } from "../bootstrap/types.js";

const result = await runBootstrap();

if (!isBootstrapReady(result)) {
  console.error(formatFailureReport(result.failure));
  process.exit(1);
}

console.log("Pillow Bootstrap succeeded (PILLOW-002)");
console.log(`  Repository: ${result.repositoryRoot}`);
console.log(`  Version: ${result.repositoryVersion ?? "unknown"}`);
console.log(`  Journey: ${result.journeyPosition ?? "—"}`);
console.log(`  Mission: ${result.currentMission ?? "—"}`);
console.log(
  `  Health: ${result.repositoryHealth.mandatoryPresent}/${result.repositoryHealth.mandatoryTotal} mandatory, ${result.repositoryHealth.optionalPresent}/${result.repositoryHealth.optionalTotal} optional`,
);
console.log(`  ADRs: ${result.knownDecisions.adrCount}`);
console.log(`  Executive Audits: ${result.knownExecutiveAudits.length}`);
console.log(`  REAL owners: ${result.realOwners.length}`);
console.log(`  Duration: ${result.durationMs}ms`);
process.exit(0);
