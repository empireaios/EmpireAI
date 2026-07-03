#!/usr/bin/env node
import { startPillow } from "../session.js";

const args = process.argv.slice(2);
const instructionIndex = args.indexOf("--instruction");
const instruction =
  instructionIndex >= 0 ? args.slice(instructionIndex + 1).join(" ") : null;

if (!instruction) {
  console.error('Usage: npm run cursor-bridge -- --instruction "Deploy latest version"');
  process.exit(1);
}

const session = await startPillow();
const state = session.cursorBridge.getState();
const result = session.cursorBridge.processInstruction(instruction);

console.log("Pillow Autonomous Cursor Bridge (PILLOW-CB-001)");
console.log(`  Bridge ID: ${result.bridgeMissionId}`);
console.log(`  Kind: ${result.instruction.kind}`);
console.log(`  Dispatch mode: ${state.defaultDispatchMode}`);
console.log(`  Duration: ${result.durationMs}ms`);
console.log("");
console.log(result.executiveBrief);
console.log("");
console.log("--- Mission Artifact ---");
console.log(`Path: ${result.dispatch.artifactPath ?? result.mission.artifactPath ?? "none"}`);
console.log(`Supervisor mission: ${result.dispatch.supervisorMissionId ?? "none"}`);

process.exit(0);
