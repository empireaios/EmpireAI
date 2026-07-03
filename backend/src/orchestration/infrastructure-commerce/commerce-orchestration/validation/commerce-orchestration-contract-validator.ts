/**
 * G2-08 — Commerce orchestration contract validation.
 */

import {
  COMMERCE_ORCHESTRATION_VERSION,
  commerceOrchestrationConfigurationSchema,
  commerceOrchestrationRequestSchema,
  type CommerceOrchestrationConfiguration,
  type CommerceOrchestrationContract,
  type CommerceOrchestrationProfileRow,
  type CommerceOrchestrationRequest,
  type CommerceHealthStatus,
} from "../contracts/commerce-orchestration-types.js";

export class CommerceOrchestrationValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CommerceOrchestrationValidationError";
  }
}

export function parseCommerceOrchestrationConfiguration(
  configuration: Record<string, unknown>,
): CommerceOrchestrationConfiguration {
  const integration = configuration.orchestrationFramework;
  try {
    return commerceOrchestrationConfigurationSchema.parse(integration);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new CommerceOrchestrationValidationError(
      `Invalid commerce orchestration configuration: ${detail}`,
    );
  }
}

export function buildCommerceOrchestrationContract(
  row: CommerceOrchestrationProfileRow,
  healthStatus: CommerceHealthStatus = "unknown",
  status: CommerceOrchestrationContract["status"] = "validated",
): CommerceOrchestrationContract {
  const integration = parseCommerceOrchestrationConfiguration(row.configuration);

  return {
    profileId: row.id,
    profileName: row.name,
    version: row.version,
    status,
    capabilities: row.capabilities,
    executionScope: integration.executionScope,
    participatingComponents: integration.participatingComponents,
    coordinationCapabilities: integration.coordinationCapabilities,
    healthStatus,
    domainContracts: integration.domainContracts,
    policyRef: row.policyRef,
    discoverySource: "CommerceOrchestrationCatalog:registry-backed",
  };
}

export function validateCommerceOrchestrationRequest(request: unknown): CommerceOrchestrationRequest {
  try {
    return commerceOrchestrationRequestSchema.parse(request);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new CommerceOrchestrationValidationError(
      `Invalid commerce orchestration request: ${detail}`,
    );
  }
}

export function assertUniqueOrchestrationProfileIds(
  contracts: CommerceOrchestrationContract[],
): void {
  const seen = new Set<string>();
  for (const contract of contracts) {
    if (seen.has(contract.profileId)) {
      throw new CommerceOrchestrationValidationError(
        `Duplicate orchestration profile id: ${contract.profileId}`,
      );
    }
    seen.add(contract.profileId);
  }
}

export function assertOrchestrationVersion(): typeof COMMERCE_ORCHESTRATION_VERSION {
  return COMMERCE_ORCHESTRATION_VERSION;
}
