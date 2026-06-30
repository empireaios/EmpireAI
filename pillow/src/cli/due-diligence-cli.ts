import { startPillow } from "../session.js";

const session = await startPillow();
const engine = session.dueDiligence;
const state = engine.getState();

console.log("Pillow Continuous Due Diligence Engine (PILLOW-011)");
console.log(`  Repository: ${session.bootstrap.repositoryRoot}`);
console.log(`  Doctrine: ${state.doctrinePath}`);
console.log(`  Total cycles: ${state.totalCycles}`);

const report = await engine.runAnalysisCycle();

console.log(`\n  Report: ${report.reportId}`);
console.log(`  Findings: ${report.findings.length}`);
console.log(`  Recommendations: ${report.recommendations.length}`);
console.log(`  Domains: ${report.domainsAnalysed.length}`);
console.log(`  Categories: ${report.categoriesReviewed.length}`);
console.log(`  Duration: ${report.durationMs}ms`);

for (const rec of report.recommendations.slice(0, 5)) {
  console.log(`\n  [${rec.priority.toUpperCase()}] ${rec.kind}`);
  console.log(`    ${rec.reason.slice(0, 100)}…`);
  console.log(`    Owners: ${rec.affectedOwners.join(", ")}`);
  console.log(`    Action: ${rec.recommendedAction.slice(0, 80)}…`);
}

const interrupted = engine.interrupt("Grand King priority command");
console.log(`\n  Interrupt at ${interrupted.at}: "${interrupted.command}"`);
const idle = await engine.tick();
console.log(`  Tick after interrupt: ${idle === null ? "skipped (Grand King priority)" : "ran"}`);

engine.resumeAfterInterrupt();
console.log(`  Resumed — ready for next cycle`);
