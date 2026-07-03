/**
 * G3-10 — Executive Intelligence Orchestrator Brain module contract.
 */

import { randomUUID } from "node:crypto";

import type { ExecutiveIntelligenceOrchestratorCapability } from "../../brain/contract/capabilities.js";
import type { IntelligenceModuleContract } from "../../brain/contract/intelligence-module.js";
import { intelligenceModuleRegistry } from "../../brain/contract/registry.js";
import type {
  BrainExecutionResult,
  IntelligenceBrainTask,
  ModuleHealthReport,
  ModuleInputSpec,
  ModuleOutputSpec,
  ModuleValidationResult,
} from "../../brain/contract/types.js";
import {
  buildExecutiveIntelligenceOrchestratorArchitecture,
  buildExecutiveIntelligenceUnifiedService,
  coordinateExecutiveEngines,
  loadExecutiveIntelligenceOrchestratorView,
} from "./engine-architecture.js";

const G3_10_CAPABILITIES = [
  "executive-intelligence-orchestrator.architecture",
  "executive-intelligence-orchestrator.coordinate",
  "executive-intelligence-orchestrator.aggregate",
  "executive-intelligence-orchestrator.deliver",
] as const;

type G310Capability = (typeof G3_10_CAPABILITIES)[number];

const REQUIRED_INPUTS: readonly ModuleInputSpec[] = [
  {
    name: "workspaceId",
    type: "string",
    required: true,
    description: "Workspace scope for executive intelligence orchestration",
  },
];

const PRODUCED_OUTPUTS: readonly ModuleOutputSpec[] = [
  { name: "architecture", type: "object", description: "G3-10 orchestrator architecture" },
  { name: "unifiedService", type: "object", description: "Unified Executive Intelligence service payload" },
  { name: "orchestratorView", type: "object", description: "Full Executive Intelligence Orchestrator view" },
];

export class ExecutiveIntelligenceOrchestratorModule implements IntelligenceModuleContract {
  readonly moduleId = "executive-intelligence-orchestrator" as const;
  readonly moduleName = "Executive Intelligence Orchestrator";
  readonly moduleVersion = "g3-10.1.0.0";
  readonly capabilities = G3_10_CAPABILITIES as unknown as readonly ExecutiveIntelligenceOrchestratorCapability[];
  readonly requiredInputs = REQUIRED_INPUTS;
  readonly producedOutputs = PRODUCED_OUTPUTS;

  validate(task: IntelligenceBrainTask): ModuleValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!task.workspaceId?.trim()) errors.push("workspaceId is required");

    const action = task.action as G310Capability;
    if (!G3_10_CAPABILITIES.includes(action)) errors.push(`Unknown action: ${task.action}`);

    if (task.input.consumerId) {
      warnings.push("consumerId accepted — delivery channel filtered in deliver action");
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  async execute(task: IntelligenceBrainTask): Promise<BrainExecutionResult> {
    const started = Date.now();
    const validation = this.validate(task);

    if (!validation.valid) {
      return {
        taskId: task.id,
        moduleId: this.moduleId,
        status: "failed",
        decisions: [],
        observations: [],
        recommendations: [],
        error: validation.errors.join("; "),
        confidence: 0,
        executedAt: new Date().toISOString(),
        durationMs: Date.now() - started,
      };
    }

    const workspaceId = task.workspaceId;
    const action = task.action as G310Capability;
    let output: Record<string, unknown> = {};
    let confidence = 80;

    try {
      switch (action) {
        case "executive-intelligence-orchestrator.architecture":
          output = { architecture: buildExecutiveIntelligenceOrchestratorArchitecture() };
          confidence = 95;
          break;
        case "executive-intelligence-orchestrator.coordinate":
          output = { coordinatedEngines: coordinateExecutiveEngines(workspaceId) };
          confidence = 85;
          break;
        case "executive-intelligence-orchestrator.aggregate":
          output = { unifiedService: buildExecutiveIntelligenceUnifiedService(workspaceId) };
          confidence = 88;
          break;
        case "executive-intelligence-orchestrator.deliver": {
          const view = loadExecutiveIntelligenceOrchestratorView(workspaceId);
          const consumerId = task.input.consumerId ? String(task.input.consumerId) : null;
          if (consumerId) {
            const delivery = view.unifiedService.consumerDeliveries.find((d) => d.consumerId === consumerId);
            output = { consumerDelivery: delivery ?? null, orchestratorView: view };
          } else {
            output = { unifiedService: view.unifiedService, orchestratorView: view };
          }
          confidence = view.unifiedService.decisionSnapshot.decisionConfidence;
          break;
        }
        default:
          output = { architecture: buildExecutiveIntelligenceOrchestratorArchitecture() };
      }

      return {
        taskId: task.id,
        moduleId: this.moduleId,
        status: "completed",
        decisions: [],
        observations: [
          {
            id: randomUUID(),
            taskId: task.id,
            moduleId: this.moduleId,
            category: "executive_intelligence_orchestrator",
            summary: `G3-10 ${action} completed`,
            signals: {
              action,
              enginesAvailable: (output.orchestratorView as { unifiedService?: { enginesAvailable?: number } })
                ?.unifiedService?.enginesAvailable,
            },
            observedAt: new Date().toISOString(),
          },
        ],
        recommendations: [],
        output,
        confidence,
        executedAt: new Date().toISOString(),
        durationMs: Date.now() - started,
      };
    } catch (err) {
      return {
        taskId: task.id,
        moduleId: this.moduleId,
        status: "failed",
        decisions: [],
        observations: [],
        recommendations: [],
        error: err instanceof Error ? err.message : String(err),
        confidence: 0,
        executedAt: new Date().toISOString(),
        durationMs: Date.now() - started,
      };
    }
  }

  health(): ModuleHealthReport {
    return {
      moduleId: this.moduleId,
      status: "healthy",
      message: "G3-10 Executive Intelligence Orchestrator — G3 suite coordination wired",
      checkedAt: new Date().toISOString(),
    };
  }

  confidenceScore(_task: IntelligenceBrainTask, result?: BrainExecutionResult): number {
    return result?.confidence ?? 0;
  }
}

const executiveIntelligenceOrchestratorModule = new ExecutiveIntelligenceOrchestratorModule();
intelligenceModuleRegistry.register(executiveIntelligenceOrchestratorModule);

export { executiveIntelligenceOrchestratorModule };
