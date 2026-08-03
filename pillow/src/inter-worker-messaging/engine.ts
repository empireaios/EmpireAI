import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildInterWorkerMessagingConfiguration,
  type InterWorkerMessagingConfiguration,
} from "./configuration.js";
import { InterWorkerMessagingController } from "./inter-worker-messaging-controller.js";
import { InterWorkerMessagingCore } from "./inter-worker-messaging-core.js";
import { resetIwmLogsForTesting } from "./iwm-logging.js";
import { resetMessageSequenceForTesting } from "./message-store.js";
import { INTER_WORKER_MESSAGING_SYSTEM_PATH } from "./paths.js";
import type {
  InterWorkerMessagingCockpitSnapshot,
  InterWorkerMessagingInput,
  InterWorkerMessagingState,
} from "./types.js";

export interface InterWorkerMessagingOptions {
  configuration?: Partial<InterWorkerMessagingConfiguration>;
}

/** Authoritative Q0-24 Inter-Worker Messaging — transport only. */
export class InterWorkerMessaging {
  private initializedAt: string | null = null;
  private readonly controller: InterWorkerMessagingController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: InterWorkerMessagingOptions = {},
  ) {
    this.controller = new InterWorkerMessagingController(
      new InterWorkerMessagingCore(),
      buildInterWorkerMessagingConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      INTER_WORKER_MESSAGING_SYSTEM_PATH,
    );
    if (!doc?.includes("Inter-Worker Messaging")) {
      throw new Error(
        `${INTER_WORKER_MESSAGING_SYSTEM_PATH} missing — Q0-24 system doc required.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  getState(): InterWorkerMessagingState {
    if (!this.initializedAt) {
      throw new Error("Inter-Worker Messaging not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-IWM-001",
      missionId: "Q0-24",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration,
      latestReport,
      engineRecord,
      health: {
        status: engineRecord?.healthStatus ?? "standby",
        healthScore:
          engineRecord?.healthStatus === "healthy" ? 100 : engineRecord ? 70 : 50,
        engineEnabled: configuration.enabled,
        lastOperationAt: latestReport?.runTimestamp ?? null,
        lastValidationDecision: latestReport?.validation.decision ?? null,
        totalMessageRecords: this.getRecords().length,
        deliveredCount: engineRecord?.deliveredCount ?? 0,
        failedCount: engineRecord?.failedCount ?? 0,
        conversationCount: engineRecord?.conversationCount ?? 0,
        lastMessageType: engineRecord?.lastMessageType ?? null,
        notes: [
          "Transport only: does not execute worker logic, modify worker decisions, replace Workforce Orchestrator, override Pillow, or override Grand King.",
        ],
      },
    };
  }

  connectInterWorkerMessaging(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  sendMessage(input: InterWorkerMessagingInput = {}) {
    return this.controller.send(input);
  }

  receiveMessages(input: InterWorkerMessagingInput = {}) {
    return this.controller.receive(input);
  }

  routeMessage(input: InterWorkerMessagingInput = {}) {
    return this.controller.route(input);
  }

  replyMessage(input: InterWorkerMessagingInput = {}) {
    return this.controller.reply(input);
  }

  broadcastMessage(input: InterWorkerMessagingInput = {}) {
    return this.controller.broadcast(input);
  }

  trackDelivery(input: InterWorkerMessagingInput = {}) {
    return this.controller.trackDelivery(input);
  }

  searchHistory(input: InterWorkerMessagingInput = {}) {
    return this.controller.searchHistory(input);
  }

  listMessages() {
    return this.controller.list();
  }

  validateInterWorkerMessaging(input: InterWorkerMessagingInput = {}) {
    return this.controller.validate(input);
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
      health:
        score >= 75
          ? ("healthy" as const)
          : score >= 50
            ? ("degraded" as const)
            : ("blocked" as const),
      readinessScore: score,
      notes: [
        `Engine status: ${state.status}`,
        `Message records: ${state.health.totalMessageRecords}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): InterWorkerMessagingCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q0-24",
      status: state.status,
      healthStatus: state.health.status,
      totalMessageRecords: state.health.totalMessageRecords,
      latestMessageId: this.getLatestRecord()?.messageId ?? null,
      conversationCount: state.health.conversationCount,
      neverExecuteWorkerLogic: true,
      neverModifyWorkerDecisions: true,
      neverReplaceWorkforceOrchestrator: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    };
  }
}

export function createInterWorkerMessaging(
  bootstrap: EmpireBootstrapContext,
  options?: InterWorkerMessagingOptions,
) {
  return new InterWorkerMessaging(bootstrap, options);
}

export function resetInterWorkerMessagingForTesting() {
  resetIwmLogsForTesting();
  resetMessageSequenceForTesting();
}
