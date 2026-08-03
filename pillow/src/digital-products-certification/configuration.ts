import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import {
  CERTIFICATION_STATUSES,
  DIGITAL_PRODUCTS_FACTORY_COMPONENTS,
  DIGITAL_PRODUCTS_FACTORY_VERSION,
  DIGITAL_PRODUCTS_GOVERNANCE_RULES,
  INTEGRATION_DOMAINS,
  MISSION_AUDIT_PATHS,
} from "./paths.js";
import type { DigitalProductsCertificationReport } from "./types.js";

export type DigitalProductsCertificationConfiguration = {
  enabled: boolean;
  certificationRulesEnabled: boolean;
  componentRulesEnabled: boolean;
  integrationRulesEnabled: boolean;
  governanceRulesEnabled: boolean;
  readinessRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  repositoryEvidenceScanEnabled: boolean;
  digitalProductsFactoryVersion: string;
  digitalProductsFactoryComponents: string[];
  certificationStatuses: string[];
  integrationDomains: string[];
  governanceRules: string[];
  maxFailuresForPartial: number;
  maxWarningsForConditional: number;
  defaultDigitalProductMission: string;
  seedReports: DigitalProductsCertificationReport[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  neverAutomaticallyFixFailures: true;
  neverAutomaticallyCertifyIncompleteWork: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverBeginQ6Implementation: true;
  neverAssumeImplementation: true;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  preserveCompleteTraceability: true;
  preserveAuditHistory: true;
  reportEveryDeviationHonestly: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
  neverLogSensitiveEnterpriseInformation: true;
};

export const DEFAULT_DIGITAL_PRODUCTS_CERTIFICATION_CONFIGURATION: DigitalProductsCertificationConfiguration =
  {
    enabled: true,
    certificationRulesEnabled: true,
    componentRulesEnabled: true,
    integrationRulesEnabled: true,
    governanceRulesEnabled: true,
    readinessRulesEnabled: true,
    validationRulesEnabled: true,
    repositoryEvidenceScanEnabled: true,
    digitalProductsFactoryVersion: DIGITAL_PRODUCTS_FACTORY_VERSION,
    digitalProductsFactoryComponents: DIGITAL_PRODUCTS_FACTORY_COMPONENTS.map((c) => c.id),
    certificationStatuses: [...CERTIFICATION_STATUSES],
    integrationDomains: [...INTEGRATION_DOMAINS],
    governanceRules: [...DIGITAL_PRODUCTS_GOVERNANCE_RULES],
    maxFailuresForPartial: 2,
    maxWarningsForConditional: 5,
    defaultDigitalProductMission: "Lean digital product business for factory operations",
    seedReports: [],
    retryPolicyAttempts: 3,
    timeoutMs: 5000,
    loggingLevel: "info",
    neverAutomaticallyFixFailures: true,
    neverAutomaticallyCertifyIncompleteWork: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverBeginQ6Implementation: true,
    neverAssumeImplementation: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    preserveCompleteTraceability: true,
    preserveAuditHistory: true,
    reportEveryDeviationHonestly: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
  };

export function buildDigitalProductsCertificationConfiguration(
  repositoryRoot?: string,
  overrides: Partial<DigitalProductsCertificationConfiguration> = {},
): DigitalProductsCertificationConfiguration {
  let file: Partial<DigitalProductsCertificationConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "digital-products-certification.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(
    process.env.DIGITAL_PRODUCTS_CERTIFICATION_TIMEOUT_MS ?? "",
    10,
  );
  const retries = Number.parseInt(
    process.env.DIGITAL_PRODUCTS_CERTIFICATION_RETRY_ATTEMPTS ?? "",
    10,
  );

  const mergeList = (
    key:
      | "digitalProductsFactoryComponents"
      | "certificationStatuses"
      | "integrationDomains"
      | "governanceRules",
  ) =>
    Array.from(
      new Set([
        ...DEFAULT_DIGITAL_PRODUCTS_CERTIFICATION_CONFIGURATION[key],
        ...(file[key] ?? []),
        ...(overrides[key] ?? []),
      ]),
    );

  return {
    ...DEFAULT_DIGITAL_PRODUCTS_CERTIFICATION_CONFIGURATION,
    ...file,
    ...overrides,
    digitalProductsFactoryComponents: mergeList("digitalProductsFactoryComponents"),
    certificationStatuses: mergeList("certificationStatuses"),
    integrationDomains: mergeList("integrationDomains"),
    governanceRules: mergeList("governanceRules"),
    seedReports: (overrides.seedReports ?? file.seedReports ?? []).map((r) => cloneSeedReport(r)),
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    neverAutomaticallyFixFailures: true,
    neverAutomaticallyCertifyIncompleteWork: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverBeginQ6Implementation: true,
    neverAssumeImplementation: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    preserveCompleteTraceability: true,
    preserveAuditHistory: true,
    reportEveryDeviationHonestly: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
  };
}

export function scanMissionAuditEvidence(repositoryRoot: string) {
  const results = new Map<
    string,
    { found: boolean; finalPass: boolean; path: string; evidence: string }
  >();

  for (const component of DIGITAL_PRODUCTS_FACTORY_COMPONENTS) {
    const relPath = MISSION_AUDIT_PATHS[component.missionId];
    if (!relPath) {
      results.set(component.missionId, {
        found: false,
        finalPass: false,
        path: "",
        evidence: "No audit path configured",
      });
      continue;
    }
    const absPath = join(repositoryRoot, relPath);
    if (!existsSync(absPath)) {
      results.set(component.missionId, {
        found: false,
        finalPass: false,
        path: relPath,
        evidence: `Audit directory missing: ${relPath}`,
      });
      continue;
    }
    let finalPass = false;
    let evidenceFile = "";
    try {
      const files = readdirSync(absPath).filter((f) => f.endsWith(".md"));
      for (const file of files) {
        const content = readFileSync(join(absPath, file), "utf8");
        if (content.includes("FINAL PASS")) {
          finalPass = true;
          evidenceFile = file;
          break;
        }
      }
    } catch {
      /* unreadable */
    }
    results.set(component.missionId, {
      found: true,
      finalPass,
      path: relPath,
      evidence: finalPass
        ? `FINAL PASS in ${evidenceFile || "audit doc"}`
        : `Audit present but FINAL PASS not found under ${relPath}`,
    });
  }
  return results;
}

function cloneSeedReport(r: DigitalProductsCertificationReport): DigitalProductsCertificationReport {
  return {
    ...r,
    digitalProductsTested: [...r.digitalProductsTested],
    missionVerificationMatrix: r.missionVerificationMatrix.map((m) => ({ ...m })),
    workerVerificationMatrix: r.workerVerificationMatrix.map((w) => ({ ...w })),
    integrationResults: r.integrationResults.map((v) => ({ ...v })),
    endToEndWorkflowResults: r.endToEndWorkflowResults.map((w) => ({ ...w })),
    governanceResults: r.governanceResults.map((v) => ({ ...v })),
    outstandingIssues: r.outstandingIssues.map((i) => ({ ...i })),
    recommendations: [...r.recommendations],
    componentVerifications: r.componentVerifications.map((v) => ({ ...v })),
    integrationVerifications: r.integrationVerifications.map((v) => ({ ...v })),
    governanceVerifications: r.governanceVerifications.map((v) => ({ ...v })),
    traceabilityChain: r.traceabilityChain.map((t) => ({ ...t })),
  };
}
