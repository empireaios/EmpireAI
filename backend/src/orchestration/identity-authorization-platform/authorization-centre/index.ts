/**
 * G8-05 — Authorization Centre Cockpit public surface.
 */

import { authorizationCentrePluginRegistry } from "./cockpit/authorization-centre-plugin-registry.js";
import { resetConnectionHealthHarnessForTests } from "../connection-health-monitoring/index.js";
import { resetCredentialVaultHarnessForTests } from "../credential-vault-integration/index.js";
import { resetAuthorizationFrameworkHarnessForTests } from "../authorization-framework/index.js";
import { resetConnectionRegistryHarnessForTests } from "../connection-registry/index.js";

export {
  AUTHORIZATION_CENTRE_VERSION,
  AUTHORIZATION_CENTRE_SCREEN_ID,
  AUTHORIZATION_CENTRE_ROUTE,
  type AuthorizationCentreView,
  type AuthorizationProviderDetailView,
  type AuthorizationProviderCard,
  type AuthorizationCentreAction,
  type AuthorizationCentreOverview,
} from "./contracts/authorization-centre-types.js";

export {
  COCKPIT_AUTHORIZATION_CENTRE_MODULE_ID,
  AUTHORIZATION_CENTRE_CAPABILITIES,
  createAuthorizationCentreModuleContract,
  type AuthorizationCentreModuleContract,
} from "./contract/authorization-centre-module.js";

export {
  loadAuthorizationCentreView,
  loadAuthorizationCentreDetailView,
  loadAuthorizationCentreAttentionItems,
} from "./cockpit/authorization-centre-view-loader.js";

export { validateAuthorizationCentreAction } from "./cockpit/authorization-centre-pillow-governance.js";
export { authorizationCentrePluginRegistry } from "./cockpit/authorization-centre-plugin-registry.js";
export { authorizationCentreTools } from "./tools/authorization-centre-tools.js";

export function resetAuthorizationCentreHarnessForTests(): void {
  resetConnectionRegistryHarnessForTests();
  resetAuthorizationFrameworkHarnessForTests();
  resetCredentialVaultHarnessForTests();
  resetConnectionHealthHarnessForTests();
  authorizationCentrePluginRegistry.resetForTests();
}
