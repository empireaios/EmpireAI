/**
 * G3-04 — Financial Intelligence Engine Brain module contract.
 * Architecture wiring — delegates modelling to registry-backed financial scoring.
 * No live accounting integrations in G3-04.
 */

import { randomUUID } from "node:crypto";

import type { FinancialIntelligenceCapability } from "../../brain/contract/capabilities.js";
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
  buildFinancialIntelligenceEngineArchitecture,
  loadFinancialIntelligenceEngineView,
} from "./engine-architecture.js";

const G3_04_CAPABILITIES = [
  "financial-intelligence.architecture",
  "financial-intelligence.analyse",
  "financial-intelligence.rank",
  "financial-intelligence.forecast",
] as const;

type G304Capability = (typeof G3_04_CAPABILITIES)[number];

const REQUIRED_INPUTS: readonly ModuleInputSpec[] = [
  {
    name: "workspaceId",
    type: "string",
    required: true,
    description: "Workspace scope for financial intelligence modelling",
  },
];

const PRODUCED_OUTPUTS: readonly ModuleOutputSpec[] = [
  {
    name: "architecture",
    type: "object",
    description: "G3-04 engine architecture — capabilities, integrations, discovery",
  },
  {
    name: "analysisContract",
    type: "object",
    description: "Seven-field financial analysis contract",
  },
  {
    name: "engineView",
    type: "object",
    description: "Full Financial Intelligence Engine view with ranked scenarios",
  },
];

export class FinancialIntelligenceEngineModule implements IntelligenceModuleContract {
  readonly moduleId = "financial-intelligence" as const;
  readonly moduleName = "Financial Intelligence Engine";
  readonly moduleVersion = "g3-04.1.0.0";
  readonly capabilities = G3_04_CAPABILITIES as unknown as readonly FinancialIntelligenceCapability[];
  readonly requiredInputs = REQUIRED_INPUTS;
  readonly producedOutputs = PRODUCED_OUTPUTS;

  validate(task: IntelligenceBrainTask): ModuleValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!task.workspaceId?.trim()) {
      errors.push("workspaceId is required");
    }

    const action = task.action as G304Capability;
    if (!G3_04_CAPABILITIES.includes(action)) {
      errors.push(`Unknown action: ${task.action}`);
    }

    if (action === "financial-intelligence.rank" && !task.input.scenarioId) {
      warnings.push("scenarioId omitted — returning full ranked scenario catalog");
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
    const action = task.action as G304Capability;
    let output: Record<string, unknown> = {};
    let confidence = 80;

    try {
      switch (action) {
        case "financial-intelligence.architecture":
          output = { architecture: buildFinancialIntelligenceEngineArchitecture() };
          confidence = 95;
          break;
        case "financial-intelligence.analyse":
        case "financial-intelligence.rank":
        case "financial-intelligence.forecast": {
          const view = loadFinancialIntelligenceEngineView(workspaceId);
          if (task.input.scenarioId) {
            const match = view.analysedScenarios.find((s) => s.scenarioId === task.input.scenarioId);
            output = {
              analysisContract: match ?? null,
              engineView: view,
            };
          } else {
            output = { engineView: view, topOpportunities: view.topOpportunities };
          }
          confidence = view.analysedScenarios.length > 0 ? 85 : 40;
          break;
        }
        default:
          output = { architecture: buildFinancialIntelligenceEngineArchitecture() };
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
            category: "financial_intelligence",
            summary: `G3-04 ${action} completed`,
            signals: {
              action,
              scenarioCount: (output.engineView as { analysedScenarios?: unknown[] })?.analysedScenarios?.length,
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
      message: "G3-04 Financial Intelligence Engine — registry discovery wired, architecture active",
      checkedAt: new Date().toISOString(),
    };
  }

  confidenceScore(_task: IntelligenceBrainTask, result?: BrainExecutionResult): number {
    return result?.confidence ?? 0;
  }
}

const financialIntelligenceEngineModule = new FinancialIntelligenceEngineModule();
intelligenceModuleRegistry.register(financialIntelligenceEngineModule);

export { financialIntelligenceEngineModule };
