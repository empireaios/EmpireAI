import type { AccountReadinessLabel, AccountReadinessSummary } from "../models/account-readiness-summary.js";
import type { ExternalAccount } from "../models/account-provider.js";
import type { HumanActionItem } from "../models/human-action-queue.js";
import { ACCOUNT_PROVIDER_IDS } from "../models/account-provider.js";
import { getAccountProviderDefinition } from "./account-provider-definitions.js";

function readinessLabel(
  account: ExternalAccount,
  pendingActions: HumanActionItem[],
): AccountReadinessLabel {
  if (account.connectionStatus === "DISABLED") return "DISABLED";
  if (account.connectionStatus === "ERROR" || account.connectionStatus === "PERMISSION_EXPIRED") {
    return "ERROR";
  }
  if (
    account.connectionStatus === "AWAITING_USER_ACTION" ||
    account.connectionStatus === "PENDING_SETUP" ||
    pendingActions.length > 0
  ) {
    return "ACTION_REQUIRED";
  }
  if (account.connectionStatus === "CONNECTED" && account.healthScore >= 70) {
    return "READY";
  }
  if (account.connectionStatus === "NOT_CONNECTED") {
    return "NOT_CONNECTED";
  }
  return "ACTION_REQUIRED";
}

/** Unified readiness summary for Grand King and Founder dashboards. */
export function buildAccountReadinessSummary(
  workspaceId: string,
  accounts: ExternalAccount[],
  humanActions: HumanActionItem[],
  accountType: ExternalAccount["accountType"] = "grand_king",
): AccountReadinessSummary {
  const byProvider = new Map(accounts.map((entry) => [entry.providerId, entry]));
  const timestamp = new Date().toISOString();

  const lines = ACCOUNT_PROVIDER_IDS.map((providerId) => {
    const account = byProvider.get(providerId);
    const definition = getAccountProviderDefinition(providerId);
    const pending = humanActions.filter(
      (action) =>
        action.providerId === providerId &&
        (action.status === "PENDING" || action.status === "IN_PROGRESS" || action.status === "BLOCKED"),
    );

    if (!account) {
      return {
        providerId,
        displayName: definition.displayName,
        label: "NOT_CONNECTED" as AccountReadinessLabel,
        healthScore: 0,
        connectionStatus: "NOT_CONNECTED",
        pendingHumanActions: pending.length,
      };
    }

    return {
      providerId,
      displayName: account.displayName,
      label: readinessLabel(account, pending),
      healthScore: account.healthScore,
      connectionStatus: account.connectionStatus,
      pendingHumanActions: pending.length,
    };
  });

  const readyCount = lines.filter((line) => line.label === "READY").length;
  const actionRequiredCount = lines.filter((line) => line.label === "ACTION_REQUIRED").length;
  const pendingHumanActions = humanActions.filter(
    (action) => action.status === "PENDING" || action.status === "IN_PROGRESS" || action.status === "BLOCKED",
  ).length;

  const overallReadinessPercent =
    lines.length === 0
      ? 0
      : Math.round(lines.reduce((sum, line) => sum + line.healthScore, 0) / lines.length);

  return {
    workspaceId,
    accountType,
    lines,
    overallReadinessPercent,
    readyCount,
    actionRequiredCount,
    pendingHumanActions,
    computedAt: timestamp,
  };
}

export function formatReadinessSummaryText(summary: AccountReadinessSummary): string {
  const lines = summary.lines.map((line) => {
    const dots = ".".repeat(Math.max(1, 18 - line.displayName.length));
    return `${line.displayName} ${dots} ${line.label === "READY" ? "READY" : line.label.replace("_", " ")}`;
  });
  return [
    ...lines,
    "",
    `Overall Readiness:`,
    `${summary.overallReadinessPercent}%`,
  ].join("\n");
}
