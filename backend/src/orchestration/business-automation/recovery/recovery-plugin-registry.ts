/**
 * G5-06 — Recovery plugin registry.
 */

import type { FailureCategory, RecoveryRecord, ResolvedRecoveryPolicy } from "../contracts/recovery-types.js";
import type { AutomationRun } from "../contracts/orchestrator-types.js";
import { classifyFailureCategory } from "./recovery-policy-resolver.js";

export type RecoveryStrategyPlugin = {
  pluginId: string;
  kind: "retry" | "rollback" | "escalate" | "halt";
  evaluate?: (input: {
    policy: ResolvedRecoveryPolicy;
    record: RecoveryRecord;
    run: AutomationRun;
  }) => boolean;
};

export type RollbackStrategyPlugin = {
  pluginId: string;
  apply?: (input: {
    run: AutomationRun;
    failedStepId: string;
    rollbackStepId: string;
  }) => AutomationRun;
};

export type FailureAnalyserPlugin = {
  pluginId: string;
  analyse: (input: {
    errorClass?: string;
    errorMessage?: string;
  }) => { category: FailureCategory; rootCause: string; confidence: number };
};

export type EscalationProviderPlugin = {
  pluginId: string;
  escalate: (input: {
    record: RecoveryRecord;
    targetTier?: string;
    reason: string;
  }) => Promise<{ escalated: boolean; reason: string }>;
};

export type RecoveryNotificationProviderPlugin = {
  pluginId: string;
  notificationRegistryId: string;
  deliver: (input: {
    record: RecoveryRecord;
    templateRef?: string;
    channel?: string;
  }) => Promise<{ delivered: boolean; reason: string }>;
};

export class RecoveryPluginRegistry {
  private readonly recoveryStrategies = new Map<string, RecoveryStrategyPlugin>();
  private readonly rollbackStrategies = new Map<string, RollbackStrategyPlugin>();
  private readonly failureAnalysers = new Map<string, FailureAnalyserPlugin>();
  private readonly escalationProviders = new Map<string, EscalationProviderPlugin>();
  private readonly notificationProviders = new Map<string, RecoveryNotificationProviderPlugin>();

  registerRecoveryStrategy(plugin: RecoveryStrategyPlugin): void {
    this.recoveryStrategies.set(plugin.pluginId, plugin);
  }

  registerRollbackStrategy(plugin: RollbackStrategyPlugin): void {
    this.rollbackStrategies.set(plugin.pluginId, plugin);
  }

  registerFailureAnalyser(plugin: FailureAnalyserPlugin): void {
    this.failureAnalysers.set(plugin.pluginId, plugin);
  }

  registerEscalationProvider(plugin: EscalationProviderPlugin): void {
    this.escalationProviders.set(plugin.pluginId, plugin);
  }

  registerNotificationProvider(plugin: RecoveryNotificationProviderPlugin): void {
    this.notificationProviders.set(plugin.pluginId, plugin);
  }

  analyseFailure(input: { errorClass?: string; errorMessage?: string }): {
    category: FailureCategory;
    rootCause: string;
    confidence: number;
  } {
    for (const analyser of this.failureAnalysers.values()) {
      return analyser.analyse(input);
    }
    return {
      category: classifyFailureCategory(input.errorClass),
      rootCause: input.errorMessage ?? "Unknown failure",
      confidence: 0.5,
    };
  }

  applyRollbackPlugins(input: {
    run: AutomationRun;
    failedStepId: string;
    rollbackStepId: string;
  }): AutomationRun {
    let run = input.run;
    for (const plugin of this.rollbackStrategies.values()) {
      if (plugin.apply) {
        run = plugin.apply({ run, failedStepId: input.failedStepId, rollbackStepId: input.rollbackStepId });
      }
    }
    return run;
  }

  resetForTests(): void {
    this.recoveryStrategies.clear();
    this.rollbackStrategies.clear();
    this.failureAnalysers.clear();
    this.escalationProviders.clear();
    this.notificationProviders.clear();
  }

  removePlugin(pluginId: string): void {
    this.recoveryStrategies.delete(pluginId);
    this.rollbackStrategies.delete(pluginId);
    this.failureAnalysers.delete(pluginId);
    this.escalationProviders.delete(pluginId);
    this.notificationProviders.delete(pluginId);
  }
}

export const recoveryPluginRegistry = new RecoveryPluginRegistry();

export function resetRecoveryPluginRegistryForTests(): void {
  recoveryPluginRegistry.resetForTests();
}
