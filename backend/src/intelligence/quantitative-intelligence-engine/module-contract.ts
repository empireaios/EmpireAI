/**
 * G3-05 — Quantitative Intelligence Engine Brain module contract.
 * Mathematical reasoning only — no executive decisions.
 */

import { randomUUID } from "node:crypto";

import type { QuantitativeIntelligenceCapability } from "../../brain/contract/capabilities.js";
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
  buildQuantitativeIntelligenceEngineArchitecture,
  loadQuantitativeIntelligenceEngineView,
} from "./engine-architecture.js";

const G3_05_CAPABILITIES = [
  "quantitative-intelligence.architecture",
  "quantitative-intelligence.compute",
  "quantitative-intelligence.simulate",
  "quantitative-intelligence.analyse",
] as const;

type G305Capability = (typeof G3_05_CAPABILITIES)[number];

const REQUIRED_INPUTS: readonly ModuleInputSpec[] = [
  {
    name: "workspaceId",
    type: "string",
    required: true,
    description: "Workspace scope for quantitative model inputs",
  },
];

const PRODUCED_OUTPUTS: readonly ModuleOutputSpec[] = [
  {
    name: "architecture",
    type: "object",
    description: "G3-05 engine architecture — capabilities, integrations, decision policy",
  },
  {
    name: "modelResult",
    type: "object",
    description: "Five-field quantitative model result contract",
  },
  {
    name: "engineView",
    type: "object",
    description: "Full Quantitative Intelligence Engine view with all model results",
  },
];

export class QuantitativeIntelligenceEngineModule implements IntelligenceModuleContract {
  readonly moduleId = "quantitative-intelligence" as const;
  readonly moduleName = "Quantitative Intelligence Engine";
  readonly moduleVersion = "g3-05.1.0.0";
  readonly capabilities = G3_05_CAPABILITIES as unknown as readonly QuantitativeIntelligenceCapability[];
  readonly requiredInputs = REQUIRED_INPUTS;
  readonly producedOutputs = PRODUCED_OUTPUTS;

  validate(task: IntelligenceBrainTask): ModuleValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!task.workspaceId?.trim()) {
      errors.push("workspaceId is required");
    }

    const action = task.action as G305Capability;
    if (!G3_05_CAPABILITIES.includes(action)) {
      errors.push(`Unknown action: ${task.action}`);
    }

    if (action === "quantitative-intelligence.analyse" && task.input.modelKind) {
      warnings.push("modelKind filter not yet applied — returning all model results");
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
    const action = task.action as G305Capability;
    let output: Record<string, unknown> = {};
    let confidence = 80;

    try {
      switch (action) {
        case "quantitative-intelligence.architecture":
          output = { architecture: buildQuantitativeIntelligenceEngineArchitecture() };
          confidence = 95;
          break;
        case "quantitative-intelligence.compute":
        case "quantitative-intelligence.analyse": {
          const view = loadQuantitativeIntelligenceEngineView(workspaceId);
          output = { engineView: view, modelResults: view.modelResults };
          confidence = view.modelResults.length > 0 ? 88 : 40;
          break;
        }
        case "quantitative-intelligence.simulate": {
          const view = loadQuantitativeIntelligenceEngineView(workspaceId);
          const simulation = view.modelResults.find((r) => r.modelKind === "simulation");
          output = { modelResult: simulation ?? null, engineView: view };
          confidence = simulation?.confidence ?? 40;
          break;
        }
        default:
          output = { architecture: buildQuantitativeIntelligenceEngineArchitecture() };
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
            category: "quantitative_intelligence",
            summary: `G3-05 ${action} completed — mathematics only, no executive decisions`,
            signals: {
              action,
              modelCount: (output.engineView as { modelResults?: unknown[] })?.modelResults?.length,
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
      message: "G3-05 Quantitative Intelligence Engine — mathematical models active, no executive decisions",
      checkedAt: new Date().toISOString(),
    };
  }

  confidenceScore(_task: IntelligenceBrainTask, result?: BrainExecutionResult): number {
    return result?.confidence ?? 0;
  }
}

const quantitativeIntelligenceEngineModule = new QuantitativeIntelligenceEngineModule();
intelligenceModuleRegistry.register(quantitativeIntelligenceEngineModule);

export { quantitativeIntelligenceEngineModule };
