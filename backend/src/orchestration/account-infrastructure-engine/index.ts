export {
  ACCOUNT_PROVIDER_IDS,
  ACCOUNT_CONNECTION_STATUSES,
  ACCOUNT_EXPIRY_STATUSES,
  externalAccountSchema,
} from "./models/account-provider.js";
export type {
  AccountProviderId,
  AccountConnectionStatus,
  AccountExpiryStatus,
  ExternalAccount,
  AccountProviderDefinition,
} from "./models/account-provider.js";

export { accountHealthSchema } from "./models/account-health.js";
export type { AccountHealth } from "./models/account-health.js";

export {
  HUMAN_ACTION_TYPES,
  HUMAN_ACTION_STATUSES,
  humanActionItemSchema,
} from "./models/human-action-queue.js";
export type { HumanActionType, HumanActionStatus, HumanActionItem } from "./models/human-action-queue.js";

export {
  ACCOUNT_READINESS_LABELS,
  accountReadinessSummarySchema,
  accountReadinessLineSchema,
} from "./models/account-readiness-summary.js";
export type {
  AccountReadinessLabel,
  AccountReadinessLine,
  AccountReadinessSummary,
} from "./models/account-readiness-summary.js";

export {
  ACCOUNT_PROVIDER_DEFINITIONS,
  getAccountProviderDefinition,
} from "./services/account-provider-definitions.js";

export {
  computeAccountHealth,
  deriveConnectionHealth,
  mapMarketplaceStatusToAccountStatus,
  mapInfrastructureStatusToAccountStatus,
} from "./services/account-health-engine.js";

export {
  identifyRequiredHumanActions,
  syncHumanActionQueue,
  listHumanActionQueue,
  markHumanActionComplete,
  shouldQueueHumanActions,
} from "./services/human-action-queue-service.js";

export {
  buildAccountReadinessSummary,
  formatReadinessSummaryText,
} from "./services/account-readiness-service.js";

export {
  SqliteAccountInfrastructureRepository,
  getAccountInfrastructureRepository,
  resetAccountInfrastructureRepository,
  createHumanActionItem,
} from "./repositories/sqlite-account-infrastructure-repository.js";
export type { AccountInfrastructureRepository } from "./repositories/sqlite-account-infrastructure-repository.js";

export {
  listExternalAccounts,
  getExternalAccount,
  getAccountProviderRegistry,
  startAccountSetup,
  completeAccountConnection,
  markAccountError,
  disableAccount,
  getAccountReadiness,
  getAccountHealthSnapshot,
  mapAccountStatusForIntegrations,
} from "./services/account-infrastructure-service.js";

export { registerAccountInfrastructureRoutes } from "./routes/account-infrastructure-routes.js";
export { accountInfrastructureTools } from "./tools/account-infrastructure-tools.js";

export {
  ACCOUNT_INFRASTRUCTURE_MODULE_ID,
  ACCOUNT_INFRASTRUCTURE_CAPABILITIES,
  createAccountInfrastructureModuleContract,
} from "./contract/account-infrastructure-module.js";
export type {
  AccountInfrastructureCapability,
  AccountInfrastructureModuleContract,
} from "./contract/account-infrastructure-module.js";
