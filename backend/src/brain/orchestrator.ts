import { randomUUID } from "node:crypto";
import type { AgentManager } from "./agent-manager.js";
import type { AuditLogger } from "./audit/audit-logger.js";
import type { EventBus } from "./events/event-bus.js";
import type { BrainTaskQueue } from "./task-queue.js";
import type { WorkflowEngine } from "./workflow-engine.js";
import type { ToolRegistry } from "./tools/tool-registry.js";
import type { GuardianEngine } from "../guardian/guardian-engine.js";
import type { GovernanceEngine } from "../foundation/empire-governance/services/governance-engine.js";
import { GuardianBlockedError } from "../guardian/guardian-engine.js";
import { GovernanceBlockedError } from "../foundation/empire-governance/services/governance-engine.js";
import type {
  OrchestratorDispatchRequest,
  OrchestratorDispatchResult,
} from "./types.js";

export type ModuleRoute = {
  module: string;
  action: string;
  agentId?: string;
  workflowId?: string;
  toolName?: string;
  async?: boolean;
  authorityCheck?: boolean;
};

export type OrchestratorDeps = {
  agentManager: AgentManager;
  workflowEngine: WorkflowEngine;
  taskQueue: BrainTaskQueue;
  eventBus: EventBus;
  auditLogger: AuditLogger;
  toolRegistry: ToolRegistry;
  guardian?: GuardianEngine;
  governance?: GovernanceEngine;
  routes: ModuleRoute[];
};

export class Orchestrator {
  private readonly routeIndex: Map<string, ModuleRoute>;

  constructor(private readonly deps: OrchestratorDeps) {
    this.routeIndex = new Map(
      deps.routes.map((route) => [
        `${route.module}:${route.action}`,
        route,
      ]),
    );
  }

  async dispatch(
    request: OrchestratorDispatchRequest,
  ): Promise<OrchestratorDispatchResult> {
    const correlationId = request.correlationId ?? randomUUID();
    const routeKey = `${request.module}:${request.action}`;
    const route = this.routeIndex.get(routeKey);

    if (!route) {
      throw new Error(`No orchestrator route for ${routeKey}`);
    }

    if (this.deps.governance) {
      const governanceVerdict = this.deps.governance.assessDispatch(request);
      if (!governanceVerdict.allowed) {
        throw new GovernanceBlockedError(governanceVerdict.reason, governanceVerdict);
      }
    }

    if (this.deps.guardian) {
      const tool = route.toolName
        ? this.deps.toolRegistry.get(route.toolName)
        : undefined;
      const verdict = this.deps.guardian.assessDispatch(request, {
        toolAuthorityLevel: tool?.authorityLevel,
      });

      if (!verdict.allowed) {
        throw new GuardianBlockedError(verdict.reason, verdict);
      }
    }

    this.deps.auditLogger.write({
      action: "orchestrator.dispatch",
      actor: "orchestrator",
      workspaceId: request.workspaceId,
      companyId: request.companyId,
      correlationId,
      metadata: { module: request.module, action: request.action, payload: request.payload },
    });

    await this.deps.eventBus.publish({
      type: "request",
      source: request.module,
      workspaceId: request.workspaceId,
      companyId: request.companyId,
      correlationId,
      payload: { action: request.action, ...request.payload },
    });

    if (route.async) {
      const { jobId } = await this.deps.taskQueue.enqueue({
        type: route.workflowId ? "workflow.run" : "agent.run",
        workspaceId: request.workspaceId,
        companyId: request.companyId,
        agentId: route.agentId,
        workflowId: route.workflowId,
        input: request.payload,
        correlationId,
        priority: "normal",
      });

      return { correlationId, status: "queued", taskId: jobId };
    }

    if (route.toolName) {
      const tool = this.deps.toolRegistry.require(route.toolName);
      const toolArgs = {
        workspaceId: request.workspaceId,
        companyId: request.companyId,
        ...request.payload,
      };

      const result = await tool.handler(toolArgs, {
        workspaceId: request.workspaceId,
        companyId: request.companyId,
        agentId: "orchestrator",
        correlationId,
      });

      this.deps.auditLogger.write({
        action: "tool.execute",
        actor: "orchestrator",
        workspaceId: request.workspaceId,
        companyId: request.companyId,
        correlationId,
        metadata: { tool: route.toolName, module: request.module },
      });

      await this.deps.eventBus.publish({
        type: "tool_executed",
        source: request.module,
        workspaceId: request.workspaceId,
        companyId: request.companyId,
        correlationId,
        payload: { tool: route.toolName, action: request.action },
      });

      return { correlationId, status: "completed", result };
    }

    if (route.workflowId) {
      const result = await this.deps.workflowEngine.run({
        workflowId: route.workflowId,
        workspaceId: request.workspaceId,
        companyId: request.companyId,
        input: request.payload,
        correlationId,
      });

      return { correlationId, status: "completed", result };
    }

    if (route.agentId) {
      const result = await this.deps.agentManager.run({
        workspaceId: request.workspaceId,
        companyId: request.companyId,
        agentId: route.agentId,
        objective: String(request.payload.objective ?? request.action),
        context: request.payload,
        correlationId,
      });

      const requiresApproval = result.decisions.some(
        (decision) => decision.requiresFounderApproval && !decision.approved,
      );

      return {
        correlationId,
        status: requiresApproval ? "requires_approval" : "completed",
        result,
      };
    }

    throw new Error(`Route ${routeKey} has no execution target`);
  }
}
