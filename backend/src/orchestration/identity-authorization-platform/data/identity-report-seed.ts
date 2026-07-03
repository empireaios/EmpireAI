/**
 * G8-00 — Identity report seed (REG-IDENTITY-REPORT).
 */

import {
  IDENTITY_AUTHORIZATION_REGISTRY_VERSION,
  type IdentityAuthorizationRegistryRowBase,
} from "../../../registry/types/identity-authorization-registry-types.js";

export const IDENTITY_REPORT_SEED_ROWS: IdentityAuthorizationRegistryRowBase[] = [
  {
    id: "identity-report-executive-summary",
    name: "Identity executive summary report",
    description: "Executive summary report for Identity & Authorization Platform",
    status: "VALIDATED",
    version: "1.0.0",
    owner: "pillow:governance",
    dependencies: ["REG-IDENTITY-PROVIDER"],
    capabilities: ["report"],
    configuration: {
      identityReport: {
        schemaVersion: IDENTITY_AUTHORIZATION_REGISTRY_VERSION,
        reportId: "identity-report-executive-summary",
        reportName: "Executive Summary",
        reportKind: "executive_summary",
        configurable: true,
      },
    },
    supportedRegions: [],
    supportedCountries: [],
    validation: { schemaVersion: IDENTITY_AUTHORIZATION_REGISTRY_VERSION },
    pluginSupport: { allowPluginRegistration: true },
    workspaceScope: { scope: "global" },
    futureCompatibility: { notes: "Reporting foundation only" },
  },
  {
    id: "identity-report-provider-status",
    name: "Provider status report",
    description: "Provider status report for IAP",
    status: "VALIDATED",
    version: "1.0.0",
    owner: "pillow:governance",
    dependencies: ["REG-AUTHORIZATION-PROVIDER"],
    capabilities: ["report"],
    configuration: {
      identityReport: {
        schemaVersion: IDENTITY_AUTHORIZATION_REGISTRY_VERSION,
        reportId: "identity-report-provider-status",
        reportName: "Provider Status",
        reportKind: "provider_status",
        configurable: true,
      },
    },
    supportedRegions: [],
    supportedCountries: [],
    validation: { schemaVersion: IDENTITY_AUTHORIZATION_REGISTRY_VERSION },
    pluginSupport: { allowPluginRegistration: true },
    workspaceScope: { scope: "global" },
    futureCompatibility: { notes: "Reporting foundation only" },
  },
];
