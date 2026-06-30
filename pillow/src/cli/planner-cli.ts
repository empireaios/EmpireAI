import { startPillow } from "../session.js";

const session = await startPillow();
const plan = session.planner.getPlan();
const next = session.planner.determineNextMission();
const document = session.planner.generateNextMission();

console.log("Pillow Mission Planner (PILLOW-006)");
console.log(`  Repository: ${session.bootstrap.repositoryRoot}`);
console.log(`  Position: ${plan.intelligence.repositoryPosition ?? "—"}`);
console.log(`  Completed: ${plan.intelligence.completedCount}`);
console.log(`  Pending: ${plan.intelligence.pendingCount}`);
console.log(`  Health score: ${plan.intelligence.repositoryHealthScore}/100`);
console.log(`  Queue size: ${plan.queue.length}`);
console.log(`  Blocked: ${plan.blockedMissions.length}`);
console.log(`  Duration: ${plan.durationMs}ms`);

if (next) {
  console.log(`\n  Next mission: ${next.id} — ${next.title}`);
  console.log(`  Category: ${next.category}`);
  console.log(`  Priority: ${next.priority}`);
  console.log(`  Readiness: ${next.readiness}`);
  if (next.blockedBy.length > 0) {
    console.log(`  Blocked by: ${next.blockedBy.join(", ")}`);
  }
} else {
  console.log("\n  Next mission: none ready");
}

if (document) {
  console.log("\n--- Cursor Mission Preview (first 40 lines) ---\n");
  console.log(document.formatted.split("\n").slice(0, 40).join("\n"));
  console.log("\n... (truncated)");
} else {
  console.log("\n  Cursor mission: not generated (dependencies incomplete or no ready mission)");
}
