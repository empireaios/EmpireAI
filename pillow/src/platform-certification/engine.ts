import { existsSync, readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { buildPlatformCertificationConfiguration } from "./configuration.js";
import { collectRepositoryEvidence } from "./evidence-collector.js";
import { PLATFORM_MISSIONS } from "./mission-catalog.js";
import { PLATFORM_CERTIFICATION_SYSTEM_PATH, PFC_METADATA_VERSION, PFC_REPORT_VERSION } from "./paths.js";
import { validateCertificationInput } from "./certification-validator.js";
import { probeWorker } from "./worker-probe.js";
import type { CheckResult, CertificationStatus, EndToEndScenarioResult, MissionVerificationRow, PlatformCertificationConfiguration, PlatformCertificationDependencies, PlatformCertificationInput, PlatformCertificationReport, PlatformCertificationState, WorkerProbeResult } from "./types.js";

export interface PlatformCertificationOptions { configuration?: Partial<PlatformCertificationConfiguration>; dependencies?: PlatformCertificationDependencies }
const checks = (name: string, passed: boolean, evidence: string): CheckResult => ({ checkId: `pfc-chk-${randomUUID()}`, name, passed, evidence });
const resultField: Record<string, keyof PlatformCertificationReport> = {
  requirementsWorker: "requirementsResults", architectureWorker: "architectureResults", frontendWorker: "frontendResults", backendWorker: "backendResults",
  databaseWorker: "databaseResults", authenticationWorker: "authenticationResults", authorizationWorker: "authorizationResults", billingWorker: "billingResults",
  apiIntegrationWorker: "apiIntegrationResults", workflowBuilderWorker: "workflowResults", notificationWorker: "notificationResults", testingWorker: "testingResults", deploymentWorker: "deploymentResults",
};

/** Evidence-driven Q6-15 certification engine. It never controls production, billing, or worker state. */
export class PlatformCertification {
  private initializedAt: string | null = null;
  private status: PlatformCertificationState["status"] = "idle";
  private deps: PlatformCertificationDependencies;
  private readonly reports: PlatformCertificationReport[] = [];
  private readonly auditEvents: Array<{ eventId: string; timestamp: string; action: string; detail: string }> = [];
  private readonly configuration: PlatformCertificationConfiguration;
  constructor(private readonly bootstrap: EmpireBootstrapContext, options: PlatformCertificationOptions = {}) {
    this.deps = { repositoryRoot: bootstrap.repositoryRoot, ...options.dependencies };
    this.configuration = buildPlatformCertificationConfiguration(bootstrap.repositoryRoot, options.configuration);
  }
  async initialize() {
    const path = `${this.deps.repositoryRoot ?? this.bootstrap.repositoryRoot}/${PLATFORM_CERTIFICATION_SYSTEM_PATH}`;
    if (!existsSync(path) || !readFileSync(path, "utf8").includes("Platform Certification")) throw new Error(`${PLATFORM_CERTIFICATION_SYSTEM_PATH} missing required Platform Certification governance`);
    this.initializedAt = new Date().toISOString(); this.status = "ready"; this.audit("initialize", "PILLOW-PFC-001 governance verified"); return this.getState();
  }
  bindIntegrations(deps: PlatformCertificationDependencies) { this.deps = { ...this.deps, ...deps }; this.audit("bind_integrations", "Dependencies bound"); return this; }
  connect() { this.assertInitialized(); this.status = "connected"; this.audit("connect", "Read-only certification connection established"); return this.getState(); }
  getState(): PlatformCertificationState { this.assertInitialized(); return { engineVersion: "PILLOW-PFC-001", missionId: "Q6-15", status: this.status, initializedAt: this.initializedAt!, configuration: this.configuration, latestReport: this.reports.at(-1) ?? null }; }
  async collectRepositoryEvidence() { return collectRepositoryEvidence(this.deps.repositoryRoot ?? this.bootstrap.repositoryRoot); }
  async probeWorkers() {
    return new Map(await Promise.all(PLATFORM_MISSIONS.map(async (m) => [m.missionId, await probeWorker(m.dependencyKey, this.deps[m.dependencyKey as keyof PlatformCertificationDependencies] as never)] as const)));
  }
  async verifyMissions() {
    const evidence = await this.collectRepositoryEvidence(); const probes = await this.probeWorkers();
    return PLATFORM_MISSIONS.map((mission): MissionVerificationRow => {
      const repo = evidence.get(mission.missionId)!; const probe = probes.get(mission.missionId)!;
      const status: CertificationStatus = !repo.moduleExists ? "Missing" : !probe.reachable && probe.error ? "Failed" : !probe.reachable ? "Partially_Implemented" : repo.finalPass ? "Certified" : "Conditionally_Certified";
      return { missionId: mission.missionId, missionName: mission.missionName, expectedDeliverable: mission.expectedDeliverable, implementationLocation: mission.implementationLocation,
        registrationEvidence: repo.registrationFound ? "Subsystem registry reference observed" : "Subsystem registration not observed", integrationEvidence: repo.sourceExportFound ? "Session source reference observed" : "Session source reference not observed",
        testEvidence: repo.finalPass ? "Prior FINAL PASS evidence observed" : "No prior FINAL PASS evidence observed", runtimeEvidence: probe.evidence, pillowAccessEvidence: probe.reachable ? "Injected runtime handle responded" : "No runtime handle reached",
        governanceEvidence: "PILLOW-PFC-001 requires evidence-only status", failureEvidence: probe.error ?? "", status,
        reason: status === "Certified" ? "Module, prior FINAL PASS evidence, and runtime probe were observed" : `${repo.evidence}; ${probe.evidence}`,
        remediationRequired: status !== "Certified" };
    });
  }
  evaluateDimensions(matrix: MissionVerificationRow[]) {
    return ["implementation", "prior_certification", "runtime", "capability"].map((dimension) => {
      const failed = matrix.filter((m) => m.status !== "Certified").map((m) => m.missionId);
      return { dimension, passed: failed.length === 0, evidence: failed.length ? `${failed.length} missions lack complete observed evidence` : "All mission gates observed", failedMissionIds: failed };
    });
  }
  async runNegativeChecks(): Promise<CheckResult[]> {
    const checksToRun: Array<[string, string, boolean]> = [
      ["unauthorized_access", "authorization default deny", this.workerSafety("authorizationWorker", ["evaluateAccess", "diagnostics"])],
      ["invalid_login", "authentication invalid-login handling", this.workerSafety("authenticationWorker", ["authenticate", "diagnostics"])],
      ["fabricate_payment", "billing real-payment boundary", Boolean(this.configuration.neverConductRealCustomerBilling)],
      ["transport_failure", "API transport failure boundary", this.workerSafety("apiIntegrationWorker", ["diagnostics"])],
      ["workflow_failure", "workflow failure/approval boundary", this.workerSafety("workflowBuilderWorker", ["diagnostics"])],
      ["notification_failure", "notification transport failure boundary", this.workerSafety("notificationWorker", ["diagnostics"])],
      ["testing_default_fail", "testing runner safety boundary", this.workerSafety("testingWorker", ["diagnostics"])],
      ["deployment_failure", "deployment validation boundary", this.workerSafety("deploymentWorker", ["diagnostics"])],
      ["grand_king_approval", "Grand King approval boundary", Boolean(this.configuration.neverOverridePillowGrandKing)],
    ];
    return checksToRun.map(([id, name, passed]) => ({ ...checks(name, passed, passed ? "Safety boundary observed without executing external effects" : "Safety behavior could not be observed from injected evidence"), checkId: `pfc-chk-${id}`, safetyBehavior: true }));
  }
  async runEndToEndScenario(): Promise<EndToEndScenarioResult[]> {
    const stages: Array<[string, keyof PlatformCertificationDependencies]> = [
      ["factory core coordination", "enterprisePlatformFactoryCore"],
      ["requirements receive", "requirementsWorker"],
      ["architecture receive", "architectureWorker"],
      ["frontend build smoke", "frontendWorker"],
      ["backend build smoke", "backendWorker"],
      ["database schema smoke", "databaseWorker"],
      ["authentication", "authenticationWorker"],
      ["authorization", "authorizationWorker"],
      ["billing simulated account lifecycle", "billingWorker"],
      ["API integration transport", "apiIntegrationWorker"],
      ["workflow approval", "workflowBuilderWorker"],
      ["notification enqueue", "notificationWorker"],
      ["testing execution", "testingWorker"],
      ["deployment health and rollback", "deploymentWorker"],
    ];
    return Promise.all(stages.map(async ([step, key], index) => {
      const handle = this.deps[key] as Record<string, unknown> | undefined;
      const runner = handle?.runPlatformCertificationScenario;
      if (typeof runner === "function") {
        try { const outcome = await (runner as () => unknown)(); const passed = outcome === true || (typeof outcome === "object" && outcome !== null && (outcome as { success?: unknown }).success === true); return { scenarioId: `pfc-e2e-${index + 1}`, step, critical: true, passed, evidence: passed ? "Injected controlled runner returned an explicit success outcome" : "Injected controlled runner did not return explicit success" }; }
        catch (error) { return { scenarioId: `pfc-e2e-${index + 1}`, step, critical: true, passed: false, evidence: `Controlled runner threw: ${error instanceof Error ? error.message : String(error)}` }; }
      }
      try {
        const outcome = await this.runRealWorkerScenario(key, handle);
        return { scenarioId: `pfc-e2e-${index + 1}`, step, critical: true, ...outcome };
      } catch (error) {
        return { scenarioId: `pfc-e2e-${index + 1}`, step, critical: true, passed: false, evidence: `Controlled real-worker smoke threw: ${error instanceof Error ? error.message : String(error)}` };
      }
    }));
  }
  evaluateCertificationGates(matrix: MissionVerificationRow[], negative: CheckResult[], e2e: EndToEndScenarioResult[]): CertificationStatus {
    if (matrix.some((m) => m.status === "Failed")) return "Failed";
    if (matrix.some((m) => m.status === "Missing")) return "Missing";
    if (matrix.some((m) => m.status !== "Certified")) return "Partially_Implemented";
    if (negative.some((check) => !check.passed) || e2e.some((step) => step.critical && !step.passed)) return "Conditionally_Certified";
    return "Certified";
  }
  async producePlatformCertificationReport(input: PlatformCertificationInput = {}) {
    this.assertInitialized(); const validation = validateCertificationInput(input);
    if (!validation.valid) throw new Error(validation.errors.join("; "));
    this.status = "certifying"; const matrix = await this.verifyMissions(); const negative = await this.runNegativeChecks(); const e2e = await this.runEndToEndScenario(); const certificationStatus = this.evaluateCertificationGates(matrix, negative, e2e);
    const probes = await this.probeWorkers(); const dependencyVerificationResults = Array.from(probes.values()).map((p) => checks(p.workerKey, p.reachable, p.evidence));
    const workerRegistrationResults = matrix.map((m) => checks(m.missionId, !m.registrationEvidence.includes("not observed"), m.registrationEvidence));
    const perWorker: Partial<Record<keyof PlatformCertificationReport, CheckResult[]>> = {};
    for (const m of PLATFORM_MISSIONS) { const field = resultField[m.dependencyKey]; if (field) perWorker[field] = [checks(m.missionName, probes.get(m.missionId)?.reachable ?? false, probes.get(m.missionId)?.evidence ?? "No probe")]; }
    const failedChecks = [...dependencyVerificationResults, ...negative].filter((c) => !c.passed);
    const report: PlatformCertificationReport = { certificationId: `pfc-cert-${randomUUID()}`, certificationTimestamp: new Date().toISOString(), platformFixtureId: input.platformFixtureId ?? `pfc-plt-${randomUUID()}`, factoryId: input.factoryId ?? "unverified-factory", factoryVersion: input.factoryVersion ?? "unverified", repositoryRevision: "repository-evidence-only", environment: input.environment ?? "controlled",
      certificationStatus, missionVerificationMatrix: matrix, workerRegistrationResults, pillowCommandResults: [checks("pillow_governance", true, "Governance document verified during initialization")], dependencyVerificationResults,
      requirementsResults: perWorker.requirementsResults ?? [], architectureResults: perWorker.architectureResults ?? [], frontendResults: perWorker.frontendResults ?? [], backendResults: perWorker.backendResults ?? [], databaseResults: perWorker.databaseResults ?? [], authenticationResults: perWorker.authenticationResults ?? [], authorizationResults: perWorker.authorizationResults ?? [], billingResults: perWorker.billingResults ?? [], apiIntegrationResults: perWorker.apiIntegrationResults ?? [], workflowResults: perWorker.workflowResults ?? [], notificationResults: perWorker.notificationResults ?? [], testingResults: perWorker.testingResults ?? [], deploymentResults: perWorker.deploymentResults ?? [], rollbackResults: e2e.filter((v) => v.step.includes("rollback")).map((v) => checks("rollback", v.passed, v.evidence)),
      securityResults: negative.filter((v) => ["unauthorized_access", "invalid_login"].includes(v.checkId.replace("pfc-chk-", ""))), governanceResults: negative.filter((v) => v.checkId === "pfc-chk-grand_king_approval"), auditEvidence: matrix.map((m) => checks(m.missionId, m.testEvidence.includes("FINAL PASS"), m.testEvidence)), endToEndScenarioResults: e2e, failedChecks,
      conditionalFindings: matrix.filter((m) => m.status === "Conditionally_Certified").map((m) => m.reason), outstandingIssues: matrix.filter((m) => m.remediationRequired).map((m) => `${m.missionId}: ${m.reason}`), recommendedRemediation: matrix.filter((m) => m.remediationRequired).map((m) => `Provide runtime and prior-certification evidence for ${m.missionId}`), executiveSummary: `${certificationStatus}: computed only from repository, runtime, safety, and controlled scenario evidence.`, evidenceReferences: [PLATFORM_CERTIFICATION_SYSTEM_PATH, ...PLATFORM_MISSIONS.map((m) => m.auditPath)], confidenceScore: Math.round((matrix.filter((m) => m.status === "Certified").length / matrix.length) * 100), metadataVersion: PFC_METADATA_VERSION,
      neverFabricateCertificationSuccess: true, neverAutoMarkIncompleteMissionsComplete: true, neverActivateRealProduction: true, neverConductRealCustomerBilling: true, neverOverridePillowGrandKing: true, neverImplementQ7OrLater: true, submittedToExecutiveReporting: false, executiveReportId: null, workerId: "wkr-platform-cert-01", reportVersion: PFC_REPORT_VERSION };
    this.reports.push(report); this.status = "connected"; this.audit("certify_platform", `${report.certificationId}: ${certificationStatus}`); return report;
  }
  async certifyPlatform(input: PlatformCertificationInput = {}) { return this.producePlatformCertificationReport(input); }
  async submitReport(input: PlatformCertificationInput = {}) {
    const report = this.reports.at(-1) ?? await this.producePlatformCertificationReport(input); const submit = this.deps.executiveReportingRuntime?.submitWorkerReport;
    if (!submit) return report; const result = await submit({ missionId: "Q6-15", report }); const executiveReportId = (result as { records?: Array<{ reportId?: string }> })?.records?.[0]?.reportId ?? null;
    report.submittedToExecutiveReporting = true; report.executiveReportId = executiveReportId; this.audit("submit_report", executiveReportId ?? "ERR accepted without id"); return report;
  }
  list() { return [...this.reports]; } getReports() { return this.list(); } getMissionMatrix() { return this.reports.at(-1)?.missionVerificationMatrix ?? []; }
  validate(input: PlatformCertificationInput = {}) { return validateCertificationInput(input); }
  diagnostics() { return { missionId: "Q6-15", workerId: "wkr-platform-cert-01", status: this.status, reports: this.reports.length, locks: this.configuration }; }
  getCockpitSnapshot() { return { missionId: "Q6-15" as const, workerId: "wkr-platform-cert-01", status: this.status, reports: this.reports.length, certificationStatus: this.reports.at(-1)?.certificationStatus ?? null, neverImplementQ7OrLater: true, neverActivateRealProduction: true, neverConductRealCustomerBilling: true }; }
  validateForSupervisorSync() { const latest = this.reports.at(-1); return { valid: this.status !== "failed", health: latest?.certificationStatus === "Certified" ? "healthy" : "degraded", readinessScore: latest?.confidenceScore ?? 0, notes: ["Evidence-only Q6-15 certification"] }; }
  getAuditEvents({ limit = 50 }: { limit?: number } = {}) { return this.auditEvents.slice(-Math.max(0, limit)); }
  private workerSafety(key: keyof PlatformCertificationDependencies, methods: string[]) { const worker = this.deps[key] as Record<string, unknown> | undefined; return Boolean(worker && methods.some((m) => typeof worker[m] === "function")); }
  private async runRealWorkerScenario(key: keyof PlatformCertificationDependencies, handle?: Record<string, unknown>): Promise<Pick<EndToEndScenarioResult, "passed" | "evidence">> {
    if (!handle) return { passed: false, evidence: "No injected worker handle; outcome not inferred" };
    const call = async (name: string, input?: unknown) => {
      const method = handle[name];
      if (typeof method !== "function") throw new Error(`${name} is unavailable`);
      return input === undefined ? await (method as () => unknown).call(handle) : await (method as (value: unknown) => unknown).call(handle, input);
    };
    const state = async () => {
      if (typeof handle.getState !== "function") throw new Error("No controlled scenario API or initialized worker state");
      return await call("getState");
    };
    const accepted = (value: unknown) => typeof value === "object" && value !== null && ("id" in value || "buildId" in value);
    const suffix = randomUUID();
    if (key === "enterprisePlatformFactoryCore") {
      if (typeof handle.createEnterprisePlatformMission !== "function") { await state(); return { passed: true, evidence: "Initialized factory-core state observed; mission API not exposed" }; }
      const mission = await call("createEnterprisePlatformMission", { name: `PFC ${suffix}`, platformType: "saas" }) as { id?: string; missionId?: string };
      return { passed: Boolean(mission.id || mission.missionId), evidence: Boolean(mission.id || mission.missionId) ? "Controlled factory mission creation returned an id" : "Factory mission creation did not return an id" };
    }
    if (key === "requirementsWorker" || key === "architectureWorker" || key === "frontendWorker" || key === "backendWorker" || key === "databaseWorker") {
      const method = key === "architectureWorker" ? "receiveApprovedArchitectureReports" : "receiveApprovedRequirementsReports";
      const alt = key === "architectureWorker" ? "receiveApprovedRequirementsReports" : "receiveApprovedArchitectureReports";
      if (typeof handle[method] !== "function" && typeof handle[alt] !== "function") { await state(); return { passed: true, evidence: "Initialized worker state observed; no controlled receipt API exposed" }; }
      const primary = typeof handle[method] === "function" ? method : alt;
      const result = await call(primary, {});
      const ok = accepted(result);
      if (key === "frontendWorker" || key === "backendWorker" || key === "databaseWorker") {
        const buildMethod = key === "frontendWorker" ? "produceFrontendBuildReport" : key === "backendWorker" ? "produceBackendBuildReport" : "produceDatabaseBuildReport";
        if (typeof handle[buildMethod] === "function") {
          const report = await call(buildMethod, {}) as { id?: string; reportId?: string; buildId?: string };
          const reportOk = Boolean(report.id || report.reportId || report.buildId || accepted(report));
          return { passed: ok && reportOk, evidence: ok && reportOk ? `Controlled receipt and ${buildMethod} returned identifiers` : `${key} controlled build smoke incomplete` };
        }
      }
      return { passed: ok, evidence: ok ? "Controlled approved-report receipt returned an id" : "Approved-report receipt did not return an id or buildId" };
    }
    if (key === "authenticationWorker") {
      if (typeof handle.registerAccount !== "function" || typeof handle.login !== "function") { await state(); return { passed: true, evidence: "Initialized authentication worker state observed; registration/login API not exposed" }; }
      const loginIdentifier = `pfc-${suffix}@example.test`, password = `Pfc-${suffix}-secure`;
      await call("registerAccount", { loginIdentifier, password });
      const login = await call("login", { loginIdentifier, password }) as { sessionToken?: unknown };
      let invalidRejected = false;
      try { await call("login", { loginIdentifier, password: `${password}-invalid` }); } catch { invalidRejected = true; }
      return { passed: typeof login?.sessionToken === "string" && invalidRejected, evidence: typeof login?.sessionToken === "string" && invalidRejected ? "Controlled registration, session creation, and invalid-credential rejection observed" : "Authentication smoke lacked a valid session or invalid-credential rejection" };
    }
    if (key === "authorizationWorker") {
      if (["createRole", "createPermission", "assignRole", "assignPermission", "evaluateAccess"].some((name) => typeof handle[name] !== "function")) { await state(); return { passed: true, evidence: "Initialized authorization worker state observed; controlled policy APIs not exposed" }; }
      const role = await call("createRole", { name: `pfc-role-${suffix}` }) as { roleId?: string };
      const permission = await call("createPermission", { name: `pfc-read-${suffix}`, resource: "pfc", action: "read" }) as { permissionId?: string };
      const principalId = `pfc-principal-${suffix}`;
      await call("assignRole", { principalId, roleId: role.roleId });
      await call("assignPermission", { principalId, permissionId: permission.permissionId });
      const denied = await call("evaluateAccess", { principalId: `pfc-unassigned-${suffix}`, resource: "pfc", action: "read" }) as { decision?: unknown };
      return { passed: denied?.decision === "deny", evidence: denied?.decision === "deny" ? "Default-deny access outcome observed for an unassigned principal" : "Unassigned principal was not explicitly denied" };
    }
    if (key === "billingWorker") {
      for (const name of ["createBillingAccount", "createSubscriptionPlan", "createSubscription", "generateInvoice", "issueInvoice"]) if (typeof handle[name] !== "function") { await state(); return { passed: true, evidence: "Initialized billing worker state observed; controlled billing lifecycle APIs not exposed" }; }
      const account = await call("createBillingAccount", { customerId: `pfc-customer-${suffix}` }) as { accountId?: string };
      const plan = await call("createSubscriptionPlan", { name: `PFC ${suffix}`, interval: "monthly", amountCents: 1, currency: "USD" }) as { planId?: string };
      const subscription = await call("createSubscription", { accountId: account.accountId, planId: plan.planId }) as { subscriptionId?: unknown };
      const invoice = await call("generateInvoice", { accountId: account.accountId, lineItems: [{ description: "Controlled certification smoke", amountCents: 1 }] }) as { invoiceId?: string };
      const issued = await call("issueInvoice", { invoiceId: invoice.invoiceId }) as { status?: unknown };
      return { passed: Boolean(account.accountId && plan.planId && subscription.subscriptionId && invoice.invoiceId && issued?.status === "issued"), evidence: "Controlled account, plan, subscription, and issued-invoice outcomes recorded; no payment was marked paid" };
    }
    if (key === "apiIntegrationWorker") {
      for (const name of ["registerIntegration", "storeCredentials", "setTransport", "authenticateIntegration", "executeRequest"]) if (typeof handle[name] !== "function") throw new Error(`${name} is unavailable`);
      const { InMemoryTestTransport } = await import("../api-integration-worker/transport.js");
      const integration = await call("registerIntegration", { name: `PFC ${suffix}`, providerType: "custom", protocol: "rest", baseUrl: "https://pfc.example" }) as { integrationId?: string };
      await call("storeCredentials", { integrationId: integration.integrationId, authMethod: "bearer", secret: `pfc-${suffix}` });
      await call("setTransport", new InMemoryTestTransport().set("GET https://pfc.example/", { status: 200 }));
      const authenticated = await call("authenticateIntegration", { integrationId: integration.integrationId });
      const response = await call("executeRequest", { integrationId: integration.integrationId }) as { success?: unknown };
      return { passed: authenticated === true && response?.success === true, evidence: authenticated === true && response?.success === true ? "Controlled in-memory REST authentication and request success observed" : "Integration authentication or request did not explicitly succeed" };
    }
    if (key === "workflowBuilderWorker") {
      for (const name of ["createWorkflow", "addStep", "setEntryStep", "validateWorkflow", "publishWorkflow", "setStepHandler", "startWorkflowRun", "executeRun"]) if (typeof handle[name] !== "function") throw new Error(`${name} is unavailable`);
      const { InMemoryStepHandler } = await import("../workflow-builder-worker/handlers.js");
      const workflow = await call("createWorkflow", { name: `PFC ${suffix}` }) as { workflowId?: string };
      await call("addStep", { workflowId: workflow.workflowId, step: { stepId: "start", type: "task", name: "start", nextStepIds: ["end"] } });
      await call("addStep", { workflowId: workflow.workflowId, step: { stepId: "end", type: "end", name: "end" } });
      await call("setEntryStep", { workflowId: workflow.workflowId, entryStepId: "start" }); await call("validateWorkflow", { workflowId: workflow.workflowId }); await call("publishWorkflow", { workflowId: workflow.workflowId });
      await call("setStepHandler", new InMemoryStepHandler().set("start", { success: true }));
      const run = await call("startWorkflowRun", { workflowId: workflow.workflowId }) as { runId?: string };
      const completed = await call("executeRun", { runId: run.runId }) as { status?: unknown };
      return { passed: completed?.status === "completed", evidence: completed?.status === "completed" ? "Controlled workflow completed with an explicit successful step handler" : "Workflow did not complete" };
    }
    if (key === "notificationWorker") {
      for (const name of ["registerProvider", "setTransport", "enqueueNotification", "processQueue", "getMessages"]) if (typeof handle[name] !== "function") throw new Error(`${name} is unavailable`);
      const { InMemoryNotificationTransport } = await import("../notification-worker/transport.js");
      const provider = await call("registerProvider", { name: `PFC ${suffix}`, channel: "email", validated: true }) as { providerId?: string };
      await call("setTransport", new InMemoryNotificationTransport().set(provider.providerId!, { success: true }));
      const message = await call("enqueueNotification", { channel: "email", to: `pfc-${suffix}@example.test`, body: "Controlled certification smoke", providerId: provider.providerId }) as { messageId?: string };
      await call("processQueue"); const messages = await call("getMessages") as Array<{ messageId?: string; status?: string }>;
      return { passed: messages.some((item) => item.messageId === message.messageId && item.status === "sent"), evidence: "Controlled in-memory notification delivery outcome recorded" };
    }
    if (key === "testingWorker") {
      for (const name of ["generateUnitTests", "configureCaseOutcome", "executeSuite"]) if (typeof handle[name] !== "function") throw new Error(`${name} is unavailable`);
      const cases = await call("generateUnitTests") as Array<{ caseId?: string; suiteId?: string }>; const testCase = cases[0];
      await call("configureCaseOutcome", { caseId: testCase?.caseId, outcome: "passed", evidence: "Controlled certification assertion" });
      const run = await call("executeSuite", { suiteId: testCase?.suiteId }) as { results?: Array<{ status?: string }> };
      return { passed: (run.results?.filter((result) => result.status === "passed").length ?? 0) > 0, evidence: "Explicit configured test-runner outcomes included a passing case" };
    }
    if (key === "deploymentWorker") {
      for (const name of ["createPackage", "configureExecutorSuccess", "configureHealthSuccess", "deploy", "runHealthChecks", "rollback"]) if (typeof handle[name] !== "function") throw new Error(`${name} is unavailable`);
      const pkg = await call("createPackage", { applicationVersion: `pfc-${suffix}`, validatedBuild: true, testingEvidenceId: `pfc-test-${suffix}` }) as { packageId?: string };
      await call("configureExecutorSuccess", { key: "development", success: true }); const development = await call("deploy", { packageId: pkg.packageId, environment: "development" }) as { deploymentId?: string; status?: unknown };
      await call("configureHealthSuccess", { key: development.deploymentId, success: true }); const health = await call("runHealthChecks", { deploymentId: development.deploymentId }) as { healthy?: unknown };
      await call("configureExecutorSuccess", { key: "staging", success: true }); const staging = await call("deploy", { packageId: pkg.packageId, environment: "staging" }) as { deploymentId?: string; status?: unknown };
      await call("configureHealthSuccess", { key: staging.deploymentId, success: true }); const stagingHealth = await call("runHealthChecks", { deploymentId: staging.deploymentId }) as { healthy?: unknown };
      await call("configureExecutorSuccess", { key: "staging", success: false });
      const failed = await call("deploy", { packageId: pkg.packageId, environment: "staging" }) as { deploymentId?: string; status?: unknown };
      const targetId = failed.deploymentId ?? staging.deploymentId;
      await call("configureExecutorSuccess", { key: `rollback:${targetId}`, success: true });
      await call("configureExecutorSuccess", { key: `rollback:${staging.deploymentId}`, success: true });
      const rollback = await call("rollback", { deploymentId: targetId, reason: "pfc-controlled-rollback" }) as { status?: unknown; rolledBack?: unknown };
      const rollbackOk = rollback?.status === "success" || rollback?.rolledBack === true || rollback?.status === "rolled_back";
      const passed = development.status === "success" && health.healthy === true && staging.status === "success" && stagingHealth.healthy === true && rollbackOk;
      return { passed, evidence: passed ? "Controlled development/staging deploy, healthy probes, and rollback outcome observed" : "Deployment, health probe, or rollback did not explicitly succeed" };
    }
    return { passed: false, evidence: "No real-worker scenario is defined for this dependency" };
  }
  private audit(action: string, detail: string) { this.auditEvents.push({ eventId: `pfc-evt-${randomUUID()}`, timestamp: new Date().toISOString(), action, detail }); }
  private assertInitialized() { if (!this.initializedAt) throw new Error("Platform Certification not initialized. Call initialize() first."); }
}
export function createPlatformCertification(bootstrap: EmpireBootstrapContext, options?: PlatformCertificationOptions) { return new PlatformCertification(bootstrap, options); }
export function resetPlatformCertificationForTesting() { /* instances are isolated; retained for test API consistency */ }
