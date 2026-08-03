import { NTW_INTEGRATION_TARGETS } from "./paths.js";
export function bindNotificationWorkerIntegrations<T extends Record<string,unknown>>(current:T,deps:Record<string,unknown>={}){return {...current,...deps}} export const notificationWorkerIntegrationTargets=NTW_INTEGRATION_TARGETS;
