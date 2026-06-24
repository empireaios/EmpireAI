import {
  createBullMQConnection,
  createRedisClient,
  probeRedisAvailable,
  REDIS_START_HINT,
  shouldAllowRedisDegradedMode,
  type RedisClient,
} from "../config/redis-client.js";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { agentDefinitions } from "../agents/definitions/agents.js";
import { moduleRoutes } from "../agents/routes/module-routes.js";
import { coreTools } from "../agents/tools/core-tools.js";
import { aiCeoTools } from "../agents/tools/ai-ceo-tools.js";
import { moduleLoadTools } from "../agents/tools/module-load-tools.js";
import { domainTools } from "../agents/tools/domain-tools.js";
import { productScoutTools } from "../agents/tools/product-scout-tools.js";
import { supplierIntelligenceTools } from "../agents/tools/supplier-intelligence-tools.js";
import { registerSupplierIntelligenceModule } from "../intelligence/supplier-intelligence-engine/module-contract.js";
import { workflowDefinitions } from "../agents/workflows/workflows.js";
import { AgentManager } from "./agent-manager.js";
import { AuditLogger } from "./audit/audit-logger.js";
import { DecisionEngine } from "./decision-engine.js";
import { EventBus } from "./events/event-bus.js";
import { LLMRouter } from "./llm/llm-router.js";
import { MemoryStore } from "./memory/memory-store.js";
import { Orchestrator } from "./orchestrator.js";
import { BrainScheduler } from "./scheduler.js";
import {
  DegradedTaskQueue,
  TaskQueue,
  type BrainTaskQueue,
} from "./task-queue.js";
import { ToolRegistry } from "./tools/tool-registry.js";
import { WorkflowEngine } from "./workflow-engine.js";
import { BrainWorkerPool } from "./workers/worker-pool.js";
import { GuardianEngine } from "../guardian/guardian-engine.js";
import {
  InMemorySessionStore,
  SessionStore,
  type SessionStoreBackend,
} from "../auth/session-store.js";

export type RedisMode = "connected" | "degraded";

export type EmpireBrain = {
  redisMode: RedisMode;
  redis: RedisClient | null;
  sessionStore: SessionStoreBackend;
  auditLogger: AuditLogger;
  memoryStore: MemoryStore;
  eventBus: EventBus;
  toolRegistry: ToolRegistry;
  llmRouter: LLMRouter;
  decisionEngine: DecisionEngine;
  agentManager: AgentManager;
  workflowEngine: WorkflowEngine;
  taskQueue: BrainTaskQueue;
  scheduler: BrainScheduler;
  orchestrator: Orchestrator;
  workerPool: BrainWorkerPool;
  guardian: GuardianEngine;
  shutdown: () => Promise<void>;
};

export async function createBrain(options?: {
  startWorkers?: boolean;
  startScheduler?: boolean;
}): Promise<EmpireBrain> {
  const redisAvailable = await probeRedisAvailable(env.REDIS_URL);
  const allowDegraded = shouldAllowRedisDegradedMode();

  if (!redisAvailable && !allowDegraded) {
    throw new Error(
      `Redis unavailable at ${env.REDIS_URL}. Start Redis or set REDIS_OPTIONAL=true for local fallback.`,
    );
  }

  const redisMode: RedisMode =
    redisAvailable ? "connected" : "degraded";

  if (redisMode === "degraded") {
    logger.warn(
      `Redis unavailable — running in local degraded mode (queue/events/sessions in-memory). Start Redis with: ${REDIS_START_HINT}`,
    );
  }

  const redis =
    redisMode === "connected" ? createRedisClient(env.REDIS_URL) : null;
  const bullmqConnection =
    redisMode === "connected" ? createBullMQConnection(env.REDIS_URL) : null;

  const auditLogger = new AuditLogger();
  const guardian = new GuardianEngine(auditLogger);
  const memoryStore = new MemoryStore();
  const eventBus = new EventBus(redis, { localOnly: redisMode === "degraded" });
  const toolRegistry = new ToolRegistry();
  const llmRouter = new LLMRouter();
  const decisionEngine = new DecisionEngine();
  const taskQueue: BrainTaskQueue =
    redisMode === "connected"
      ? new TaskQueue(bullmqConnection!, auditLogger)
      : new DegradedTaskQueue(auditLogger);
  const sessionStore: SessionStoreBackend =
    redisMode === "connected"
      ? new SessionStore(redis!)
      : new InMemorySessionStore();

  registerSupplierIntelligenceModule();

  const brainTools = [
    ...coreTools,
    ...moduleLoadTools,
    ...aiCeoTools,
    ...domainTools,
    ...productScoutTools,
    ...supplierIntelligenceTools,
  ];
  const uniqueTools = [...new Map(brainTools.map((tool) => [tool.name, tool])).values()];
  toolRegistry.registerMany(uniqueTools);

  const agentManager = new AgentManager({
    toolRegistry,
    llmRouter,
    memoryStore,
    decisionEngine,
    eventBus,
    auditLogger,
  });

  agentManager.registerMany(agentDefinitions);

  const workflowEngine = new WorkflowEngine({
    agentManager,
    toolRegistry,
    eventBus,
    auditLogger,
  });

  workflowEngine.registerMany(workflowDefinitions);

  const orchestrator = new Orchestrator({
    agentManager,
    workflowEngine,
    taskQueue,
    eventBus,
    auditLogger,
    toolRegistry,
    guardian: env.GUARDIAN_ENABLED ? guardian : undefined,
    routes: moduleRoutes,
  });

  const scheduler = new BrainScheduler(taskQueue, auditLogger);
  const workerPool = new BrainWorkerPool(bullmqConnection, {
    agentManager,
    workflowEngine,
    toolRegistry,
  });

  await eventBus.start();

  if (options?.startScheduler ?? false) {
    await scheduler.register({
      name: "daily-portfolio-review",
      cron: "0 6 * * *",
      payload: {
        type: "workflow.run",
        workspaceId: "system",
        workflowId: "daily-portfolio-review",
        input: { objective: "Run daily portfolio review" },
        correlationId: "schedule:daily-portfolio-review",
        priority: "high",
      },
    });
    await scheduler.start();
  }

  if (options?.startWorkers ?? false) {
    workerPool.start();
  }

  logger.info(
    {
      agents: agentManager.list().length,
      tools: toolRegistry.list().length,
      llmProviders: llmRouter.listAvailable(),
      redisMode,
    },
    "EmpireAI Brain initialized",
  );

  const shutdown = async () => {
    await workerPool.stop();
    await scheduler.close();
    await taskQueue.close();
    await eventBus.stop();
    redis?.disconnect();
    logger.info("EmpireAI Brain shutdown complete");
  };

  return {
    redisMode,
    redis,
    sessionStore,
    auditLogger,
    memoryStore,
    eventBus,
    toolRegistry,
    llmRouter,
    decisionEngine,
    agentManager,
    workflowEngine,
    taskQueue,
    scheduler,
    orchestrator,
    workerPool,
    guardian,
    shutdown,
  };
}

export type { OrchestratorDispatchRequest, OrchestratorDispatchResult } from "./types.js";

export {
  INTELLIGENCE_MODULE_CATALOG,
  INTELLIGENCE_MODULE_IDS,
  MODULE_CAPABILITIES,
  PRODUCT_SCOUT_ACTION_MAP,
  StubIntelligenceModuleRegistry,
  intelligenceModuleRegistry,
  isIntelligenceModuleId,
} from "./contract/index.js";
export type {
  AIEmployeeModule,
  BrainDecision,
  BrainExecutionResult,
  BrainObservation,
  BrainRecommendation,
  IntelligenceBrainTask,
  IntelligenceCapability,
  IntelligenceModuleCatalogEntry,
  IntelligenceModuleContract,
  IntelligenceModuleId,
  IntelligenceModuleRegistry,
  ModuleCapabilityMap,
  ModuleHealthReport,
  ModuleInputSpec,
  ModuleOutputSpec,
  ModuleValidationResult,
  ProductScoutModuleContractAdapter,
  ProductScoutTaskInput,
} from "./contract/index.js";
