/**
 * G6-03 — Cockpit Infrastructure & Deployment backend contracts.
 */

import type {
  DeploymentRiskEntry,
  InfrastructureDeploymentOverview,
  InfrastructureDeploymentScanResult,
  InfrastructureDeploymentResultState,
  InfrastructureDeploymentViolation,
  ServiceHealthEntry,
} from "./infrastructure-deployment-types.js";

export const COCKPIT_INFRASTRUCTURE_DEPLOYMENT_VIEW_ID = "cockpit-infrastructure-deployment" as const;

export type CockpitInfrastructureDeploymentView = {
  viewId: typeof COCKPIT_INFRASTRUCTURE_DEPLOYMENT_VIEW_ID;
  computedAt: string;
  dataMode: "live";
  infrastructureOverview: InfrastructureDeploymentOverview;
  deploymentHealth: {
    status: InfrastructureDeploymentResultState;
    score: number;
    label: string;
  };
  deploymentReadiness: InfrastructureDeploymentScanResult["readinessSummary"];
  serviceHealth: ServiceHealthEntry[];
  securityFindings: InfrastructureDeploymentViolation[];
  riskRegister: DeploymentRiskEntry[];
  certificationStatus: InfrastructureDeploymentResultState;
  executiveRecommendations: string[];
  lastScan?: Pick<InfrastructureDeploymentScanResult, "scanId" | "status" | "score" | "scannedAt">;
  discoverySource: "production-certification:infrastructure-deployment-cockpit";
};

export function buildCockpitInfrastructureDeploymentView(input: {
  overview: InfrastructureDeploymentOverview;
  scan?: InfrastructureDeploymentScanResult;
}): CockpitInfrastructureDeploymentView {
  const scan = input.scan;
  const allFindings = [
    ...(scan?.infrastructureFindings ?? []),
    ...(scan?.deploymentFindings ?? []),
  ];
  return {
    viewId: COCKPIT_INFRASTRUCTURE_DEPLOYMENT_VIEW_ID,
    computedAt: new Date().toISOString(),
    dataMode: "live",
    infrastructureOverview: input.overview,
    deploymentHealth: {
      status: scan?.status ?? "warning",
      score: scan?.score ?? 0,
      label: scan ? `Deployment health ${scan.status}` : "No scan completed",
    },
    deploymentReadiness: scan?.readinessSummary ?? {
      rollbackReady: false,
      upgradeReady: false,
      capacityReady: false,
      recoveryAvailable: false,
    },
    serviceHealth: scan?.serviceHealth ?? [],
    securityFindings: allFindings,
    riskRegister: scan?.riskRegister ?? [],
    certificationStatus: scan?.status ?? "warning",
    executiveRecommendations: scan?.executiveRecommendations ?? [],
    lastScan: scan
      ? { scanId: scan.scanId, status: scan.status, score: scan.score, scannedAt: scan.scannedAt }
      : undefined,
    discoverySource: "production-certification:infrastructure-deployment-cockpit",
  };
}
