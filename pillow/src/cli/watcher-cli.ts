import { startPillow } from "../session.js";

const session = await startPillow();
const watcher = session.watcher;
const state = watcher.getState();

console.log("Pillow Live Repository Watcher (PILLOW-014)");
console.log(`  Repository: ${session.bootstrap.repositoryRoot}`);
console.log(`  Contract: ${state.contractPath}`);
console.log(`  Subscribers: ${state.subscriberCount}`);
console.log(`  Observation scope: ${watcher.getObservationScopeSize()}+ paths`);

const result = await watcher.observe();
const batch = result.batch;

console.log(`\n  Batch: ${batch.batchId}`);
console.log(`  Scanned: ${result.scannedPaths} file snapshot(s)`);
console.log(`  Events: ${batch.events.length}`);
console.log(`  Drift signals: ${batch.driftSignals.length}`);
console.log(`  Duration: ${batch.durationMs}ms`);
console.log(`  Recommendation: ${result.recommendation}`);

for (const event of batch.events.slice(0, 5)) {
  console.log(`\n  [${event.type}] ${event.summary}`);
  console.log(`    Classification: ${event.classification}`);
  if (event.paths.length > 0) {
    console.log(`    Paths: ${event.paths.slice(0, 3).join(", ")}`);
  }
}

for (const drift of batch.driftSignals.slice(0, 3)) {
  console.log(`\n  Drift [${drift.severity}]: ${drift.label}`);
}

console.log(`\n  Subscribers notified: ${result.notifications.length}`);

const tick = await watcher.tick();
console.log(`  Tick (no change): ${tick === null ? "skipped" : "observed"}`);
