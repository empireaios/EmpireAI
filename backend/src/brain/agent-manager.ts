import type {
  AgentDefinition,
  AgentRunRequest,
  AgentRunResult,
  DecisionRecord,
} from "./types.js";
import type { AuditLogger } from "./audit/audit-logger.js";
import type { DecisionEngine } from "./decision-engine.js";
import type { EventBus } from "./events/event-bus.js";
import type { LLMRouter } from "./llm/llm-router.js";
import type { MemoryStore } from "./memory/memory-store.js";
import type { ToolRegistry } from "./tools/tool-registry.js";
import { randomUUID } from "node:crypto";

export type AgentManagerDeps = {
  toolRegistry: ToolRegistry;
  llmRouter: LLMRouter;
  memoryStore: MemoryStore;
  decisionEngine: DecisionEngine;
  eventBus: EventBus;
  auditLogger: AuditLogger;
};

export class AgentManager {
  private readonly agents = new Map<string, AgentDefinition>();

  constructor(private readonly deps: AgentManagerDeps) {}

  register(definition: AgentDefinition): void {
    if (this.agents.has(definition.id)) {
      throw new Error(`Agent already registered: ${definition.id}`);
    }

    for (const toolName of definition.tools) {
      if (!this.deps.toolRegistry.get(toolName)) {
        throw new Error(
          `Agent ${definition.id} references unknown tool: ${toolName}`,
        );
      }
    }

    this.agents.set(definition.id, definition);
  }

  registerMany(definitions: AgentDefinition[]): void {
    for (const definition of definitions) {
      this.register(definition);
    }
  }

  get(agentId: string): AgentDefinition | undefined {
    return this.agents.get(agentId);
  }

  list(): AgentDefinition[] {
    return [...this.agents.values()];
  }

  async run(request: AgentRunRequest): Promise<AgentRunResult> {
    const agent = this.agents.get(request.agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${request.agentId}`);
    }

    const correlationId = request.correlationId ?? randomUUID();

    await this.deps.eventBus.publish({
      type: "agent_invoked",
      source: "agent-manager",
      target: agent.id,
      workspaceId: request.workspaceId,
      companyId: request.companyId,
      agentId: agent.id,
      correlationId,
      payload: { objective: request.objective },
    });

    this.deps.auditLogger.write({
      action: "agent.run",
      actor: agent.id,
      workspaceId: request.workspaceId,
      companyId: request.companyId,
      agentId: agent.id,
      correlationId,
      metadata: { objective: request.objective, module: agent.module },
    });

    const memoryContext = this.deps.memoryStore.list({
      scope: "agent",
      workspaceId: request.workspaceId,
      companyId: request.companyId,
      agentId: agent.id,
    });

    const llmResponse = await this.deps.llmRouter.complete({
      provider: request.provider ?? agent.defaultProvider,
      model: request.model ?? agent.defaultModel,
      workspaceId: request.workspaceId,
      correlationId,
      messages: [
        { role: "system", content: agent.systemPrompt },
        {
          role: "user",
          content: JSON.stringify({
            objective: request.objective,
            context: request.context ?? {},
            memory: memoryContext.map((record) => ({
              key: record.key,
              value: record.value,
            })),
          }),
        },
      ],
      tools: this.deps.toolRegistry.toLLMDefinitions(agent.tools),
    });

    this.deps.auditLogger.write({
      action: "llm.complete",
      actor: agent.id,
      workspaceId: request.workspaceId,
      companyId: request.companyId,
      agentId: agent.id,
      correlationId,
      metadata: {
        provider: llmResponse.provider,
        model: llmResponse.model,
        usage: llmResponse.usage,
      },
    });

    const toolResults: Array<{ tool: string; result: unknown }> = [];
    const decisions: DecisionRecord[] = [];

    for (const toolCall of llmResponse.toolCalls ?? []) {
      const tool = this.deps.toolRegistry.require(toolCall.name);

      const decision = this.deps.decisionEngine.evaluate({
        agentId: agent.id,
        action: toolCall.name,
        authorityLevel: tool.authorityLevel,
        rationale: `Agent ${agent.name} invoked tool ${tool.name}`,
        metadata: toolCall.arguments,
      });

      decisions.push(decision);

      this.deps.auditLogger.write({
        action: "decision.evaluate",
        actor: agent.id,
        workspaceId: request.workspaceId,
        companyId: request.companyId,
        agentId: agent.id,
        correlationId,
        metadata: { decision },
      });

      if (!this.deps.decisionEngine.canExecute(decision)) {
        await this.deps.eventBus.publish({
          type: "approval_needed",
          source: agent.id,
          workspaceId: request.workspaceId,
          companyId: request.companyId,
          agentId: agent.id,
          correlationId,
          payload: { decision, tool: tool.name },
        });
        continue;
      }

      const result = await tool.handler(toolCall.arguments, {
        workspaceId: request.workspaceId,
        companyId: request.companyId,
        agentId: agent.id,
        correlationId,
      });

      toolResults.push({ tool: tool.name, result });

      await this.deps.eventBus.publish({
        type: "tool_executed",
        source: agent.id,
        workspaceId: request.workspaceId,
        companyId: request.companyId,
        agentId: agent.id,
        correlationId,
        payload: { tool: tool.name, result },
      });

      this.deps.auditLogger.write({
        action: "tool.execute",
        actor: agent.id,
        workspaceId: request.workspaceId,
        companyId: request.companyId,
        agentId: agent.id,
        correlationId,
        metadata: { tool: tool.name, arguments: toolCall.arguments, result },
      });
    }

    this.deps.memoryStore.upsert({
      scope: "agent",
      workspaceId: request.workspaceId,
      companyId: request.companyId,
      agentId: agent.id,
      key: `last_run:${correlationId}`,
      value: {
        objective: request.objective,
        output: llmResponse.content,
        toolResults,
        timestamp: new Date().toISOString(),
      },
      ttlSeconds: 60 * 60 * 24 * 7,
    });

    await this.deps.eventBus.publish({
      type: "task_complete",
      source: agent.id,
      workspaceId: request.workspaceId,
      companyId: request.companyId,
      agentId: agent.id,
      correlationId,
      payload: { output: llmResponse.content },
    });

    return {
      agentId: agent.id,
      correlationId,
      output: llmResponse.content,
      toolResults,
      decisions,
    };
  }
}
