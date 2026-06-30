import type { GovernancePolicyRule } from "../../empire-governance/models/governance-policy.js";
import type { Doctrine } from "../models/doctrine.js";

/** Compiles an active doctrine into an executable governance policy rule. */
export function compileDoctrineToGovernancePolicy(doctrine: Doctrine): GovernancePolicyRule | null {
  if (doctrine.status !== "ACTIVE" || !doctrine.executablePolicy) {
    return null;
  }

  const executable = doctrine.executablePolicy;
  const timestamp = doctrine.updatedAt;

  return {
    policyId: `policy:${doctrine.doctrineId}:v${doctrine.version}`,
    workspaceId: doctrine.workspaceId,
    domain: executable.domain,
    name: doctrine.title,
    description: doctrine.statement,
    module: executable.module,
    action: executable.action,
    effect: executable.effect,
    envFlag: executable.envFlag,
    requiredRole: executable.requiredRole,
    priority: executable.priority,
    enabled: true,
    metadata: {
      source: "doctrine-engine",
      doctrineId: doctrine.doctrineId,
      doctrineVersion: String(doctrine.version),
      ...doctrine.metadata,
    },
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

/** Compiles all active doctrines into governance policies for enforcement. */
export function compileExecutableDoctrinePolicies(doctrines: Doctrine[]): GovernancePolicyRule[] {
  return doctrines
    .map(compileDoctrineToGovernancePolicy)
    .filter((policy): policy is GovernancePolicyRule => policy !== null);
}
