import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  AUDIT_STATUSES,
  CHECK_STATUSES,
  SECURITY_COMPONENT_KEYS,
  READINESS_CLASSIFICATIONS,
  READINESS_DECISIONS,
  SECART_CAPABILITIES,
  SECART_METADATA_VERSION,
  SECURITY_AUDIT_REPORT_VERSION,
  buildSecurityAuditConfiguration,
  createSecurityAudit,
  isForbiddenMissionId,
  resetSecurityAuditForTesting,
  type SecartInput,
  type SecurityAuditDependencies,
} from "../../security-audit/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

function sampleInput(overrides: Partial<SecartInput> = {}): SecartInput {
  return {
    grandKingInstructions:
      "Discover every security component strictly from injected handles, verify authentication/authorization/RBAC/secret-management/API security/data protection/runtime security/operational security from observed structural evidence only, and classify security readiness deterministically; never fabricate, never certify insecure implementations, never expose secrets, never override governance, Pillow, or Grand King.",
    pillowCommandConfirmed: true,
    grandKingApproved: true,
    validated: true,
    ...overrides,
  };
}

/** Full evidence stubs: every catalogued security component bound with its
 * capability methods present, configuration flags masked, and the Q1105
 * consumable contract exposed by an injected business-factory-audit handle. */
function allDependenciesReachable(): SecurityAuditDependencies {
  const deps: Record<string, unknown> = {};
  deps.authenticationWorker = {
    getState: () => ({
      status: "active",
      configuration: {
        maskSensitiveValues: true,
        neverStorePlaintextPasswords: true,
        neverExposeSecretsInLogsOrReports: true,
      },
    }),
    login: () => ({ ok: true }),
    registerAccount: () => ({ ok: true }),
    validateSession: () => ({ ok: true }),
    requestPasswordReset: () => ({ ok: true }),
    resetPassword: () => ({ ok: true }),
    verifyAccount: () => ({ ok: true }),
    getAuthAuditEvents: () => [],
  };
  deps.authorizationWorker = {
    getState: () => ({ status: "active" }),
    evaluateAccess: () => ({ allowed: true }),
    createRole: () => ({ ok: true }),
    assignRole: () => ({ ok: true }),
    getAuthorizationAuditEvents: () => [],
  };
  deps.authorityMatrix = {
    getState: () => ({ status: "active" }),
    validateWorkerAuthority: () => ({ ok: true }),
    validateApprovalRouting: () => ({ ok: true }),
    deriveAuthority: () => ({ ok: true }),
    getCatalog: () => ({ entries: [] }),
  };
  deps.apiRuntime = {
    getState: () => ({ status: "active" }),
    authenticate: () => ({ ok: true }),
    routeRequest: () => ({ ok: true }),
    checkHealth: () => ({ status: "active" }),
    getAuditTrail: () => [],
  };
  deps.toolRuntime = {
    getState: () => ({ status: "active" }),
    authenticate: () => ({ ok: true }),
    invokeTool: () => ({ ok: true }),
    checkAvailability: () => ({ ok: true }),
  };
  deps.auditRuntime = {
    getState: () => ({ status: "active" }),
    recordEvent: () => ({ ok: true }),
    verifyIntegrity: () => ({ ok: true }),
    query: () => [],
  };
  deps.monitoringRuntime = {
    getState: () => ({ status: "active" }),
    monitorRuntimes: () => ({ ok: true }),
    detectAnomalies: () => [],
    generateAlerts: () => [],
    getDashboard: () => ({ panels: [] }),
  };
  deps.productionCertificationCore = {
    getState: () => ({ status: "active" }),
    verifyGovernanceCompliance: () => ({ ok: true }),
    produceReport: () => ({ report: {} }),
    getCertificationResults: () => [],
  };
  deps.businessFactoryAudit = {
    getState: () => ({ status: "active" }),
    getQ1105ConsumableContract: () => ({
      contractVersion: "BFART-001-v1",
      consumerMissionId: "Q11-05",
      exposedFields: ["assessments", "businessReadinessSummary"],
    }),
  };
  deps.executiveReportingRuntime = {
    submitWorkerReport: () => ({ records: [{ reportId: "ert-secart-test" }] }),
    retrieveReport: () => ({ report: {} }),
  };
  deps.sharedRuntimeCore = { listFactories: () => [], getCatalog: () => ({ factories: [] }) };
  deps.workerRegistry = { listWorkers: () => [], registerWorker: () => ({ ok: true }) };
  deps.pillowOrchestrationRuntime = {
    invokeWorker: () => ({ dispatched: true }),
    retrieveReport: () => ({ report: {} }),
  };
  return deps as SecurityAuditDependencies;
}

async function build(config?: Parameters<typeof createSecurityAudit>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  if (bootstrap.status !== "ready") {
    throw new Error("Bootstrap failed to reach ready state for Security Audit tests");
  }
  const engine = createSecurityAudit(bootstrap, config);
  await engine.initialize();
  engine.connect();
  return engine;
}

async function buildFullyReachable() {
  return build({ dependencies: allDependenciesReachable() });
}

describe("Q11-05 Security Audit", () => {
  beforeEach(resetSecurityAuditForTesting);

  test("1 locks mandatory boundaries", () => {
    const c = buildSecurityAuditConfiguration(REPO_ROOT, {
      neverFabricateSecurityEvidence: false as never,
      neverCertifyInsecureImplementations: false as never,
      neverExposeSecretsDuringAuditing: false as never,
      neverAssumeImplementation: false as never,
      neverModifySecurityImplementations: false as never,
      neverRepairFailedSecurityComponents: false as never,
      neverBypassPillowGovernance: false as never,
      neverBypassGrandKingApproval: false as never,
      neverOverrideApprovedArchitecture: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
      neverImplementQ1106OrLater: false as never,
    });
    assert.equal(c.neverFabricateSecurityEvidence, true);
    assert.equal(c.neverCertifyInsecureImplementations, true);
    assert.equal(c.neverExposeSecretsDuringAuditing, true);
    assert.equal(c.neverAssumeImplementation, true);
    assert.equal(c.neverModifySecurityImplementations, true);
    assert.equal(c.neverRepairFailedSecurityComponents, true);
    assert.equal(c.neverBypassPillowGovernance, true);
    assert.equal(c.neverBypassGrandKingApproval, true);
    assert.equal(c.neverOverrideApprovedArchitecture, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverImplementQ1106OrLater, true);
    assert.equal(c.preserveCompleteTraceability, true);
    assert.equal(c.preserveImmutableAuditHistory, true);
    assert.equal(c.preserveAuditHistory, true);
    assert.equal(c.deterministicAuditBehaviour, true);
    assert.equal(c.structuralSignalOnly, true);
    assert.equal(c.evidenceBasedOnly, true);
    assert.equal(c.maskSensitiveValues, true);
  });

  test("2 initializes PILLOW-SECART-001 Q11-05", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q11-05");
    assert.equal(state.engineVersion, "PILLOW-SECART-001");
    assert.equal(state.configuration.workerId, "wkr-security-audit-01");
    assert.equal(state.configuration.factory, "security-audit");
    assert.ok(SECART_CAPABILITIES.includes("discover_security_components"));
    assert.ok(SECART_CAPABILITIES.includes("verify_authentication"));
    assert.ok(SECART_CAPABILITIES.includes("verify_secret_management"));
    assert.ok(SECART_CAPABILITIES.includes("classify_security_readiness"));
    assert.ok(SECART_CAPABILITIES.includes("expose_q1106_consumable_contract"));
    assert.ok(SECART_CAPABILITIES.includes("consume_q1105_consumable_contract"));
    for (const classification of READINESS_CLASSIFICATIONS) {
      assert.ok(
        ["certified", "partially_certified", "failed", "missing", "blocked", "deferred"].includes(classification),
      );
    }
    for (const decision of READINESS_DECISIONS) {
      assert.ok(["certify", "withhold", "escalate", "defer"].includes(decision));
    }
    for (const status of CHECK_STATUSES) {
      assert.ok(["Passed", "Partial", "Failed", "Missing"].includes(status));
    }
  });

  test("3 discovers security components strictly from injected handles", async () => {
    const engineNoHandles = await build();
    const noHandleDiscovery = engineNoHandles.discoverSecurityComponents();
    assert.equal(noHandleDiscovery.discoveredCount, 0);
    assert.equal(noHandleDiscovery.totalCatalogued, SECURITY_COMPONENT_KEYS.length);

    const engine = await buildFullyReachable();
    const discovery = engine.discoverSecurityComponents();
    assert.equal(discovery.discoveredCount, SECURITY_COMPONENT_KEYS.length);
    for (const component of discovery.components) {
      assert.ok((SECURITY_COMPONENT_KEYS as readonly string[]).includes(component.componentKey));
      assert.equal(component.bound, true);
      assert.equal(component.evidencePresent, true);
    }
  });

  test("4 verifies authentication (identity-provider capability presence)", async () => {
    const engine = await buildFullyReachable();
    const rows = engine.verifyAuthentication();
    assert.equal(rows.length, SECURITY_COMPONENT_KEYS.length);
    const authRow = rows.find((r) => r.componentId === "authentication-worker");
    assert.ok(authRow);
    assert.equal(authRow!.authenticationStatus, "Passed");
    assert.ok(Array.isArray(authRow!.evidence));

    const engineNoAuth = await build();
    const rowsMissing = engineNoAuth.verifyAuthentication();
    const missingRow = rowsMissing.find((r) => r.componentId === "authentication-worker");
    assert.equal(missingRow!.authenticationStatus, "Missing");
  });

  test("5 verifies authorization + RBAC/permission enforcement", async () => {
    const engine = await buildFullyReachable();
    const rows = engine.verifyAuthorization();
    assert.equal(rows.length, SECURITY_COMPONENT_KEYS.length);
    const azRow = rows.find((r) => r.componentId === "authorization-worker");
    assert.equal(azRow!.authorizationStatus, "Passed");

    const rbacRows = engine.verifyRolePermissionEnforcement();
    assert.equal(rbacRows.length, 2);
    for (const row of rbacRows) {
      assert.ok(["authorization-worker", "authority-matrix"].includes(row.componentId));
      assert.equal(row.authorizationStatus, "Passed");
    }

    const engineNoAuthz = await build();
    const missingRbac = engineNoAuthz.verifyRolePermissionEnforcement();
    for (const row of missingRbac) assert.equal(row.authorizationStatus, "Missing");
  });

  test("6 verifies secret management without exposing secret values", async () => {
    const engine = await buildFullyReachable();
    const rows = engine.verifySecretManagement();
    assert.equal(rows.length, SECURITY_COMPONENT_KEYS.length);
    const secretRow = rows.find((r) => r.componentId === "secret-management");
    assert.equal(secretRow!.secretStatus, "Passed");
    const serialized = JSON.stringify(rows).toLowerCase();
    assert.ok(!serialized.includes("password="), "must never expose password values");
    assert.ok(!serialized.includes("token="), "must never expose token values");

    const engineNoAuth = await build();
    const rowsMissing = engineNoAuth.verifySecretManagement();
    const missingSecretRow = rowsMissing.find((r) => r.componentId === "secret-management");
    assert.equal(missingSecretRow!.secretStatus, "Missing");
  });

  test("7 verifies api security, data protection, runtime security, operational security", async () => {
    const engine = await buildFullyReachable();
    const apiRows = engine.verifyApiSecurity();
    const apiRow = apiRows.find((r) => r.componentId === "api-runtime");
    assert.equal(apiRow!.apiSecurityStatus, "Passed");

    const dataRows = engine.verifyDataProtection();
    assert.equal(dataRows.length, SECURITY_COMPONENT_KEYS.length);

    const runtimeRows = engine.verifyRuntimeSecurity();
    const monitoringRow = runtimeRows.find((r) => r.componentId === "monitoring-runtime");
    assert.equal(monitoringRow!.runtimeSecurityStatus, "Passed");

    const operationalRows = engine.verifyOperationalSecurity();
    const auditRow = operationalRows.find((r) => r.componentId === "audit-runtime");
    assert.equal(auditRow!.operationalSecurityStatus, "Passed");

    const integrationVerification = engine.verifyIntegrations();
    assert.equal(integrationVerification.allBound, true);

    const bareEngine = await build();
    const bareApiRows = bareEngine.verifyApiSecurity();
    const bareApiRow = bareApiRows.find((r) => r.componentId === "api-runtime");
    assert.equal(bareApiRow!.apiSecurityStatus, "Missing");
  });

  test("8 security readiness classifications + full Security Audit Report + consumableByQ1106", async () => {
    const engine = await buildFullyReachable();
    const report = engine.produceReport(sampleInput());
    assert.ok(["pass", "partial"].includes(report.validation.decision));
    assert.ok(report.reportId.startsWith("secart-rpt-"));
    assert.ok(report.timestamp);
    assert.equal(report.auditVersion, "Q11-SECART-v1");
    assert.equal(report.engineId, "PILLOW-SECART-001");
    assert.equal(report.missionId, "Q11-05");
    assert.equal(report.totalSecurityComponents, SECURITY_COMPONENT_KEYS.length);
    assert.equal(
      report.certifiedComponents +
        report.partiallyCertifiedComponents +
        report.failedComponents +
        report.missingComponents +
        report.blockedComponents +
        report.deferredComponents,
      SECURITY_COMPONENT_KEYS.length,
    );
    assert.ok(report.authenticationSummary);
    assert.ok(report.authorizationSummary);
    assert.ok(report.secretManagementSummary);
    assert.ok(report.apiSecuritySummary);
    assert.ok(report.dataProtectionSummary);
    assert.ok(report.runtimeSecuritySummary);
    assert.ok(report.operationalSecuritySummary);
    assert.ok(report.integrationSummary);
    assert.ok(report.governanceSummary);
    assert.ok(Array.isArray(report.supportingEvidence));
    assert.ok(Array.isArray(report.outstandingRisks));
    assert.ok(Array.isArray(report.criticalFindings));
    assert.ok(report.confidenceScore >= 0 && report.confidenceScore <= 1);
    assert.equal(report.metadataVersion, SECART_METADATA_VERSION);
    assert.equal(report.reportVersion, SECURITY_AUDIT_REPORT_VERSION);
    assert.equal(report.workerId, "wkr-security-audit-01");
    assert.ok(READINESS_DECISIONS.includes(report.decision));
    assert.equal(report.decision, "certify");
    assert.equal(report.certifiedComponents, SECURITY_COMPONENT_KEYS.length);
    assert.ok(report.validation);
    assert.equal(report.consumableByQ1106, true);
    assert.equal(report.neverImplementQ1106OrLater, true);
    assert.equal(report.structuralSignalOnly, true);
    assert.equal(report.evidenceBasedOnly, true);
    assert.equal(report.fifthQ11Gate, true);
    assert.ok(report.q1105ContractConsumed);
    assert.equal(report.q1105ContractConsumed.attempted, true);
    assert.equal(report.q1105ContractConsumed.consumed, true);
    assert.equal(report.componentInventory.length, SECURITY_COMPONENT_KEYS.length);
    assert.equal(report.assessments.length, SECURITY_COMPONENT_KEYS.length);
    for (const row of report.assessments) {
      assert.ok(row.componentId.length > 0);
      assert.ok(row.componentType.length > 0);
      assert.ok(CHECK_STATUSES.includes(row.authenticationStatus));
      assert.ok(CHECK_STATUSES.includes(row.authorizationStatus));
      assert.ok(CHECK_STATUSES.includes(row.secretStatus));
      assert.ok(CHECK_STATUSES.includes(row.apiSecurityStatus));
      assert.ok(CHECK_STATUSES.includes(row.dataProtectionStatus));
      assert.ok(CHECK_STATUSES.includes(row.runtimeSecurityStatus));
      assert.ok(CHECK_STATUSES.includes(row.operationalSecurityStatus));
      assert.ok(READINESS_CLASSIFICATIONS.includes(row.readinessClassification));
      assert.ok(Array.isArray(row.supportingEvidence));
      assert.ok(row.auditReference.length > 0);
      assert.ok(row.auditTimestamp.length > 0);
    }
    assert.ok(AUDIT_STATUSES.includes(report.auditStatus));
    assert.equal(report.auditStatus, "certified");
    const serialized = JSON.stringify(report).toLowerCase();
    assert.ok(!serialized.includes("performance audit implemented"), "must never claim to implement Performance Audit");
    assert.ok(!serialized.includes("password="), "must never expose password values in the report");
  });

  test("9 exposes Q1106 contract without implementing Performance Audit", async () => {
    const engine = await buildFullyReachable();
    const contract = engine.getQ1106ConsumableContract();
    assert.equal(contract.producedBy, "security-audit");
    assert.equal(contract.missionId, "Q11-05");
    assert.equal(contract.consumerMissionId, "Q11-06");
    assert.ok(contract.exposedFields.length > 0);
    assert.ok(contract.readinessClassificationCatalog.length > 0);
    assert.ok(contract.decisionCatalog.length > 0);
    assert.equal(contract.neverImplementQ1106OrLater, true);
    assert.equal(contract.structuralSignalOnly, true);
    assert.ok(
      !JSON.stringify(contract).toLowerCase().includes("performance audit implemented"),
      "must never claim to implement Performance Audit",
    );

    const report = engine.produceReport(sampleInput());
    assert.equal(report.q1105ContractConsumed.attempted, true);
    assert.equal(report.q1105ContractConsumed.consumed, true);
  });

  test("10 rejects fabricate / expose-secrets / certify-insecure / governance bypass", async () => {
    const engine = await buildFullyReachable();
    for (const forbidden of [
      { fabricateSecurityEvidence: true },
      { forceFail: true },
      { certifyInsecureImplementations: true },
      { exposeSecretsDuringAuditing: true },
      { assumeImplementation: true },
      { modifySecurityImplementations: true },
      { repairFailedSecurityComponents: true },
      { bypassPillowGovernance: true },
      { bypassGrandKingApproval: true },
      { overrideApprovedArchitecture: true },
      { overridePillow: true },
      { overrideGrandKing: true },
      { implementQ1106OrLater: true },
    ] as const) {
      const report = engine.produceReport({
        ...sampleInput(),
        ...forbidden,
      });
      assert.equal(report.validation.decision, "fail", `expected fail for ${JSON.stringify(forbidden)}`);
      assert.equal(report.decision, "escalate");
    }
  });

  test("11 rejects Q11-06+ missionId", async () => {
    const engine = await buildFullyReachable();
    assert.equal(isForbiddenMissionId("Q11-05"), false);
    for (const missionId of ["Q11-06", "Q11-07", "Q12-01", "Q20-01"]) {
      assert.equal(isForbiddenMissionId(missionId), true, `expected forbidden: ${missionId}`);
      const report = engine.produceReport({
        ...sampleInput(),
        missionId,
      });
      assert.equal(report.validation.decision, "fail", `expected fail for ${missionId}`);
      assert.equal(report.decision, "escalate");
    }
    const selfOk = engine.produceReport({ ...sampleInput(), missionId: "Q11-05" });
    assert.notEqual(selfOk.decision, "escalate");
  });

  test("12 cockpit + never implements Q1106+ + consumes Q1105 when injected", async () => {
    const engine = await buildFullyReachable();
    engine.produceReport(sampleInput());
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.missionId, "Q11-05");
    assert.ok(cockpit.totalReports >= 1);
    assert.equal(cockpit.lastDecision, "certify");
    assert.equal(cockpit.workerId, "wkr-security-audit-01");
    assert.deepEqual([...cockpit.readinessClassificationOptions].sort(), [...READINESS_CLASSIFICATIONS].sort());
    assert.equal(cockpit.neverFabricateSecurityEvidence, true);
    assert.equal(cockpit.neverExposeSecretsDuringAuditing, true);
    assert.equal(cockpit.neverImplementQ1106OrLater, true);
    assert.equal(cockpit.fifthQ11Gate, true);

    const diagnostics = engine.runDiagnostics();
    assert.equal(diagnostics.missionId, "Q11-05");
    assert.ok(engine.getAuditTrail().length >= 1);
    assert.ok(engine.getCatalog());
    assert.ok(engine.getReports().length >= 1);
    assert.ok(engine.list().length >= 1);
    assert.ok(engine.getSecurityMatrix().length > 0);

    const sync = engine.validateForSupervisorSync();
    assert.notEqual(sync.health, "blocked");
    assert.ok(sync.readinessScore > 0);

    // No businessFactoryAudit injected -> Q1105 contract handshake not attempted.
    const bareEngine = await build();
    const bareReport = bareEngine.produceReport(sampleInput());
    assert.equal(bareReport.q1105ContractConsumed.attempted, false);
    assert.equal(bareReport.q1105ContractConsumed.consumed, false);
  });
});
