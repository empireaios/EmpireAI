import { startPillow } from "../session.js";

const session = await startPillow();
const state = session.recovery.getState();

console.log("Pillow Recovery Manager (PILLOW-008)");
console.log(`  Repository: ${session.bootstrap.repositoryRoot}`);
console.log(`  Doctrine: ${state.doctrinePath}`);
console.log(`  Total recoveries: ${state.totalRecoveries}`);

const doc = session.planner.generateNextMission();
if (doc) {
  const launch = session.supervisor.launchMission({ document: doc });
  session.supervisor.transitionMission(launch.mission.id, "validation");
  session.supervisor.recordMissionHeartbeat(
    launch.mission.id,
    "validation",
    "waiting for detached background process",
  );

  const result = await session.recovery.executeRecovery({
    mission: session.supervisor.getMission(launch.mission.id)!,
    trigger: "detached_background_process",
  });

  console.log(`\n  Mission: ${result.record.missionId}`);
  console.log(`  Trigger: ${result.record.trigger}`);
  console.log(`  Strategy: ${result.record.strategy}`);
  console.log(`  Outcome: ${result.record.outcome}`);
  console.log(`  Recovered: ${result.recovered}`);
  console.log(`  Resume state: ${result.resumeState}`);
  console.log(`  Preserved files: ${result.record.preservedWork.length}`);
  console.log(`  Steps: ${result.record.steps.length}`);
  console.log(`  Recommendation: ${result.recommendation}`);
} else {
  console.log("\n  No mission available for recovery demo");
}
