import type { ArchitectureReport } from "./types.js";



/** Authoritative in-memory architecture store — structural signals only. */

export class ArchitectureStore {

  private reports = new Map<string, ArchitectureReport>();

  private latestArchitectureReportId: string | null = null;

  private auditTrail: Array<{

    timestamp: string;

    architectureId: string;

    action: string;

    details: string;

  }> = [];



  seed(reports: ArchitectureReport[]) {

    this.reports.clear();

    this.latestArchitectureReportId = null;

    this.auditTrail = [];

    for (const report of reports) {

      this.reports.set(report.architectureId, clone(report));

      this.latestArchitectureReportId = report.architectureId;

      this.auditTrail.push({

        timestamp: new Date().toISOString(),

        architectureId: report.architectureId,

        action: "seed",

        details: `seeded architecture=${report.architectureId} platform=${report.platformName}`,

      });

    }

  }



  count() {

    return this.reports.size;

  }



  list() {

    return [...this.reports.values()]

      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))

      .map(clone);

  }



  get(architectureId: string) {

    const report = this.reports.get(architectureId);

    return report ? clone(report) : null;

  }



  getLatestArchitectureReportId() {

    return this.latestArchitectureReportId;

  }



  getAuditTrail(limit = 100) {

    return this.auditTrail.slice(-limit).map((entry) => ({ ...entry }));

  }



  save(report: ArchitectureReport, action = "save") {

    this.reports.set(report.architectureId, clone(report));

    this.latestArchitectureReportId = report.architectureId;

    this.auditTrail.push({

      timestamp: new Date().toISOString(),

      architectureId: report.architectureId,

      action,

      details: `platform=${report.platformName} confidence=${report.confidenceScore}`,

    });

    return clone(report);

  }



  markSubmitted(architectureId: string, executiveReportId: string) {

    const current = this.reports.get(architectureId);

    if (!current) return null;

    const updated: ArchitectureReport = {

      ...clone(current),

      submittedToExecutiveReporting: true,

      executiveReportId,

    };

    return this.save(updated, "submit_report");

  }

}



function clone(report: ArchitectureReport): ArchitectureReport {

  return {

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

  };

}


