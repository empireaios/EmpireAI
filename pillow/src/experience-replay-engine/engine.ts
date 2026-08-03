import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildExperienceReplayEngineConfiguration,
  type ExperienceReplayEngineConfiguration,
} from "./configuration.js";
import { ExperienceReplayEngineController } from "./experience-replay-engine-controller.js";
import { ExperienceReplayEngineCore } from "./experience-replay-engine-core.js";
import { resetXplLogsForTesting } from "./xpl-logging.js";
import { resetExperienceSequenceForTesting } from "./lesson-extractor.js";
import { EXPERIENCE_REPLAY_ENGINE_SYSTEM_PATH } from "./paths.js";
import type {
  ExperienceReplayEngineCockpitSnapshot,
  ExperienceReplayEngineInput,
  ExperienceReplayEngineState,
} from "./types.js";

export interface ExperienceReplayEngineOptions {
  configuration?: Partial<ExperienceReplayEngineConfiguration>;
}

/** Authoritative Q0-14 Experience Replay Engine — historical learning only. */
export class ExperienceReplayEngine {
  private initializedAt: string | null = null;
  private readonly controller: ExperienceReplayEngineController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: ExperienceReplayEngineOptions = {},
  ) {
    this.controller = new ExperienceReplayEngineController(
      new ExperienceReplayEngineCore(),
      buildExperienceReplayEngineConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      EXPERIENCE_REPLAY_ENGINE_SYSTEM_PATH,
    );
    if (!doc?.includes("Experience Replay Engine")) {
      throw new Error(`${EXPERIENCE_REPLAY_ENGINE_SYSTEM_PATH} missing — Q0-14 system doc required.`);
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  getState(): ExperienceReplayEngineState {
    if (!this.initializedAt) {
      throw new Error("Experience Replay Engine not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-XPL-001",
      missionId: "Q0-14",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration,
      latestReport,
      engineRecord,
      health: {
        status: engineRecord?.healthStatus ?? "standby",
        healthScore: engineRecord?.healthStatus === "healthy" ? 100 : engineRecord ? 70 : 50,
        engineEnabled: configuration.enabled,
        lastOperationAt: latestReport?.runTimestamp ?? null,
        lastValidationDecision: latestReport?.validation.decision ?? null,
        totalExperienceRecords: this.getRecords().length,
        lastConfidenceScore: engineRecord?.lastConfidenceScore ?? null,
        notes: [
          "Learning only: does not execute work, replace Execution Memory, replace Decision Engine, override Pillow, or override Grand King.",
        ],
      },
    };
  }

  connectExperienceReplayEngine(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  replayExperience(input: ExperienceReplayEngineInput = {}) {
    return this.controller.replay(input);
  }

  analyseSuccess(input: ExperienceReplayEngineInput = {}) {
    return this.controller.analyseSuccess(input);
  }

  analyseFailure(input: ExperienceReplayEngineInput = {}) {
    return this.controller.analyseFailure(input);
  }

  analyseRejection(input: ExperienceReplayEngineInput = {}) {
    return this.controller.analyseRejection(input);
  }

  analyseGrandKingFeedback(input: ExperienceReplayEngineInput = {}) {
    return this.controller.analyseGrandKing(input);
  }

  detectPatterns(input: ExperienceReplayEngineInput = {}) {
    return this.controller.detectPatterns(input);
  }

  extractLessons(input: ExperienceReplayEngineInput = {}) {
    return this.controller.extractLessons(input);
  }

  recommendFutureBehaviour(input: ExperienceReplayEngineInput = {}) {
    return this.controller.recommend(input);
  }

  listRecords() {
    return this.controller.listRecords();
  }

  validateExperience(input: ExperienceReplayEngineInput = {}) {
    return this.controller.validateExperience(input);
  }

  runDiagnostics() {
    return this.controller.diagnostics();
  }

  getRecords() {
    return this.controller.getManager().getRecords();
  }

  getLatestRecord() {
    return this.controller.getManager().getLatestRecord();
  }

  getLessons() {
    return this.controller.getManager().getLessons();
  }

  getRepeatedMistakes() {
    return this.controller.getManager().getRepeatedMistakes();
  }

  getHistory() {
    return this.controller.getManager().getHistory();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  validateForSupervisorSync() {
    const state = this.getState();
    const score =
      state.latestReport?.validation.decision === "fail"
        ? 40
        : state.latestReport?.validation.decision === "partial"
          ? 70
          : 100;
    return {
      valid: state.health.status !== "failed",
      health: score >= 75 ? ("healthy" as const) : score >= 50 ? ("degraded" as const) : ("blocked" as const),
      readinessScore: score,
      notes: [
        `Engine status: ${state.status}`,
        `Experience records: ${state.health.totalExperienceRecords}`,
        `Last confidence: ${state.health.lastConfidenceScore ?? "n/a"}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): ExperienceReplayEngineCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q0-14",
      status: state.status,
      healthStatus: state.health.status,
      totalExperienceRecords: state.health.totalExperienceRecords,
      latestExperienceId: this.getLatestRecord()?.experienceId ?? null,
      lastConfidenceScore: state.health.lastConfidenceScore,
      neverExecuteWork: true,
      neverReplaceExecutionMemory: true,
      neverReplaceDecisionEngine: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    };
  }
}

export function createExperienceReplayEngine(
  bootstrap: EmpireBootstrapContext,
  options?: ExperienceReplayEngineOptions,
) {
  return new ExperienceReplayEngine(bootstrap, options);
}

export function resetExperienceReplayEngineForTesting() {
  resetXplLogsForTesting();
  resetExperienceSequenceForTesting();
}
