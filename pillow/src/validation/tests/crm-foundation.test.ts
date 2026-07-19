import assert from "node:assert/strict";
import path from "node:path";
import { describe, test, beforeEach } from "node:test";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

import { runBootstrap } from "../../bootstrap/engine.js";
import {
  createCustomerIdentityEngine,
  resetCustomerIdentityEngineForTesting,
} from "../../customer-identity-engine/index.js";
import {
  createCrmFoundationEngine,
  resetCrmFoundationForTesting,
  buildCrmFoundationConfiguration,
  CRM_FOUNDATION_SYSTEM_PATH,
  CRM_METADATA_VERSION,
  CRM_CAPABILITIES,
} from "../../crm-foundation/index.js";
import { appendCrmLog, getCrmLogs } from "../../crm-foundation/crm-logging.js";

async function buildCrmStack() {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const identity = createCustomerIdentityEngine(bootstrap);
  await identity.initialize();
  identity.connectCustomerIdentityEngine();
  const created = identity.createCustomerIdentity({
    customerName: "CRM Test User",
    customerIdentifiers: [
      { identifierType: "email", identifierValue: "crm-test@example.com", channel: null },
    ],
  });
  const customerId = created.customerRecords[0].customerId;
  const crm = createCrmFoundationEngine(bootstrap, identity);
  await crm.initialize();
  return { bootstrap, identity, crm, customerId };
}

describe("CRM Foundation (R4-02 / PILLOW-CRM-001)", () => {
  beforeEach(() => {
    resetCustomerIdentityEngineForTesting();
    resetCrmFoundationForTesting();
  });

  test("configuration defaults are valid", () => {
    const config = buildCrmFoundationConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.defaultSearchLimit, 50);
    assert.equal(config.maskSensitiveValues, true);
    assert.ok(config.lifecycleRules.length >= 3);
    assert.ok(config.searchRules.some((r) => r.ruleId === "default_search"));
  });

  test("initializes with governance doc", async () => {
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
    const identity = createCustomerIdentityEngine(bootstrap);
    await identity.initialize();
    const crm = createCrmFoundationEngine(bootstrap, identity);
    const state = await crm.initialize();
    assert.equal(state.engineVersion, "PILLOW-CRM-001");
    assert.equal(state.missionId, "R4-02");
    assert.equal(state.status, "active");
  });

  test("connect produces engine record with identity link", async () => {
    const { crm } = await buildCrmStack();
    const report = crm.connectCrmFoundation();
    assert.equal(report.action, "connect");
    assert.equal(report.metadataVersion, CRM_METADATA_VERSION);
    assert.ok(report.engineRecord);
    assert.equal(report.engineRecord!.engineId, "crm-foundation");
    assert.equal(report.engineRecord!.identityEngineConnected, true);
  });

  test("creates customer profile from identity", async () => {
    const { crm, customerId } = await buildCrmStack();
    crm.connectCrmFoundation();
    const report = crm.createCustomerProfile({
      customerId,
      customerOwner: "sales-team",
      customerLifecycleStatus: "prospect",
      customerTags: ["vip"],
      customerAccountRefs: ["acct-001"],
      contactInformation: { email: "crm-test@example.com", phone: "+15551234567" },
    });
    assert.equal(report.action, "create_profile");
    assert.equal(report.crmRecords.length, 1);
    assert.match(report.crmRecords[0].crmRecordId, /^crm-rec-/);
    assert.equal(report.crmRecords[0].customerId, customerId);
    assert.equal(report.crmRecords[0].customerOwner, "sales-team");
    assert.notEqual(report.validation.decision, "fail");
  });

  test("updates CRM record lifecycle and owner", async () => {
    const { crm, customerId } = await buildCrmStack();
    crm.connectCrmFoundation();
    const created = crm.createCustomerProfile({
      customerId,
      customerOwner: "sales-team",
      customerLifecycleStatus: "prospect",
    });
    const crmRecordId = created.crmRecords[0].crmRecordId;
    const updated = crm.updateCrmRecord({
      crmRecordId,
      customerOwner: "account-manager",
      customerLifecycleStatus: "active",
    });
    assert.equal(updated.action, "update_record");
    assert.equal(updated.crmRecords[0].customerOwner, "account-manager");
    assert.equal(updated.crmRecords[0].customerLifecycleStatus, "active");
  });

  test("searches customer records", async () => {
    const { crm, customerId } = await buildCrmStack();
    crm.connectCrmFoundation();
    crm.createCustomerProfile({
      customerId,
      customerOwner: "sales-team",
      customerTags: ["enterprise"],
      contactInformation: { email: "crm-test@example.com" },
    });
    const search = crm.searchCustomerRecords({ query: "enterprise", searchBy: "tags" });
    assert.equal(search.action, "search_customers");
    assert.ok(search.searchResults.length >= 1);
    assert.ok(search.crmRecords.length >= 1);
  });

  test("manages customer notes and tags", async () => {
    const { crm, customerId } = await buildCrmStack();
    crm.connectCrmFoundation();
    const created = crm.createCustomerProfile({ customerId, customerOwner: "sales-team" });
    const crmRecordId = created.crmRecords[0].crmRecordId;
    const noted = crm.addCustomerNote({
      crmRecordId,
      author: "agent-1",
      content: "Initial outreach completed",
    });
    assert.equal(noted.crmRecords[0].customerNotes.length, 1);
    const tagged = crm.updateCustomerTags({
      crmRecordId,
      tags: ["priority", "enterprise"],
      mode: "replace",
    });
    assert.deepEqual(tagged.crmRecords[0].customerTags, ["priority", "enterprise"]);
  });

  test("manages custom attributes", async () => {
    const { crm, customerId } = await buildCrmStack();
    crm.connectCrmFoundation();
    const created = crm.createCustomerProfile({ customerId });
    const crmRecordId = created.crmRecords[0].crmRecordId;
    const updated = crm.updateCustomAttributes({
      crmRecordId,
      attributes: [
        { key: "industry", value: "retail" },
        { key: "tier", value: "gold" },
      ],
      mode: "merge",
    });
    assert.equal(updated.action, "update_attributes");
    assert.ok(updated.crmRecords[0].customAttributes.some((a) => a.key === "industry"));
  });

  test("produces machine-readable CRM records", async () => {
    const { crm, customerId } = await buildCrmStack();
    crm.connectCrmFoundation();
    const created = crm.createCustomerProfile({ customerId, customerOwner: "sales-team" });
    const crmRecordId = created.crmRecords[0].crmRecordId;
    const machine = crm.getMachineReadableRecord(crmRecordId);
    assert.ok(machine);
    assert.equal(machine!.crmRecordId, crmRecordId);
    assert.equal(machine!.metadataVersion, CRM_METADATA_VERSION);
  });

  test("redacts sensitive values in logs", () => {
    appendCrmLog({
      event: "test_redaction",
      level: "info",
      details: "token=secret456 password=hidden",
    });
    const logs = getCrmLogs(5);
    const entry = logs.find((l) => l.event === "test_redaction");
    assert.ok(entry);
    assert.ok(entry!.details.includes("redacted"));
    assert.ok(!entry!.details.includes("secret456"));
  });

  test("cockpit and supervisor sync", async () => {
    const { crm, customerId } = await buildCrmStack();
    crm.connectCrmFoundation();
    crm.createCustomerProfile({ customerId, customerOwner: "sales-team" });
    const cockpit = crm.getCockpitSnapshot();
    assert.equal(cockpit.engineStatus, "active");
    assert.ok(cockpit.totalCrmRecords >= 1);
    assert.equal(cockpit.identityEngineConnected, true);
    const sync = crm.validateForSupervisorSync();
    assert.ok(sync.valid);
    assert.ok(sync.readinessScore >= 50);
  });

  test("exports capabilities and governance path", () => {
    assert.equal(CRM_FOUNDATION_SYSTEM_PATH, "docs/governance/EMPIREAI_CRM_FOUNDATION_SYSTEM.md");
    assert.ok(CRM_CAPABILITIES.includes("customer_profile_management"));
    assert.ok(CRM_CAPABILITIES.includes("customer_search"));
  });
});
