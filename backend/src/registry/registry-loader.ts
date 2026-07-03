/**
 * EA-003 — RegistryLoader facade (EA-002 canonical hierarchy).
 */

import { defaultRegistryCache, type RegistryCache } from "./cache/registry-cache.js";
import { buildDiscoverySnapshotView } from "./derived/discovery-view.js";
import { DOCTRINE_REGISTRY_VERSION, loadDoctrineRows } from "./sources/constitutional-source.js";
import {
  loadChannelRows,
  loadDeploymentProfileRows,
  resolveDeploymentProfileId,
} from "./sources/deployment-source.js";
import {
  AUTOMATION_REGISTRY_VERSION,
  loadAutomationRegistryRows,
} from "./sources/automation-source.js";
import {
  COMMERCE_REGISTRY_VERSION,
  loadCommerceRegistryRows,
} from "./sources/commerce-source.js";
import {
  CERTIFICATION_REGISTRY_VERSION,
  loadCertificationRegistryRows,
} from "./sources/certification-source.js";
import { loadLiveOperationsRegistryRows } from "./sources/live-operations-source.js";
import { loadIdentityAuthorizationRegistryRows } from "./sources/identity-authorization-source.js";
import { loadConnectionRegistryRows } from "./sources/connection-registry-source.js";
import { loadProductionWorkspaceRegistryRows } from "./sources/production-workspace-source.js";
import {
  PLATFORM_CATALOG_VERSION,
  loadCountryRows,
  loadRegionRows,
} from "./sources/platform-catalog-source.js";
import { buildPlaceholderNotice } from "./sources/placeholder-source.js";
import {
  DERIVED_ACTIVATION_SNAPSHOT,
  DERIVED_DISCOVERY_SNAPSHOT,
  DERIVED_READINESS_SNAPSHOT,
  REGISTRY_IDS,
  REGISTRY_TIER_BY_ID,
  REG_AI_ENGINE,
  REG_BRAND,
  REG_BUSINESS_RULE,
  REG_CATEGORY,
  REG_CHANNEL,
  REG_COMPANY,
  REG_COUNTRY,
  REG_DEPLOYMENT_PROFILE,
  REG_DOCTRINE,
  REG_INTEGRATION,
  REG_MARKETPLACE,
  REG_PRICING_POLICY,
  REG_PRODUCT,
  REG_PROVIDER,
  REG_REGION,
  REG_SCORING_POLICY,
  REG_SUPPLIER,
  REG_TENANT,
  REG_WORKFLOW,
  REG_AUTOMATION_TRIGGER,
  REG_AUTOMATION_WORKFLOW,
  REG_AUTOMATION_SCHEDULE,
  REG_AUTOMATION_POLICY,
  REG_AUTOMATION_APPROVAL,
  REG_AUTOMATION_EXECUTOR,
  REG_AUTOMATION_RECOVERY,
  REG_AUTOMATION_NOTIFICATION,
  REG_AUTOMATION_REPORT,
  REG_AUTOMATION_MONITOR,
  REG_CERTIFICATION_DOMAIN,
  REG_CERTIFICATION_CHECK,
  REG_CERTIFICATION_GATE,
  REG_CERTIFICATION_INTEGRITY,
  REG_CERTIFICATION_SECURITY,
  REG_CERTIFICATION_DEPLOYMENT,
  REG_CERTIFICATION_OPERATIONAL,
  REG_CERTIFICATION_BUSINESS,
  REG_CERTIFICATION_PERFORMANCE,
  REG_CERTIFICATION_EXECUTIVE,
  REG_CERTIFICATION_FAILURE_RECOVERY,
  REG_CERTIFICATION_SIMULATION,
  REG_CERTIFICATION_FINAL_READINESS,
  REG_LIVE_OPERATIONS_DOMAIN,
  REG_LIVE_OPERATIONS_PROFILE,
  REG_LIVE_OPERATIONS_FINAL_CERTIFICATION,
  REG_WORKSPACE,
  REG_READINESS_POLICY,
  REG_CONNECTION_PROVIDER,
  REG_IDENTITY_PROVIDER,
  REG_EXECUTIVE_POLICY,
  REG_FINANCIAL_POLICY,
  REG_OPTIMIZATION_POLICY,
  REG_IDENTITY_MONITOR,
  REG_AUTHORIZATION_PROVIDER,
  REG_CREDENTIAL_TYPE,
  REG_CONNECTION_TYPE,
  REG_CONNECTION_POLICY,
  REG_IDENTITY_REPORT,
  REG_IDENTITY_NOTIFICATION,
  REG_CONNECTION_SCOPE,
  REG_CONNECTION_PERMISSION,
  REG_CONNECTION_ACCOUNT_HOLDER,
  REG_CONNECTION_REQUIREMENT,
  REG_CONNECTION_CAPABILITY,
  REG_CONNECTION_DEPENDENCY,
  isAutomationRegistryId,
  isCertificationRegistryId,
  isLiveOperationsRegistryId,
  isIdentityAuthorizationRegistryId,
  isProductionWorkspaceRegistryId,
  isCommerceRegistryId,
  type DerivedViewId,
  type RegistryId,
} from "./types/registry-ids.js";
import type {
  RegistryPluginManifest,
  RegistryPluginRegistrationResult,
} from "./types/plugin-manifest.js";
import {
  CACHE_POLICY_BY_REGISTRY,
  CACHE_TTL_MS,
  type RegistryDerivedResult,
  type RegistryLoaderContext,
  type RegistryLoaderContract,
  type RegistryQuery,
  type RegistryResolveResult,
  type RegistrySnapshotMeta,
} from "./types/registry-types.js";
import {
  assertDerivedViewId,
  assertRegistryId,
  createPlaceholderRows,
  isPlaceholderRegistry,
  validatePluginManifest,
  validateResolveRequest,
} from "./validation/registry-validator.js";

const REGISTRY_VERSION = "ea-003-v1";

function simpleHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(8, "0");
}

export class RegistryLoader implements RegistryLoaderContract {
  private readonly cache: RegistryCache;
  private readonly plugins = new Map<string, RegistryPluginManifest>();

  constructor(cache: RegistryCache = defaultRegistryCache) {
    this.cache = cache;
  }

  resolve<T = unknown>(
    context: RegistryLoaderContext,
    registryId: RegistryId,
    query?: RegistryQuery,
  ): RegistryResolveResult<T> {
    assertRegistryId(registryId);
    validateResolveRequest(context, registryId, query);

    const deploymentProfileId = resolveDeploymentProfileId(context);
    const cachePolicy = CACHE_POLICY_BY_REGISTRY[registryId];
    const cacheKey = this.cache.buildKey([
      "resolve",
      registryId,
      deploymentProfileId,
      context.workspaceId,
      query?.countryCode,
      query?.registryRowId,
    ]);

    const cached = this.cache.get<RegistryResolveResult<T>>(cacheKey, cachePolicy);
    if (cached) {
      return cached;
    }

    const rows = this.loadRows(context, registryId, query) as T[];
    const wired = !isPlaceholderRegistry(registryId);
    const result: RegistryResolveResult<T> = {
      meta: this.buildMeta(registryId, rows.length, wired, deploymentProfileId, rows),
      rows,
    };

    this.cache.set(cacheKey, result, cachePolicy, CACHE_TTL_MS[cachePolicy]);
    return result;
  }

  resolveDerivedView<T = unknown>(
    context: RegistryLoaderContext,
    viewId: DerivedViewId,
    query?: RegistryQuery,
  ): RegistryDerivedResult<T> {
    assertDerivedViewId(viewId);

    const deploymentProfileId = resolveDeploymentProfileId(context);
    const cachePolicy = CACHE_POLICY_BY_REGISTRY[viewId];
    const cacheKey = this.cache.buildKey([
      "derived",
      viewId,
      deploymentProfileId,
      context.workspaceId,
      query?.countryCode,
    ]);

    const cached = this.cache.get<RegistryDerivedResult<T>>(cacheKey, cachePolicy);
    if (cached) {
      return cached;
    }

    const view = this.loadDerivedView(context, viewId, query) as T;
    const result: RegistryDerivedResult<T> = {
      meta: this.buildMeta(viewId, 1, viewId === DERIVED_DISCOVERY_SNAPSHOT, deploymentProfileId, view),
      view,
    };

    this.cache.set(cacheKey, result, cachePolicy, CACHE_TTL_MS[cachePolicy]);
    return result;
  }

  registerPlugin(manifest: RegistryPluginManifest): RegistryPluginRegistrationResult {
    validatePluginManifest(manifest);
    if (this.plugins.has(manifest.pluginId)) {
      return {
        accepted: false,
        pluginId: manifest.pluginId,
        message: `Plugin already registered: ${manifest.pluginId}`,
      };
    }
    this.plugins.set(manifest.pluginId, {
      ...manifest,
      registeredAt: new Date().toISOString(),
    });
    return {
      accepted: true,
      pluginId: manifest.pluginId,
      message: "Plugin registered (manifest stored; row injection deferred to future EA mission)",
    };
  }

  listRegisteredPlugins(): readonly RegistryPluginManifest[] {
    return [...this.plugins.values()];
  }

  listFoundationStatus(): Array<{
    registryId: RegistryId | DerivedViewId;
    tier: (typeof REGISTRY_TIER_BY_ID)[RegistryId];
    wired: boolean;
  }> {
    return [
      ...REGISTRY_IDS.map((registryId) => ({
        registryId,
        tier: REGISTRY_TIER_BY_ID[registryId],
        wired: !isPlaceholderRegistry(registryId),
      })),
      {
        registryId: DERIVED_DISCOVERY_SNAPSHOT,
        tier: REGISTRY_TIER_BY_ID[DERIVED_DISCOVERY_SNAPSHOT],
        wired: true,
      },
      {
        registryId: DERIVED_ACTIVATION_SNAPSHOT,
        tier: REGISTRY_TIER_BY_ID[DERIVED_ACTIVATION_SNAPSHOT],
        wired: false,
      },
      {
        registryId: DERIVED_READINESS_SNAPSHOT,
        tier: REGISTRY_TIER_BY_ID[DERIVED_READINESS_SNAPSHOT],
        wired: false,
      },
    ];
  }

  private loadRows(
    context: RegistryLoaderContext,
    registryId: RegistryId,
    query?: RegistryQuery,
  ): unknown[] {
    switch (registryId) {
      case REG_DOCTRINE:
        return loadDoctrineRows();
      case REG_REGION:
        return loadRegionRows();
      case REG_COUNTRY:
        return loadCountryRows(query);
      case REG_CHANNEL:
        return loadChannelRows(query);
      case REG_DEPLOYMENT_PROFILE:
        return loadDeploymentProfileRows(context);
      case REG_AUTOMATION_TRIGGER:
      case REG_AUTOMATION_WORKFLOW:
      case REG_AUTOMATION_SCHEDULE:
      case REG_AUTOMATION_POLICY:
      case REG_AUTOMATION_APPROVAL:
      case REG_AUTOMATION_EXECUTOR:
      case REG_AUTOMATION_RECOVERY:
      case REG_AUTOMATION_NOTIFICATION:
      case REG_AUTOMATION_REPORT:
      case REG_AUTOMATION_MONITOR:
        return loadAutomationRegistryRows(registryId, query);
      case REG_CERTIFICATION_DOMAIN:
      case REG_CERTIFICATION_CHECK:
      case REG_CERTIFICATION_GATE:
      case REG_CERTIFICATION_INTEGRITY:
      case REG_CERTIFICATION_SECURITY:
      case REG_CERTIFICATION_DEPLOYMENT:
      case REG_CERTIFICATION_OPERATIONAL:
      case REG_CERTIFICATION_BUSINESS:
      case REG_CERTIFICATION_PERFORMANCE:
      case REG_CERTIFICATION_EXECUTIVE:
      case REG_CERTIFICATION_FAILURE_RECOVERY:
      case REG_CERTIFICATION_SIMULATION:
      case REG_CERTIFICATION_FINAL_READINESS:
        return loadCertificationRegistryRows(registryId, query);
      case REG_LIVE_OPERATIONS_DOMAIN:
      case REG_LIVE_OPERATIONS_PROFILE:
      case REG_LIVE_OPERATIONS_FINAL_CERTIFICATION:
        return loadLiveOperationsRegistryRows(registryId, query);
      case REG_WORKSPACE:
      case REG_READINESS_POLICY:
      case REG_CONNECTION_PROVIDER:
      case REG_IDENTITY_PROVIDER:
      case REG_EXECUTIVE_POLICY:
      case REG_FINANCIAL_POLICY:
      case REG_OPTIMIZATION_POLICY:
      case REG_IDENTITY_MONITOR:
        return loadProductionWorkspaceRegistryRows(registryId, query);
      case REG_AUTHORIZATION_PROVIDER:
      case REG_CREDENTIAL_TYPE:
      case REG_CONNECTION_TYPE:
      case REG_CONNECTION_POLICY:
      case REG_IDENTITY_REPORT:
      case REG_IDENTITY_NOTIFICATION:
        return loadIdentityAuthorizationRegistryRows(registryId, query);
      case REG_CONNECTION_SCOPE:
      case REG_CONNECTION_PERMISSION:
      case REG_CONNECTION_ACCOUNT_HOLDER:
      case REG_CONNECTION_REQUIREMENT:
      case REG_CONNECTION_CAPABILITY:
      case REG_CONNECTION_DEPENDENCY:
        return loadConnectionRegistryRows(registryId, query);
      case REG_BUSINESS_RULE:
      case REG_PROVIDER:
      case REG_INTEGRATION:
      case REG_SCORING_POLICY:
      case REG_PRICING_POLICY:
      case REG_AI_ENGINE:
      case REG_WORKFLOW:
      case REG_TENANT:
      case REG_COMPANY:
      case REG_PRODUCT:
        return [buildPlaceholderNotice(registryId), ...createPlaceholderRows(registryId)];
      default:
        if (isCommerceRegistryId(registryId)) {
          return loadCommerceRegistryRows(registryId, query);
        }
        {
          const exhaustive: never = registryId;
          throw new Error(`Unhandled registry: ${exhaustive}`);
        }
    }
  }

  private loadDerivedView(
    context: RegistryLoaderContext,
    viewId: DerivedViewId,
    query?: RegistryQuery,
  ): unknown {
    switch (viewId) {
      case DERIVED_DISCOVERY_SNAPSHOT:
        return buildDiscoverySnapshotView(context, query);
      case DERIVED_ACTIVATION_SNAPSHOT:
      case DERIVED_READINESS_SNAPSHOT:
        return {
          viewId,
          status: "placeholder",
          message: `${viewId} deferred to future EA mission`,
        };
      default: {
        const exhaustive: never = viewId;
        throw new Error(`Unhandled derived view: ${exhaustive}`);
      }
    }
  }

  private buildMeta(
    registryId: RegistryId | DerivedViewId,
    rowCount: number,
    wired: boolean,
    deploymentProfileId: string,
    payload: unknown,
  ): RegistrySnapshotMeta {
    const version =
      registryId === REG_DOCTRINE
        ? DOCTRINE_REGISTRY_VERSION
        : isAutomationRegistryId(registryId)
          ? AUTOMATION_REGISTRY_VERSION
          : isCertificationRegistryId(registryId)
            ? CERTIFICATION_REGISTRY_VERSION
            : isCommerceRegistryId(registryId)
            ? COMMERCE_REGISTRY_VERSION
            : registryId === REG_REGION || registryId === REG_COUNTRY
              ? PLATFORM_CATALOG_VERSION
              : REGISTRY_VERSION;

    return {
      registryId,
      tier: REGISTRY_TIER_BY_ID[registryId],
      version,
      contentHash: simpleHash(JSON.stringify(payload)),
      loadedAt: new Date().toISOString(),
      deploymentProfileId,
      rowCount,
      wired,
    };
  }
}

let sharedLoader: RegistryLoader | undefined;

export function getRegistryLoader(): RegistryLoader {
  if (!sharedLoader) {
    sharedLoader = new RegistryLoader();
  }
  return sharedLoader;
}

export function resetRegistryLoaderForTests(): void {
  sharedLoader = undefined;
  defaultRegistryCache.invalidate();
}
