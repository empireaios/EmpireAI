import { TSW_INTEGRATION_TARGETS } from "./paths.js";
export function bindTestingWorkerIntegrations<T extends Record<string,unknown>>(current:T,deps:Record<string,unknown>={}){return {...current,...deps}} export const testingWorkerIntegrationTargets=TSW_INTEGRATION_TARGETS;
