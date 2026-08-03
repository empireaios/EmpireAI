import type { SupplierNegotiationWorkerConfiguration } from "./configuration.js";
import type { SupplierNegotiationWorkerDependencies } from "./integrations.js";
import { NegotiationManager } from "./negotiation-manager.js";
import type {
  EngineStatus,
  SupplierNegotiationWorkerInput,
  SupplierNegotiationWorkerRunReport,
} from "./types.js";

export class SupplierNegotiationWorkerController {
  private status: EngineStatus = "idle";
  private latestReport: SupplierNegotiationWorkerRunReport | null = null;

  constructor(
    private readonly manager: NegotiationManager,
    private readonly config: SupplierNegotiationWorkerConfiguration,
  ) {}

  initialize() {
    this.manager.ensureSeeded(this.config);
    this.status = "active";
  }

  bindIntegrations(deps: SupplierNegotiationWorkerDependencies = {}) {
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
      recommendations: [...this.config.recommendations],
      integrationTargets: [...this.config.integrationTargets],
      reportingLine: [...this.config.reportingLine],
      seedNegotiations: this.config.seedNegotiations.map((negotiation) => ({
        ...negotiation,
        candidateSuppliers: negotiation.candidateSuppliers.map((c) => ({
          ...c,
          strengths: [...c.strengths],
          weaknesses: [...c.weaknesses],
        })),
        preferredSupplier: negotiation.preferredSupplier
          ? {
              ...negotiation.preferredSupplier,
              strengths: [...negotiation.preferredSupplier.strengths],
              weaknesses: [...negotiation.preferredSupplier.weaknesses],
            }
          : null,
        negotiationOpportunities: [...negotiation.negotiationOpportunities],
        moqNegotiation: {
          ...negotiation.moqNegotiation,
          opportunities: [...negotiation.moqNegotiation.opportunities],
          questions: [...negotiation.moqNegotiation.questions],
        },
        priceNegotiation: {
          ...negotiation.priceNegotiation,
          opportunities: [...negotiation.priceNegotiation.opportunities],
          questions: [...negotiation.priceNegotiation.questions],
        },
        shippingNegotiation: {
          ...negotiation.shippingNegotiation,
          opportunities: [...negotiation.shippingNegotiation.opportunities],
          questions: [...negotiation.shippingNegotiation.questions],
        },
        fulfilmentQuestions: {
          ...negotiation.fulfilmentQuestions,
          opportunities: [...negotiation.fulfilmentQuestions.opportunities],
          questions: [...negotiation.fulfilmentQuestions.questions],
        },
        refundQuestions: {
          ...negotiation.refundQuestions,
          opportunities: [...negotiation.refundQuestions.opportunities],
          questions: [...negotiation.refundQuestions.questions],
        },
        supportingEvidence: negotiation.supportingEvidence.map((e) => ({ ...e })),
        evaluationIds: [...negotiation.evaluationIds],
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

  receiveEvaluationReports(input: SupplierNegotiationWorkerInput = {}) {
    this.status = "receiving";
    return this.finish(this.manager.receiveEvaluationReports(input, this.config));
  }

  compareSuppliers(input: SupplierNegotiationWorkerInput = {}) {
    this.status = "comparing";
    return this.finish(this.manager.compareSuppliers(input, this.config));
  }

  identifyOpportunities(input: SupplierNegotiationWorkerInput = {}) {
    this.status = "preparing";
    return this.finish(this.manager.identifyOpportunities(input, this.config));
  }

  prepareMoqQuestions(input: SupplierNegotiationWorkerInput = {}) {
    this.status = "preparing";
    return this.finish(this.manager.prepareMoqQuestions(input, this.config));
  }

  preparePricingQuestions(input: SupplierNegotiationWorkerInput = {}) {
    this.status = "preparing";
    return this.finish(this.manager.preparePricingQuestions(input, this.config));
  }

  prepareShippingTerms(input: SupplierNegotiationWorkerInput = {}) {
    this.status = "preparing";
    return this.finish(this.manager.prepareShippingTerms(input, this.config));
  }

  prepareFulfilmentQuestions(input: SupplierNegotiationWorkerInput = {}) {
    this.status = "preparing";
    return this.finish(this.manager.prepareFulfilmentQuestions(input, this.config));
  }

  prepareRefundQuestions(input: SupplierNegotiationWorkerInput = {}) {
    this.status = "preparing";
    return this.finish(this.manager.prepareRefundQuestions(input, this.config));
  }

  prepareDraftMessage(input: SupplierNegotiationWorkerInput = {}) {
    this.status = "preparing";
    return this.finish(this.manager.prepareDraftMessage(input, this.config));
  }

  recommendPreferred(input: SupplierNegotiationWorkerInput = {}) {
    this.status = "recommending";
    return this.finish(this.manager.recommendPreferred(input, this.config));
  }

  produceReport(input: SupplierNegotiationWorkerInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.produceReport(input, this.config));
  }

  submitFindings(input: SupplierNegotiationWorkerInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.submitFindings(input, this.config));
  }

  list() {
    this.status = "active";
    return this.finish(this.manager.list(this.config));
  }

  validate(input: SupplierNegotiationWorkerInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.validate(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  private finish(report: SupplierNegotiationWorkerRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
