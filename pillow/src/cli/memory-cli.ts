#!/usr/bin/env node
import { startPillow, requirePillowMemory } from "../session.js";

const session = await startPillow();
const memory = requirePillowMemory().getMemory();

console.log("Pillow Repository Memory Engine (PILLOW-005)");
console.log(`  Repository: ${session.bootstrap.repositoryRoot}`);
console.log(`  Fingerprint: ${memory.repositoryFingerprint.slice(0, 48)}…`);
console.log(`  Journey: ${memory.domains.journeyPosition.value ?? "—"}`);
console.log(`  Current mission: ${memory.domains.currentMission.value ?? "—"}`);
console.log(
  `  Completed missions: ${memory.domains.completedMissions.value.length}`,
);
console.log(
  `  Pending missions: ${memory.domains.pendingMissions.value.length}`,
);
console.log(`  REAL owners (memory): ${memory.domains.realOwners.value.length}`);
console.log(`  Executive audits: ${memory.domains.executiveAudits.value.length}`);
console.log(`  ADRs: ${memory.domains.decisions.value.adrCount}`);
console.log(`  Health score: ${memory.domains.repositoryHealth.value.score}/100`);
console.log(`  Synchronized: ${memory.consistency.synchronized}`);
console.log(`  Duration: ${memory.durationMs}ms`);

const integrity = requirePillowMemory().verifyIntegrity();
console.log(`  Provenance valid: ${integrity.valid}`);

process.exit(0);
