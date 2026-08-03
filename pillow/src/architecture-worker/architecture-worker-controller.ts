import type { ArchitectureWorkerConfiguration } from "./configuration.js";

import type { ArchitectureWorkerDependencies } from "./integrations.js";

import { ArchitectureManager } from "./architecture-manager.js";

import type {

  EngineStatus,

  ArchitectureWorkerInput,

  ArchitectureWorkerRunReport,

} from "./types.js";



export class ArchitectureWorkerController {

  private status: EngineStatus = "idle";

  private latestReport: ArchitectureWorkerRunReport | null = null;



  constructor(

    private readonly manager: ArchitectureManager,

    private readonly config: ArchitectureWorkerConfiguration,

  ) {}



  initialize() {

    this.manager.ensureSeeded(this.config);

    this.status = "active";

  }



  bindIntegrations(deps: ArchitectureWorkerDependencies = {}) {

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

      integrationTargets: [...this.config.integrationTargets],

      supportedArchitectureDomains: [...this.config.supportedArchitectureDomains],

      reportingLine: [...this.config.reportingLine],

      seedArchitectureReports: this.config.seedArchitectureReports.map((report) => ({

        ...report,

        architectureSteps: report.architectureSteps.map((s) => ({ ...s })),

        supportedArchitectureDomains: [...report.supportedArchitectureDomains],

        moduleArchitecture: report.moduleArchitecture.map((m) => ({ ...m })),

        apiArchitecture: report.apiArchitecture.map((a) => ({ ...a })),

        dataFlow: report.dataFlow.map((f) => ({ ...f })),

        serviceDependencies: report.serviceDependencies.map((d) => ({ ...d })),

        deploymentArchitecture: {

          ...report.deploymentArchitecture,

          environments: [...report.deploymentArchitecture.environments],

          components: report.deploymentArchitecture.components.map((c) => ({ ...c })),

        },

        integrationArchitecture: report.integrationArchitecture.map((i) => ({ ...i })),

        securityConsiderations: [...report.securityConsiderations],

        scalabilityConsiderations: [...report.scalabilityConsiderations],

        maintainabilityConsiderations: [...report.maintainabilityConsiderations],

        architecturalDecisions: report.architecturalDecisions.map((d) => ({ ...d })),

        assumptions: [...report.assumptions],

        selfReviewFindings: report.selfReviewFindings.map((f) => ({ ...f })),

        traceabilityRefs: [...report.traceabilityRefs],

        preservedDecisions: report.preservedDecisions.map((d) => ({ ...d })),

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



  receiveApprovedRequirementsReports(input: ArchitectureWorkerInput = {}) {

    this.status = "receiving_requirements";

    return this.finish(this.manager.receiveApprovedRequirementsReports(input, this.config));

  }



  receiveApprovedRequirementsReport(input: ArchitectureWorkerInput = {}) {

    return this.receiveApprovedRequirementsReports(input);

  }



  designOverallSystemArchitecture(input: ArchitectureWorkerInput = {}) {

    this.status = "designing_system";

    return this.finish(this.manager.designOverallSystemArchitecture(input, this.config));

  }



  defineApplicationModules(input: ArchitectureWorkerInput = {}) {

    this.status = "defining_modules";

    return this.finish(this.manager.defineApplicationModules(input, this.config));

  }



  designInternalAndExternalApis(input: ArchitectureWorkerInput = {}) {

    this.status = "designing_apis";

    return this.finish(this.manager.designInternalAndExternalApis(input, this.config));

  }



  designServiceBoundaries(input: ArchitectureWorkerInput = {}) {

    this.status = "designing_services";

    return this.finish(this.manager.designServiceBoundaries(input, this.config));

  }



  designDataFlowArchitecture(input: ArchitectureWorkerInput = {}) {

    this.status = "designing_data_flow";

    return this.finish(this.manager.designDataFlowArchitecture(input, this.config));

  }



  designDeploymentTopology(input: ArchitectureWorkerInput = {}) {

    this.status = "designing_deployment";

    return this.finish(this.manager.designDeploymentTopology(input, this.config));

  }



  identifyArchitecturalDependencies(input: ArchitectureWorkerInput = {}) {

    this.status = "identifying_dependencies";

    return this.finish(this.manager.identifyArchitecturalDependencies(input, this.config));

  }



  evaluateScalabilitySecurityAndMaintainability(input: ArchitectureWorkerInput = {}) {

    this.status = "evaluating_quality";

    return this.finish(

      this.manager.evaluateScalabilitySecurityAndMaintainability(input, this.config),

    );

  }



  produceArchitectureReport(input: ArchitectureWorkerInput = {}) {

    this.status = "reporting";

    return this.finish(this.manager.produceArchitectureReport(input, this.config));

  }



  submitReport(input: ArchitectureWorkerInput = {}) {

    this.status = "reporting";

    return this.finish(this.manager.submitReport(input, this.config));

  }



  list() {

    this.status = "active";

    return this.finish(this.manager.list(this.config));

  }



  validate(input: ArchitectureWorkerInput = {}) {

    this.status = "validating";

    return this.finish(this.manager.validate(input, this.config));

  }



  diagnostics() {

    return this.finish(this.manager.diagnostics(this.config));

  }



  private finish(report: ArchitectureWorkerRunReport) {

    this.latestReport = report;

    this.status = report.validation.decision === "fail" ? "failed" : "active";

    return report;

  }

}


