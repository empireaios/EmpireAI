import { startPillow } from "../session.js";

const session = await startPillow();
const orchestrator = session.orchestrator;
const state = orchestrator.getState();

console.log("Pillow EmpireAI Orchestrator (PILLOW-013)");
console.log(`  Repository: ${session.bootstrap.repositoryRoot}`);
console.log(`  Contract: ${state.contractPath}`);
console.log(`  Subsystems: ${state.subsystemCount}`);
console.log(`  Workers: ${state.workerCount}`);
console.log(`  Workflows: ${state.workflowCount}`);

const subsystems = orchestrator.getSubsystems();
console.log("\n  Subsystem Registry:");
for (const s of subsystems.filter((x) => x.missionId)) {
  console.log(`    [${s.health}] ${s.label} (${s.missionId})`);
}

const workers = orchestrator.getWorkers();
console.log("\n  Worker Registry:");
for (const w of workers) {
  console.log(`    [${w.availability}] ${w.label} (${w.kind})`);
}

const result = orchestrator.coordinate({ workflowId: "engineering" });
console.log(`\n  Engineering Pipeline: ${result.coordination.steps.length} steps`);
console.log(`  Recommendation: ${result.coordination.recommendation}`);
for (const step of result.coordination.steps.slice(0, 5)) {
  console.log(`    ${step.step.order}. ${step.step.label} → ${step.status}`);
}

const schedule = result.scheduling;
console.log(`\n  Scheduled queue: ${schedule.queue.length} item(s)`);
for (const item of schedule.queue.slice(0, 3)) {
  console.log(`    [${item.priority}] ${item.label}${item.blocked ? " (blocked)" : ""}`);
}

const awareness = result.awareness;
console.log(`\n  Runtime awareness:`);
console.log(`    Journey: ${awareness.journeyPosition ?? "unknown"}`);
console.log(`    Repository health: ${awareness.repositoryHealthScore}`);
console.log(`    Active missions: ${awareness.activeMissions}`);

const cmd = orchestrator.issueGrandKingCommand("Priority engineering directive");
console.log(`\n  Grand King command: "${cmd.command.command}"`);
console.log(`  Paused: ${cmd.paused.join(", ")}`);
orchestrator.resumeAfterGrandKingCommand();
console.log(`  Resumed after Grand King command`);
