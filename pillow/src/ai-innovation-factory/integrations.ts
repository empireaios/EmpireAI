import { appendAifrtLog } from "./aifrt-logging.js";

import type { IntegrationHandshake, IntegrationTarget, AiInnovationReport } from "./types.js";



export type QSeriesCompletionHandle = {

  getState?: () => {

    latestReport?: { finalCompletionDecision?: string } | null;

    health?: { lastCompletionDecision?: string | null };

  };

  getLatestReport?: () => { finalCompletionDecision?: string; reportId?: string } | null;

  getQ1201ConsumableContract?: () => {

    contractVersion?: string;

    consumerMissionId?: string;

    seriesCompletePrerequisite?: boolean;

    exposedFields?: readonly string[];

  };

};



export type GrandKingAcceptanceGateHandle = {

  getState?: () => {

    grandKingDecision?: string;

    deploymentAuthorisationStatus?: string;

  };

  getGrandKingDecision?: () => string;

  getDeploymentAuthorisationStatus?: () => string;

  getLatestReport?: () => { grandKingDecision?: string; deploymentAuthorisationStatus?: string } | null;

  getQ1201ConsumableContract?: () => {

    contractVersion?: string;

    consumerMissionId?: string;

    exposedFields?: readonly string[];

  };

};



export type SharedRuntimeCoreHandle = {

  getState?: () => unknown;

  listFactories?: () => Array<Record<string, unknown>>;

};



export type WorkerRegistryHandle = {

  getState?: () => unknown;

  listWorkers?: () => Array<Record<string, unknown>>;

  getWorkers?: () => Array<Record<string, unknown>>;

};



export type RuntimeHandle = {

  getState?: () => { status?: string } | unknown;

  getCatalog?: () => unknown;

  getTopology?: () => unknown;

};



export type ExecutiveReportingRuntimeHandle = {

  getState?: () => unknown;

  submitWorkerReport: (input: Record<string, unknown>) => { records?: Array<{ reportId?: string }> };

};



export type AiInnovationFactoryDependencies = {

  qSeriesCompletion?: QSeriesCompletionHandle | null;

  grandKingAcceptanceGate?: GrandKingAcceptanceGateHandle | null;

  sharedRuntimeCore?: SharedRuntimeCoreHandle | null;

  workerRegistry?: WorkerRegistryHandle | null;

  pillowOrchestrationRuntime?: RuntimeHandle | null;

  monitoringRuntime?: RuntimeHandle | null;

  auditRuntime?: RuntimeHandle | null;

  executiveReportingRuntime?: ExecutiveReportingRuntimeHandle | null;

};



export class IntegrationCoordinator {

  private handshakes: IntegrationHandshake[] = [];

  private deps: AiInnovationFactoryDependencies = {};



  bind(deps: AiInnovationFactoryDependencies = {}) {

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

      appendAifrtLog({ event: "integration_handshake", details: `${target}:${status}` });

    }

    this.handshakes = resolved;

    return this.getHandshakes();

  }



  attemptQ1201ContractHandshake(): {

    attempted: boolean;

    consumed: boolean;

    contractVersion: string | null;

    fields: string[];

    finalCompletionDecision: string | null;

    seriesCompletePrerequisite: boolean;

    evidence: string;

  } {

    const qscpt = this.deps.qSeriesCompletion;

    if (!qscpt || typeof qscpt.getQ1201ConsumableContract !== "function") {

      return {

        attempted: false,

        consumed: false,

        contractVersion: null,

        fields: [],

        finalCompletionDecision: null,

        seriesCompletePrerequisite: false,

        evidence: "Q11-13 Q Series Completion not injected / getQ1201ConsumableContract unavailable",

      };

    }

    try {

      const contract = qscpt.getQ1201ConsumableContract();

      const consumed = contract?.consumerMissionId === "Q12-01";

      const latestReport = qscpt.getLatestReport?.() ?? qscpt.getState?.()?.latestReport ?? null;

      const finalCompletionDecision =

        latestReport?.finalCompletionDecision ??

        qscpt.getState?.()?.health?.lastCompletionDecision ??

        null;

      return {

        attempted: true,

        consumed,

        contractVersion: contract?.contractVersion ?? null,

        fields: [...(contract?.exposedFields ?? [])],

        finalCompletionDecision: finalCompletionDecision ?? null,

        seriesCompletePrerequisite: contract?.seriesCompletePrerequisite === true,

        evidence: consumed

          ? `Injected Q11-13 q-series-completion Q1201 handshake consumerMissionId=Q12-01 finalCompletionDecision=${finalCompletionDecision ?? "unknown"}`

          : "Injected Q11-13 q-series-completion handshake did not return Q12-01 consumable contract",

      };

    } catch (error) {

      return {

        attempted: true,

        consumed: false,

        contractVersion: null,

        fields: [],

        finalCompletionDecision: null,

        seriesCompletePrerequisite: false,

        evidence: `getQ1201ConsumableContract threw: ${error instanceof Error ? error.message : String(error)}`,

      };

    }

  }



  observeGkQ1201Contract(): {

    observed: boolean;

    contractVersion: string | null;

    grandKingDecision: string | null;

    deploymentAuthorisationStatus: string | null;

    evidence: string;

  } {

    const gkagt = this.deps.grandKingAcceptanceGate;

    if (!gkagt) {

      return {

        observed: false,

        contractVersion: null,

        grandKingDecision: null,

        deploymentAuthorisationStatus: null,

        evidence: "GKAGT not injected — optional approval context only; not required for research",

      };

    }

    try {

      const contract = gkagt.getQ1201ConsumableContract?.();

      const grandKingDecision =

        gkagt.getGrandKingDecision?.() ??

        gkagt.getLatestReport?.()?.grandKingDecision ??

        gkagt.getState?.()?.grandKingDecision ??

        null;

      const deploymentAuthorisationStatus =

        gkagt.getDeploymentAuthorisationStatus?.() ??

        gkagt.getLatestReport?.()?.deploymentAuthorisationStatus ??

        gkagt.getState?.()?.deploymentAuthorisationStatus ??

        null;

      return {

        observed: true,

        contractVersion: contract?.contractVersion ?? null,

        grandKingDecision,

        deploymentAuthorisationStatus,

        evidence: `GKAGT Q1201 observed for approval context — grandKingDecision=${grandKingDecision ?? "unknown"}; not required for research`,

      };

    } catch (error) {

      return {

        observed: true,

        contractVersion: null,

        grandKingDecision: null,

        deploymentAuthorisationStatus: null,

        evidence: `GKAGT observation threw: ${error instanceof Error ? error.message : String(error)}`,

      };

    }

  }



  submitReport(report: AiInnovationReport): {

    submitted: boolean;

    executiveReportId: string | null;

    details: string;

  } {

    const runtime = this.deps.executiveReportingRuntime;

    if (!runtime?.submitWorkerReport) {

      return { submitted: false, executiveReportId: null, details: "executive_reporting_runtime_unavailable" };

    }

    const result = runtime.submitWorkerReport({

      reportingEntity: report.workerId,

      entityType: "worker",

      missionId: "Q12-01",

      currentStatus: `ai_innovation_factory_seriesCompleteActivation_${report.seriesCompleteActivation}`,

      progress: Math.round(report.confidenceScore * 100),

      blockers: report.outstandingIssues,

      evidence: report.supportingEvidence.slice(0, 10),

      nextAction: report.seriesCompleteActivation ? "await_q1301_consumer" : "continue_research_with_prerequisite_issues",

      completionStatus: "completed",

      reportType: "worker",

      validated: true,

      aiInnovationReport: report,

      neverFabricateResearchEvidence: true,

      neverAutoDeployInnovations: true,

      neverOverrideGrandKing: true,

    });

    const executiveReportId = result?.records?.find((r) => r.reportId)?.reportId ?? `ert-aifrt-${Date.now()}`;

    appendAifrtLog({ event: "submit_report", details: `report=${report.reportId} executive=${executiveReportId}` });

    return { submitted: true, executiveReportId, details: "submitted_to_executive_reporting_runtime" };

  }



  private isBound(target: IntegrationTarget): boolean {

    return integrationBound(this.deps, target);

  }



  private describe(target: IntegrationTarget, workerId: string, status: string): string {

    return `${target} integration ${status} for ${workerId}; innovation evidence only from injected handles.`;

  }

}



export function verifyIntegrations(deps: AiInnovationFactoryDependencies) {

  const now = new Date().toISOString();

  const targets: IntegrationTarget[] = [

    "q_series_completion",

    "grand_king_acceptance_gate",

    "shared_runtime_core",

    "worker_registry",

    "pillow_orchestration_runtime",

    "monitoring_runtime",

    "audit_runtime",

    "executive_reporting_runtime",

  ];

  const rows = targets.map((target) => {

    const bound = integrationBound(deps, target);

    return { target, bound, evidence: bound ? `${target} handle injected` : `${target} not injected` };

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



function integrationBound(deps: AiInnovationFactoryDependencies, target: IntegrationTarget): boolean {

  switch (target) {

    case "q_series_completion":

      return !!deps.qSeriesCompletion;

    case "grand_king_acceptance_gate":

      return !!deps.grandKingAcceptanceGate;

    case "shared_runtime_core":

      return !!deps.sharedRuntimeCore;

    case "worker_registry":

      return !!deps.workerRegistry;

    case "pillow_orchestration_runtime":

      return !!deps.pillowOrchestrationRuntime;

    case "monitoring_runtime":

      return !!deps.monitoringRuntime;

    case "audit_runtime":

      return !!deps.auditRuntime;

    case "executive_reporting_runtime":

      return !!deps.executiveReportingRuntime;

    default:

      return false;

  }

}


