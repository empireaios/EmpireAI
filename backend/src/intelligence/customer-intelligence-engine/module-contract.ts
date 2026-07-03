/**
 * G3-07 — Customer Intelligence Engine Brain module contract.
 */

import { randomUUID } from "node:crypto";

import type { CustomerIntelligenceCapability } from "../../brain/contract/capabilities.js";
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
  buildCustomerIntelligenceEngineArchitecture,
  loadCustomerIntelligenceEngineView,
} from "./engine-architecture.js";

const G3_07_CAPABILITIES = [
  "customer-intelligence.architecture",
  "customer-intelligence.analyse",
  "customer-intelligence.rank",
  "customer-intelligence.compare",
] as const;

type G307Capability = (typeof G3_07_CAPABILITIES)[number];

const REQUIRED_INPUTS: readonly ModuleInputSpec[] = [
  {
    name: "workspaceId",
    type: "string",
    required: true,
    description: "Workspace scope for customer intelligence analysis",
  },
];

const PRODUCED_OUTPUTS: readonly ModuleOutputSpec[] = [
  { name: "architecture", type: "object", description: "G3-07 engine architecture" },
  { name: "analysisContract", type: "object", description: "Customer analysis contract with LTV, churn, retention" },
  { name: "engineView", type: "object", description: "Full Customer Intelligence Engine view" },
];

export class CustomerIntelligenceEngineModule implements IntelligenceModuleContract {
  readonly moduleId = "customer-intelligence" as const;
  readonly moduleName = "Customer Intelligence Engine";
  readonly moduleVersion = "g3-07.1.0.0";
  readonly capabilities = G3_07_CAPABILITIES as unknown as readonly CustomerIntelligenceCapability[];
  readonly requiredInputs = REQUIRED_INPUTS;
  readonly producedOutputs = PRODUCED_OUTPUTS;

  validate(task: IntelligenceBrainTask): ModuleValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!task.workspaceId?.trim()) errors.push("workspaceId is required");

    const action = task.action as G307Capability;
    if (!G3_07_CAPABILITIES.includes(action)) errors.push(`Unknown action: ${task.action}`);

    if (action === "customer-intelligence.rank" && !task.input.customerId) {
      warnings.push("customerId omitted — returning full ranked customer catalog");
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
    const action = task.action as G307Capability;
    let output: Record<string, unknown> = {};
    let confidence = 80;

    try {
      switch (action) {
        case "customer-intelligence.architecture":
          output = { architecture: buildCustomerIntelligenceEngineArchitecture() };
          confidence = 95;
          break;
        case "customer-intelligence.analyse":
        case "customer-intelligence.rank": {
          const view = loadCustomerIntelligenceEngineView(workspaceId);
          if (task.input.customerId) {
            const match = view.analysedCustomers.find((c) => c.customerId === task.input.customerId);
            output = { analysisContract: match ?? null, engineView: view };
          } else {
            output = { engineView: view, topSegments: view.topSegments };
          }
          confidence = view.analysedCustomers.length > 0 ? 85 : 40;
          break;
        }
        case "customer-intelligence.compare": {
          const view = loadCustomerIntelligenceEngineView(workspaceId);
          output = { customerComparison: view.customerComparison, engineView: view };
          confidence = view.customerComparison.length > 0 ? 88 : 40;
          break;
        }
        default:
          output = { architecture: buildCustomerIntelligenceEngineArchitecture() };
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
            category: "customer_intelligence",
            summary: `G3-07 ${action} completed`,
            signals: {
              action,
              customerCount: (output.engineView as { analysedCustomers?: unknown[] })?.analysedCustomers?.length,
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
      message: "G3-07 Customer Intelligence Engine — registry discovery wired",
      checkedAt: new Date().toISOString(),
    };
  }

  confidenceScore(_task: IntelligenceBrainTask, result?: BrainExecutionResult): number {
    return result?.confidence ?? 0;
  }
}

const customerIntelligenceEngineModule = new CustomerIntelligenceEngineModule();
intelligenceModuleRegistry.register(customerIntelligenceEngineModule);

export { customerIntelligenceEngineModule };
