#!/usr/bin/env node
import { startPillow } from "../session.js";

const session = await startPillow();
const eos = session.empireOperatingSystem;
const state = eos.getState();

console.log("Pillow Empire Operating System (PILLOW-EOS-001)");
console.log(`  Companies managed: ${state.companiesManaged}`);
console.log(`  Governance domains: ${state.governanceDomains.join(", ")}`);
console.log("  Operating Empire portfolio...");
console.log("");

const report = await eos.operateEmpire("Create and operate Empire businesses");

console.log(`Empire Readiness: ${report.readiness.overallReadinessScore}/100 (${report.readiness.certificationLevel})`);
console.log(`Portfolio: ${report.portfolio.length} companies`);
console.log(`Governance: ${report.governance.overallComplianceScore}/100`);
console.log("");
console.log(report.executiveBrief);

process.exit(report.readiness.certificationLevel !== "not_ready" ? 0 : 1);
