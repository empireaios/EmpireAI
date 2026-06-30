import { assessLiveCommerceGoLive } from "../reality-integration/live-commerce/services/live-commerce-integration-service.js";
import { buildGrandKingGoLiveChecklist } from "../../runtime/grand-king-go-live-checklist/services/grand-king-go-live-checklist-service.js";
import { buildVersion1GoLiveApproval } from "../../runtime/version-1-go-live-approval/services/version-1-go-live-approval-service.js";
import {
  assessVersion1OperationalActivation,
  isPillowProductionModeEnabled,
} from "./version-1-activation-config.js";
import { runVersion1ProductionReadinessReview } from "./production-readiness-review.js";

export type Version1GoLivePreparation = {
  preparedAt: string;
  /** M4 — do NOT execute go-live; preparation only. */
  goLiveExecuted: false;
  productionReadiness: ReturnType<typeof runVersion1ProductionReadinessReview>;
  liveCommerceGoLive: ReturnType<typeof assessLiveCommerceGoLive>;
  grandKingChecklist: ReturnType<typeof buildGrandKingGoLiveChecklist>;
  goLiveApprovalAssessment: ReturnType<typeof buildVersion1GoLiveApproval>;
  deploymentVerification: {
    healthEndpoint: "/health";
    liveCommerceHealth: "/reality-integration/live-commerce/health";
    operationalActivation: "/version-1-activation/readiness";
    rollbackReadiness: string;
  };
  pillowProductionMode: {
    enabled: boolean;
    dryRunWhenDisabled: true;
    approvalGatesPreserved: true;
  };
  blockers: string[];
};

const DEFAULT_WORKSPACE = "ws_empire_1";
const DEFAULT_COMPANY = "co-grand-king";

/** M4 — Prepare go-live assets without executing go-live. */
export function buildVersion1GoLivePreparation(
  workspaceId = DEFAULT_WORKSPACE,
  companyId = DEFAULT_COMPANY,
  env: NodeJS.ProcessEnv = process.env,
): Version1GoLivePreparation {
  const productionReadiness = runVersion1ProductionReadinessReview(env);
  const activation = assessVersion1OperationalActivation(env);
  const liveCommerceGoLive = assessLiveCommerceGoLive(workspaceId);
  const grandKingChecklist = buildGrandKingGoLiveChecklist(workspaceId, companyId);
  const goLiveApprovalAssessment = buildVersion1GoLiveApproval(workspaceId, companyId);

  const blockers = [
    ...productionReadiness.findingsPreventingOperation,
    ...liveCommerceGoLive.blockers.filter(
      (b) => !productionReadiness.findingsPreventingOperation.includes(b),
    ),
  ];

  if (!isPillowProductionModeEnabled(env)) {
    blockers.push("EMPIRE_V1_OPERATIONAL_READY not set — Pillow dry-run remains active (M5)");
  }

  return {
    preparedAt: new Date().toISOString(),
    goLiveExecuted: false,
    productionReadiness,
    liveCommerceGoLive,
    grandKingChecklist,
    goLiveApprovalAssessment,
    deploymentVerification: {
      healthEndpoint: "/health",
      liveCommerceHealth: "/reality-integration/live-commerce/health",
      operationalActivation: "/version-1-activation/readiness",
      rollbackReadiness:
        "Set LIVE_COMMERCE_INTEGRATION_MODE=sandbox and EMPIRE_V1_OPERATIONAL_READY=false to revert Pillow dry-run",
    },
    pillowProductionMode: {
      enabled: isPillowProductionModeEnabled(env),
      dryRunWhenDisabled: true,
      approvalGatesPreserved: true,
    },
    blockers: [...new Set(blockers)],
  };
}
