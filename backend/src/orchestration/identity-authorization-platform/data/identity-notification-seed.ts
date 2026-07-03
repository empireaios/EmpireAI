/**
 * G8-00 — Identity notification seed (REG-IDENTITY-NOTIFICATION).
 */

import {
  IDENTITY_AUTHORIZATION_REGISTRY_VERSION,
  type IdentityAuthorizationRegistryRowBase,
} from "../../../registry/types/identity-authorization-registry-types.js";

export const IDENTITY_NOTIFICATION_SEED_ROWS: IdentityAuthorizationRegistryRowBase[] = [
  {
    id: "identity-notification-foundation",
    name: "Identity platform notification policy",
    description: "Foundation notification events for IAP learning records",
    status: "VALIDATED",
    version: "1.0.0",
    owner: "pillow:governance",
    dependencies: ["REG-IDENTITY-PROVIDER"],
    capabilities: ["notify"],
    configuration: {
      identityNotification: {
        schemaVersion: IDENTITY_AUTHORIZATION_REGISTRY_VERSION,
        notificationId: "identity-notification-foundation",
        notificationName: "IAP Foundation Notifications",
        eventKindRefs: [
          "connection",
          "disconnection",
          "authorization",
          "permission_change",
          "provider_failure",
          "expiry",
          "manual_override",
          "executive_action",
        ],
        configurable: true,
      },
    },
    supportedRegions: [],
    supportedCountries: [],
    validation: { schemaVersion: IDENTITY_AUTHORIZATION_REGISTRY_VERSION },
    pluginSupport: { allowPluginRegistration: true },
    workspaceScope: { scope: "global" },
    futureCompatibility: { notes: "Notification delivery deferred to later G8 missions" },
  },
];
