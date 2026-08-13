/**
 * Run Pillow Executive Birth Bootcamp (deterministic) and write evidence.
 * Never authorises Birth. Never executes sealed GK+ChatGPT exam.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runExecutiveBirthBootcamp } from "../src/orchestration/pillow-commissioning/birth-bootcamp/index.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const seed = Number(process.env.BOOTCAMP_SEED || 20260813);
const report = runExecutiveBirthBootcamp({ seed });

const outDir = path.join(root, "docs/audits/complete-state");
mkdirSync(outDir, { recursive: true });
const jsonPath = path.join(outDir, "PILLOW_EXECUTIVE_BIRTH_BOOTCAMP_EVIDENCE.json");
writeFileSync(jsonPath, JSON.stringify(report, null, 2));

const mdPath = path.join(outDir, "PILLOW_EXECUTIVE_BIRTH_BOOTCAMP_REPORT.md");
const lines = [
  "# Pillow Executive Birth Bootcamp Report",
  "",
  `Computed: ${report.computedAt}`,
  `Seed: ${report.seed}`,
  "",
  "## Integrity",
  "",
  `- REAL_GK_CHATGPT_EXAM_QUESTIONS_SEEN=${report.realGkChatgptExamQuestionsSeen}`,
  `- HIDDEN_T1_T2_T3_EXECUTED=${report.hiddenT1T2T3Executed}`,
  `- BIRTH_AUTHORISED=${report.birthAuthorised}`,
  `- BIRTH_TIMESTAMP=${report.birthTimestamp}`,
  "",
  "## Curriculum audit + mock readiness",
  "",
  "| Family | Audit | Mock readiness | Pass/Fail | Max level |",
  "|---|---|---|---|---|",
  ...report.families.map(
    (f) =>
      `| ${f.family} | ${f.audit} | ${f.mockReadiness} | ${f.passed}/${f.scenariosRun} | ${f.maxLevelPassed} |`,
  ),
  "",
  "## Cost",
  "",
  `- scenarios=${report.cost.scenariosExecuted}`,
  `- deterministic=${report.cost.deterministicScenarios}`,
  `- llmCalls=${report.cost.llmCalls}`,
  `- estimatedLlmUsd=${report.cost.estimatedLlmUsd}`,
  `- note: ${report.cost.note}`,
  "",
  "## Final state",
  "",
  `- BOOTCAMP_READY=${report.bootcampReady}`,
  `- KNOWN_BIRTH_CRITICAL_SYSTEMIC_FAILURES=${report.knownBirthCriticalSystemicFailures}`,
  `- SAFE_FOR_GK_CHATGPT_SEALED_EXAM=${report.safeForGkChatgptSealedExam}`,
  "",
  "MOCK PASS ≠ BIRTH PASS. Sealed examination remains Grand King + ChatGPT only.",
  "",
];
writeFileSync(mdPath, lines.join("\n"));
console.log(
  JSON.stringify(
    {
      bootcampReady: report.bootcampReady,
      safeForGkChatgptSealedExam: report.safeForGkChatgptSealedExam,
      scenarios: report.cost.scenariosExecuted,
      llmCalls: report.cost.llmCalls,
      jsonPath,
      mdPath,
    },
    null,
    2,
  ),
);
process.exit(report.bootcampReady ? 0 : 2);
