import type { MissionCoordinationEngineConfiguration } from "./configuration.js";
import { appendMceLog } from "./mce-logging.js";
import { MissionCoordinator } from "./mission-coordinator.js";
import { MissionStore } from "./mission-store.js";
import {
  HealthMonitor,
  MissionCoordinationEngineMetadataGenerator,
  MissionValidator,
  RecoveryManager,
} from "./mission-validator.js";
import {
  MCE_CAPABILITIES,
  MCE_METADATA_VERSION,
  MISSION_COORDINATION_ENGINE_ID,
} from "./paths.js";
import type {
  CompletionStatus,
  MissionCoordinationEngineEngineRecord,
  MissionCoordinationEngineInput,
  MissionCoordinationEngineRunReport,
  MissionPhase,
  MissionRecord,
  MissionStatus,
  OperationalState,
} from "./types.js";

export class MissionCoordinationEngineCore {
  private engineRecord: MissionCoordinationEngineEngineRecord | null = null;
  private seeded = false;
  private readonly store = new MissionStore();
  private readonly coordinator = new MissionCoordinator();
  private readonly validator = new MissionValidator();
  private readonly metadata = new MissionCoordinationEngineMetadataGenerator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();

  ensureSeeded(config: MissionCoordinationEngineConfiguration) {
    if (this.seeded) return;
    this.store.seed(config.seedMissions);
    this.seeded = true;
    this.ensureRecord("connected", config);
  }

  getEngineRecord() {
    return this.engineRecord
      ? {
          ...this.engineRecord,
          supportedCapabilities: [...this.engineRecord.supportedCapabilities],
        }
      : null;
  }

  getRecords() {
    return this.store.list();
  }

  getLatestRecord() {
    const records = this.getRecords();
    return records[records.length - 1] ?? null;
  }

  connect(
    _input: Record<string, unknown>,
    config: MissionCoordinationEngineConfiguration,
  ): MissionCoordinationEngineRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.ensureRecord("connected", config);
    appendMceLog({
      event: "connect",
      details: "Mission Coordination Engine connected; coordinate-only mode",
    });
    return this.report(
      "connect",
      [],
      null,
      null,
      null,
      {
        validationReportId: `mce-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: config.enabled ? "pass" : "fail",
        errors: config.enabled ? [] : ["Mission Coordination Engine is disabled"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: MCE_METADATA_VERSION,
      },
      started,
    );
  }

  receivePlan(input: MissionCoordinationEngineInput, config: MissionCoordinationEngineConfiguration) {
    return this.createMission("receive_plan", input, config);
  }

  create(input: MissionCoordinationEngineInput, config: MissionCoordinationEngineConfiguration) {
    return this.createMission("create", input, config);
  }

  advancePhase(input: MissionCoordinationEngineInput, config: MissionCoordinationEngineConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.phaseRulesEnabled) {
      return this.disabledReport(
        "advance_phase",
        config,
        started,
        !config.enabled
          ? "Mission Coordination Engine is disabled"
          : "Phase rules are disabled",
      );
    }
    if (this.hasBoundary(input)) {
      return this.boundaryFail("advance_phase", input, config, started);
    }

    const existing = this.resolveMission(input);
    if (!existing) {
      const created = this.createMission("create", input, config);
      if (created.validation.decision === "fail") return created;
    }
    const target = this.resolveMission(input) ?? this.getLatestRecord();
    if (!target) {
      return this.fail("advance_phase", "No mission available to advance", started);
    }

    const nextPhase = this.coordinator.nextPhase(
      target.currentPhase.toString(),
      config.missionPhases,
    );
    const dependencies = this.coordinator.refreshDependencies(target);
    const blockers = [...target.blockers];
    if (dependencies.some((d) => !d.satisfied)) {
      blockers.push("unsatisfied_worker_dependencies");
    }
    const pendingApprovals =
      nextPhase === "approval" || nextPhase === "completion" || nextPhase === "closure"
        ? target.approvalCheckpoints.filter((c) => c.required && !c.approved)
        : [];
    if (pendingApprovals.length && (nextPhase === "completion" || nextPhase === "closure")) {
      blockers.push("pending_approval_checkpoints");
    }

    let missionStatus = this.coordinator.statusForPhase(nextPhase.toString(), {
      ...target,
      dependencies,
      blockers,
    });
    if (pendingApprovals.length && nextPhase === "approval") {
      missionStatus = "waiting_approval";
    }
    if (blockers.includes("unsatisfied_worker_dependencies") && nextPhase === "preparation") {
      missionStatus = "waiting";
    }

    const record = this.store.buildRecord({
      input: { ...input, missionId: target.missionId },
      missionName: target.missionName,
      missionOwner: target.missionOwner,
      businessId: target.businessId,
      missionStatus,
      currentPhase: nextPhase,
      assignedWorkers: target.assignedWorkers,
      dependencies,
      approvalCheckpoints: target.approvalCheckpoints,
      progress: this.coordinator.progressForPhase(nextPhase.toString()),
      blockers: unique(blockers),
      completionStatus: this.coordinator.completionForPhase(nextPhase.toString()),
      validationStatus: "passed",
      stalled: false,
      phaseHistory: [...target.phaseHistory, nextPhase.toString()],
      missionId: target.missionId,
      timestamp: target.timestamp,
    });

    return this.finish("advance_phase", input, config, started, record);
  }

  trackDependencies(
    input: MissionCoordinationEngineInput,
    config: MissionCoordinationEngineConfiguration,
  ) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.dependencyRulesEnabled) {
      return this.disabledReport(
        "track_dependencies",
        config,
        started,
        !config.enabled
          ? "Mission Coordination Engine is disabled"
          : "Dependency rules are disabled",
      );
    }
    if (this.hasBoundary(input)) {
      return this.boundaryFail("track_dependencies", input, config, started);
    }

    const target = this.resolveOrCreate(input, config);
    if ("validation" in target) return target;
    const assignedWorkers = unique([
      ...target.assignedWorkers,
      ...(input.assignedWorkers ?? []),
    ]);
    const dependencies = this.coordinator.buildDependencies(
      {
        ...input,
        dependencies: input.dependencies ?? target.dependencies,
        assignedWorkers,
      },
      assignedWorkers,
    );
    const blockers = dependencies.some((d) => !d.satisfied)
      ? unique([...target.blockers, "unsatisfied_worker_dependencies"])
      : target.blockers.filter((b) => b !== "unsatisfied_worker_dependencies");
    const missionStatus = blockers.includes("unsatisfied_worker_dependencies")
      ? "waiting"
      : target.missionStatus === "waiting"
        ? "ready"
        : target.missionStatus;

    const record = this.store.buildRecord({
      input: { ...input, missionId: target.missionId },
      missionName: target.missionName,
      missionOwner: target.missionOwner,
      businessId: target.businessId,
      missionStatus,
      currentPhase: target.currentPhase,
      assignedWorkers,
      dependencies,
      approvalCheckpoints: target.approvalCheckpoints,
      progress: target.progress,
      blockers,
      completionStatus: target.completionStatus,
      validationStatus: "passed",
      stalled: target.stalled,
      phaseHistory: target.phaseHistory,
      missionId: target.missionId,
      timestamp: target.timestamp,
    });
    return this.finish("track_dependencies", input, config, started, record);
  }

  handleApproval(
    input: MissionCoordinationEngineInput,
    config: MissionCoordinationEngineConfiguration,
  ) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.approvalRulesEnabled) {
      return this.disabledReport(
        "handle_approval",
        config,
        started,
        !config.enabled
          ? "Mission Coordination Engine is disabled"
          : "Approval rules are disabled",
      );
    }
    if (this.hasBoundary(input)) {
      return this.boundaryFail("handle_approval", input, config, started);
    }

    const target = this.resolveOrCreate(input, config);
    if ("validation" in target) return target;

    const checkpointId =
      input.checkpointId?.trim() ||
      target.approvalCheckpoints.find((c) => c.required && !c.approved)?.checkpointId ||
      target.approvalCheckpoints[0]?.checkpointId;
    if (!checkpointId) {
      return this.fail("handle_approval", "No approval checkpoint available", started);
    }

    const approvalCheckpoints = target.approvalCheckpoints.map((c) =>
      c.checkpointId === checkpointId
        ? {
            ...c,
            approved: true,
            approvedBy: input.approvedBy?.trim() || input.missionOwner?.trim() || "pillow",
            approvedAt: new Date().toISOString(),
          }
        : { ...c },
    );
    const pending = approvalCheckpoints.filter((c) => c.required && !c.approved);
    const blockers = target.blockers.filter((b) => b !== "pending_approval_checkpoints");
    const missionStatus = pending.length ? "waiting_approval" : "running";
    const currentPhase =
      target.currentPhase === "approval" && !pending.length
        ? target.currentPhase
        : pending.length
          ? "approval"
          : target.currentPhase;

    const record = this.store.buildRecord({
      input: { ...input, missionId: target.missionId },
      missionName: target.missionName,
      missionOwner: target.missionOwner,
      businessId: target.businessId,
      missionStatus,
      currentPhase,
      assignedWorkers: target.assignedWorkers,
      dependencies: target.dependencies,
      approvalCheckpoints,
      progress: Math.max(target.progress, 85),
      blockers,
      completionStatus: target.completionStatus,
      validationStatus: "passed",
      stalled: false,
      phaseHistory: target.phaseHistory,
      missionId: target.missionId,
      timestamp: target.timestamp,
    });
    return this.finish("handle_approval", input, config, started, record);
  }

  detectBlocked(
    input: MissionCoordinationEngineInput,
    config: MissionCoordinationEngineConfiguration,
  ) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.blockageDetectionEnabled) {
      return this.disabledReport(
        "detect_blocked",
        config,
        started,
        !config.enabled
          ? "Mission Coordination Engine is disabled"
          : "Blockage detection is disabled",
      );
    }
    if (this.hasBoundary(input)) {
      return this.boundaryFail("detect_blocked", input, config, started);
    }

    const target = this.resolveOrCreate(input, config);
    if ("validation" in target) return target;

    const dependencies = this.coordinator.refreshDependencies(target);
    const blockers = unique([
      ...target.blockers,
      ...(input.blockers ?? []),
      ...(input.forceBlocked ? ["forced_block"] : []),
      ...(dependencies.some((d) => !d.satisfied) ? ["unsatisfied_worker_dependencies"] : []),
      ...(target.approvalCheckpoints.some((c) => c.required && !c.approved) &&
      target.currentPhase === "approval"
        ? ["pending_approval_checkpoints"]
        : []),
    ]);
    const blocked = blockers.length > 0;
    const record = this.store.buildRecord({
      input: { ...input, missionId: target.missionId },
      missionName: target.missionName,
      missionOwner: target.missionOwner,
      businessId: target.businessId,
      missionStatus: blocked ? "blocked" : target.missionStatus,
      currentPhase: target.currentPhase,
      assignedWorkers: target.assignedWorkers,
      dependencies,
      approvalCheckpoints: target.approvalCheckpoints,
      progress: target.progress,
      blockers,
      completionStatus: target.completionStatus,
      validationStatus: "passed",
      stalled: target.stalled,
      phaseHistory: target.phaseHistory,
      missionId: target.missionId,
      timestamp: target.timestamp,
    });
    return this.finish("detect_blocked", input, config, started, record);
  }

  detectStalled(
    input: MissionCoordinationEngineInput,
    config: MissionCoordinationEngineConfiguration,
  ) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.stallDetectionEnabled) {
      return this.disabledReport(
        "detect_stalled",
        config,
        started,
        !config.enabled
          ? "Mission Coordination Engine is disabled"
          : "Stall detection is disabled",
      );
    }
    if (this.hasBoundary(input)) {
      return this.boundaryFail("detect_stalled", input, config, started);
    }

    const target = this.resolveOrCreate(input, config);
    if ("validation" in target) return target;
    const stalled =
      input.forceStalled === true ||
      this.coordinator.isStalled(target, config, input.stallIdleMs);
    const record = this.store.buildRecord({
      input: { ...input, missionId: target.missionId },
      missionName: target.missionName,
      missionOwner: target.missionOwner,
      businessId: target.businessId,
      missionStatus: stalled && target.missionStatus !== "blocked" ? "paused" : target.missionStatus,
      currentPhase: target.currentPhase,
      assignedWorkers: target.assignedWorkers,
      dependencies: target.dependencies,
      approvalCheckpoints: target.approvalCheckpoints,
      progress: target.progress,
      blockers: stalled
        ? unique([...target.blockers, "stalled_mission"])
        : target.blockers.filter((b) => b !== "stalled_mission"),
      completionStatus: target.completionStatus,
      validationStatus: "passed",
      stalled,
      phaseHistory: target.phaseHistory,
      missionId: target.missionId,
      timestamp: target.timestamp,
    });
    return this.finish("detect_stalled", input, config, started, record);
  }

  complete(input: MissionCoordinationEngineInput, config: MissionCoordinationEngineConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled) {
      return this.disabledReport(
        "complete",
        config,
        started,
        "Mission Coordination Engine is disabled",
      );
    }
    if (this.hasBoundary(input)) {
      return this.boundaryFail("complete", input, config, started);
    }

    const target = this.resolveOrCreate(input, config);
    if ("validation" in target) return target;

    const pending = target.approvalCheckpoints.filter((c) => c.required && !c.approved);
    if (pending.length) {
      const record = this.store.buildRecord({
        input: { ...input, missionId: target.missionId },
        missionName: target.missionName,
        missionOwner: target.missionOwner,
        businessId: target.businessId,
        missionStatus: "waiting_approval",
        currentPhase: "approval",
        assignedWorkers: target.assignedWorkers,
        dependencies: target.dependencies,
        approvalCheckpoints: target.approvalCheckpoints,
        progress: target.progress,
        blockers: unique([...target.blockers, "pending_approval_checkpoints"]),
        completionStatus: "in_progress",
        validationStatus: "partial",
        stalled: false,
        phaseHistory: [...target.phaseHistory, "approval"],
        missionId: target.missionId,
        timestamp: target.timestamp,
      });
      return this.finish("complete", input, config, started, record, true);
    }

    const record = this.store.buildRecord({
      input: { ...input, missionId: target.missionId },
      missionName: target.missionName,
      missionOwner: target.missionOwner,
      businessId: target.businessId,
      missionStatus: "completed",
      currentPhase: "completion",
      assignedWorkers: target.assignedWorkers,
      dependencies: target.dependencies,
      approvalCheckpoints: target.approvalCheckpoints,
      progress: 95,
      blockers: [],
      completionStatus: "completed",
      validationStatus: "passed",
      stalled: false,
      phaseHistory: [...target.phaseHistory, "completion"],
      missionId: target.missionId,
      timestamp: target.timestamp,
    });
    return this.finish("complete", input, config, started, record);
  }

  close(input: MissionCoordinationEngineInput, config: MissionCoordinationEngineConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.closureRulesEnabled) {
      return this.disabledReport(
        "close",
        config,
        started,
        !config.enabled
          ? "Mission Coordination Engine is disabled"
          : "Closure rules are disabled",
      );
    }
    if (this.hasBoundary(input)) {
      return this.boundaryFail("close", input, config, started);
    }

    const target = this.resolveOrCreate(input, config);
    if ("validation" in target) return target;

    if (
      target.completionStatus !== "completed" &&
      target.missionStatus !== "completed" &&
      target.currentPhase !== "completion"
    ) {
      const completed = this.complete(input, config);
      if (
        completed.records[0]?.completionStatus !== "completed" &&
        completed.records[0]?.missionStatus !== "completed"
      ) {
        return completed;
      }
    }

    const latest = this.resolveMission(input) ?? this.getLatestRecord()!;
    const record = this.store.buildRecord({
      input: { ...input, missionId: latest.missionId },
      missionName: latest.missionName,
      missionOwner: latest.missionOwner,
      businessId: latest.businessId,
      missionStatus: "completed",
      currentPhase: "closure",
      assignedWorkers: latest.assignedWorkers,
      dependencies: latest.dependencies,
      approvalCheckpoints: latest.approvalCheckpoints,
      progress: 100,
      blockers: [],
      completionStatus: "closed",
      validationStatus: "passed",
      stalled: false,
      phaseHistory: [...latest.phaseHistory, "closure"],
      missionId: latest.missionId,
      timestamp: latest.timestamp,
    });
    return this.finish("close", input, config, started, record);
  }

  list(config: MissionCoordinationEngineConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    const records = this.store.list();
    const latest = records[records.length - 1] ?? null;
    const validation =
      records.length === 0
        ? this.validator.finalize("pass", [], ["Mission catalog is empty"], started)
        : this.validator.validateRecords(records, { validated: true }, started);
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    return this.report(
      "list",
      records,
      latest?.currentPhase ?? null,
      latest?.missionStatus ?? null,
      latest?.completionStatus ?? null,
      validation,
      started,
    );
  }

  validate(input: MissionCoordinationEngineInput, config: MissionCoordinationEngineConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    const records = this.store.list();
    const latest = records[records.length - 1] ?? null;
    const validation =
      records.length === 0 && !this.hasBoundary(input) && input.validated !== false
        ? this.validator.finalize("pass", [], ["No mission records yet"], started)
        : this.validator.validateRecords(
            records.length ? records : null,
            { ...input, validated: input.validated ?? true },
            started,
          );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    return this.report(
      "validate",
      records,
      latest?.currentPhase ?? null,
      latest?.missionStatus ?? null,
      latest?.completionStatus ?? null,
      validation,
      started,
    );
  }

  diagnostics(config: MissionCoordinationEngineConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.finalize(
      config.enabled ? "pass" : "fail",
      config.enabled ? [] : ["Mission Coordination Engine is disabled"],
      [],
      started,
    );
    this.ensureRecord("active", config);
    appendMceLog({
      event: "diagnostics",
      details: `records=${this.store.count()} active=${this.store.activeCount()} blocked=${this.store.blockedCount()}`,
    });
    const latest = this.getLatestRecord();
    return this.report(
      "diagnostics",
      this.store.list(),
      latest?.currentPhase ?? null,
      latest?.missionStatus ?? null,
      latest?.completionStatus ?? null,
      validation,
      started,
    );
  }

  private createMission(
    action: "receive_plan" | "create",
    input: MissionCoordinationEngineInput,
    config: MissionCoordinationEngineConfiguration,
  ): MissionCoordinationEngineRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.planningRulesEnabled) {
      return this.disabledReport(
        action,
        config,
        started,
        !config.enabled
          ? "Mission Coordination Engine is disabled"
          : "Planning rules are disabled",
      );
    }
    if (this.hasBoundary(input)) {
      return this.boundaryFail(action, input, config, started, true);
    }

    const bundle = this.coordinator.plan(input, config);
    const record = this.store.buildRecord({
      input,
      missionName: bundle.missionName,
      missionOwner: bundle.missionOwner,
      businessId: bundle.businessId,
      missionStatus: bundle.missionStatus,
      currentPhase: bundle.currentPhase,
      assignedWorkers: bundle.assignedWorkers,
      dependencies: bundle.dependencies,
      approvalCheckpoints: bundle.approvalCheckpoints,
      progress: bundle.progress,
      blockers: bundle.blockers,
      completionStatus: bundle.completionStatus,
      validationStatus: "passed",
      stalled: bundle.stalled,
      phaseHistory: [bundle.currentPhase.toString()],
    });
    return this.finish(action, input, config, started, record, false, true);
  }

  private resolveMission(input: MissionCoordinationEngineInput) {
    if (input.missionId?.trim()) return this.store.get(input.missionId.trim());
    return this.getLatestRecord();
  }

  private resolveOrCreate(
    input: MissionCoordinationEngineInput,
    config: MissionCoordinationEngineConfiguration,
  ): MissionRecord | MissionCoordinationEngineRunReport {
    const existing = this.resolveMission(input);
    if (existing) return existing;
    const created = this.createMission("create", input, config);
    if (created.validation.decision === "fail") return created;
    return created.records[0]!;
  }

  private finish(
    action: MissionCoordinationEngineRunReport["action"],
    input: MissionCoordinationEngineInput,
    config: MissionCoordinationEngineConfiguration,
    started: number,
    record: MissionRecord,
    requireName = false,
    requireNameStrict = false,
  ): MissionCoordinationEngineRunReport {
    const validation = this.validator.validateRecords(
      [record],
      { ...input, validated: input.validated ?? true },
      started,
      requireName || requireNameStrict,
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      record.currentPhase,
    );
    appendMceLog({
      event: action,
      details: `id=${record.missionId} phase=${record.currentPhase} status=${record.missionStatus} completion=${record.completionStatus}`,
    });
    this.metadata.generate(this.store.count(), this.store.activeCount());
    return this.report(
      action,
      [record],
      record.currentPhase,
      record.missionStatus,
      record.completionStatus,
      validation,
      started,
    );
  }

  private boundaryFail(
    action: MissionCoordinationEngineRunReport["action"],
    input: MissionCoordinationEngineInput,
    config: MissionCoordinationEngineConfiguration,
    started: number,
    requireName = false,
  ) {
    const validation = this.validator.validateRecords(null, input, started, requireName);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, [], null, null, null, validation, started);
  }

  private disabledReport(
    action: MissionCoordinationEngineRunReport["action"],
    config: MissionCoordinationEngineConfiguration,
    started: number,
    message: string,
  ) {
    const validation = this.validator.finalize("fail", [message], [], started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, [], null, null, null, validation, started);
  }

  private fail(
    action: MissionCoordinationEngineRunReport["action"],
    message: string,
    started: number,
  ) {
    const validation = this.validator.finalize("fail", [message], [], started);
    this.recovery.recordFailure();
    return this.report(action, [], null, null, null, validation, started);
  }

  private hasBoundary(input: MissionCoordinationEngineInput) {
    return (
      input.executeWorkerLogic === true ||
      input.replaceWorkforceOrchestrator === true ||
      input.replaceExecutivePlanner === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true
    );
  }

  private ensureRecord(
    state: OperationalState,
    config: MissionCoordinationEngineConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "passed",
    lastPhase: string | null = null,
  ) {
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `mce-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: MISSION_COORDINATION_ENGINE_ID,
      engineVersion: "PILLOW-MCE-001",
      currentOperationalState: state,
      healthStatus: this.healthMonitor.status(
        validationStatus === "failed" ? "fail" : "pass",
        config.enabled,
      ),
      validationStatus,
      supportedCapabilities: [...MCE_CAPABILITIES],
      totalMissionRecords: this.store.count(),
      activeMissions: this.store.activeCount(),
      blockedMissions: this.store.blockedCount(),
      completedMissions: this.store.completedCount(),
      lastPhase: lastPhase ?? this.getLatestRecord()?.currentPhase ?? null,
      metadataVersion: MCE_METADATA_VERSION,
    };
  }

  private report(
    action: MissionCoordinationEngineRunReport["action"],
    records: MissionRecord[],
    currentPhase: MissionPhase | string | null,
    missionStatus: MissionStatus | string | null,
    completionStatus: CompletionStatus | null,
    validation: MissionCoordinationEngineRunReport["validation"],
    started: number,
  ): MissionCoordinationEngineRunReport {
    const engineRecord = this.getEngineRecord()!;
    return {
      missionRunReportId: `mce-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord,
      records,
      currentPhase,
      missionStatus,
      completionStatus,
      validation,
      durationMs: Date.now() - started,
      metadataVersion: MCE_METADATA_VERSION,
    };
  }
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((v) => v.trim()).filter(Boolean)));
}
