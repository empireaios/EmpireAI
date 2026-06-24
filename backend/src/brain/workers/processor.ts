import type { BrainTaskPayload } from "../types.js";
import type { AgentManager } from "../agent-manager.js";
import type { WorkflowEngine } from "../workflow-engine.js";
import type { ToolRegistry } from "../tools/tool-registry.js";

export type WorkerProcessorDeps = {
  agentManager: AgentManager;
  workflowEngine: WorkflowEngine;
  toolRegistry: ToolRegistry;
};

export async function processBrainTask(
  payload: BrainTaskPayload,
  deps: WorkerProcessorDeps,
): Promise<unknown> {
  switch (payload.type) {
    case "agent.run": {
      if (!payload.agentId) {
        throw new Error("agent.run requires agentId");
      }
      return deps.agentManager.run({
        workspaceId: payload.workspaceId,
        companyId: payload.companyId,
        agentId: payload.agentId,
        objective: String(payload.input.objective ?? "Background agent task"),
        context: payload.input,
        correlationId: payload.correlationId,
      });
    }

    case "workflow.run": {
      if (!payload.workflowId) {
        throw new Error("workflow.run requires workflowId");
      }
      return deps.workflowEngine.run({
        workflowId: payload.workflowId,
        workspaceId: payload.workspaceId,
        companyId: payload.companyId,
        input: payload.input,
        correlationId: payload.correlationId,
      });
    }

    case "tool.execute": {
      if (!payload.toolName) {
        throw new Error("tool.execute requires toolName");
      }
      const tool = deps.toolRegistry.require(payload.toolName);
      return tool.handler(payload.input, {
        workspaceId: payload.workspaceId,
        companyId: payload.companyId,
        agentId: payload.agentId ?? "worker",
        correlationId: payload.correlationId,
      });
    }

    case "scheduler.tick": {
      if (!payload.agentId) {
        throw new Error("scheduler.tick requires agentId");
      }
      return deps.agentManager.run({
        workspaceId: payload.workspaceId,
        companyId: payload.companyId,
        agentId: payload.agentId,
        objective: String(payload.input.objective ?? "Scheduled agent tick"),
        context: payload.input,
        correlationId: payload.correlationId,
      });
    }

    default: {
      const exhaustive: never = payload.type;
      throw new Error(`Unsupported task type: ${exhaustive}`);
    }
  }
}
