#!/usr/bin/env node
import { startPillow } from "../session.js";

const session = await startPillow();
const evolution = session.continuousEvolution;
const state = evolution.getState();

console.log("Pillow Continuous Empire Evolution (PILLOW-CEV-001)");
console.log(`  Domains monitored: ${state.domainsMonitored.length}`);
console.log(`  Improvement backlog: ${state.improvementBacklogSize} items`);
console.log("  Running evolution cycle...");
console.log("");

const report = await evolution.evolveEmpire();

console.log(`Evolution trend: ${report.evolution.evolutionTrend}`);
console.log(`Stagnation risk: ${report.evolution.stagnationRisk}`);
console.log(`V1 Certification: ${report.version1Certification.readinessLevel} (${report.version1Certification.overallScore}/100)`);
console.log(`High-value opportunities: ${report.opportunities.highValueCount}`);
console.log(`Risks detected: ${report.risks.risks.length}`);
console.log("");
console.log(report.executiveBrief);

process.exit(report.version1Certification.certified || report.version1Certification.readinessLevel === "conditional" ? 0 : 1);
