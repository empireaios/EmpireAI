import { randomUUID } from "node:crypto";
import type { TaskPriority } from "../../brain/types.js";
import type { SupplierIntelligenceCapability } from "../../brain/contract/capabilities.js";
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
  compareSuppliers,
  discoverSuppliers,
  evaluateSupplier,
  supplierIntelligenceEvaluationEngine,
} from "./supplier-intelligence-engine.js";
import { listMockCatalog } from "./mock-catalog.js";

const CAPABILITIES: readonly SupplierIntelligenceCapability[] = [
  "supplier-intelligence.list",
  "supplier-intelligence.discover",
  "supplier-intelligence.evaluate",
  "supplier-intelligence.compare",
  "supplier-intelligence.score",
] as const;

const REQUIRED_INPUTS: readonly ModuleInputSpec[] = [
  {
    name: "workspaceId",
    type: "string",
    required: true,
    description: "Workspace scope for supplier evaluation",
  },
];

const PRODUCED_OUTPUTS: readonly ModuleOutputSpec[] = [
  { name: "evaluation", type: "object", description: "Supplier evaluation with trust and Guardian verdict" },
  { name: "comparison", type: "object", description: "Ranked supplier comparison result" },
  { name: "discovery", type: "object", description: "Filtered supplier discovery result" },
];

export class SupplierIntelligenceModule implements IntelligenceModuleContract {
  readonly moduleId = "supplier-intelligence" as const;
  readonly moduleName = "AI Supplier Intelligence";
  readonly moduleVersion = "1.0.0";
  readonly capabilities = CAPABILITIES;
  readonly requiredInputs = REQUIRED_INPUTS;
  readonly producedOutputs = PRODUCED_OUTPUTS;

  validate(task: IntelligenceBrainTask): ModuleValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!task.workspaceId?.trim()) {
      errors.push("workspaceId is required");
    }

    const action = task.action as SupplierIntelligenceCapability;
    if (!CAPABILITIES.includes(action)) {
      errors.push(`Unknown action: ${task.action}`);
    }

    if (action === "supplier-intelligence.evaluate" || action === "supplier-intelligence.score") {
      if (!task.input.supplierId) {
        errors.push("supplierId is required for evaluate/score");
      }
    }

    if (action === "supplier-intelligence.compare") {
      const ids = task.input.supplierIds;
      if (!Array.isArray(ids) || ids.length < 2) {
        errors.push("supplierIds array with at least 2 entries is required for compare");
      }
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

    const action = task.action as SupplierIntelligenceCapability;
    const workspaceId = task.workspaceId;
    let output: Record<string, unknown> = {};
    let confidence = 0;

    try {
      switch (action) {
        case "supplier-intelligence.list":
          output = { suppliers: listMockCatalog() };
          confidence = 90;
          break;
        case "supplier-intelligence.discover":
          output = {
            discovery: discoverSuppliers(workspaceId, task.input.filters as Parameters<typeof discoverSuppliers>[1]),
          };
          confidence = 85;
          break;
        case "supplier-intelligence.evaluate":
        case "supplier-intelligence.score": {
          const evaluation = evaluateSupplier({
            supplierId: String(task.input.supplierId),
            workspaceId,
            sellingPriceCents: task.input.sellingPriceCents as number | undefined,
            productCategory: task.input.productCategory as string | undefined,
          });
          if (task.input.persist === true) {
            supplierIntelligenceEvaluationEngine.persist(evaluation, workspaceId);
          }
          output = { evaluation };
          confidence = evaluation.confidence;
          break;
        }
        case "supplier-intelligence.compare":
          output = {
            comparison: compareSuppliers(
              workspaceId,
              task.input.supplierIds as string[],
              {
                sellingPriceCents: task.input.sellingPriceCents as number | undefined,
                productCategory: task.input.productCategory as string | undefined,
              },
            ),
          };
          confidence = 80;
          break;
        default:
          throw new Error(`Unhandled action: ${action}`);
      }
    } catch (error) {
      return {
        taskId: task.id,
        moduleId: this.moduleId,
        status: "failed",
        decisions: [],
        observations: [],
        recommendations: [],
        error: error instanceof Error ? error.message : "Execution failed",
        confidence: 0,
        executedAt: new Date().toISOString(),
        durationMs: Date.now() - started,
      };
    }

    const evaluation = output.evaluation as ReturnType<typeof evaluateSupplier> | undefined;
    const comparison = output.comparison as ReturnType<typeof compareSuppliers> | undefined;
    const recommendationPriority: TaskPriority =
      evaluation?.overallRecommendation === "SELL" ? "normal" : "high";

    return {
      taskId: task.id,
      moduleId: this.moduleId,
      status: "completed",
      decisions: [
        {
          id: randomUUID(),
          taskId: task.id,
          moduleId: this.moduleId,
          action: task.action,
          outcome: evaluation?.overallRecommendation === "REJECT" ? "rejected" : "approved",
          rationale: evaluation?.explanation ?? comparison?.explanation ?? "Supplier intelligence task completed",
          confidence,
          decidedAt: new Date().toISOString(),
        },
      ],
      observations: evaluation
        ? [
            {
              id: randomUUID(),
              taskId: task.id,
              moduleId: this.moduleId,
              category: "supplier_risk",
              summary: `Fake risk ${evaluation.fakeSupplierRisk}/100; trust ${evaluation.trustScore}/100`,
              signals: {
                fakeSupplierRisk: evaluation.fakeSupplierRisk,
                trustScore: evaluation.trustScore,
                guardianFlags: evaluation.guardianVerdict.flags,
              },
              observedAt: new Date().toISOString(),
            },
          ]
        : [],
      recommendations: evaluation
        ? [
            {
              id: randomUUID(),
              taskId: task.id,
              moduleId: this.moduleId,
              title: `${evaluation.supplierName} sourcing recommendation`,
              recommendation: evaluation.overallRecommendation,
              priority: recommendationPriority,
              confidence: evaluation.confidence,
              rationale: [evaluation.explanation],
              recommendedAt: new Date().toISOString(),
            },
          ]
        : [],
      output,
      confidence,
      executedAt: new Date().toISOString(),
      durationMs: Date.now() - started,
    };
  }

  health(): ModuleHealthReport {
    const probe = evaluateSupplier({ supplierId: "sup-spocket-001", workspaceId: "system" });
    const fakeProbe = evaluateSupplier({ supplierId: "sup-fake-001", workspaceId: "system" });

    const healthy =
      probe.trustScore > 0 &&
      probe.explanation.length >= 10 &&
      fakeProbe.overallRecommendation === "REJECT";

    return {
      moduleId: this.moduleId,
      status: healthy ? "healthy" : "degraded",
      message: healthy
        ? "Supplier Intelligence Engine operational with fake supplier detection"
        : "Supplier Intelligence Engine probe degraded",
      checkedAt: new Date().toISOString(),
      metadata: {
        catalogSize: listMockCatalog().length,
        probeRecommendation: probe.overallRecommendation,
        fakeProbeRecommendation: fakeProbe.overallRecommendation,
      },
    };
  }

  confidenceScore(_task: IntelligenceBrainTask, result?: BrainExecutionResult): number {
    return result?.confidence ?? 0;
  }
}

export const supplierIntelligenceModule = new SupplierIntelligenceModule();

export function registerSupplierIntelligenceModule(): void {
  if (!intelligenceModuleRegistry.has("supplier-intelligence")) {
    intelligenceModuleRegistry.register(supplierIntelligenceModule);
  }
}

registerSupplierIntelligenceModule();
