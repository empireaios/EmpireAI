/**
 * G3-08 — Risk Intelligence Engine Brain module contract.
 */

import { randomUUID } from "node:crypto";

import type { RiskIntelligenceCapability } from "../../brain/contract/capabilities.js";
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
  buildRiskIntelligenceEngineArchitecture,
  loadRiskIntelligenceEngineView,
} from "./engine-architecture.js";

const G3_08_CAPABILITIES = [
  "risk-intelligence.architecture",
  "risk-intelligence.analyse",
  "risk-intelligence.rank",
  "risk-intelligence.compare",
] as const;

type G308Capability = (typeof G3_08_CAPABILITIES)[number];

const REQUIRED_INPUTS: readonly ModuleInputSpec[] = [
  {
    name: "workspaceId",
    type: "string",
    required: true,
    description: "Workspace scope for risk intelligence assessment",
  },
];

const PRODUCED_OUTPUTS: readonly ModuleOutputSpec[] = [
  { name: "architecture", type: "object", description: "G3-08 engine architecture" },
  { name: "analysisContract", type: "object", description: "Risk analysis contract with score, severity, mitigation" },
  { name: "engineView", type: "object", description: "Full Risk Intelligence Engine view" },
];

export class RiskIntelligenceEngineModule implements IntelligenceModuleContract {
  readonly moduleId = "risk-intelligence" as const;
  readonly moduleName = "Risk Intelligence Engine";
  readonly moduleVersion = "g3-08.1.0.0";
  readonly capabilities = G3_08_CAPABILITIES as unknown as readonly RiskIntelligenceCapability[];
  readonly requiredInputs = REQUIRED_INPUTS;
  readonly producedOutputs = PRODUCED_OUTPUTS;

  validate(task: IntelligenceBrainTask): ModuleValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!task.workspaceId?.trim()) errors.push("workspaceId is required");

    const action = task.action as G308Capability;
    if (!G3_08_CAPABILITIES.includes(action)) errors.push(`Unknown action: ${task.action}`);

    if (action === "risk-intelligence.rank" && !task.input.riskId) {
      warnings.push("riskId omitted — returning full ranked risk catalog");
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
    const action = task.action as G308Capability;
    let output: Record<string, unknown> = {};
    let confidence = 80;

    try {
      switch (action) {
        case "risk-intelligence.architecture":
          output = { architecture: buildRiskIntelligenceEngineArchitecture() };
          confidence = 95;
          break;
        case "risk-intelligence.analyse":
        case "risk-intelligence.rank": {
          const view = loadRiskIntelligenceEngineView(workspaceId);
          if (task.input.riskId) {
            const match = view.assessedRisks.find((r) => r.riskId === task.input.riskId);
            output = { analysisContract: match ?? null, engineView: view };
          } else {
            output = { engineView: view, topRisks: view.topRisks };
          }
          confidence = view.assessedRisks.length > 0 ? 85 : 40;
          break;
        }
        case "risk-intelligence.compare": {
          const view = loadRiskIntelligenceEngineView(workspaceId);
          output = { riskComparison: view.riskComparison, engineView: view };
          confidence = view.riskComparison.length > 0 ? 88 : 40;
          break;
        }
        default:
          output = { architecture: buildRiskIntelligenceEngineArchitecture() };
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
            category: "risk_intelligence",
            summary: `G3-08 ${action} completed`,
            signals: {
              action,
              riskCount: (output.engineView as { assessedRisks?: unknown[] })?.assessedRisks?.length,
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
      message: "G3-08 Risk Intelligence Engine — registry discovery wired",
      checkedAt: new Date().toISOString(),
    };
  }

  confidenceScore(_task: IntelligenceBrainTask, result?: BrainExecutionResult): number {
    return result?.confidence ?? 0;
  }
}

const riskIntelligenceEngineModule = new RiskIntelligenceEngineModule();
intelligenceModuleRegistry.register(riskIntelligenceEngineModule);

export { riskIntelligenceEngineModule };
