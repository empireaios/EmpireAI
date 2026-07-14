import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";

import {
  assessIdentityAuthorizationProductionReadiness,
  assertNoSecretsInIdentityPluginPayload,
  assertNoSecretsInIsolationPayload,
  createIdentityAuthorizationModuleContract,
  createIdentityAuthorizationProgrammeCertification,
  IDENTITY_AUTHORIZATION_MISSIONS,
  IDENTITY_AUTHORIZATION_READINESS_RATINGS,
  listConnectionRegistryIds,
  listIdentityPlatformRegistryIds,
  loadAuthorizationCentreView,
  redactAuthorizationSecrets,
  redactCredentialVaultSecrets,
  redactIdentityAuthorizationSecrets,
  resetIdentityAuthorizationPlatformHarnessForTests,
  validateIdentityAuthorizationPillowGovernance,
} from "../../orchestration/identity-authorization-platform/index.js";
import {
  CONNECTION_REGISTRY_CANONICAL_REGISTRY_IDS,
  IDENTITY_PLATFORM_CANONICAL_REGISTRY_IDS,
} from "../../registry/types/registry-ids.js";
import { configureValidationEnvironment } from "../harness.js";

configureValidationEnvironment();

const ARTIFACTS_ROOT = join(process.cwd(), "..", "artifacts");
const CANONICAL_WORKSPACE_ID = "ws_empire_1";

const MISSION_AUDITS: Array<{ mission: string; artifact: string }> = [
  { mission: "G8-00", artifact: "g8-00-identity-platform-foundation-executive-audit.md" },
  { mission: "G8-01", artifact: "g8-01-connection-registry-foundation-executive-audit.md" },
  { mission: "G8-02", artifact: "g8-02-oauth-api-authorization-framework-executive-audit.md" },
  { mission: "G8-03", artifact: "g8-03-credential-vault-secret-management-executive-audit.md" },
  { mission: "G8-04", artifact: "g8-04-connection-health-monitoring-executive-audit.md" },
  { mission: "G8-05", artifact: "g8-05-authorization-centre-cockpit-executive-audit.md" },
  { mission: "G8-06", artifact: "g8-06-operational-readiness-engine-executive-audit.md" },
  { mission: "G8-07", artifact: "g8-07-automatic-reauthorization-token-lifecycle-executive-audit.md" },
  { mission: "G8-08", artifact: "g8-08-multi-workspace-customer-isolation-executive-audit.md" },
  { mission: "G8-09", artifact: "g8-09-identity-authorization-plugin-integration-executive-audit.md" },
];

function resetG810Harness(): void {
  resetIdentityAuthorizationPlatformHarnessForTests();
}

describe("G8-10 — Identity & Authorization Production Readiness & Executive Audit", () => {
  it("certifies the complete G8 programme with all missions present", () => {
    resetG810Harness();
    assert.equal(IDENTITY_AUTHORIZATION_MISSIONS.length, 11);
    assert.equal(IDENTITY_AUTHORIZATION_MISSIONS[0], "G8-00");
    assert.equal(IDENTITY_AUTHORIZATION_MISSIONS[10], "G8-10");

    const certification = createIdentityAuthorizationProgrammeCertification({
      validationSuitePass: true,
      typecheckPass: true,
      frontendTypecheckPass: true,
    });

    assert.equal(certification.status, "certified");
    assert.equal(certification.productionEligible, true);
    assert.equal(certification.readinessRating, "PASS_WITH_CONDITIONS");
    assert.equal(certification.registryCompliance, true);
    assert.equal(certification.pillowGovernanceConfirmed, true);
    assert.equal(certification.ownershipIntegrityConfirmed, true);
    assert.equal(certification.secretLeakageDetected, false);
    assert.equal(certification.workspaceIsolationConfirmed, true);
    assert.equal(certification.pluginIntegrationConfirmed, true);
  });

  it("confirms module contract reflects G8-10 certification without new capabilities", () => {
    resetG810Harness();
    const contract = createIdentityAuthorizationModuleContract();
    assert.equal(contract.missionId, "G8-10");
    assert.equal(contract.programmeStatus, "certified");
    assert.ok(contract.capabilities.includes("identity-authorization.programme_certification"));
    assert.ok(contract.integratesWith.includes("pillow"));
    assert.ok(contract.integratesWith.includes("ekls"));
    assert.ok(contract.integratesWith.includes("brain"));
    assert.ok(contract.integratesWith.includes("registry"));
    assert.ok(contract.integratesWith.includes("EmpireAIPluginFramework"));
  });

  it("validates identity and connection registries are wired for dynamic resolution", () => {
    resetG810Harness();
    const identityIds = listIdentityPlatformRegistryIds();
    const connectionIds = listConnectionRegistryIds();
    assert.equal(identityIds.length, IDENTITY_PLATFORM_CANONICAL_REGISTRY_IDS.length);
    assert.equal(connectionIds.length, CONNECTION_REGISTRY_CANONICAL_REGISTRY_IDS.length);
    assert.ok(identityIds.every((id) => id.startsWith("REG-")));
    assert.ok(connectionIds.every((id) => id.startsWith("REG-CONNECTION-")));
  });

  it("confirms architecture ownership — IAP owns connection state, Pillow owns governance", () => {
    resetG810Harness();
    const pillow = validateIdentityAuthorizationPillowGovernance({
      actorId: "grand-king",
      workspaceId: CANONICAL_WORKSPACE_ID,
      ownerId: "grand-king",
      operation: "configure",
      pillowGovernance: true,
    });
    assert.equal(pillow.allowed, true);
    assert.equal(pillow.eklsGoverned, true);
  });

  it("confirms Brain integration surface spans foundation through plugin lifecycle", async () => {
    resetG810Harness();
    const { identityAuthorizationTools } = await import(
      "../../orchestration/identity-authorization-platform/tools/identity-authorization-tools.js"
    );
    const { connectionRegistryTools } = await import(
      "../../orchestration/identity-authorization-platform/connection-registry/tools/connection-registry-tools.js"
    );
    const { authorizationFrameworkTools } = await import(
      "../../orchestration/identity-authorization-platform/authorization-framework/tools/authorization-framework-tools.js"
    );
    const { credentialVaultTools } = await import(
      "../../orchestration/identity-authorization-platform/credential-vault-integration/tools/credential-vault-tools.js"
    );
    const { connectionHealthTools } = await import(
      "../../orchestration/identity-authorization-platform/connection-health-monitoring/tools/connection-health-tools.js"
    );
    const { authorizationCentreTools } = await import(
      "../../orchestration/identity-authorization-platform/authorization-centre/tools/authorization-centre-tools.js"
    );
    const { operationalReadinessTools } = await import(
      "../../orchestration/identity-authorization-platform/operational-readiness-engine/tools/operational-readiness-tools.js"
    );
    const { tokenLifecycleTools } = await import(
      "../../orchestration/identity-authorization-platform/automatic-reauthorization/tools/token-lifecycle-tools.js"
    );
    const { isolationTools } = await import(
      "../../orchestration/identity-authorization-platform/multi-workspace-isolation/tools/isolation-tools.js"
    );
    const { identityPluginTools } = await import(
      "../../orchestration/identity-authorization-platform/identity-plugin-integration/tools/identity-plugin-tools.js"
    );

    const toolNames = [
      ...identityAuthorizationTools,
      ...connectionRegistryTools,
      ...authorizationFrameworkTools,
      ...credentialVaultTools,
      ...connectionHealthTools,
      ...authorizationCentreTools,
      ...operationalReadinessTools,
      ...tokenLifecycleTools,
      ...isolationTools,
      ...identityPluginTools,
    ].map((tool) => tool.name);

    assert.ok(toolNames.includes("load_identity_platform"));
    assert.ok(toolNames.includes("connection_registry_list"));
    assert.ok(toolNames.includes("authorization_start"));
    assert.ok(toolNames.includes("credential_reference_list"));
    assert.ok(toolNames.includes("connection_health_summary"));
    assert.ok(toolNames.includes("authorization_centre.load_view"));
    assert.ok(toolNames.includes("readiness_overview"));
    assert.ok(toolNames.includes("token_lifecycle_summary"));
    assert.ok(toolNames.includes("identity_isolation_check"));
    assert.ok(toolNames.includes("identity_plugin_list"));
  });

  it("validates operational subsystems are exported from the canonical module barrel", async () => {
    resetG810Harness();
    const module = await import("../../orchestration/identity-authorization-platform/index.js");

    assert.equal(typeof module.bootstrapIdentityPlatform, "function");
    assert.equal(typeof module.initializeConnectionRegistry, "function");
    assert.equal(typeof module.startAuthorization, "function");
    assert.equal(typeof module.createCredentialReference, "function");
    assert.equal(typeof module.getConnectionHealthSummary, "function");
    assert.equal(typeof module.loadAuthorizationCentreView, "function");
    assert.equal(typeof module.evaluateReadinessOverview, "function");
    assert.equal(typeof module.getTokenLifecycleSummary, "function");
    assert.equal(typeof module.checkIdentityIsolation, "function");
    assert.equal(typeof module.registerIdentityPlugin, "function");
    assert.equal(typeof module.assessIdentityAuthorizationProductionReadiness, "function");
  });

  it("confirms executive audit artifacts exist for G8-00 through G8-09", () => {
    resetG810Harness();
    for (const row of MISSION_AUDITS) {
      const path = join(ARTIFACTS_ROOT, row.artifact);
      assert.ok(existsSync(path), `Missing executive audit for ${row.mission}: ${row.artifact}`);
    }
  });

  it("rejects certification when validation or typecheck gates fail", () => {
    resetG810Harness();
    const failed = createIdentityAuthorizationProgrammeCertification({
      validationSuitePass: false,
      typecheckPass: true,
    });
    assert.equal(failed.status, "not_certified");
    assert.equal(failed.productionEligible, false);
    assert.equal(failed.readinessRating, "FAIL");
    assert.ok(failed.blockers.length > 0);
  });

  it("produces production readiness report with security and integration reviews", () => {
    resetG810Harness();
    const report = assessIdentityAuthorizationProductionReadiness({
      validationSuitePass: true,
      typecheckPass: true,
      frontendTypecheckPass: true,
    });

    assert.ok(IDENTITY_AUTHORIZATION_READINESS_RATINGS.includes(report.readinessRating));
    assert.equal(report.readinessRating, "PASS_WITH_CONDITIONS");
    assert.equal(report.productionEligible, true);
    assert.equal(report.securityReview.passed, true);
    assert.equal(report.integrationReview.passed, true);
    assert.ok(Object.values(report.certificationAreas).every(Boolean));
    assert.ok(report.conditions.length > 0);
    assert.equal(report.blockers.length, 0);
    assert.ok(report.risks.length >= 2);
  });

  it("validates secret redaction across G8 subsystems", () => {
    resetG810Harness();
    const authRedacted = redactIdentityAuthorizationSecrets({ token: "sk_live_secret" }) as Record<
      string,
      unknown
    >;
    const frameworkRedacted = redactAuthorizationSecrets({
      client_secret: "oauth_client_secret",
    }) as Record<string, unknown>;
    const vaultRedacted = redactCredentialVaultSecrets({ api_key: "vault_api_key" }) as Record<
      string,
      unknown
    >;

    assert.equal(authRedacted.token, "[REDACTED]");
    assert.equal(frameworkRedacted.client_secret, "[REDACTED]");
    assert.equal(vaultRedacted.api_key, "[REDACTED]");

    assert.equal(
      assertNoSecretsInIsolationPayload({ safeField: "workspace-visible" }),
      true,
    );
    assert.equal(
      assertNoSecretsInIsolationPayload({ refresh_token: "raw_refresh_token_value" }),
      false,
    );
    assert.throws(() =>
      assertNoSecretsInIdentityPluginPayload({ secret: "client_secret_value" }),
    );
  });

  it("validates Authorization Centre Cockpit contracts include G8-06 through G8-09 summaries", () => {
    resetG810Harness();
    const view = loadAuthorizationCentreView(CANONICAL_WORKSPACE_ID);
    assert.ok(view.readinessSummary);
    assert.ok(view.tokenLifecycleSummary);
    assert.ok(view.isolationSummary);
    assert.ok(view.pluginIntegrationSummary);
    assert.equal(view.screenId, "SCR-304");
    assert.equal(view.pillowGovernanceState, "pillow-governed");
  });

  it("confirms G8-10 production readiness and completion summary artifacts are present", () => {
    resetG810Harness();
    assert.ok(
      existsSync(join(ARTIFACTS_ROOT, "g8-10-identity-authorization-production-readiness-executive-audit.md")),
    );
    assert.ok(existsSync(join(ARTIFACTS_ROOT, "g8-identity-authorization-completion-summary.md")));
  });
});
