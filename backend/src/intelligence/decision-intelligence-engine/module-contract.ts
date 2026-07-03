/**
 * G3-09 — Decision Intelligence Engine Brain module contract.
 */

import { randomUUID } from "node:crypto";

import type { DecisionIntelligenceCapability } from "../../brain/contract/capabilities.js";
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
  buildDecisionIntelligenceEngineArchitecture,
  collectExecutiveEngineFeeds,
  loadDecisionIntelligenceEngineView,
  synthesizeDecisionContract,
} from "./engine-architecture.js";

const G3_09_CAPABILITIES = [
  "decision-intelligence.architecture",
  "decision-intelligence.orchestrate",
  "decision-intelligence.synthesize",
  "decision-intelligence.feeds",
] as const;

type G309Capability = (typeof G3_09_CAPABILITIES)[number];

const REQUIRED_INPUTS: readonly ModuleInputSpec[] = [
  {
    name: "workspaceId",
    type: "string",
    required: true,
    description: "Workspace scope for decision orchestration",
  },
];

const PRODUCED_OUTPUTS: readonly ModuleOutputSpec[] = [
  { name: "architecture", type: "object", description: "G3-09 engine architecture" },
  { name: "decisionContract", type: "object", description: "Orchestrated decision with final recommendation" },
  { name: "engineView", type: "object", description: "Full Decision Intelligence Engine view" },
];

export class DecisionIntelligenceEngineModule implements IntelligenceModuleContract {
  readonly moduleId = "decision-intelligence" as const;
  readonly moduleName = "Decision Intelligence Engine";
  readonly moduleVersion = "g3-09.1.0.0";
  readonly capabilities = G3_09_CAPABILITIES as unknown as readonly DecisionIntelligenceCapability[];
  readonly requiredInputs = REQUIRED_INPUTS;
  readonly producedOutputs = PRODUCED_OUTPUTS;

  validate(task: IntelligenceBrainTask): ModuleValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!task.workspaceId?.trim()) errors.push("workspaceId is required");

    const action = task.action as G309Capability;
    if (!G3_09_CAPABILITIES.includes(action)) errors.push(`Unknown action: ${task.action}`);

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
    const action = task.action as G309Capability;
    let output: Record<string, unknown> = {};
    let confidence = 80;

    try {
      switch (action) {
        case "decision-intelligence.architecture":
          output = { architecture: buildDecisionIntelligenceEngineArchitecture() };
          confidence = 95;
          break;
        case "decision-intelligence.feeds":
          output = { engineFeeds: collectExecutiveEngineFeeds(workspaceId) };
          confidence = 85;
          break;
        case "decision-intelligence.synthesize":
        case "decision-intelligence.orchestrate": {
          const view = loadDecisionIntelligenceEngineView(workspaceId);
          output = { decisionContract: view.decision, engineView: view };
          confidence = view.decision.decisionConfidence;
          break;
        }
        default:
          output = { architecture: buildDecisionIntelligenceEngineArchitecture() };
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
            category: "decision_intelligence",
            summary: `G3-09 ${action} completed`,
            signals: {
              action,
              finalRecommendation: (output.decisionContract as { finalRecommendation?: string })?.finalRecommendation,
              feedsAvailable: (output.engineView as { feedsAvailable?: number })?.feedsAvailable,
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
      message: "G3-09 Decision Intelligence Engine — G3-01–G3-08 orchestration wired",
      checkedAt: new Date().toISOString(),
    };
  }

  confidenceScore(_task: IntelligenceBrainTask, result?: BrainExecutionResult): number {
    return result?.confidence ?? 0;
  }
}

const decisionIntelligenceEngineModule = new DecisionIntelligenceEngineModule();
intelligenceModuleRegistry.register(decisionIntelligenceEngineModule);

export { decisionIntelligenceEngineModule };
