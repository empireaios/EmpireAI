/**
 * G7-01 — Grand King production workspace service.
 */

import { randomUUID } from "node:crypto";
import type { RegistryLoaderContext } from "../../../registry/types/registry-types.js";
import type {
  GrandKingProductionWorkspace,
  ProductionWorkspaceOverview,
} from "../contracts/production-workspace-types.js";
import { GRAND_KING_PRODUCTION_WORKSPACE_VERSION } from "../contracts/production-workspace-types.js";
import { recordProductionWorkspaceEklsObservation } from "../ekls/production-workspace-ekls-integration.js";
import { validateProductionWorkspacePillowGovernance } from "../governance/production-workspace-pillow-governance.js";
import { buildWorkspaceConfiguration } from "./workspace-configuration-manager.js";
import { evaluateWorkspaceHealth } from "./workspace-health-evaluator.js";
import { transitionWorkspaceStatus } from "./workspace-lifecycle-manager.js";
import { validateWorkspaceOwnership } from "./workspace-ownership-validator.js";
import { evaluateWorkspaceReadiness } from "./workspace-readiness-integration.js";

let canonicalWorkspace: GrandKingProductionWorkspace | undefined;

export function resetProductionWorkspaceStateForTests(): void {
  canonicalWorkspace = undefined;
}

function buildWorkspaceFromRegistry(context: RegistryLoaderContext): GrandKingProductionWorkspace {
  const { config, dependencies } = buildWorkspaceConfiguration(context);
  const readiness = evaluateWorkspaceReadiness(context);
  const ownership = validateWorkspaceOwnership({
    workspaceId: config.workspaceId,
    ownerId: config.ownerId,
  });
  if (!ownership.valid) {
    throw new Error(ownership.reason);
  }

  const now = new Date().toISOString();
  const correlationId = randomUUID();

  return {
    workspaceId: config.workspaceId,
    workspaceName: config.workspaceName,
    workspaceType: config.workspaceType,
    ownerId: config.ownerId,
    brandIds: config.brandIds,
    environment: "production",
    status: readiness.ready ? "ready" : "configuring",
    productionEligibility: readiness.productionEligible,
    readinessReference: readiness.readinessReference,
    commerceReference: dependencies.commercePolicy,
    automationReference: dependencies.automationWorkflow,
    identityReference: dependencies.identityRef,
    providerReferences: dependencies.connectionProviders,
    createdAt: now,
    updatedAt: now,
    correlationId,
    governanceState: readiness.ready ? "pillow-approved" : "configuring",
  };
}

export function createGrandKingProductionWorkspace(input: {
  context?: RegistryLoaderContext;
  actorId: string;
  ownerId: string;
  pillowGovernance: true;
}): GrandKingProductionWorkspace {
  const context = input.context ?? { workspaceId: "ws_empire_1" };
  const governance = validateProductionWorkspacePillowGovernance({
    actorId: input.actorId,
    workspaceId: context.workspaceId ?? "ws_empire_1",
    ownerId: input.ownerId,
    operation: "configure",
    pillowGovernance: true,
  });
  if (!governance.allowed) {
    throw new Error(governance.reason);
  }

  if (canonicalWorkspace) {
    return canonicalWorkspace;
  }

  const workspace = buildWorkspaceFromRegistry(context);
  canonicalWorkspace = workspace;

  recordProductionWorkspaceEklsObservation({
    actorId: input.actorId,
    workspaceId: workspace.workspaceId,
    ownerId: input.ownerId,
    kind: "workspace_created",
    summary: `Grand King production workspace ${workspace.workspaceName} created`,
    pillowGovernance: true,
  });

  recordProductionWorkspaceEklsObservation({
    actorId: input.actorId,
    workspaceId: workspace.workspaceId,
    ownerId: input.ownerId,
    kind: "workspace_configuration_updated",
    summary: "Grand King production workspace configuration resolved from registry",
    pillowGovernance: true,
  });

  if (workspace.status === "ready") {
    recordProductionWorkspaceEklsObservation({
      actorId: input.actorId,
      workspaceId: workspace.workspaceId,
      ownerId: input.ownerId,
      kind: "workspace_ready",
      summary: "Grand King production workspace ready",
      pillowGovernance: true,
    });
  }

  return workspace;
}

export function activateGrandKingProductionWorkspace(input: {
  actorId: string;
  ownerId: string;
  pillowGovernance: true;
}): GrandKingProductionWorkspace {
  const workspace = getGrandKingProductionWorkspace();
  const governance = validateProductionWorkspacePillowGovernance({
    actorId: input.actorId,
    workspaceId: workspace.workspaceId,
    ownerId: input.ownerId,
    operation: "activate",
    pillowGovernance: true,
  });
  if (!governance.allowed) {
    throw new Error(governance.reason);
  }

  const readiness = evaluateWorkspaceReadiness();
  if (!readiness.ready) {
    throw new Error("Workspace not ready for activation");
  }

  const transition = transitionWorkspaceStatus(workspace, "active", "pillow-approved");
  if (!transition.ok) {
    throw new Error(transition.reason);
  }

  canonicalWorkspace = transition.workspace;
  recordProductionWorkspaceEklsObservation({
    actorId: input.actorId,
    workspaceId: workspace.workspaceId,
    ownerId: input.ownerId,
    kind: "workspace_activated",
    summary: "Grand King production workspace activated",
    pillowGovernance: true,
  });

  return transition.workspace;
}

export function getGrandKingProductionWorkspace(): GrandKingProductionWorkspace {
  if (!canonicalWorkspace) {
    throw new Error("Grand King production workspace not initialized — call createGrandKingProductionWorkspace first");
  }
  return canonicalWorkspace;
}

export function getProductionWorkspaceOverview(context: RegistryLoaderContext = {}): ProductionWorkspaceOverview {
  const workspace = canonicalWorkspace;
  const health = workspace ? evaluateWorkspaceHealth(workspace, context) : { score: 0 };
  return {
    frameworkVersion: GRAND_KING_PRODUCTION_WORKSPACE_VERSION,
    workspaceCount: workspace ? 1 : 0,
    canonicalWorkspaceId: workspace?.workspaceId ?? "ws_empire_1",
    workspaceStatus: workspace?.status,
    productionEligible: workspace?.productionEligibility ?? false,
    healthScore: health.score,
    generatedAt: new Date().toISOString(),
  };
}

export function getWorkspaceHealth(context: RegistryLoaderContext = {}) {
  return evaluateWorkspaceHealth(getGrandKingProductionWorkspace(), context);
}

export function getWorkspaceReadiness(context: RegistryLoaderContext = {}) {
  return evaluateWorkspaceReadiness(context);
}

export function getWorkspaceDependencies(context: RegistryLoaderContext = {}) {
  return buildWorkspaceConfiguration(context).dependencies;
}

export function getWorkspaceConfiguration(context: RegistryLoaderContext = {}) {
  return buildWorkspaceConfiguration(context);
}

export function getWorkspaceSummary(context: RegistryLoaderContext = {}): string {
  const workspace = getGrandKingProductionWorkspace();
  const health = evaluateWorkspaceHealth(workspace, context);
  const readiness = evaluateWorkspaceReadiness(context);
  return `Grand King Production Workspace: ${workspace.status} (health ${health.score}, ready=${readiness.ready})`;
}

export function blockGrandKingProductionWorkspace(input: {
  actorId: string;
  ownerId: string;
  reason: string;
  pillowGovernance: true;
}): GrandKingProductionWorkspace {
  const workspace = getGrandKingProductionWorkspace();
  const blocked: GrandKingProductionWorkspace = {
    ...workspace,
    status: "blocked",
    updatedAt: new Date().toISOString(),
    governanceState: "pillow-blocked",
  };
  canonicalWorkspace = blocked;
  recordProductionWorkspaceEklsObservation({
    actorId: input.actorId,
    workspaceId: workspace.workspaceId,
    ownerId: input.ownerId,
    kind: "workspace_blocked",
    summary: input.reason,
    pillowGovernance: true,
  });
  recordProductionWorkspaceEklsObservation({
    actorId: input.actorId,
    workspaceId: workspace.workspaceId,
    ownerId: input.ownerId,
    kind: "workspace_health_changed",
    summary: "Workspace health changed due to blocked status",
    pillowGovernance: true,
  });
  return blocked;
}
