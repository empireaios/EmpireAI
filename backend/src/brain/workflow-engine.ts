import { randomUUID } from "node:crypto";
import { getDatabase } from "./database.js";
import type {
  BrainTaskPayload,
  WorkflowDefinition,
  WorkflowRunRequest,
  WorkflowStep,
} from "./types.js";
import type { AuditLogger } from "./audit/audit-logger.js";
import type { EventBus } from "./events/event-bus.js";
import type { ToolRegistry } from "./tools/tool-registry.js";
import type { AgentManager } from "./agent-manager.js";

export type WorkflowEngineDeps = {
  agentManager: AgentManager;
  toolRegistry: ToolRegistry;
  eventBus: EventBus;
  auditLogger: AuditLogger;
};

export class WorkflowEngine {
  private readonly workflows = new Map<string, WorkflowDefinition>();

  constructor(private readonly deps: WorkflowEngineDeps) {}

  register(definition: WorkflowDefinition): void {
    this.validate(definition);
    this.workflows.set(definition.id, definition);
  }

  registerMany(definitions: WorkflowDefinition[]): void {
    for (const definition of definitions) {
      this.register(definition);
    }
  }

  get(workflowId: string): WorkflowDefinition | undefined {
    return this.workflows.get(workflowId);
  }

  async run(request: WorkflowRunRequest): Promise<Record<string, unknown>> {
    const workflow = this.workflows.get(request.workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${request.workflowId}`);
    }

    const correlationId = request.correlationId ?? randomUUID();
    const runId = randomUUID();
    const now = new Date().toISOString();

    const db = getDatabase();
    db.prepare(
      `INSERT INTO workflow_runs
        (id, workflow_id, workspace_id, company_id, status, correlation_id, input, created_at, updated_at)
       VALUES (@id, @workflowId, @workspaceId, @companyId, @status, @correlationId, @input, @createdAt, @updatedAt)`,
    ).run({
      id: runId,
      workflowId: workflow.id,
      workspaceId: request.workspaceId,
      companyId: request.companyId ?? null,
      status: "running",
      correlationId,
      input: JSON.stringify(request.input ?? {}),
      createdAt: now,
      updatedAt: now,
    });

    await this.deps.eventBus.publish({
      type: "workflow_started",
      source: "workflow-engine",
      workspaceId: request.workspaceId,
      companyId: request.companyId,
      correlationId,
      payload: { workflowId: workflow.id, runId },
    });

    this.deps.auditLogger.write({
      action: "workflow.run",
      actor: "workflow-engine",
      workspaceId: request.workspaceId,
      companyId: request.companyId,
      correlationId,
      metadata: { workflowId: workflow.id, runId },
    });

    const completed = new Set<string>();
    const outputs: Record<string, unknown> = {};

    try {
      const orderedSteps = topologicalSort(workflow.steps);

      for (const step of orderedSteps) {
        if (step.dependsOn?.some((dep) => !completed.has(dep))) {
          throw new Error(`Unmet dependency for step ${step.id}`);
        }

        if (step.agentId) {
          const result = await this.deps.agentManager.run({
            workspaceId: request.workspaceId,
            companyId: request.companyId,
            agentId: step.agentId,
            objective: `Execute workflow step ${step.id} for ${workflow.name}`,
            context: { ...(request.input ?? {}), ...(step.input ?? {}), stepId: step.id },
            correlationId,
          });
          outputs[step.id] = result;
        } else if (step.toolName) {
          const tool = this.deps.toolRegistry.require(step.toolName);
          const result = await tool.handler(step.input ?? {}, {
            workspaceId: request.workspaceId,
            companyId: request.companyId,
            agentId: "workflow-engine",
            correlationId,
          });
          outputs[step.id] = result;
        }

        completed.add(step.id);
      }

      db.prepare(
        `UPDATE workflow_runs SET status = @status, output = @output, updated_at = @updatedAt WHERE id = @id`,
      ).run({
        id: runId,
        status: "completed",
        output: JSON.stringify(outputs),
        updatedAt: new Date().toISOString(),
      });

      await this.deps.eventBus.publish({
        type: "workflow_completed",
        source: "workflow-engine",
        workspaceId: request.workspaceId,
        companyId: request.companyId,
        correlationId,
        payload: { workflowId: workflow.id, runId, outputs },
      });

      return outputs;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";

      db.prepare(
        `UPDATE workflow_runs SET status = @status, error = @error, updated_at = @updatedAt WHERE id = @id`,
      ).run({
        id: runId,
        status: "failed",
        error: message,
        updatedAt: new Date().toISOString(),
      });

      await this.deps.eventBus.publish({
        type: "workflow_failed",
        source: "workflow-engine",
        workspaceId: request.workspaceId,
        companyId: request.companyId,
        correlationId,
        payload: { workflowId: workflow.id, runId, error: message },
      });

      throw error;
    }
  }

  private validate(definition: WorkflowDefinition): void {
    const stepIds = new Set(definition.steps.map((step) => step.id));
    for (const step of definition.steps) {
      if (!step.agentId && !step.toolName) {
        throw new Error(`Workflow step ${step.id} requires agentId or toolName`);
      }
      for (const dep of step.dependsOn ?? []) {
        if (!stepIds.has(dep)) {
          throw new Error(`Workflow step ${step.id} depends on unknown step ${dep}`);
        }
      }
    }
  }
}

function topologicalSort(steps: WorkflowStep[]): WorkflowStep[] {
  const byId = new Map(steps.map((step) => [step.id, step]));
  const visited = new Set<string>();
  const result: WorkflowStep[] = [];

  const visit = (stepId: string) => {
    if (visited.has(stepId)) return;
    const step = byId.get(stepId);
    if (!step) return;

    for (const dep of step.dependsOn ?? []) {
      visit(dep);
    }

    visited.add(stepId);
    result.push(step);
  };

  for (const step of steps) {
    visit(step.id);
  }

  return result;
}

export type { BrainTaskPayload };
