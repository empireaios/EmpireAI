#!/usr/bin/env node
import { startPillow } from "../session.js";
import { formatExecutiveEngineeringReport } from "../technical-chief/certification-engine.js";

const args = process.argv.slice(2);
const problemIndex = args.indexOf("--problem");
const problem =
  problemIndex >= 0 ? args.slice(problemIndex + 1).join(" ") : null;

if (!problem) {
  console.error("Usage: npm run technical-chief -- --problem \"describe the issue\"");
  process.exit(1);
}

const session = await startPillow();
const analysis = session.technicalChief.analyzeIssue({ problemDescription: problem });

console.log("Pillow Technical Chief (PILLOW-TC-001)");
console.log(`  Analysis ID: ${analysis.analysisId}`);
console.log(`  Duration: ${analysis.durationMs}ms`);
console.log("");
console.log(analysis.executiveBrief);
console.log("");
console.log("--- Engineering Plan Steps ---");
for (const step of analysis.plan.steps) {
  console.log(`${step.order}. ${step.action}`);
  console.log(`   Files: ${step.files.join(", ")}`);
}
console.log("");
const report = session.technicalChief.certifyWork({
  problemDescription: problem,
  changedFiles: analysis.plan.requiredFiles.slice(0, 5),
});
console.log(formatExecutiveEngineeringReport(report));

process.exit(0);
