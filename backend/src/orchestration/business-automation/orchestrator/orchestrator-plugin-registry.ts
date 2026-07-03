/**
 * G5-04 — Orchestrator plugin registry (executors, adapters, validators, observers, enrichers).
 */

import type { AutomationExecutorType } from "../../../registry/types/automation-registry-types.js";
import type { OrchestratorDispatchRequest, OrchestratorDispatchResult } from "../../../brain/types.js";
import type {
  AutomationRun,
  ResolvedWorkflowStep,
  StepResult,
} from "../contracts/orchestrator-types.js";
import type { ResolvedExecutorBinding } from "../broker/executor-resolver.js";

export type WorkflowExecutorPlugin = {
  pluginId: string;
  executorType: AutomationExecutorType;
  execute?: (input: {
    run: AutomationRun;
    step: ResolvedWorkflowStep;
    binding: ResolvedExecutorBinding;
  }) => Promise<StepResult | undefined>;
};

export type ExecutionAdapterPlugin = {
  pluginId: string;
  executorType: AutomationExecutorType;
  transformDispatch?: (
    request: OrchestratorDispatchRequest,
    run: AutomationRun,
    step: ResolvedWorkflowStep,
  ) => Partial<OrchestratorDispatchRequest>;
};

export type ExecutionValidatorPlugin = {
  pluginId: string;
  validate: (input: {
    run: AutomationRun;
    step: ResolvedWorkflowStep;
    binding: ResolvedExecutorBinding;
    actorId: string;
  }) => { valid: boolean; reason: string };
};

export type ExecutionObserverPlugin = {
  pluginId: string;
  onStepDispatched?: (input: {
    run: AutomationRun;
    step: ResolvedWorkflowStep;
    binding: ResolvedExecutorBinding;
    dispatchRequest: OrchestratorDispatchRequest;
    dispatchResult: OrchestratorDispatchResult;
  }) => void;
  onStepCompleted?: (input: {
    run: AutomationRun;
    step: ResolvedWorkflowStep;
    result: StepResult;
  }) => void;
};

export type ExecutionEnricherPlugin = {
  pluginId: string;
  enrichPayload: (
    run: AutomationRun,
    step: ResolvedWorkflowStep,
    payload: Record<string, unknown>,
  ) => Record<string, unknown>;
};

export class OrchestratorPluginRegistry {
  private readonly executors = new Map<string, WorkflowExecutorPlugin>();
  private readonly adapters = new Map<string, ExecutionAdapterPlugin>();
  private readonly validators = new Map<string, ExecutionValidatorPlugin>();
  private readonly observers = new Map<string, ExecutionObserverPlugin>();
  private readonly enrichers = new Map<string, ExecutionEnricherPlugin>();

  registerExecutor(plugin: WorkflowExecutorPlugin): void {
    this.executors.set(plugin.pluginId, plugin);
  }

  registerAdapter(plugin: ExecutionAdapterPlugin): void {
    this.adapters.set(plugin.pluginId, plugin);
  }

  registerValidator(plugin: ExecutionValidatorPlugin): void {
    this.validators.set(plugin.pluginId, plugin);
  }

  registerObserver(plugin: ExecutionObserverPlugin): void {
    this.observers.set(plugin.pluginId, plugin);
  }

  registerEnricher(plugin: ExecutionEnricherPlugin): void {
    this.enrichers.set(plugin.pluginId, plugin);
  }

  resolveAdapter(executorType: AutomationExecutorType): ExecutionAdapterPlugin | undefined {
    for (const adapter of this.adapters.values()) {
      if (adapter.executorType === executorType) return adapter;
    }
    return undefined;
  }

  listValidators(): readonly ExecutionValidatorPlugin[] {
    return [...this.validators.values()];
  }

  listObservers(): readonly ExecutionObserverPlugin[] {
    return [...this.observers.values()];
  }

  applyEnrichers(
    run: AutomationRun,
    step: ResolvedWorkflowStep,
    payload: Record<string, unknown>,
  ): Record<string, unknown> {
    let enriched = payload;
    for (const enricher of this.enrichers.values()) {
      enriched = enricher.enrichPayload(run, step, enriched);
    }
    return enriched;
  }

  resetForTests(): void {
    this.executors.clear();
    this.adapters.clear();
    this.validators.clear();
    this.observers.clear();
    this.enrichers.clear();
  }

  removePlugin(pluginId: string): void {
    this.executors.delete(pluginId);
    this.adapters.delete(pluginId);
    this.validators.delete(pluginId);
    this.observers.delete(pluginId);
    this.enrichers.delete(pluginId);
  }
}

export const orchestratorPluginRegistry = new OrchestratorPluginRegistry();

export function resetOrchestratorPluginRegistryForTests(): void {
  orchestratorPluginRegistry.resetForTests();
}
