import type { IntegrationHandshake } from "./types.js";

export type WorkerRegistryHandle = {
  listWorkers?: (...args: any[]) => any;
  getWorkers?: (...args: any[]) => any;
} & Record<string, any>;

export type ExecutiveReportingRuntimeHandle = {
  submitWorkerReport?: (...args: any[]) => any;
} & Record<string, any>;

export type AuditRuntimeHandle = {
  recordAuditEvent?: (...args: any[]) => any;
} & Record<string, any>;

export type WorkerRecoverySystemHandle = {
  registerRecoveryTarget?: (...args: any[]) => any;
} & Record<string, any>;

export type FactoryCoreHandle = {
  getState?: (...args: any[]) => any;
} & Record<string, any>;

export type SharedRuntimeCoreDependencies = {
  workerRegistry?: WorkerRegistryHandle;
  executiveReportingRuntime?: ExecutiveReportingRuntimeHandle;
  auditRuntime?: AuditRuntimeHandle;
  workerRecoverySystem?: WorkerRecoverySystemHandle;
  empireBuilderFactory?: FactoryCoreHandle;
  commerceFactory?: FactoryCoreHandle;
  mediaFactory?: FactoryCoreHandle;
  digitalProductsFactory?: FactoryCoreHandle;
  enterprisePlatformFactory?: FactoryCoreHandle;
  localBusinessFactory?: FactoryCoreHandle;
  affiliateFactory?: FactoryCoreHandle;
  capitalFactory?: FactoryCoreHandle;
  workforceOs?: FactoryCoreHandle;
};

export class SrtcIntegrationCoordinator {
  private deps: SharedRuntimeCoreDependencies = {};

  bind(deps: SharedRuntimeCoreDependencies = {}) {
    this.deps = { ...this.deps, ...deps };
  }

  getDependencies() {
    return { ...this.deps };
  }

  connect(integrationTargets: string[]): IntegrationHandshake[] {
    const map: Record<string, unknown> = {
      worker_registry: this.deps.workerRegistry,
      executive_reporting_runtime: this.deps.executiveReportingRuntime,
      audit_runtime: this.deps.auditRuntime,
      worker_recovery_system: this.deps.workerRecoverySystem,
      empire_builder_factory: this.deps.empireBuilderFactory,
      commerce_factory: this.deps.commerceFactory,
      media_factory: this.deps.mediaFactory,
      digital_products_factory: this.deps.digitalProductsFactory,
      enterprise_platform_factory: this.deps.enterprisePlatformFactory,
      local_business_factory: this.deps.localBusinessFactory,
      affiliate_factory: this.deps.affiliateFactory,
      capital_factory: this.deps.capitalFactory,
      workforce_os: this.deps.workforceOs,
    };

    return integrationTargets.map((target) => {
      const handle = map[target];
      const available = handle != null;
      return {
        target,
        available,
        probed: true,
        notes: available
          ? [`${target} connected — presence only`]
          : [`${target} unavailable`],
      };
    });
  }

  submitReport(report: unknown) {
    const err = this.deps.executiveReportingRuntime;
    if (err?.submitWorkerReport) {
      return err.submitWorkerReport(report);
    }
    return { records: [], offline: true };
  }
}
