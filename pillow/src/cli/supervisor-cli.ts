import { startPillow } from "../session.js";

const session = await startPillow();
const state = session.supervisor.getState();
const awareness = session.supervisor.getRepositoryAwareness();
const registry = session.supervisor.getRegistry();

console.log("Pillow Cursor Supervisor (PILLOW-007)");
console.log(`  Repository: ${session.bootstrap.repositoryRoot}`);
console.log(`  Doctrine: ${state.doctrinePath}`);
console.log(`  Journey: ${awareness.journeyPosition ?? "—"}`);
console.log(`  Planned next: ${awareness.plannedNext ?? "—"}`);
console.log(`  Active mission: ${registry.activeMission?.id ?? "none"}`);
console.log(`  Queued: ${registry.queued.length}`);
console.log(`  Completed: ${registry.completed.length}`);
console.log(`  History: ${registry.history.length}`);

const launch = session.supervisor.launchNextPlannedMission();
if (launch) {
  console.log(`\n  Launched: ${launch.mission.id} — ${launch.mission.title}`);
  console.log(`  State: ${launch.mission.state}`);
  const tick = await session.supervisor.tick();
  console.log(`  Tick: evaluated=${tick.missionsEvaluated} stalls=${tick.stallsDetected}`);
} else {
  console.log("\n  No mission launched (planner returned null)");
}
