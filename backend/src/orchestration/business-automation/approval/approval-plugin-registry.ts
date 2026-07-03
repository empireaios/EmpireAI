/**
 * G5-05 — Approval plugin registry (providers, validators, observers, notifications, escalation).
 */

import type { AutomationApprovalTier } from "../../../registry/types/automation-registry-types.js";
import type {
  AutomationApprovalRequest,
  ResolvedApprovalPolicy,
} from "../contracts/approval-types.js";

export type ApprovalProviderPlugin = {
  pluginId: string;
  tier: AutomationApprovalTier;
  submit?: (request: AutomationApprovalRequest) => Promise<{ externalReference?: string } | void>;
};

export type ApprovalValidatorPlugin = {
  pluginId: string;
  validate: (input: {
    policy: ResolvedApprovalPolicy;
    request: AutomationApprovalRequest;
  }) => { valid: boolean; reason: string };
};

export type ApprovalObserverPlugin = {
  pluginId: string;
  onStateChange?: (input: {
    request: AutomationApprovalRequest;
    previousState: AutomationApprovalRequest["approvalState"];
  }) => void;
};

export type NotificationProviderPlugin = {
  pluginId: string;
  notificationRegistryId: string;
  deliver: (input: {
    request: AutomationApprovalRequest;
    templateRef?: string;
    channel?: string;
  }) => Promise<{ delivered: boolean; reason: string }>;
};

export type EscalationProviderPlugin = {
  pluginId: string;
  escalate: (input: {
    request: AutomationApprovalRequest;
    targetTier: AutomationApprovalTier;
    reason: string;
  }) => Promise<{ escalated: boolean; reason: string }>;
};

export class ApprovalPluginRegistry {
  private readonly providers = new Map<string, ApprovalProviderPlugin>();
  private readonly validators = new Map<string, ApprovalValidatorPlugin>();
  private readonly observers = new Map<string, ApprovalObserverPlugin>();
  private readonly notificationProviders = new Map<string, NotificationProviderPlugin>();
  private readonly escalationProviders = new Map<string, EscalationProviderPlugin>();

  registerProvider(plugin: ApprovalProviderPlugin): void {
    this.providers.set(plugin.pluginId, plugin);
  }

  registerValidator(plugin: ApprovalValidatorPlugin): void {
    this.validators.set(plugin.pluginId, plugin);
  }

  registerObserver(plugin: ApprovalObserverPlugin): void {
    this.observers.set(plugin.pluginId, plugin);
  }

  registerNotificationProvider(plugin: NotificationProviderPlugin): void {
    this.notificationProviders.set(plugin.pluginId, plugin);
  }

  registerEscalationProvider(plugin: EscalationProviderPlugin): void {
    this.escalationProviders.set(plugin.pluginId, plugin);
  }

  runValidators(input: {
    policy: ResolvedApprovalPolicy;
    request: AutomationApprovalRequest;
  }): { valid: boolean; reason: string } {
    for (const validator of this.validators.values()) {
      const result = validator.validate(input);
      if (!result.valid) {
        return { valid: false, reason: `[${validator.pluginId}] ${result.reason}` };
      }
    }
    return { valid: true, reason: "Approval plugin validators passed" };
  }

  async deliverNotifications(input: {
    request: AutomationApprovalRequest;
    notificationRegistryIds: string[];
    resolveNotification: (id: string) => { templateRef?: string; channel?: string } | undefined;
  }): Promise<Array<{ notificationRegistryId: string; delivered: boolean; reason: string }>> {
    const results: Array<{ notificationRegistryId: string; delivered: boolean; reason: string }> = [];

    for (const notificationId of input.notificationRegistryIds) {
      const provider = [...this.notificationProviders.values()].find(
        (item) => item.notificationRegistryId === notificationId,
      );
      const notification = input.resolveNotification(notificationId);
      if (!provider) {
        results.push({
          notificationRegistryId: notificationId,
          delivered: false,
          reason: "No notification provider registered for registry id",
        });
        continue;
      }
      const delivery = await provider.deliver({
        request: input.request,
        templateRef: notification?.templateRef,
        channel: notification?.channel,
      });
      results.push({
        notificationRegistryId: notificationId,
        delivered: delivery.delivered,
        reason: delivery.reason,
      });
    }

    return results;
  }

  notifyStateChange(
    request: AutomationApprovalRequest,
    previousState: AutomationApprovalRequest["approvalState"],
  ): void {
    for (const observer of this.observers.values()) {
      observer.onStateChange?.({ request, previousState });
    }
  }

  resetForTests(): void {
    this.providers.clear();
    this.validators.clear();
    this.observers.clear();
    this.notificationProviders.clear();
    this.escalationProviders.clear();
  }
}

export const approvalPluginRegistry = new ApprovalPluginRegistry();

export function resetApprovalPluginRegistryForTests(): void {
  approvalPluginRegistry.resetForTests();
}
