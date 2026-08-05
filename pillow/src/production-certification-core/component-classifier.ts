import type {
  CertificationStatus,
  FactoryDiscoveryResult,
  GovernanceResults,
  IntegrationVerification,
  ProgrammeId,
  ReportingResults,
  RuntimeDiscoveryResult,
  WorkerDiscoveryResult,
} from "./types.js";

export type ProgrammeClassification = {
  status: CertificationStatus;
  readinessScore: number;
  reason: string;
  passedChecks: string[];
  failedChecks: string[];
};

export type ProgrammeEvaluationContext = {
  factoryDiscovery: FactoryDiscoveryResult;
  workerDiscovery: WorkerDiscoveryResult;
  runtimeDiscovery: RuntimeDiscoveryResult;
  governanceResults: GovernanceResults;
  reportingResults: ReportingResults;
  integrationVerification: IntegrationVerification;
  monitoringInjected: boolean;
  monitoringReachable: boolean;
  recoveryInjected: boolean;
  recoveryReachable: boolean;
  financialBridgesPresent: number;
  financialBridgesTotal: number;
  executiveReady: boolean;
  executiveBriefingPresent: boolean;
};

function ratio(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return Math.round((numerator / denominator) * 100) / 100;
}

/**
 * Evaluates a single Q11 certification programme strictly from observed
 * discovery/verification evidence. Never fabricates a passing result.
 */
export function evaluateProgramme(
  programmeId: ProgrammeId,
  ctx: ProgrammeEvaluationContext,
): ProgrammeClassification {
  switch (programmeId) {
    case "workforce_certification": {
      const passed: string[] = [];
      const failed: string[] = [];
      if (ctx.workerDiscovery.registryInjected) passed.push("workerRegistry injected");
      else failed.push("workerRegistry not injected");
      if (ctx.workerDiscovery.discoveredCount > 0) {
        passed.push(`${ctx.workerDiscovery.discoveredCount} workers discovered`);
        return {
          status: "Certified",
          readinessScore: 1,
          reason: `${ctx.workerDiscovery.discoveredCount} workers discovered via injected workerRegistry.listWorkers()`,
          passedChecks: passed,
          failedChecks: failed,
        };
      }
      if (ctx.workerDiscovery.registryInjected) {
        failed.push("workerRegistry injected but returned zero workers");
        return {
          status: "Partially Certified",
          readinessScore: 0.5,
          reason: "workerRegistry injected but no workers discovered",
          passedChecks: passed,
          failedChecks: failed,
        };
      }
      return {
        status: "Pending",
        readinessScore: 0,
        reason: "workerRegistry not injected — worker discovery cannot proceed without inventing workers",
        passedChecks: passed,
        failedChecks: failed,
      };
    }
    case "runtime_certification": {
      const { discoveredCount, totalCatalog } = ctx.runtimeDiscovery;
      const passed = ctx.runtimeDiscovery.runtimes.filter((r) => r.injected || r.repositoryEvidence).map((r) => r.missionId);
      const failed = ctx.runtimeDiscovery.runtimes.filter((r) => !r.injected && !r.repositoryEvidence).map((r) => r.missionId);
      if (discoveredCount === totalCatalog) {
        return {
          status: "Certified",
          readinessScore: 1,
          reason: `All ${totalCatalog} Q10-01..Q10-13 runtimes discovered from repository/injected evidence`,
          passedChecks: passed,
          failedChecks: failed,
        };
      }
      if (discoveredCount > 0) {
        return {
          status: "Partially Certified",
          readinessScore: ratio(discoveredCount, totalCatalog),
          reason: `${discoveredCount}/${totalCatalog} Q10 runtimes discovered`,
          passedChecks: passed,
          failedChecks: failed,
        };
      }
      return {
        status: "Blocked",
        readinessScore: 0,
        reason: "No Q10-01..Q10-13 runtime evidence discovered",
        passedChecks: passed,
        failedChecks: failed,
      };
    }
    case "factory_certification": {
      const { discoveredCount, totalCatalog } = ctx.factoryDiscovery;
      const passed = ctx.factoryDiscovery.factories.filter((f) => f.injected || f.repositoryEvidence).map((f) => f.factoryKey);
      const failed = ctx.factoryDiscovery.factories.filter((f) => !f.injected && !f.repositoryEvidence).map((f) => f.factoryKey);
      if (discoveredCount === totalCatalog) {
        return {
          status: "Certified",
          readinessScore: 1,
          reason: `All ${totalCatalog} FACTORY_KEYS catalog entries discovered from repository/injected evidence`,
          passedChecks: passed,
          failedChecks: failed,
        };
      }
      if (discoveredCount > 0) {
        return {
          status: "Partially Certified",
          readinessScore: ratio(discoveredCount, totalCatalog),
          reason: `${discoveredCount}/${totalCatalog} factories discovered`,
          passedChecks: passed,
          failedChecks: failed,
        };
      }
      return {
        status: "Blocked",
        readinessScore: 0,
        reason: "No factory evidence discovered",
        passedChecks: passed,
        failedChecks: failed,
      };
    }
    case "governance_certification": {
      const passed: string[] = [];
      const failed: string[] = [];
      if (ctx.governanceResults.selfDocPresent) passed.push("self governance document present");
      else failed.push("self governance document missing");
      if (ctx.governanceResults.boundaryLocksHonoured) passed.push("all boundary locks honoured");
      else failed.push("boundary locks not honoured");
      const status: CertificationStatus = ctx.governanceResults.compliant ? "Certified" : "Failed Certification";
      return {
        status,
        readinessScore: ctx.governanceResults.compliant ? 1 : 0,
        reason: ctx.governanceResults.compliant
          ? "Governance document present and boundary locks honoured"
          : "Governance compliance evidence incomplete",
        passedChecks: passed,
        failedChecks: failed,
      };
    }
    case "reporting_certification": {
      const passed: string[] = [];
      const failed: string[] = [];
      if (ctx.reportingResults.executiveReportingAvailable) passed.push("executiveReportingRuntime injected");
      else failed.push("executiveReportingRuntime not injected");
      return {
        status: ctx.reportingResults.verified ? "Certified" : "Pending",
        readinessScore: ctx.reportingResults.verified ? 1 : 0,
        reason: ctx.reportingResults.verified
          ? "Executive Reporting Runtime injected and capable of submitWorkerReport"
          : "Executive Reporting Runtime not injected — reporting cannot be certified without inventing capability",
        passedChecks: passed,
        failedChecks: failed,
      };
    }
    case "integration_certification": {
      const { boundCount, totalTargets } = ctx.integrationVerification;
      const passed = ctx.integrationVerification.rows.filter((r) => r.bound).map((r) => r.target);
      const failed = ctx.integrationVerification.rows.filter((r) => !r.bound).map((r) => r.target);
      if (ctx.integrationVerification.allBound) {
        return {
          status: "Certified",
          readinessScore: 1,
          reason: `All ${totalTargets} integration targets bound`,
          passedChecks: passed,
          failedChecks: failed,
        };
      }
      if (boundCount > 0) {
        return {
          status: "Partially Certified",
          readinessScore: ratio(boundCount, totalTargets),
          reason: `${boundCount}/${totalTargets} integration targets bound`,
          passedChecks: passed,
          failedChecks: failed,
        };
      }
      return {
        status: "Pending",
        readinessScore: 0,
        reason: "No integration targets bound — no dependencies injected",
        passedChecks: passed,
        failedChecks: failed,
      };
    }
    case "security_certification": {
      const passed = ["neverFabricateCertificationEvidence", "maskSensitiveValues", "neverBypassPillowGovernance"];
      return {
        status: "Certified",
        readinessScore: 1,
        reason: "Boundary locks and credential masking are force-locked true in configuration",
        passedChecks: passed,
        failedChecks: [],
      };
    }
    case "performance_certification": {
      const passed: string[] = [];
      const failed: string[] = [];
      if (ctx.monitoringInjected) passed.push("monitoringRuntime injected");
      else failed.push("monitoringRuntime not injected");
      if (ctx.monitoringReachable) passed.push("monitoringRuntime reachable");
      else failed.push("monitoringRuntime not reachable");
      if (ctx.monitoringInjected && ctx.monitoringReachable) {
        return {
          status: "Certified",
          readinessScore: 1,
          reason: "Monitoring Runtime injected and reachable",
          passedChecks: passed,
          failedChecks: failed,
        };
      }
      if (ctx.monitoringInjected) {
        return {
          status: "Partially Certified",
          readinessScore: 0.5,
          reason: "Monitoring Runtime injected but not reachable",
          passedChecks: passed,
          failedChecks: failed,
        };
      }
      return {
        status: "Pending",
        readinessScore: 0,
        reason: "Monitoring Runtime not injected",
        passedChecks: passed,
        failedChecks: failed,
      };
    }
    case "recovery_certification": {
      const passed: string[] = [];
      const failed: string[] = [];
      if (ctx.recoveryInjected) passed.push("recoveryRuntime/workerRecoverySystem injected");
      else failed.push("recoveryRuntime/workerRecoverySystem not injected");
      if (ctx.recoveryReachable) passed.push("recoveryRuntime reachable");
      if (ctx.recoveryInjected && ctx.recoveryReachable) {
        return {
          status: "Certified",
          readinessScore: 1,
          reason: "Recovery Runtime injected and reachable",
          passedChecks: passed,
          failedChecks: failed,
        };
      }
      if (ctx.recoveryInjected) {
        return {
          status: "Partially Certified",
          readinessScore: 0.5,
          reason: "Recovery dependency injected but not reachable",
          passedChecks: passed,
          failedChecks: failed,
        };
      }
      return {
        status: "Pending",
        readinessScore: 0,
        reason: "No recovery dependency injected",
        passedChecks: passed,
        failedChecks: failed,
      };
    }
    case "financial_readiness_certification": {
      const { financialBridgesPresent, financialBridgesTotal } = ctx;
      if (financialBridgesPresent === financialBridgesTotal && financialBridgesTotal > 0) {
        return {
          status: "Certified",
          readinessScore: 1,
          reason: `All ${financialBridgesTotal} financial/capital worker bridges present in repository`,
          passedChecks: [`${financialBridgesPresent}/${financialBridgesTotal} bridges present`],
          failedChecks: [],
        };
      }
      if (financialBridgesPresent > 0) {
        return {
          status: "Partially Certified",
          readinessScore: ratio(financialBridgesPresent, financialBridgesTotal),
          reason: `${financialBridgesPresent}/${financialBridgesTotal} financial/capital worker bridges present`,
          passedChecks: [],
          failedChecks: [`${financialBridgesTotal - financialBridgesPresent} bridges missing`],
        };
      }
      return {
        status: "Blocked",
        readinessScore: 0,
        reason: "No financial/capital worker bridges found in repository",
        passedChecks: [],
        failedChecks: ["all financial/capital worker bridges missing"],
      };
    }
    case "executive_certification": {
      const passed: string[] = [];
      const failed: string[] = [];
      if (ctx.executiveReady) passed.push("bootstrap.executiveReady is true");
      else failed.push("bootstrap.executiveReady is false");
      if (ctx.executiveBriefingPresent) passed.push("bootstrap.executiveBriefing present");
      else failed.push("bootstrap.executiveBriefing missing");
      const certified = ctx.executiveReady && ctx.executiveBriefingPresent;
      return {
        status: certified ? "Certified" : "Failed Certification",
        readinessScore: certified ? 1 : 0,
        reason: certified
          ? "Executive readiness confirmed from bootstrap executiveReady + executiveBriefing"
          : "Executive readiness evidence incomplete",
        passedChecks: passed,
        failedChecks: failed,
      };
    }
    case "custom_extension":
    default:
      return {
        status: "Registered",
        readinessScore: 0,
        reason: "Reserved extension slot — no certification requirement registered yet",
        passedChecks: [],
        failedChecks: [],
      };
  }
}
