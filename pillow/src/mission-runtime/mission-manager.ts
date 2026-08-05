import type { MissionRuntimeConfiguration } from "./configuration.js";
import { applyTransition, validateTransition } from "./lifecycle-engine.js";
import { CheckpointManager } from "./checkpoint-manager.js";
import { DependencyResolver } from "./dependency-resolver.js";
import { ExecutionCoordinator } from "./execution-coordinator.js";
import { MsrIntegrationCoordinator, type MissionRuntimeDependencies } from "./integrations.js";
import { MetricsCollector } from "./metrics-collector.js";
import { MissionFactory } from "./mission-factory.js";
import { MissionStore, nextMsrId, resetMsrSequenceForTesting } from "./mission-store.js";
import { MissionValidator } from "./mission-validator.js";
import { appendMsrLog } from "./msr-logging.js";
import {
  INTEGRATION_TARGETS,
  MISSION_RUNTIME_ID,
  MSR_CAPABILITIES,
  MSR_METADATA_VERSION,
} from "./paths.js";
import { RecoveryManager } from "./recovery-manager.js";
import { ReportBuilder } from "./report-builder.js";
import { RetryManager } from "./retry-manager.js";
import type {
  IntegrationHandshake,
  LifecycleTransition,
  MissionInstance,
  MissionRuntimeReport,
  MsrEngineRecord,
  MsrInput,
  MsrRunReport,
  Q1004ConsumableContract,
} from "./types.js";

export class MissionManager {
  private engineRecord: MsrEngineRecord | null = null;
  private seeded = false;
  private readonly store = new MissionStore();
  private readonly validator = new MissionValidator();
  private readonly factory = new MissionFactory();
  private readonly executionCoordinator = new ExecutionCoordinator();
  private readonly checkpointManager = new CheckpointManager();
  private readonly retryManager = new RetryManager();
  private readonly recoveryManager = new RecoveryManager();
  private readonly dependencyResolver = new DependencyResolver();
  private readonly metricsCollector = new MetricsCollector();
  private readonly reportBuilder = new ReportBuilder();
  private readonly integrations = new MsrIntegrationCoordinator();

  bindIntegrations(deps: MissionRuntimeDependencies = {}) {
    this.integrations.bind(deps);
  }

  getIntegrations() {
    return this.integrations.getDependencies();
  }

  ensureSeeded(_config: MissionRuntimeConfiguration) {
    if (this.seeded) return;
    this.seeded = true;
    this.ensureRecord("active", _config);
  }

  getEngineRecord() {
    return this.engineRecord
      ? {
          ...this.engineRecord,
          supportedCapabilities: [...this.engineRecord.supportedCapabilities],
          integrationTargets: [...this.engineRecord.integrationTargets],
        }
      : null;
  }

  getReports() {
    return this.store.listReports();
  }

  getHistory() {
    return this.store.getHistory();
  }

  getAuditTrail() {
    return this.store.getAuditTrail();
  }

  getQ1004ConsumableContract(config: MissionRuntimeConfiguration): Q1004ConsumableContract {
    return this.reportBuilder.buildQ1004ConsumableContract(config);
  }

  connect(_input: Record<string, unknown>, config: MissionRuntimeConfiguration): MsrRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const handshakes = this.integrations.connect(
      config.integrationTargets.length ? config.integrationTargets : [...INTEGRATION_TARGETS],
    );
    appendMsrLog({
      event: "connect",
      details: `Mission Runtime connected; integrations=${handshakes.filter((h) => h.available).length}`,
    });
    return this.reportAction("connect", started, { validated: true }, config, null, [], handshakes);
  }

  createMission(input: MsrInput, config: MissionRuntimeConfiguration): MsrRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.validateInput(input, started);
    if (validation.decision === "fail") {
      return this.failReport("create_mission", started, validation, config);
    }
    const mission = this.factory.create(input);
    this.store.saveMission(mission);
    this.store.appendTimeline({
      entryId: nextMsrId(`${mission.missionId}-created`),
      timestamp: mission.createdAt,
      label: "mission_created",
      state: "Created",
      notes: ["Mission instance created"],
    });
    this.ensureRecord("active", config);
    appendMsrLog({ event: "create_mission", details: mission.missionId });
    return this.reportAction("create_mission", started, input, config, mission);
  }

  queue(input: MsrInput, config: MissionRuntimeConfiguration): MsrRunReport {
    return this.transitionOp("queue", input, config, "Created", "Queued");
  }

  ready(input: MsrInput, config: MissionRuntimeConfiguration): MsrRunReport {
    const started = Date.now();
    const mission = this.requireMission(input, started, config, "ready");
    if (!mission) return this.lastFail!;
    if (!this.dependencyResolver.isReady(this.store, mission)) {
      return this.failReport(
        "ready",
        started,
        {
          ...this.validator.validateInput(input, started),
          decision: "fail",
          errors: ["Dependencies not satisfied for ready transition"],
        },
        config,
      );
    }
    return this.transitionOp("ready", input, config, "Queued", "Ready");
  }

  execute(input: MsrInput, config: MissionRuntimeConfiguration): MsrRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.validateExecute(input, started);
    if (validation.decision === "fail") {
      return this.failReport("execute", started, validation, config);
    }

    let mission = input.missionId ? this.store.getMission(input.missionId) : null;
    if (!mission) {
      const created = this.createMission(input, config);
      if (created.decision === "fail" || !created.mission) {
        return created;
      }
      mission = created.mission;
      input = { ...input, missionId: mission.missionId };
    }

    const transitions: LifecycleTransition[] = [];
    const advance = (from: MissionInstance["currentStatus"], to: MissionInstance["currentStatus"], reason: string) => {
      const t = this.applyMissionTransition(mission!, from, to, reason);
      transitions.push(t);
      mission = this.store.getMission(mission!.missionId)!;
    };

    if (mission.currentStatus === "Created") advance("Created", "Queued", "Auto-queue for execute");
    if (mission.currentStatus === "Queued") advance("Queued", "Ready", "Auto-ready for execute");
    if (mission.currentStatus === "Ready") advance("Ready", "Running", "Execute mission");

    if (mission.currentStatus !== "Running") {
      return this.failReport(
        "execute",
        started,
        {
          ...validation,
          decision: "fail",
          errors: [`Cannot execute from state ${mission.currentStatus}`],
        },
        config,
        mission,
        transitions,
      );
    }

    if (input.checkpointLabel) {
      this.checkpointManager.create(this.store, mission, input.checkpointLabel);
    }

    const execResult = this.executionCoordinator.run(this.store, this.integrations, mission, input);

    if (input.completeAfterRun === false) {
      mission = this.updateMission(mission, { progress: this.metricsCollector.progressFor(mission) });
      return this.reportAction("execute", started, input, config, mission, transitions);
    }

    if (input.forceFail === true) {
      advance("Running", "Failed", "forceFail requested");
      mission = this.updateMission(mission, {
        progress: this.metricsCollector.progressFor(mission),
      });
      return this.reportAction("execute", started, input, config, mission, transitions);
    }

    advance("Running", "Completed", execResult.succeeded ? "Execution completed" : "Execution failed");
    if (execResult.succeeded) {
      mission = this.updateMission(mission, { progress: 100 });
    }

    appendMsrLog({ event: "execute", details: `${mission.missionId}:${mission.currentStatus}` });
    return this.reportAction("execute", started, input, config, mission, transitions);
  }

  pause(input: MsrInput, config: MissionRuntimeConfiguration): MsrRunReport {
    const started = Date.now();
    const mission = this.requireMission(input, started, config, "pause");
    if (!mission) return this.lastFail!;
    const from = mission.currentStatus;
    if (from !== "Running" && from !== "Waiting") {
      return this.failReport(
        "pause",
        started,
        {
          ...this.validator.validateInput(input, started),
          decision: "fail",
          errors: [`Cannot pause from state ${from}`],
        },
        config,
        mission,
      );
    }
    this.checkpointManager.create(this.store, mission, "pause", from);
    return this.transitionOp("pause", input, config, from, "Paused");
  }

  resume(input: MsrInput, config: MissionRuntimeConfiguration): MsrRunReport {
    const started = Date.now();
    const mission = this.requireMission(input, started, config, "resume");
    if (!mission) return this.lastFail!;
    if (mission.currentStatus !== "Paused") {
      return this.failReport(
        "resume",
        started,
        {
          ...this.validator.validateInput(input, started),
          decision: "fail",
          errors: [`Cannot resume from state ${mission.currentStatus}`],
        },
        config,
        mission,
      );
    }
    const t1 = this.applyMissionTransition(mission, "Paused", "Resumed", "Resume requested");
    const updated = this.store.getMission(mission.missionId)!;
    const t2 = this.applyMissionTransition(updated, "Resumed", "Running", "Resumed to running");
    return this.reportAction("resume", started, input, config, this.store.getMission(mission.missionId), [t1, t2]);
  }

  retry(input: MsrInput, config: MissionRuntimeConfiguration): MsrRunReport {
    const started = Date.now();
    const mission = this.requireMission(input, started, config, "retry");
    if (!mission) return this.lastFail!;
    if (mission.currentStatus !== "Failed") {
      return this.failReport(
        "retry",
        started,
        {
          ...this.validator.validateInput(input, started),
          decision: "fail",
          errors: [`Cannot retry from state ${mission.currentStatus}`],
        },
        config,
        mission,
      );
    }
    if (!this.retryManager.canRetry(mission, config)) {
      return this.failReport(
        "retry",
        started,
        {
          ...this.validator.validateInput(input, started),
          decision: "fail",
          errors: [`Max retries (${config.maxRetries}) exceeded`],
        },
        config,
        mission,
      );
    }
    const transitions: LifecycleTransition[] = [];
    let m = mission;
    const t1 = this.applyMissionTransition(m, "Failed", "Retrying", "Retry initiated");
    transitions.push(t1);
    m = this.store.getMission(m.missionId)!;
    m = this.updateMission(m, { retryCount: m.retryCount + 1 });
    this.retryManager.recordRetry(this.store, m, "Failed", "Retrying", "Retry initiated");
    const t2 = this.applyMissionTransition(m, "Retrying", "Running", "Retry running");
    transitions.push(t2);
    m = this.store.getMission(m.missionId)!;

    if (input.forceFail !== true && input.completeAfterRun !== false) {
      const t3 = this.applyMissionTransition(m, "Running", "Completed", "Retry succeeded");
      transitions.push(t3);
      m = this.store.getMission(m.missionId)!;
      m = this.updateMission(m, { progress: 100 });
    }

    return this.reportAction("retry", started, input, config, this.store.getMission(m.missionId), transitions);
  }

  cancel(input: MsrInput, config: MissionRuntimeConfiguration): MsrRunReport {
    const started = Date.now();
    const mission = this.requireMission(input, started, config, "cancel");
    if (!mission) return this.lastFail!;
    const cancellable: MissionInstance["currentStatus"][] = [
      "Running",
      "Waiting",
      "Paused",
      "Queued",
      "Ready",
      "Failed",
    ];
    if (!cancellable.includes(mission.currentStatus)) {
      return this.failReport(
        "cancel",
        started,
        {
          ...this.validator.validateInput(input, started),
          decision: "fail",
          errors: [`Cannot cancel from state ${mission.currentStatus}`],
        },
        config,
        mission,
      );
    }
    return this.transitionOp("cancel", input, config, mission.currentStatus, "Cancelled");
  }

  recover(input: MsrInput, config: MissionRuntimeConfiguration): MsrRunReport {
    const started = Date.now();
    const mission = this.requireMission(input, started, config, "recover");
    if (!mission) return this.lastFail!;
    if (!this.recoveryManager.canRecover(mission)) {
      return this.failReport(
        "recover",
        started,
        {
          ...this.validator.validateInput(input, started),
          decision: "fail",
          errors: [`Cannot recover from state ${mission.currentStatus}`],
        },
        config,
        mission,
      );
    }
    const { recovery } = this.recoveryManager.recover(
      this.store,
      this.checkpointManager,
      mission,
      "Recovery from interrupted mission",
    );
    const transitions: LifecycleTransition[] = [];
    const t1 = this.applyMissionTransition(mission, mission.currentStatus, "Recovered", recovery.reason);
    transitions.push(t1);
    let m = this.store.getMission(mission.missionId)!;
    const targetState: MissionInstance["currentStatus"] =
      mission.currentStatus === "Paused" ? "Paused" : "Running";
    const t2 = this.applyMissionTransition(m, "Recovered", targetState, "Restored after recovery");
    transitions.push(t2);
    m = this.updateMission(this.store.getMission(mission.missionId)!, {
      progress: this.metricsCollector.progressFor(this.store.getMission(mission.missionId)!),
    });
    return this.reportAction("recover", started, input, config, m, transitions);
  }

  archive(input: MsrInput, config: MissionRuntimeConfiguration): MsrRunReport {
    const started = Date.now();
    const mission = this.requireMission(input, started, config, "archive");
    if (!mission) return this.lastFail!;
    const archivable: MissionInstance["currentStatus"][] = ["Completed", "Cancelled", "Failed"];
    if (!archivable.includes(mission.currentStatus)) {
      return this.failReport(
        "archive",
        started,
        {
          ...this.validator.validateInput(input, started),
          decision: "fail",
          errors: [`Cannot archive from state ${mission.currentStatus}`],
        },
        config,
        mission,
      );
    }
    return this.transitionOp("archive", input, config, mission.currentStatus, "Archived");
  }

  monitor(input: MsrInput, config: MissionRuntimeConfiguration): MsrRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const mission = input.missionId ? this.store.getMission(input.missionId) : null;
    const metrics = this.metricsCollector.collect(this.store);
    appendMsrLog({
      event: "monitor",
      details: `missions=${metrics.totalMissions}`,
    });
    return this.reportAction("monitor", started, input, config, mission);
  }

  produceReport(input: MsrInput, config: MissionRuntimeConfiguration): MsrRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.validateInput(input, started);
    if (validation.decision === "fail") {
      return this.failReport("produce_report", started, validation, config);
    }
    const missionId = input.missionId;
    if (!missionId) {
      return this.failReport(
        "produce_report",
        started,
        { ...validation, decision: "fail", errors: ["missionId required"] },
        config,
      );
    }
    const handshakes = this.integrations.connect(config.integrationTargets);
    const report = this.reportBuilder.buildMissionRuntimeReport(
      this.store,
      this.dependencyResolver,
      config,
      missionId,
      {
        auditStatus: handshakes.every((h) => h.available) ? "passed" : "partial",
        outstandingIssues: [],
        confidenceScore: 85,
        supportingEvidence: ["mission-runtime structural evidence"],
      },
    );
    if (!report) {
      return this.failReport(
        "produce_report",
        started,
        { ...validation, decision: "fail", errors: [`Mission ${missionId} not found`] },
        config,
      );
    }
    this.store.saveReport(report);
    this.ensureRecord("active", config);
    const mission = this.store.getMission(missionId);
    return {
      action: "produce_report",
      runTimestamp: new Date().toISOString(),
      durationMs: Date.now() - started,
      decision: "pass",
      validation,
      mission,
      missionRuntimeReport: report,
      transitions: this.store.listTransitions(missionId),
      errors: [],
      warnings: [],
    };
  }

  submitReport(input: MsrInput, config: MissionRuntimeConfiguration): MsrRunReport {
    const started = Date.now();
    const produced = this.produceReport(input, config);
    if (produced.decision === "fail" || !produced.missionRuntimeReport) {
      return produced;
    }
    this.integrations.submitReport(produced.missionRuntimeReport);
    this.integrations.recordAudit({
      event: "mission_runtime_report_submitted",
      reportId: produced.missionRuntimeReport.reportId,
    });
    return { ...produced, action: "submit_report" };
  }

  list(_input: MsrInput, config: MissionRuntimeConfiguration): MsrRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    return this.reportAction("list", started, _input, config, null);
  }

  validate(input: MsrInput, config: MissionRuntimeConfiguration): MsrRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.validateInput(input, started);
    if (input.forceFail === true) {
      validation.decision = "fail";
      validation.errors.push("forceFail is not permitted");
    }
    return {
      action: "validate",
      runTimestamp: new Date().toISOString(),
      durationMs: Date.now() - started,
      decision: validation.decision === "pass" ? "pass" : "fail",
      validation,
      mission: null,
      missionRuntimeReport: null,
      transitions: [],
      errors: validation.errors,
      warnings: validation.warnings,
    };
  }

  diagnostics(_input: MsrInput, config: MissionRuntimeConfiguration): MsrRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const handshakes = this.integrations.connect(config.integrationTargets);
    this.reportBuilder.buildDiagnostics(this.store, handshakes);
    return this.reportAction("diagnostics", started, _input, config, null, [], handshakes);
  }

  private lastFail: MsrRunReport | null = null;

  private requireMission(
    input: MsrInput,
    started: number,
    config: MissionRuntimeConfiguration,
    action: string,
  ): MissionInstance | null {
    this.ensureSeeded(config);
    const validation = this.validator.validateInput(input, started);
    if (validation.decision === "fail") {
      this.lastFail = this.failReport(action, started, validation, config);
      return null;
    }
    if (!input.missionId) {
      this.lastFail = this.failReport(
        action,
        started,
        { ...validation, decision: "fail", errors: ["missionId required"] },
        config,
      );
      return null;
    }
    const mission = this.store.getMission(input.missionId);
    if (!mission) {
      this.lastFail = this.failReport(
        action,
        started,
        { ...validation, decision: "fail", errors: [`Mission ${input.missionId} not found`] },
        config,
      );
      return null;
    }
    return mission;
  }

  private transitionOp(
    action: string,
    input: MsrInput,
    config: MissionRuntimeConfiguration,
    expectedFrom: MissionInstance["currentStatus"],
    to: MissionInstance["currentStatus"],
  ): MsrRunReport {
    const started = Date.now();
    const mission = this.requireMission(input, started, config, action);
    if (!mission) return this.lastFail!;
    if (mission.currentStatus !== expectedFrom) {
      const check = validateTransition(mission.currentStatus, to);
      if (!check.valid) {
        return this.failReport(
          action,
          started,
          {
            ...this.validator.validateInput(input, started),
            decision: "fail",
            errors: [check.reason],
          },
          config,
          mission,
        );
      }
    }
    const t = this.applyMissionTransition(mission, mission.currentStatus, to, `${action} transition`);
    const updated = this.updateMission(this.store.getMission(mission.missionId)!, {
      progress: this.metricsCollector.progressFor({ ...mission, currentStatus: to }),
    });
    return this.reportAction(action, started, input, config, updated, [t]);
  }

  private applyMissionTransition(
    mission: MissionInstance,
    from: MissionInstance["currentStatus"],
    to: MissionInstance["currentStatus"],
    reason: string,
  ): LifecycleTransition {
    applyTransition(from, to);
    const transition: LifecycleTransition = {
      transitionId: nextMsrId("msr-trn"),
      missionId: mission.missionId,
      fromState: from,
      toState: to,
      timestamp: new Date().toISOString(),
      reason,
      fabricated: false,
      metadataVersion: MSR_METADATA_VERSION,
    };
    this.store.saveTransition(transition);
    this.store.saveMission({
      ...mission,
      currentStatus: to,
      updatedAt: transition.timestamp,
    });
    this.store.appendTimeline({
      entryId: transition.transitionId,
      timestamp: transition.timestamp,
      label: `${from}→${to}`,
      state: to,
      notes: [reason],
    });
    return transition;
  }

  private updateMission(mission: MissionInstance, patch: Partial<MissionInstance>): MissionInstance {
    const updated = {
      ...mission,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    this.store.saveMission(updated);
    return updated;
  }

  private ensureRecord(state: MsrEngineRecord["operationalState"], config: MissionRuntimeConfiguration) {
    const missions = this.store.listMissions();
    this.engineRecord = {
      engineId: MISSION_RUNTIME_ID,
      workerId: config.workerId,
      operationalState: state,
      healthStatus: state === "failed" ? "failed" : "healthy",
      totalMissions: missions.length,
      totalReports: this.store.listReports().length,
      lastReportId: this.store.listReports().at(-1)?.reportId ?? null,
      supportedCapabilities: [...MSR_CAPABILITIES],
      integrationTargets: [...config.integrationTargets] as MsrEngineRecord["integrationTargets"],
      metadataVersion: MSR_METADATA_VERSION,
    };
  }

  private reportAction(
    action: string,
    started: number,
    input: MsrInput,
    config: MissionRuntimeConfiguration,
    mission: MissionInstance | null,
    transitions: LifecycleTransition[] = [],
    handshakes: IntegrationHandshake[] = [],
  ): MsrRunReport {
    const validation = this.validator.validateInput(input, started);
    this.ensureRecord(validation.decision === "fail" ? "failed" : "active", config);
    return {
      action,
      runTimestamp: new Date().toISOString(),
      durationMs: Date.now() - started,
      decision: validation.decision === "fail" ? "fail" : "pass",
      validation,
      mission,
      missionRuntimeReport: null,
      transitions,
      errors: validation.errors,
      warnings: [...validation.warnings, ...handshakes.filter((h) => !h.available).map((h) => `${h.target} unavailable`)],
    };
  }

  private failReport(
    action: string,
    started: number,
    validation: MsrRunReport["validation"],
    config: MissionRuntimeConfiguration,
    mission: MissionInstance | null = null,
    transitions: LifecycleTransition[] = [],
  ): MsrRunReport {
    this.ensureRecord("failed", config);
    return {
      action,
      runTimestamp: new Date().toISOString(),
      durationMs: Date.now() - started,
      decision: "fail",
      validation,
      mission,
      missionRuntimeReport: null,
      transitions,
      errors: validation.errors,
      warnings: validation.warnings,
    };
  }
}

export { resetMsrSequenceForTesting };
