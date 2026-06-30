import { randomUUID } from "node:crypto";
import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import { RECOVERY_DOCTRINE_PATH } from "../supervisor/doctrine.js";
import type { SupervisedMission } from "../supervisor/types.js";
import { diagnoseMissionState } from "./diagnosis.js";
import { inspectRepositoryState } from "./inspector.js";
import { determineRecoveryStrategy } from "./strategy.js";
import type {
  RecoveryExecutionResult,
  RecoveryManagerOptions,
  RecoveryManagerState,
  RecoveryOutcome,
  RecoveryProcedureStep,
  RecoveryRecord,
  RecoveryRequest,
} from "./types.js";
import { runValidationCycle } from "./validation-runner.js";

/**
 * Recovery Manager (PILLOW-008).
 * Autonomous engineering recovery per EMPIREAI_CURSOR_RECOVERY_DOCTRINE.md.
 * Invoked only by Cursor Supervisor — never modifies Journey/BL/governance.
 */
export class RecoveryManagerEngine {
  private initializedAt: string | null = null;
  private history: RecoveryRecord[] = [];

  constructor(
    private bootstrap: EmpireBootstrapContext,
    private options: RecoveryManagerOptions = {},
  ) {}

  async initialize(): Promise<RecoveryManagerState> {
    const reader = new RepositoryReader(this.bootstrap.repositoryRoot);
    const ok = await this.verifyDoctrinePresent(reader);
    if (!ok) {
      throw new Error(
        `${RECOVERY_DOCTRINE_PATH} missing — Recovery Manager requires Recovery Doctrine.`,
      );
    }
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  getState(): RecoveryManagerState {
    if (!this.initializedAt) {
      throw new Error("Recovery Manager not initialized. Call initialize() first.");
    }
    return {
      managerVersion: "PILLOW-008",
      status: "ready",
      initializedAt: this.initializedAt,
      doctrinePath: RECOVERY_DOCTRINE_PATH,
      totalRecoveries: this.history.length,
      lastRecovery: this.history.at(-1) ?? null,
    };
  }

  async verifyDoctrinePresent(reader: RepositoryReader): Promise<boolean> {
    const text = await reader.readText(RECOVERY_DOCTRINE_PATH);
    return Boolean(text?.includes("Recovery Mode"));
  }

  /** Execute full recovery procedure — supervisor invocation only. */
  async executeRecovery(request: RecoveryRequest): Promise<RecoveryExecutionResult> {
    const started = performance.now();
    const startedAt = new Date().toISOString();
    const warnings: string[] = [];
    const preservedWork: string[] = [];

    // Step 1 — Inspect repository state
    const inspection = await inspectRepositoryState(this.bootstrap.repositoryRoot);
    if (inspection.modifiedFiles.length > 0) {
      preservedWork.push(...inspection.modifiedFiles.slice(0, 20));
    }
    if (inspection.createdFiles.length > 0) {
      preservedWork.push(...inspection.createdFiles.slice(0, 20));
    }
    if (!inspection.repositoryIntegrityOk) {
      warnings.push("Repository merge conflict detected — manual review required");
    }

    // Step 2 — Determine mission state
    const diagnosis = diagnoseMissionState(
      request.mission,
      request.trigger,
      request.stallSignals ?? request.mission.health.stallSignals,
    );

    // Step 3 — Determine recovery strategy
    const { strategy, resumeTarget } = determineRecoveryStrategy(diagnosis);

    const steps: RecoveryProcedureStep[] = [
      {
        step: 1,
        label: "Inspect repository state",
        status: inspection.gitDiffAvailable ? "completed" : "skipped",
        detail: inspection.diffSummary,
      },
      {
        step: 2,
        label: "Determine mission state",
        status: "completed",
        detail: `${diagnosis.completedCriteriaCount}/${diagnosis.acceptanceCriteria.length} acceptance criteria complete · issue: ${diagnosis.issueKind}`,
      },
      {
        step: 3,
        label: "Determine recovery strategy",
        status: "completed",
        detail: `Strategy: ${strategy} → resume ${resumeTarget}`,
      },
      {
        step: 4,
        label: "Resume first incomplete work item",
        status: strategy === "recovery_impossible" ? "skipped" : "completed",
        detail:
          strategy === "mission_already_complete"
            ? "No repeat — mission work preserved"
            : `Resume at ${resumeTarget} without duplicating completed implementation`,
      },
    ];

    let validation = null;
    let outcome: RecoveryOutcome;
    let recovered = false;
    let resumeState: SupervisedMission["state"] = request.mission.state;
    let recommendation = "";

    if (strategy === "mission_already_complete") {
      outcome = "mission_already_complete";
      recovered = true;
      resumeState = "executive_audit";
      recommendation =
        "Mission already complete — produce or verify Executive Audit per doctrine §3 Step 2.";
      steps.push({
        step: 5,
        label: "Validation cycle",
        status: "skipped",
        detail: "Validation already succeeded — not repeated",
      });
      steps.push({
        step: 6,
        label: "Executive Audit",
        status: diagnosis.executiveAuditStatus === "produced" ? "completed" : "pending",
        detail: "Complete Executive Audit to close mission",
      });
    } else if (strategy === "recovery_impossible") {
      outcome = "manual_intervention_required";
      recommendation = "Recovery impossible without manual intervention — preserve repository state.";
      steps.push(
        { step: 5, label: "Validation cycle", status: "skipped", detail: "Not executed" },
        { step: 6, label: "Executive Audit", status: "skipped", detail: "Blocked" },
      );
    } else if (strategy === "resume_executive_audit") {
      outcome = "recovered_successfully";
      recovered = true;
      resumeState = "executive_audit";
      recommendation = "Validation succeeded — proceed directly to Executive Audit per doctrine §3 Step 2.";
      steps.push(
        {
          step: 5,
          label: "Validation cycle",
          status: "skipped",
          detail: "Validation already passed — one cycle not repeated",
        },
        {
          step: 6,
          label: "Executive Audit",
          status: "pending",
          detail: "Produce Executive Audit immediately",
        },
      );
    } else {
      // Step 5 — One fresh validation cycle when required
      const needsValidation =
        strategy === "resume_validation" ||
        (strategy === "resume_implementation" &&
          diagnosis.acceptanceCriteria.find((c) => c.id === "implementation")?.completed);

      if (needsValidation) {
        steps.push({
          step: 5,
          label: "Terminate blocked process (doctrine §3 Step 3)",
          status: "completed",
          detail: "Supervisory recommendation — terminate only blocked validation process",
        });

        validation = await runValidationCycle(this.bootstrap.repositoryRoot, {
          dryRun: this.options.dryRunValidation,
          packageDir: this.options.validationPackageDir ?? "pillow",
        });

        steps.push({
          step: 6,
          label: "One fresh validation cycle (doctrine §3 Step 4)",
          status:
            validation.typecheckPassed && validation.buildPassed
              ? "completed"
              : "failed",
          detail: validation.dryRun
            ? "dry-run"
            : `typecheck: ${validation.typecheckPassed ? "pass" : "fail"} · build: ${validation.buildPassed ? "pass" : "fail"}`,
        });

        if (validation.typecheckPassed && validation.buildPassed) {
          outcome = warnings.length > 0 ? "recovered_with_warnings" : "recovered_successfully";
          recovered = true;
          resumeState = "executive_audit";
          recommendation =
            "Validation succeeded — produce Executive Audit immediately per doctrine §3 Step 5.";
        } else {
          outcome = "recovery_failed";
          recommendation =
            "Validation failed — repair implementation once and re-validate once per doctrine §3 Step 6.";
        }
      } else {
        outcome = "recovered_successfully";
        recovered = true;
        resumeState = resumeTarget as SupervisedMission["state"];
        recommendation = `Resume ${resumeTarget} — preserve all completed work.`;
        steps.push(
          { step: 5, label: "Validation cycle", status: "skipped", detail: "Not yet required" },
          { step: 6, label: "Executive Audit", status: "pending", detail: "After validation" },
        );
      }
    }

    const completedAt = new Date().toISOString();
    const record: RecoveryRecord = {
      recordId: randomUUID(),
      missionId: request.mission.id,
      trigger: request.trigger,
      outcome,
      strategy,
      invokedBy: "cursor_supervisor",
      startedAt,
      completedAt,
      durationMs: Math.round(performance.now() - started),
      inspection,
      diagnosis,
      steps,
      validation,
      resumeTarget,
      warnings,
      preservedWork,
      doctrinePath: RECOVERY_DOCTRINE_PATH,
    };

    this.history.push(record);

    return {
      record,
      recovered,
      resumeState,
      recommendation,
    };
  }

  getHistory(missionId?: string): RecoveryRecord[] {
    if (missionId) return this.history.filter((r) => r.missionId === missionId);
    return [...this.history];
  }

  getLastRecovery(missionId?: string): RecoveryRecord | null {
    const list = missionId ? this.getHistory(missionId) : this.history;
    return list.at(-1) ?? null;
  }
}

export function createRecoveryManagerEngine(
  bootstrap: EmpireBootstrapContext,
  options?: RecoveryManagerOptions,
): RecoveryManagerEngine {
  const engine = new RecoveryManagerEngine(bootstrap, options);
  return engine;
}
