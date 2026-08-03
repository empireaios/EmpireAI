import { EnterpriseKpiAggregator } from "./enterprise-kpi-aggregator.js";
/** Composes non-sensitive structural dashboard views. */
export class EmpireDashboardEngine {
  constructor(private readonly kpis = new EnterpriseKpiAggregator()) {}
  buildEnterpriseKpiSummary() { return this.kpis.aggregate(); }
}
