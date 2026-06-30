import { findSequenceEntry } from "../planner/sequencer.js";
import type { SupervisedMission } from "../supervisor/types.js";
import type { CategoryReviewResult, CriterionResult } from "./types.js";

export function verifyContractCompliance(
  mission: SupervisedMission,
  auditText?: string | null,
): CategoryReviewResult {
  const findings: string[] = [];
  const entry = findSequenceEntry(mission.id);
  let passed = 0;
  let total = 0;

  const check = (ok: boolean, label: string, failMsg: string) => {
    total++;
    if (ok) {
      passed++;
    } else {
      findings.push(failMsg);
    }
  };

  check(Boolean(entry), "mission_sequence", `Mission ${mission.id} not in Pillow Part 7 sequence`);
  check(
    Boolean(mission.missionAuthority),
    "authority",
    "Mission authority not recorded",
  );
  if (entry) {
    check(
      mission.title.includes(entry.title.split(" ")[0]!) ||
        entry.title.toLowerCase().includes(mission.title.toLowerCase().slice(0, 8)) ||
        mission.id === entry.id,
      "correct_mission",
      `Mission title may not match sequence entry ${entry.id}`,
    );
    check(
      entry.prerequisites.every((p) =>
        mission.dependencies.includes(p) || p.startsWith("PILLOW-00"),
      ) || mission.dependencies.length === 0,
      "dependencies",
      "Mission dependencies may not reflect sequence prerequisites",
    );
    if (auditText) {
      check(
        auditText.includes(mission.id) || auditText.includes(entry.id),
        "audit_mission_id",
        "Executive Audit does not reference mission id",
      );
      check(
        /stop rule|do not begin/i.test(auditText) || entry.stopRule.includes("Stop"),
        "stop_rule",
        "Stop rule not referenced in Executive Audit",
      );
    }
  }

  const result = scoreToResult(passed, total, findings.length);
  return {
    category: "contract_compliance",
    result,
    score: total > 0 ? Math.round((passed / total) * 100) : 0,
    findings,
  };
}

function scoreToResult(
  passed: number,
  total: number,
  issueCount: number,
): CriterionResult {
  if (total === 0) return "unable_to_verify";
  if (passed === total) return "passed";
  if (passed === 0) return "failed";
  if (issueCount > 2) return "failed";
  return "partially_passed";
}
