import { AIW_INTEGRATION_TARGETS, AIW_WORKER_ID } from "./paths.js";
import type { ApiIntegrationWorkerConfiguration } from "./types.js";
const locked={neverReplacePlatformBusinessLogic:true,neverExposeApiSecretsOrCredentials:true,neverStoreSecretsInsecurely:true,neverFabricateSuccessfulIntegrationTests:true,neverImplementQ611OrLater:true,neverOverridePillowGrandKingApprovedArchitecture:true,followApprovedRequirementsAndArchitecture:true,preserveCompleteTraceability:true,preserveAuditHistory:true,maskSensitiveValues:true} as const;
export const DEFAULT:ApiIntegrationWorkerConfiguration={enabled:true,timeoutMs:Number(process.env.API_INTEGRATION_WORKER_TIMEOUT_MS??30_000),workerId:AIW_WORKER_ID,integrationTargets:[...AIW_INTEGRATION_TARGETS],...locked};
export const DEFAULT_API_INTEGRATION_WORKER_CONFIGURATION=DEFAULT;
export function buildApiIntegrationWorkerConfiguration(_root:string,override:Partial<ApiIntegrationWorkerConfiguration>={}):ApiIntegrationWorkerConfiguration{return {...DEFAULT,...override,integrationTargets:[...AIW_INTEGRATION_TARGETS],...locked};}
