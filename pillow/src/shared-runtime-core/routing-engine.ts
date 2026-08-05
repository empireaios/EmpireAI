import { SRTC_METADATA_VERSION } from "./paths.js";
import { nextSrtcId } from "./runtime-store.js";
import type { FactoryRegistry } from "./factory-registry.js";
import type { RuntimeStore } from "./runtime-store.js";
import type { RoutingRecord } from "./types.js";

export class RoutingEngine {
  constructor(
    private readonly store: RuntimeStore,
    private readonly factoryRegistry: FactoryRegistry,
  ) {}

  routeRequest(sourceFactory: string, targetFactory: string, service: string): RoutingRecord {
    const factories = this.factoryRegistry.list();
    const source = factories.find((f) => f.factoryKey === sourceFactory);
    const target = factories.find((f) => f.factoryKey === targetFactory);

    const notes: string[] = [
      "Routing record only — no factory or worker business logic invoked",
      `Requested service: ${service}`,
    ];

    let routingStatus: RoutingRecord["routingStatus"] = "routed";
    if (!source) {
      routingStatus = "blocked";
      notes.push(`Source factory ${sourceFactory} not registered`);
    }
    if (!target) {
      routingStatus = "blocked";
      notes.push(`Target factory ${targetFactory} not registered`);
    }
    if (!service?.trim()) {
      routingStatus = "blocked";
      notes.push("Service name is required");
    }

    const route: RoutingRecord = {
      routeId: nextSrtcId("srtc-route"),
      timestamp: new Date().toISOString(),
      sourceFactory,
      targetFactory,
      service,
      routingStatus,
      businessLogicInvoked: false,
      notes,
      traceabilityRefs: ["q10-01", "shared-runtime-core", "routing-record"],
      metadataVersion: SRTC_METADATA_VERSION,
    };
    this.store.saveRoute(route);
    return route;
  }

  listRoutes(): RoutingRecord[] {
    return this.store.listRoutes();
  }

  deterministicRouteKey(sourceFactory: string, targetFactory: string, service: string) {
    return [sourceFactory, targetFactory, service].join("::");
  }
}
