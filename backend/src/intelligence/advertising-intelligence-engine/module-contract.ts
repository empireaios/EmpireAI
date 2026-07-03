/**
 * G3-06 — Advertising Intelligence Engine Brain module contract.
 */

import { randomUUID } from "node:crypto";

import type { AdvertisingIntelligenceCapability } from "../../brain/contract/capabilities.js";
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
  buildAdvertisingIntelligenceEngineArchitecture,
  loadAdvertisingIntelligenceEngineView,
} from "./engine-architecture.js";

const G3_06_CAPABILITIES = [
  "advertising-intelligence.architecture",
  "advertising-intelligence.analyse",
  "advertising-intelligence.rank",
  "advertising-intelligence.compare",
] as const;

type G306Capability = (typeof G3_06_CAPABILITIES)[number];

const REQUIRED_INPUTS: readonly ModuleInputSpec[] = [
  {
    name: "workspaceId",
    type: "string",
    required: true,
    description: "Workspace scope for advertising intelligence analysis",
  },
];

const PRODUCED_OUTPUTS: readonly ModuleOutputSpec[] = [
  { name: "architecture", type: "object", description: "G3-06 engine architecture" },
  { name: "analysisContract", type: "object", description: "Campaign analysis contract with ROAS, CAC, scaling" },
  { name: "engineView", type: "object", description: "Full Advertising Intelligence Engine view" },
];

export class AdvertisingIntelligenceEngineModule implements IntelligenceModuleContract {
  readonly moduleId = "advertising-intelligence" as const;
  readonly moduleName = "Advertising Intelligence Engine";
  readonly moduleVersion = "g3-06.1.0.0";
  readonly capabilities = G3_06_CAPABILITIES as unknown as readonly AdvertisingIntelligenceCapability[];
  readonly requiredInputs = REQUIRED_INPUTS;
  readonly producedOutputs = PRODUCED_OUTPUTS;

  validate(task: IntelligenceBrainTask): ModuleValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!task.workspaceId?.trim()) errors.push("workspaceId is required");

    const action = task.action as G306Capability;
    if (!G3_06_CAPABILITIES.includes(action)) errors.push(`Unknown action: ${task.action}`);

    if (action === "advertising-intelligence.rank" && !task.input.campaignId) {
      warnings.push("campaignId omitted — returning full ranked campaign catalog");
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
    const action = task.action as G306Capability;
    let output: Record<string, unknown> = {};
    let confidence = 80;

    try {
      switch (action) {
        case "advertising-intelligence.architecture":
          output = { architecture: buildAdvertisingIntelligenceEngineArchitecture() };
          confidence = 95;
          break;
        case "advertising-intelligence.analyse":
        case "advertising-intelligence.rank": {
          const view = loadAdvertisingIntelligenceEngineView(workspaceId);
          if (task.input.campaignId) {
            const match = view.analysedCampaigns.find((c) => c.campaignId === task.input.campaignId);
            output = { analysisContract: match ?? null, engineView: view };
          } else {
            output = { engineView: view, topPerformers: view.topPerformers };
          }
          confidence = view.analysedCampaigns.length > 0 ? 85 : 40;
          break;
        }
        case "advertising-intelligence.compare": {
          const view = loadAdvertisingIntelligenceEngineView(workspaceId);
          output = { campaignComparison: view.campaignComparison, engineView: view };
          confidence = view.campaignComparison.length > 0 ? 88 : 40;
          break;
        }
        default:
          output = { architecture: buildAdvertisingIntelligenceEngineArchitecture() };
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
            category: "advertising_intelligence",
            summary: `G3-06 ${action} completed`,
            signals: {
              action,
              campaignCount: (output.engineView as { analysedCampaigns?: unknown[] })?.analysedCampaigns?.length,
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
      message: "G3-06 Advertising Intelligence Engine — registry discovery wired",
      checkedAt: new Date().toISOString(),
    };
  }

  confidenceScore(_task: IntelligenceBrainTask, result?: BrainExecutionResult): number {
    return result?.confidence ?? 0;
  }
}

const advertisingIntelligenceEngineModule = new AdvertisingIntelligenceEngineModule();
intelligenceModuleRegistry.register(advertisingIntelligenceEngineModule);

export { advertisingIntelligenceEngineModule };
