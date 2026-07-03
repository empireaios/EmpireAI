#!/usr/bin/env node
import { startPillow } from "../session.js";

const session = await startPillow();
const commander = session.infrastructureCommander;
const state = commander.getState();

console.log("Pillow Infrastructure Commander (PILLOW-IC-001)");
console.log(`  Platforms: ${state.platformsMonitored.join(", ")}`);
console.log(`  Scans: ${state.totalScans}`);
console.log("  Scanning infrastructure...");
console.log("");

const snapshot = await commander.scanInfrastructure();
const report = await commander.generateExecutiveReport();

console.log(`Overall health: ${snapshot.overallHealth}`);
console.log(`Production readiness: ${snapshot.productionReadiness}`);
console.log(`Alert level: ${snapshot.alertLevel}`);
console.log("");
console.log(report.executiveBrief);

process.exit(snapshot.overallHealth === "critical" ? 1 : 0);
