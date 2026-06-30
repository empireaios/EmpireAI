import type { AccountConnectionStatus, AccountProviderId, ExternalAccount } from "../models/account-provider.js";
import type { HumanActionItem, HumanActionType } from "../models/human-action-queue.js";
import {
  createHumanActionItem,
  getAccountInfrastructureRepository,
} from "../repositories/sqlite-account-infrastructure-repository.js";
import { getAccountProviderDefinition } from "./account-provider-definitions.js";

const ACTION_TITLES: Record<HumanActionType, string> = {
  identity_verification: "Complete identity verification",
  tax_verification: "Complete tax verification",
  banking_verification: "Complete banking verification",
  marketplace_approval: "Await marketplace approval",
  document_upload: "Upload required documents",
  oauth_authorization: "Authorize OAuth connection",
  account_creation: "Create external account",
  permission_renewal: "Renew expired permissions",
};

function actionDescription(actionType: HumanActionType, providerName: string): string {
  return `${ACTION_TITLES[actionType]} for ${providerName}. EA cannot bypass this step — account owner must complete it.`;
}

function blockingOperationsFor(actionType: HumanActionType): string[] {
  switch (actionType) {
    case "identity_verification":
    case "tax_verification":
    case "banking_verification":
      return ["payments", "payouts", "marketplace_listing"];
    case "marketplace_approval":
      return ["marketplace_listing", "catalog_sync"];
    case "document_upload":
      return ["catalog_sync", "ads_launch"];
    case "oauth_authorization":
    case "permission_renewal":
      return ["api_operations", "catalog_sync", "order_sync"];
    case "account_creation":
      return ["all_operations"];
    default:
      return ["api_operations"];
  }
}

/** Identifies human-only actions — EA never attempts to bypass these. */
export function identifyRequiredHumanActions(account: ExternalAccount): HumanActionItem[] {
  const definition = getAccountProviderDefinition(account.providerId);
  const actions: HumanActionItem[] = [];

  if (account.connectionStatus === "NOT_CONNECTED") {
    for (const actionType of definition.humanOnlyActions) {
      if (actionType === "oauth_authorization") continue;
      actions.push(
        createHumanActionItem({
          workspaceId: account.workspaceId,
          providerId: account.providerId,
          accountType: account.accountType,
          actionType: actionType as HumanActionType,
          title: ACTION_TITLES[actionType as HumanActionType] ?? actionType,
          description: actionDescription(actionType as HumanActionType, definition.displayName),
          status: "PENDING",
          blockingOperations: blockingOperationsFor(actionType as HumanActionType),
          metadata: {},
        }),
      );
    }
  }

  if (account.connectionStatus === "PENDING_SETUP" || account.connectionStatus === "AWAITING_USER_ACTION") {
    if (definition.oauthSupported && !account.credentialsRef) {
      actions.push(
        createHumanActionItem({
          workspaceId: account.workspaceId,
          providerId: account.providerId,
          accountType: account.accountType,
          actionType: "oauth_authorization",
          title: ACTION_TITLES.oauth_authorization,
          description: actionDescription("oauth_authorization", definition.displayName),
          status: "PENDING",
          blockingOperations: blockingOperationsFor("oauth_authorization"),
          metadata: {},
        }),
      );
    }
  }

  if (account.connectionStatus === "PERMISSION_EXPIRED") {
    actions.push(
      createHumanActionItem({
        workspaceId: account.workspaceId,
        providerId: account.providerId,
        accountType: account.accountType,
        actionType: "permission_renewal",
        title: ACTION_TITLES.permission_renewal,
        description: actionDescription("permission_renewal", definition.displayName),
        status: "PENDING",
        blockingOperations: blockingOperationsFor("permission_renewal"),
        metadata: {},
      }),
    );
  }

  return actions;
}

export function syncHumanActionQueue(account: ExternalAccount): HumanActionItem[] {
  const repository = getAccountInfrastructureRepository();
  const required = identifyRequiredHumanActions(account);
  const existing = repository.listHumanActions(account.workspaceId, {
    providerId: account.providerId,
  });

  const synced: HumanActionItem[] = [];
  for (const action of required) {
    const match = existing.find(
      (entry) => entry.actionType === action.actionType && entry.status !== "COMPLETED",
    );
    if (match) {
      synced.push(match);
    } else if (account.connectionStatus !== "CONNECTED" && account.connectionStatus !== "DISABLED") {
      synced.push(repository.saveHumanAction(action));
    }
  }

  return synced.filter((entry) => entry.status === "PENDING" || entry.status === "IN_PROGRESS" || entry.status === "BLOCKED");
}

export function listHumanActionQueue(
  workspaceId: string,
  filters?: { providerId?: AccountProviderId; status?: HumanActionItem["status"] },
): HumanActionItem[] {
  return getAccountInfrastructureRepository().listHumanActions(workspaceId, filters);
}

export function markHumanActionComplete(
  workspaceId: string,
  actionId: string,
  actor: string,
): HumanActionItem | null {
  const repository = getAccountInfrastructureRepository();
  const actions = repository.listHumanActions(workspaceId);
  const action = actions.find((entry) => entry.actionId === actionId);
  if (!action) {
    return null;
  }
  return repository.saveHumanAction({
    ...action,
    status: "COMPLETED",
    metadata: { ...action.metadata, completedBy: actor, completedAt: new Date().toISOString() },
  });
}

export function shouldQueueHumanActions(status: AccountConnectionStatus): boolean {
  return status !== "CONNECTED" && status !== "DISABLED";
}
