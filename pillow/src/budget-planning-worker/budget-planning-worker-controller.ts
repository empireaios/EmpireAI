import type { BudgetPlanningWorkerConfiguration } from "./configuration.js";
import type { BudgetPlanningWorkerDependencies } from "./integrations.js";
import { BudgetPlanningWorkerManager } from "./budget-manager.js";
import type { BpwInput, BpwRunReport, EngineStatus } from "./types.js";

export class BudgetPlanningWorkerController {
  private status: EngineStatus = "idle";
  private latestReport: BpwRunReport | null = null;

  constructor(
    private readonly manager: BudgetPlanningWorkerManager,
    private readonly config: BudgetPlanningWorkerConfiguration,
  ) {}

  initialize() {
    this.manager.ensureSeeded(this.config);
    this.status = "active";
  }

  bindIntegrations(deps: BudgetPlanningWorkerDependencies = {}) {
    this.manager.bindIntegrations(deps);
  }

  getStatus() {
    return this.status;
  }

  getManager() {
    return this.manager;
  }

  getConfiguration() {
    return {
      ...this.config,
      budgetCategories: [...this.config.budgetCategories],
      budgetPeriods: [...this.config.budgetPeriods],
      approvalStatuses: [...this.config.approvalStatuses],
      currencies: [...this.config.currencies],
      integrationTargets: [...this.config.integrationTargets],
      reportingLine: [...this.config.reportingLine],
      seedBudgets: this.config.seedBudgets.map((b) => ({
        ...b,
        businessOrProject: { ...b.businessOrProject },
        plannedAmount: { ...b.plannedAmount },
        actualExpenditure: { ...b.actualExpenditure },
        remainingBudget: { ...b.remainingBudget },
        varianceAmount: { ...b.varianceAmount },
        supportingNotes: [...b.supportingNotes],
        traceabilityRefs: [...b.traceabilityRefs],
      })),
    };
  }

  getLatestReport() {
    return this.latestReport;
  }

  connect(input: Record<string, unknown> = {}) {
    this.status = "connecting";
    return this.finish(this.manager.connect(input, this.config));
  }

  createProjectBudget(input: BpwInput = {}) {
    this.status = "creating_budget";
    return this.finish(this.manager.createProjectBudget(input, this.config));
  }

  createBusinessBudget(input: BpwInput = {}) {
    this.status = "creating_budget";
    return this.finish(this.manager.createBusinessBudget(input, this.config));
  }

  createAdvertisingBudget(input: BpwInput = {}) {
    this.status = "creating_budget";
    return this.finish(this.manager.createAdvertisingBudget(input, this.config));
  }

  createInfrastructureBudget(input: BpwInput = {}) {
    this.status = "creating_budget";
    return this.finish(this.manager.createInfrastructureBudget(input, this.config));
  }

  createBudget(input: BpwInput = {}) {
    this.status = "creating_budget";
    return this.finish(this.manager.createBudget(input, this.config));
  }

  trackBudgetUtilisation(input: BpwInput = {}) {
    this.status = "tracking_utilisation";
    return this.finish(this.manager.trackBudgetUtilisation(input, this.config));
  }

  detectBudgetOverruns(input: BpwInput = {}) {
    this.status = "detecting_variance";
    return this.finish(this.manager.detectBudgetOverruns(input, this.config));
  }

  detectUnderutilisedBudgets(input: BpwInput = {}) {
    this.status = "detecting_variance";
    return this.finish(this.manager.detectUnderutilisedBudgets(input, this.config));
  }

  compareActualVsBudget(input: BpwInput = {}) {
    this.status = "detecting_variance";
    return this.finish(this.manager.compareActualVsBudget(input, this.config));
  }

  recommendBudgetAdjustments(input: BpwInput = {}) {
    this.status = "recommending";
    return this.finish(this.manager.recommendBudgetAdjustments(input, this.config));
  }

  produceBudgetPlanningReport(input: BpwInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.produceBudgetPlanningReport(input, this.config));
  }

  submitReport(input: BpwInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.submitReport(input, this.config));
  }

  list() {
    this.status = "active";
    return this.finish(this.manager.list(this.config));
  }

  validate(input: BpwInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.validate(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  runDiagnostics() {
    return this.diagnostics();
  }

  getQ905ConsumableContract() {
    return this.manager.getQ905ConsumableContract(this.config);
  }

  private finish(report: BpwRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
