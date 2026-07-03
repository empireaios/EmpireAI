/**
 * G6-01 — Platform integrity certification contract types.
 */

import { z } from "zod";
import type { CertificationResultState } from "../../contracts/production-certification-types.js";

export const PLATFORM_INTEGRITY_CERTIFICATION_VERSION = "g6-01-v1" as const;

export const PLATFORM_INTEGRITY_EKLS_KINDS = [
  "platform_integrity_scan",
  "ownership_violation",
  "architecture_drift",
  "dependency_violation",
  "integrity_certified",
] as const;

export type PlatformIntegrityEklsKind = (typeof PLATFORM_INTEGRITY_EKLS_KINDS)[number];

export const PLATFORM_INTEGRITY_RESULT_STATES = [
  "pass",
  "pass_with_conditions",
  "warning",
  "blocked",
  "fail",
] as const;

export type PlatformIntegrityResultState = (typeof PLATFORM_INTEGRITY_RESULT_STATES)[number];

export type PlatformIntegrityViolation = {
  violationId: string;
  ruleId: string;
  ruleKind: string;
  subsystemId: string;
  severity: "info" | "low" | "medium" | "high" | "critical";
  message: string;
  recommendation?: string;
};

export type OwnershipMatrixEntry = {
  subsystemId: string;
  canonicalOwner: string;
  actualOwner: string;
  compliant: boolean;
  forbiddenOwners: string[];
};

export type DependencyMatrixEntry = {
  subsystemId: string;
  dependencyId: string;
  allowed: boolean;
  direction: "outbound" | "inbound";
};

export type PlatformIntegrityScanResult = {
  scanId: string;
  correlationId: string;
  status: PlatformIntegrityResultState;
  score: number;
  ownershipMatrix: OwnershipMatrixEntry[];
  dependencyMatrix: DependencyMatrixEntry[];
  violations: PlatformIntegrityViolation[];
  driftFindings: PlatformIntegrityViolation[];
  duplicateOwnershipFindings: PlatformIntegrityViolation[];
  circularDependencyFindings: PlatformIntegrityViolation[];
  programmeResults: Array<{
    programmeRef: string;
    subsystemId: string;
    status: PlatformIntegrityResultState;
    moduleId?: string;
    programmeStatus?: string;
  }>;
  scannedAt: string;
  discoverySource: "REG-CERTIFICATION-INTEGRITY";
};

export type PlatformIntegrityOverview = {
  frameworkVersion: typeof PLATFORM_INTEGRITY_CERTIFICATION_VERSION;
  ruleCount: number;
  subsystemCount: number;
  lastScanId?: string;
  lastStatus?: PlatformIntegrityResultState;
  generatedAt: string;
};

export const platformIntegrityPluginManifestSchema = z.object({
  pluginId: z.string().min(1),
  pluginName: z.string().min(1),
  validatorKind: z.enum(["integrity", "dependency", "ownership", "risk_analyser"]),
  pillowGovernance: z.literal(true),
});

export type PlatformIntegrityPluginManifest = z.infer<typeof platformIntegrityPluginManifestSchema>;

export function mapIntegrityStatusToCertification(
  status: PlatformIntegrityResultState,
): CertificationResultState {
  return status;
}
