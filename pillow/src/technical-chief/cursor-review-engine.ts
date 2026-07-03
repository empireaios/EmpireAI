import type { CursorEngineeringReview, CursorReviewFinding } from "./types.js";

const HALLUCINATION_PATTERNS = [
  /frontend\/src\/(?!components)/i,
  /packages\/empire-core/i,
  /microservices\/pillow/i,
  /graphql gateway/i,
];

const UNSAFE_PATTERNS = [
  { pattern: /eval\s*\(/i, code: "UNSAFE_EVAL", message: "eval() usage detected" },
  { pattern: /--no-verify/i, code: "SKIP_HOOKS", message: "Git hook skip suggested" },
  { pattern: /force push/i, code: "FORCE_PUSH", message: "Force push suggested" },
  { pattern: /process\.env\.\w+\s*\|\|\s*['"][^'"]+['"]/i, code: "HARDCODED_SECRET", message: "Hardcoded env fallback may leak secrets" },
  { pattern: /localhost:4000/i, code: "LOCALHOST_PROD", message: "localhost:4000 reference in production path" },
];

export function reviewCursorEngineeringOutput(input: {
  changedFiles: string[];
  diffSummary?: string;
  claimedArchitecture?: string[];
}): CursorEngineeringReview {
  const findings: CursorReviewFinding[] = [];
  const missingFiles: string[] = [];
  const incorrectAssumptions: string[] = [];
  const incompleteAreas: string[] = [];
  const dependencyIssues: string[] = [];
  const regressions: string[] = [];
  const technicalDebt: string[] = [];
  const requiredCorrections: string[] = [];

  for (const file of input.changedFiles) {
    for (const pattern of HALLUCINATION_PATTERNS) {
      if (pattern.test(file)) {
        incorrectAssumptions.push(`Hallucinated or non-canonical path: ${file}`);
        findings.push({
          code: "HALLUCINATED_PATH",
          severity: "high",
          message: `Path does not match EmpireAI monorepo layout: ${file}`,
          file,
        });
      }
    }

    if (file.endsWith(".ts") && file.includes("orchestration") && !file.includes("backend/src")) {
      incorrectAssumptions.push(`Orchestration module outside backend/src: ${file}`);
    }
  }

  const text = `${input.diffSummary ?? ""} ${(input.claimedArchitecture ?? []).join(" ")}`;
  for (const { pattern, code, message } of UNSAFE_PATTERNS) {
    if (pattern.test(text)) {
      findings.push({ code, severity: "critical", message });
      requiredCorrections.push(message);
    }
  }

  if (input.changedFiles.some((f) => f.includes("pillow/src")) && !input.changedFiles.some((f) => f.includes("validation/tests"))) {
    incompleteAreas.push("Pillow source changed without validation test update");
    technicalDebt.push("Missing test coverage for Pillow module changes");
  }

  if (input.changedFiles.some((f) => f.includes("empireai-web")) && !input.changedFiles.some((f) => f.includes("server-proxy") || f.includes("route"))) {
    if (/api|fetch|proxy/i.test(text)) {
      dependencyIssues.push("Frontend API change may require BFF route or server-proxy update");
    }
  }

  if (input.changedFiles.length > 50) {
    regressions.push("Large change set — high regression risk; consider splitting PRs");
    findings.push({
      code: "LARGE_DIFF",
      severity: "medium",
      message: `${input.changedFiles.length} files changed — review scope carefully`,
    });
  }

  const approved =
    findings.filter((f) => f.severity === "critical" || f.severity === "high").length === 0 &&
    requiredCorrections.length === 0;

  if (!approved && requiredCorrections.length === 0) {
    requiredCorrections.push("Address high-severity Cursor review findings before certification");
  }

  return {
    approved,
    findings,
    missingFiles,
    incorrectAssumptions,
    incompleteAreas,
    dependencyIssues,
    regressions,
    technicalDebt,
    requiredCorrections,
  };
}
