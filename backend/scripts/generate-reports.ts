import path from "node:path";
import { fileURLToPath } from "node:url";
import { configureValidationEnvironment } from "../src/validation/harness.js";
import { bootstrapFoundation, buildReportContext, writeAllReports } from "../src/foundation/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(backendRoot, "..");

configureValidationEnvironment();
bootstrapFoundation("ws_empire_1");

const ctx = buildReportContext("ws_empire_1");
const reports = writeAllReports(ctx, repoRoot);

console.log("EmpireAI reports generated:");
for (const filename of Object.keys(reports)) {
  console.log(`  - ${path.join(repoRoot, filename)}`);
}
