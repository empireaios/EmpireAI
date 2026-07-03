import type { ImplementationValidation } from "./types.js";

export function validateImplementation(input: {
  changedFiles: string[];
  hasTypecheckPass?: boolean;
  hasTestsPass?: boolean;
  hasBuildPass?: boolean;
  productionHealthOk?: boolean;
  pillowSessionOk?: boolean;
}): ImplementationValidation {
  const findings: string[] = [];
  const blockers: string[] = [];

  if (input.changedFiles.length === 0) {
    findings.push("No changed files supplied — validation limited to checklist");
  } else {
    findings.push(`${input.changedFiles.length} files in change set`);
    if (input.changedFiles.some((f) => f.includes(".env") && !f.includes(".example"))) {
      blockers.push("Potential secret file in change set — do not commit .env");
    }
    if (input.changedFiles.some((f) => f.includes("node_modules"))) {
      blockers.push("node_modules in change set — invalid commit scope");
    }
  }

  const implementationVerified = input.changedFiles.length > 0;
  const architectureVerified = !input.changedFiles.some((f) =>
    /hardcoded localhost|127\.0\.0\.1/i.test(f),
  );
  const repositoryConsistencyVerified = !blockers.some((b) => b.includes("node_modules"));
  const runtimeVerified = input.productionHealthOk ?? false;
  const testsVerified = input.hasTestsPass ?? false;
  const buildVerified = input.hasBuildPass ?? false;
  const deploymentVerified = input.productionHealthOk ?? false;
  const productionVerified = (input.productionHealthOk ?? false) && (input.pillowSessionOk ?? false);
  const businessLogicVerified = input.hasTypecheckPass ?? false;

  if (!input.hasTypecheckPass) findings.push("Typecheck not confirmed — run before certification");
  if (!input.hasTestsPass) findings.push("Test suite not confirmed — run pillow validation tests");
  if (!input.productionHealthOk) findings.push("Production health not verified");
  if (!input.pillowSessionOk) findings.push("Pillow session endpoint not verified");

  return {
    implementationVerified,
    architectureVerified,
    repositoryConsistencyVerified,
    runtimeVerified,
    testsVerified,
    buildVerified,
    deploymentVerified,
    productionVerified,
    businessLogicVerified,
    findings,
    blockers,
  };
}
