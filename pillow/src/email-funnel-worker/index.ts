export {
  EmailFunnelWorker,
  createEmailFunnelWorker,
  resetEmailFunnelWorkerForTesting,
  type EmailFunnelWorkerOptions,
} from "./engine.js";
export type { EmailFunnelWorkerDependencies } from "./integrations.js";
export {
  buildEmailFunnelWorkerConfiguration,
  DEFAULT_EMAIL_FUNNEL_WORKER_CONFIGURATION,
  type EmailFunnelWorkerConfiguration,
} from "./configuration.js";
export {
  EMAIL_FUNNEL_WORKER_ID,
  EMAIL_FUNNEL_WORKER_SYSTEM_PATH,
  EMAIL_FUNNEL_WORKER_IDENTITY,
  EFW_METADATA_VERSION,
  EMAIL_FUNNEL_REPORT_VERSION,
  EFW_CAPABILITIES,
  INTEGRATION_TARGETS,
} from "./paths.js";
export type {
  EmailFunnelWorkerState,
  EmailFunnelReport,
  EfwInput,
  EfwRunReport,
  EmailFunnelWorkerCatalog,
  EmailFunnelWorkerCockpitSnapshot,
  EmailFunnelWorkerEngineRecord,
  LeadMagnet,
  EmailSequence,
  CallToActionStrategy,
  FunnelStage,
  Q807ConsumableContract,
  IntegrationHandshake as EfwIntegrationHandshake,
} from "./types.js";
