#!/usr/bin/env node
import { startPillow } from "../session.js";

const args = process.argv.slice(2);
const requestIndex = args.indexOf("--request");
const request =
  requestIndex >= 0 ? args.slice(requestIndex + 1).join(" ") : null;

if (!request) {
  console.error('Usage: npm run ux-designer -- --request "Make the homepage pink"');
  process.exit(1);
}

const session = await startPillow();
const state = session.uxDesigner.getState();
const result = session.uxDesigner.designFromRequest(request);

console.log("Pillow AI UX Designer (PILLOW-UX-001)");
console.log(`  Design ID: ${result.designId}`);
console.log(`  Indexed screens: ${state.indexedScreens}`);
console.log(`  Duration: ${result.durationMs}ms`);
console.log("");
console.log(result.executiveBrief);
console.log("");
console.log("--- Option A Engineering Spec ---");
const specA = result.proposals[0]!.spec;
console.log(`Objective: ${specA.objective}`);
console.log(`Files: ${specA.requiredFiles.join(", ")}`);
console.log(`Tailwind: ${specA.tailwindClasses.join(" ")}`);
console.log("");
console.log("--- Cursor Mission ---");
console.log(specA.cursorMissionSummary);

process.exit(0);
