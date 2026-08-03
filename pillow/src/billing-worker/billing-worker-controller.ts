import { BillingManager } from "./billing-manager.js"; import type { BillingWorkerDependencies } from "./types.js";
export class BillingWorkerController { readonly manager=new BillingManager(); bindIntegrations(deps:BillingWorkerDependencies={}){this.manager.bindIntegrations(deps);} }
