#!/usr/bin/env node
import { startPillow } from "../session.js";

const session = await startPillow();
const commander = session.empireCommander;
const state = commander.getState();

console.log("Pillow Empire Commander (PILLOW-EC-001)");
console.log(`  Domains: ${state.domainsMonitored.join(", ")}`);
console.log(`  Engines coordinated: ${state.enginesCoordinated}`);
console.log("  Synthesizing cross-domain intelligence...");
console.log("");

const report = await commander.commandEmpire("What should EmpireAI prioritise next?");

console.log(`Overall Empire Health: ${report.crossDomain.overallHealthScore}/100`);
console.log(`Strategic priorities: ${report.strategicPriorities.length}`);
console.log("");
console.log(report.executiveBrief);

process.exit(report.crossDomain.overallHealthScore >= 50 ? 0 : 1);
