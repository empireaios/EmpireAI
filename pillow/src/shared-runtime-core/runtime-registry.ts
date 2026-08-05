import { RUNTIME_SERVICES, SHARED_RUNTIME_VERSION, SRTC_METADATA_VERSION } from "./paths.js";
import { nextSrtcId } from "./runtime-store.js";
import type { RuntimeStore } from "./runtime-store.js";
import type { SharedRuntimeCoreDependencies } from "./integrations.js";
import type { DependencyStatus, IntegrationHandshake, RuntimeServiceRecord } from "./types.js";

export class RuntimeRegistry {
  constructor(private readonly store: RuntimeStore) {}

  bootstrapServices(): RuntimeServiceRecord[] {
    const now = new Date().toISOString();
    const services: RuntimeServiceRecord[] = RUNTIME_SERVICES.map((serviceName) => ({
      serviceId: nextSrtcId(`srtc-svc-${serviceName}`),
      serviceName,
      status: "connected",
      registeredAt: now,
      version: SHARED_RUNTIME_VERSION,
      fabricated: false,
      notes: [`Runtime service ${serviceName} registered`],
    }));
    for (const service of services) {
      this.store.registerService(service);
    }
    return services;
  }

  discoverServices(): RuntimeServiceRecord[] {
    return this.store.listServices();
  }

  resolveDependencies(deps: SharedRuntimeCoreDependencies): DependencyStatus[] {
    const targets = [
      { target: "worker_registry", handle: deps.workerRegistry },
      { target: "executive_reporting_runtime", handle: deps.executiveReportingRuntime },
      { target: "audit_runtime", handle: deps.auditRuntime },
      { target: "worker_recovery_system", handle: deps.workerRecoverySystem },
      { target: "empire_builder_factory", handle: deps.empireBuilderFactory },
      { target: "commerce_factory", handle: deps.commerceFactory },
      { target: "media_factory", handle: deps.mediaFactory },
      { target: "digital_products_factory", handle: deps.digitalProductsFactory },
      { target: "enterprise_platform_factory", handle: deps.enterprisePlatformFactory },
      { target: "local_business_factory", handle: deps.localBusinessFactory },
      { target: "affiliate_factory", handle: deps.affiliateFactory },
      { target: "capital_factory", handle: deps.capitalFactory },
      { target: "workforce_os", handle: deps.workforceOs },
    ];

    return targets.map(({ target, handle }) => {
      const available = handle != null;
      return {
        target,
        status: available ? "available" : "unavailable",
        probed: true,
        fabricated: false,
        notes: available
          ? [`${target} handle present — presence only, no business logic invoked`]
          : [`${target} unavailable — not injected or not probed`],
      };
    });
  }

  buildIntegrationHandshakes(deps: SharedRuntimeCoreDependencies): IntegrationHandshake[] {
    return this.resolveDependencies(deps).map((d) => ({
      target: d.target,
      available: d.status === "available",
      probed: d.probed,
      notes: [...d.notes],
    }));
  }
}
