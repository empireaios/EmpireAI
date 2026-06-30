import { startPillow } from "../session.js";

const session = await startPillow();
const command = session.command;
const state = command.getState();

console.log("Pillow Grand King Command Interface (PILLOW-015)");
console.log(`  Repository: ${session.bootstrap.repositoryRoot}`);
console.log(`  Contract: ${state.contractPath}`);
console.log(`  Commands processed: ${state.totalCommands}`);

const samples = [
  "What's next?",
  "Review Empire health",
  "Review commercial readiness",
];

for (const text of samples) {
  console.log(`\n── Command: "${text}"`);
  const response = await command.processCommand({ command: text });
  console.log(`  Intent: ${response.intent} (${response.category})`);
  console.log(`  Modules: ${response.plan.relevantModules.join(", ")}`);
  console.log(`  Duration: ${response.durationMs}ms`);
  console.log(response.message.split("\n").slice(0, 6).join("\n"));
}

session.orchestrator.resumeAfterGrandKingCommand();
console.log("\n  Autonomous workflows resumed after demo commands");
