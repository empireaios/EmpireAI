/**
 * G3-01 — Product Intelligence Engine Brain module contract.
 * Architecture wiring — delegates scoring to existing PIE evaluateProduct().
 * No live API connections in G3-01.
 */

import { randomUUID } from "node:crypto";

import type { ProductIntelligenceCapability } from "../../brain/contract/capabilities.js";
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
  buildProductIntelligenceEngineArchitecture,
  loadProductIntelligenceEngineView,
} from "./engine-architecture.js";
import { productIntelligenceService } from "./service.js";

const G3_01_CAPABILITIES = [
  "product-intelligence.evaluate",
  "product-intelligence.persist",
  "product-intelligence.architecture",
  "product-intelligence.rank",
] as const;

type G301Capability = (typeof G3_01_CAPABILITIES)[number];

const REQUIRED_INPUTS: readonly ModuleInputSpec[] = [
  {
    name: "workspaceId",
    type: "string",
    required: true,
    description: "Workspace scope for product intelligence",
  },
];

const PRODUCED_OUTPUTS: readonly ModuleOutputSpec[] = [
  {
    name: "architecture",
    type: "object",
    description: "G3-01 engine architecture — sources, capabilities, integrations",
  },
  {
    name: "analysisContract",
    type: "object",
    description: "Seven-field product analysis contract",
  },
  {
    name: "engineView",
    type: "object",
    description: "Full Product Intelligence Engine view with ranked products",
  },
];

export class ProductIntelligenceEngineModule implements IntelligenceModuleContract {
  readonly moduleId = "product-intelligence" as const;
  readonly moduleName = "Product Intelligence Engine";
  readonly moduleVersion = "g3-01.1.0.0";
  readonly capabilities = G3_01_CAPABILITIES as unknown as readonly ProductIntelligenceCapability[];
  readonly requiredInputs = REQUIRED_INPUTS;
  readonly producedOutputs = PRODUCED_OUTPUTS;

  validate(task: IntelligenceBrainTask): ModuleValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!task.workspaceId?.trim()) {
      errors.push("workspaceId is required");
    }

    const action = task.action as G301Capability;
    if (!G3_01_CAPABILITIES.includes(action)) {
      errors.push(`Unknown action: ${task.action}`);
    }

    if (action === "product-intelligence.rank" && !task.input.productId) {
      warnings.push("productId omitted — returning full ranked catalog");
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
    const action = task.action as G301Capability;
    let output: Record<string, unknown> = {};
    let confidence = 80;

    try {
      switch (action) {
        case "product-intelligence.architecture":
          output = { architecture: buildProductIntelligenceEngineArchitecture() };
          confidence = 95;
          break;
        case "product-intelligence.rank": {
          productIntelligenceService.seedCatalog(workspaceId);
          const products = productIntelligenceService.listProducts(workspaceId);
          const view = loadProductIntelligenceEngineView(products);
          if (task.input.productId) {
            const match = view.analysedProducts.find((p) => p.productId === task.input.productId);
            output = {
              analysisContract: match ?? null,
              engineView: view,
            };
          } else {
            output = { engineView: view, topRanked: view.topRanked };
          }
          confidence = products.length > 0 ? 85 : 40;
          break;
        }
        case "product-intelligence.evaluate":
        case "product-intelligence.persist":
          productIntelligenceService.seedCatalog(workspaceId);
          output = {
            engineView: loadProductIntelligenceEngineView(
              productIntelligenceService.listProducts(workspaceId),
            ),
            note: "G3-01 delegates evaluate/persist to existing PIE service — no live APIs",
          };
          confidence = 85;
          break;
        default:
          output = { architecture: buildProductIntelligenceEngineArchitecture() };
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
            category: "product_intelligence",
            summary: `G3-01 ${action} completed`,
            signals: { action, catalogSize: (output.engineView as { catalogSize?: number })?.catalogSize },
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
      message: "G3-01 Product Intelligence Engine — architecture wired, PIE domain store active",
      checkedAt: new Date().toISOString(),
    };
  }

  confidenceScore(_task: IntelligenceBrainTask, result?: BrainExecutionResult): number {
    return result?.confidence ?? 0;
  }
}

const productIntelligenceEngineModule = new ProductIntelligenceEngineModule();
intelligenceModuleRegistry.register(productIntelligenceEngineModule);

export { productIntelligenceEngineModule };
