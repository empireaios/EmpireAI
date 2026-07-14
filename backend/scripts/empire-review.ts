import path from "node:path";
import { fileURLToPath } from "node:url";

import { configureValidationEnvironment } from "../src/validation/harness.js";
import { bootstrapFoundation } from "../src/foundation/index.js";
import { generateReviewPackageOnly } from "../src/orchestration/empire-self-inspection/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");

configureValidationEnvironment();
bootstrapFoundation("ws_empire_1");

const skipSlowTests = process.argv.includes("--skip-tests");
const runValidation = !process.argv.includes("--no-validation");

console.log("Empire Self-Inspection System (ESIS) — generating review package...");
console.log(`  Validation: ${runValidation ? "enabled" : "disabled"}`);
console.log(`  Full test suite: ${runValidation && !skipSlowTests ? "enabled" : "skipped"}`);

const { path: reportPath, report } = generateReviewPackageOnly({
  workspaceId: "ws_empire_1",
  companyId: "co-grand-king",
  runValidation,
  skipSlowTests: skipSlowTests || !runValidation,
});

console.log("");
console.log("Review package generated:");
console.log(`  - ${path.join(repoRoot, reportPath)}`);
console.log(`  - Report ID: ${report.reportId}`);
console.log(`  - Deterministic hash: ${report.deterministicHash}`);
console.log(`  - Backend modules: ${report.backend.modules.length}`);
console.log(`  - Frontend routes: ${report.frontend.routeCount}`);
console.log(`  - Connectors: ${report.connectors.entries.length}`);
console.log(`  - Risks: ${report.risks.length}`);
console.log(`  - Typecheck: ${report.production.typecheck.status}`);
console.log(`  - Tests: ${report.production.tests.status}`);
console.log(`  - Build: ${report.production.build.status}`);
console.log(`  - Governance review: ${report.governance.reviewPassed ? "PASSED" : "FAILED"}`);
console.log(`  - Architecture review: ${report.architecture.reviewPassed ? "PASSED" : "FAILED"}`);
console.log(`  - UX & Identity review: ${report.uxIdentity.reviewPassed ? "PASSED" : "FAILED"}`);
console.log(`  - Commercial review: ${report.commercial.reviewPassed ? "PASSED" : "FAILED"}`);

if (!report.governance.reviewPassed) {
  console.error("");
  console.error("Empire Review FAILED — governance violations detected (GVD-029).");
  process.exit(1);
}

if (!report.architecture.reviewPassed) {
  console.error("");
  console.error("Empire Review FAILED — architecture constraint violations detected (ACD-030).");
  process.exit(1);
}

if (!report.uxIdentity.reviewPassed) {
  console.error("");
  console.error("Empire Review FAILED — UX & identity doctrine violations detected (UID).");
  process.exit(1);
}

if (!report.commercial.reviewPassed) {
  console.error("");
  console.error("Empire Review FAILED — commercial business doctrine violations detected (CBD).");
  process.exit(1);
}
