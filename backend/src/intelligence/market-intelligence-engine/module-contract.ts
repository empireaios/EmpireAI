/**
 * G3-02 — Market Intelligence Engine Brain module contract.
 * Architecture wiring — delegates analysis to registry-backed market scoring.
 * No live API connections in G3-02.
 */

import { randomUUID } from "node:crypto";

import type { MarketIntelligenceCapability } from "../../brain/contract/capabilities.js";
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
  buildMarketIntelligenceEngineArchitecture,
  loadMarketIntelligenceEngineView,
} from "./engine-architecture.js";

const G3_02_CAPABILITIES = [
  "market-intelligence.architecture",
  "market-intelligence.analyse",
  "market-intelligence.rank",
  "market-intelligence.compare",
] as const;

type G302Capability = (typeof G3_02_CAPABILITIES)[number];

const REQUIRED_INPUTS: readonly ModuleInputSpec[] = [
  {
    name: "workspaceId",
    type: "string",
    required: true,
    description: "Workspace scope for market intelligence cross-signals",
  },
];

const PRODUCED_OUTPUTS: readonly ModuleOutputSpec[] = [
  {
    name: "architecture",
    type: "object",
    description: "G3-02 engine architecture — capabilities, integrations, discovery",
  },
  {
    name: "analysisContract",
    type: "object",
    description: "Eight-field market analysis contract",
  },
  {
    name: "engineView",
    type: "object",
    description: "Full Market Intelligence Engine view with ranked markets",
  },
];

export class MarketIntelligenceEngineModule implements IntelligenceModuleContract {
  readonly moduleId = "market-intelligence" as const;
  readonly moduleName = "Market Intelligence Engine";
  readonly moduleVersion = "g3-02.1.0.0";
  readonly capabilities = G3_02_CAPABILITIES as unknown as readonly MarketIntelligenceCapability[];
  readonly requiredInputs = REQUIRED_INPUTS;
  readonly producedOutputs = PRODUCED_OUTPUTS;

  validate(task: IntelligenceBrainTask): ModuleValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!task.workspaceId?.trim()) {
      errors.push("workspaceId is required");
    }

    const action = task.action as G302Capability;
    if (!G3_02_CAPABILITIES.includes(action)) {
      errors.push(`Unknown action: ${task.action}`);
    }

    if (action === "market-intelligence.rank" && !task.input.marketId) {
      warnings.push("marketId omitted — returning full ranked market catalog");
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

    const action = task.action as G302Capability;
    let output: Record<string, unknown> = {};
    let confidence = 80;

    try {
      switch (action) {
        case "market-intelligence.architecture":
          output = { architecture: buildMarketIntelligenceEngineArchitecture() };
          confidence = 95;
          break;
        case "market-intelligence.analyse":
        case "market-intelligence.rank": {
          const view = loadMarketIntelligenceEngineView();
          if (task.input.marketId) {
            const match = view.analysedMarkets.find((m) => m.marketId === task.input.marketId);
            output = {
              analysisContract: match ?? null,
              engineView: view,
            };
          } else {
            output = { engineView: view, topOpportunities: view.topOpportunities };
          }
          confidence = view.analysedMarkets.length > 0 ? 85 : 40;
          break;
        }
        case "market-intelligence.compare": {
          const view = loadMarketIntelligenceEngineView();
          output = {
            marketplaceComparison: view.marketplaceComparison,
            engineView: view,
          };
          confidence = view.marketplaceComparison.length > 0 ? 88 : 40;
          break;
        }
        default:
          output = { architecture: buildMarketIntelligenceEngineArchitecture() };
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
            category: "market_intelligence",
            summary: `G3-02 ${action} completed`,
            signals: {
              action,
              marketCount: (output.engineView as { analysedMarkets?: unknown[] })?.analysedMarkets?.length,
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
      message: "G3-02 Market Intelligence Engine — registry discovery wired, architecture active",
      checkedAt: new Date().toISOString(),
    };
  }

  confidenceScore(_task: IntelligenceBrainTask, result?: BrainExecutionResult): number {
    return result?.confidence ?? 0;
  }
}

const marketIntelligenceEngineModule = new MarketIntelligenceEngineModule();
intelligenceModuleRegistry.register(marketIntelligenceEngineModule);

export { marketIntelligenceEngineModule };
