import { appendGkagtLog } from "./gkagt-logging.js";

import type {

  GrandKingAcceptanceReport,

  GkagtHandle,

  IntegrationHandshake,

  IntegrationTarget,

} from "./types.js";

import type { ExecutiveAcceptancePackReport } from "../executive-acceptance-pack/types.js";



export type ExecutiveAcceptancePackHandle = GkagtHandle & {

  getState?: () => { latestReport?: ExecutiveAcceptancePackReport | null };

  getLatestReport?: () => ExecutiveAcceptancePackReport | null;

  getReports?: () => ExecutiveAcceptancePackReport[];

  produceReport?: (...args: unknown[]) => Promise<ExecutiveAcceptancePackReport> | ExecutiveAcceptancePackReport;

  getQ1110ConsumableContract?: () => object;

};



export type ProductionCertificationCoreHandle = GkagtHandle & {

  getState?: () => unknown;

  getLatestReport?: () => { reportId?: string; decision?: string } | null;

  getReports?: () => Array<{ reportId?: string; decision?: string }>;

};



export type SharedRuntimeCertificationHandle = GkagtHandle & {

  getState?: () => unknown;

  getLatestReport?: () => { reportId?: string; decision?: string } | null;

};



export type MonitoringRuntimeHandle = GkagtHandle & {

  getState?: () => unknown;

  getDashboard?: () => unknown;

};



export type AuditRuntimeHandle = GkagtHandle & {

  getState?: () => unknown;

  query?: (input?: Record<string, unknown>) => unknown;

};



export type ApprovalRuntimeHandle = GkagtHandle & {

  getState?: () => unknown;

};



export type ExecutiveReportingRuntimeHandle = {

  getState?: () => unknown;

  submitWorkerReport: (input: Record<string, unknown>) => {

    records?: Array<{ reportId?: string }>;

  };

  retrieveReport?: (...args: unknown[]) => unknown;

};



export type GrandKingAcceptanceGateDependencies = {

  executiveAcceptancePack?: ExecutiveAcceptancePackHandle | null;

  productionCertificationCore?: ProductionCertificationCoreHandle | null;

  sharedRuntimeCertification?: SharedRuntimeCertificationHandle | null;

  executiveReportingRuntime?: ExecutiveReportingRuntimeHandle | null;

  approvalRuntime?: ApprovalRuntimeHandle | null;

  auditRuntime?: AuditRuntimeHandle | null;

  monitoringRuntime?: MonitoringRuntimeHandle | null;

};



export class IntegrationCoordinator {

  private handshakes: IntegrationHandshake[] = [];

  private deps: GrandKingAcceptanceGateDependencies = {};



  bind(deps: GrandKingAcceptanceGateDependencies = {}) {

    this.deps = { ...deps };

  }



  getDependencies() {

    return this.deps;

  }



  getHandshakes() {

    return this.handshakes.map((h) => ({ ...h }));

  }



  connect(workerId: string, targets: string[]): IntegrationHandshake[] {

    const now = new Date().toISOString();

    const resolved: IntegrationHandshake[] = [];

    for (const target of targets as IntegrationTarget[]) {

      const status = this.isBound(target) ? "bound" : "ready";

      const handshake: IntegrationHandshake = {

        target,

        status,

        details: this.describe(target, workerId, status),

        timestamp: now,

      };

      resolved.push(handshake);

      appendGkagtLog({ event: "integration_handshake", details: `${target}:${status}` });

    }

    this.handshakes = resolved;

    return this.getHandshakes();

  }



  attemptQ1110ContractHandshake(): {

    attempted: boolean;

    consumed: boolean;

    contractVersion: string | null;

    fields: string[];

    evidence: string;

  } {

    const eaprt = this.deps.executiveAcceptancePack;

    if (!eaprt || typeof eaprt.getQ1110ConsumableContract !== "function") {

      return {

        attempted: false,

        consumed: false,

        contractVersion: null,

        fields: [],

        evidence: "Q11-09 Executive Acceptance Pack not injected / getQ1110ConsumableContract unavailable",

      };

    }

    try {

      const contract = eaprt.getQ1110ConsumableContract() as {

        contractVersion?: string;

        exposedFields?: readonly string[];

        consumerMissionId?: string;

      };

      const consumed = contract?.consumerMissionId === "Q11-10";

      return {

        attempted: true,

        consumed,

        contractVersion: contract?.contractVersion ?? null,

        fields: [...(contract?.exposedFields ?? [])],

        evidence: consumed

          ? "Injected Q11-09 executive-acceptance-pack handshake returned explicit consumableByQ1110 contract"

          : "Injected Q11-09 executive-acceptance-pack handshake did not return explicit consumableByQ1110 contract",

      };

    } catch (error) {

      return {

        attempted: true,

        consumed: false,

        contractVersion: null,

        fields: [],

        evidence: `getQ1110ConsumableContract threw: ${error instanceof Error ? error.message : String(error)}`,

      };

    }

  }



  submitReport(report: GrandKingAcceptanceReport): {

    submitted: boolean;

    executiveReportId: string | null;

    details: string;

  } {

    const runtime = this.deps.executiveReportingRuntime;

    if (!runtime?.submitWorkerReport) {

      return {

        submitted: false,

        executiveReportId: null,

        details: "executive_reporting_runtime_unavailable",

      };

    }

    const result = runtime.submitWorkerReport({

      reportingEntity: report.workerId,

      entityType: "worker",

      missionId: "Q11-10",

      currentStatus: `grand_king_acceptance_gate_${report.grandKingDecision}`,

      progress: Math.round(report.confidenceScore * 100),

      blockers: report.outstandingIssues,

      evidence: [

        `decision=${report.grandKingDecision}`,

        `deploymentAuthorisation=${report.deploymentAuthorisationStatus}`,

      ],

      nextAction:

        report.grandKingDecision === "approve" && report.deploymentAuthorisationStatus === "authorised"

          ? "await_q12_deployment_gate"

          : "await_grand_king_re_review_or_remediation",

      completionStatus: "completed",

      reportType: "worker",

      validated: true,

      grandKingAcceptanceReport: report,

      neverFabricateApprovalEvidence: true,

      neverAuthoriseWithoutApproval: true,

      neverOverrideGrandKing: true,

    });

    const executiveReportId =

      result?.records?.find((r) => r.reportId)?.reportId ?? `ert-gkagt-${Date.now()}`;

    appendGkagtLog({

      event: "submit_report",

      details: `report=${report.reportId} executive=${executiveReportId}`,

    });

    return {

      submitted: true,

      executiveReportId,

      details: "submitted_to_executive_reporting_runtime",

    };

  }



  private isBound(target: IntegrationTarget): boolean {

    switch (target) {

      case "executive_acceptance_pack":

        return !!this.deps.executiveAcceptancePack;

      case "production_certification_core":

        return !!this.deps.productionCertificationCore;

      case "shared_runtime_certification":

        return !!this.deps.sharedRuntimeCertification;

      case "executive_reporting_runtime":

        return !!this.deps.executiveReportingRuntime;

      case "approval_runtime":

        return !!this.deps.approvalRuntime;

      case "audit_runtime":

        return !!this.deps.auditRuntime;

      case "monitoring_runtime":

        return !!this.deps.monitoringRuntime;

      default:

        return false;

    }

  }



  private describe(target: IntegrationTarget, workerId: string, status: string): string {

    return `${target} integration ${status} for ${workerId}; constitutional approval evidence only under Grand King authority.`;

  }

}



function integrationBound(

  deps: GrandKingAcceptanceGateDependencies,

  target: IntegrationTarget,

): boolean {

  switch (target) {

    case "executive_acceptance_pack":

      return !!deps.executiveAcceptancePack;

    case "production_certification_core":

      return !!deps.productionCertificationCore;

    case "shared_runtime_certification":

      return !!deps.sharedRuntimeCertification;

    case "executive_reporting_runtime":

      return !!deps.executiveReportingRuntime;

    case "approval_runtime":

      return !!deps.approvalRuntime;

    case "audit_runtime":

      return !!deps.auditRuntime;

    case "monitoring_runtime":

      return !!deps.monitoringRuntime;

    default:

      return false;

  }

}



export function verifyIntegrations(deps: GrandKingAcceptanceGateDependencies) {

  const now = new Date().toISOString();

  const targets: IntegrationTarget[] = [

    "executive_acceptance_pack",

    "production_certification_core",

    "shared_runtime_certification",

    "executive_reporting_runtime",

    "approval_runtime",

    "audit_runtime",

    "monitoring_runtime",

  ];

  const rows = targets.map((target) => {

    const bound = integrationBound(deps, target);

    return {

      target,

      bound,

      evidence: bound ? `${target} handle injected` : `${target} not injected`,

    };

  });

  const boundCount = rows.filter((r) => r.bound).length;

  return {

    verifiedAt: now,

    rows,

    totalTargets: targets.length,

    boundCount,

    allBound: boundCount === targets.length,

    evidence: rows.map((r) => r.evidence),

  };

}

