import type {
  ExecutionContext,
  FactoryRegistration,
  RoutingRecord,
  RuntimeServiceRecord,
  SharedRuntimeReport,
  WorkerRegistration,
} from "./types.js";

let sequence = 0;

export function resetSrtcSequenceForTesting() {
  sequence = 0;
}

export function nextSrtcId(prefix: string) {
  sequence += 1;
  return `${prefix}-${Date.now()}-${sequence}`;
}

export class RuntimeStore {
  private factories = new Map<string, FactoryRegistration>();
  private workers = new Map<string, WorkerRegistration>();
  private services = new Map<string, RuntimeServiceRecord>();
  private contexts = new Map<string, ExecutionContext>();
  private routes = new Map<string, RoutingRecord>();
  private reports: SharedRuntimeReport[] = [];
  private auditTrail: string[] = [];

  seedFactories(factories: FactoryRegistration[]) {
    for (const factory of factories) {
      this.factories.set(factory.factoryKey, { ...factory, notes: [...(factory.notes ?? [])] });
    }
  }

  seedWorkers(workers: WorkerRegistration[]) {
    for (const worker of workers) {
      this.workers.set(worker.workerId, { ...worker, notes: [...(worker.notes ?? [])] });
    }
  }

  registerFactory(factory: FactoryRegistration) {
    this.factories.set(factory.factoryKey, { ...factory, notes: [...(factory.notes ?? [])] });
    this.auditTrail.push(`factory_registered:${factory.factoryKey}@${factory.registeredAt}`);
    return this.factories.get(factory.factoryKey)!;
  }

  registerWorker(worker: WorkerRegistration) {
    this.workers.set(worker.workerId, { ...worker, notes: [...(worker.notes ?? [])] });
    this.auditTrail.push(`worker_registered:${worker.workerId}@${worker.registeredAt}`);
    return this.workers.get(worker.workerId)!;
  }

  registerService(service: RuntimeServiceRecord) {
    this.services.set(service.serviceId, { ...service, notes: [...service.notes] });
    return service;
  }

  saveContext(context: ExecutionContext) {
    this.contexts.set(context.contextId, {
      ...context,
      traceabilityRefs: [...context.traceabilityRefs],
      factoryKeys: [...context.factoryKeys],
      workerIds: [...context.workerIds],
      metadata: { ...context.metadata },
    });
    return context;
  }

  saveRoute(route: RoutingRecord) {
    this.routes.set(route.routeId, {
      ...route,
      notes: [...route.notes],
      traceabilityRefs: [...route.traceabilityRefs],
    });
    this.auditTrail.push(`route_recorded:${route.routeId}@${route.timestamp}`);
    return route;
  }

  saveReport(report: SharedRuntimeReport) {
    this.reports.push({
      ...report,
      registeredFactories: report.registeredFactories.map((f) => ({ ...f, notes: [...(f.notes ?? [])] })),
      registeredWorkers: report.registeredWorkers.map((w) => ({ ...w, notes: [...(w.notes ?? [])] })),
      runtimeServices: report.runtimeServices.map((s) => ({ ...s, notes: [...s.notes] })),
      dependencyStatus: report.dependencyStatus.map((d) => ({ ...d, notes: [...d.notes] })),
      supportingEvidence: [...report.supportingEvidence],
      outstandingIssues: [...report.outstandingIssues],
      runtimeDiagnostics: {
        ...report.runtimeDiagnostics,
        integrationHandshakes: report.runtimeDiagnostics.integrationHandshakes.map((h) => ({
          ...h,
          notes: [...h.notes],
        })),
        notes: [...report.runtimeDiagnostics.notes],
      },
    });
    this.auditTrail.push(`report_saved:${report.reportId}@${report.timestamp}`);
    return report;
  }

  listFactories() {
    return [...this.factories.values()].map((f) => ({ ...f, notes: [...(f.notes ?? [])] }));
  }

  listWorkers() {
    return [...this.workers.values()].map((w) => ({ ...w, notes: [...(w.notes ?? [])] }));
  }

  listServices() {
    return [...this.services.values()].map((s) => ({ ...s, notes: [...s.notes] }));
  }

  listContexts() {
    return [...this.contexts.values()];
  }

  listRoutes() {
    return [...this.routes.values()];
  }

  listReports() {
    return this.reports.map((r) => ({ ...r }));
  }

  getLatestReport() {
    return this.reports.length ? this.reports[this.reports.length - 1] : null;
  }

  getFactory(key: string) {
    const f = this.factories.get(key);
    return f ? { ...f, notes: [...(f.notes ?? [])] } : null;
  }

  getAuditTrail() {
    return [...this.auditTrail];
  }
}
