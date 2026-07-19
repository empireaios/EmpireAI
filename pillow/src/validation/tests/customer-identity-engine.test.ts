import assert from "node:assert/strict";
import path from "node:path";
import { describe, test, beforeEach } from "node:test";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

import { runBootstrap } from "../../bootstrap/engine.js";
import {
  createCustomerIdentityEngine,
  resetCustomerIdentityEngineForTesting,
  buildCustomerIdentityEngineConfiguration,
  CUSTOMER_IDENTITY_ENGINE_SYSTEM_PATH,
  CIE_METADATA_VERSION,
  CIE_CAPABILITIES,
} from "../../customer-identity-engine/index.js";
import { appendCieLog, getCieLogs } from "../../customer-identity-engine/cie-logging.js";

describe("Customer Identity Engine (R4-01 / PILLOW-CIE-001)", () => {
  beforeEach(() => {
    resetCustomerIdentityEngineForTesting();
  });

  test("configuration defaults are valid", () => {
    const config = buildCustomerIdentityEngineConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.minMatchConfidenceScore, 80);
    assert.equal(config.maskSensitiveValues, true);
    assert.ok(config.matchingRules.length >= 3);
    assert.ok(config.mergeRules.some((r) => r.ruleId === "validated_merge"));
  });

  test("initializes with governance doc", async () => {
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
    const engine = createCustomerIdentityEngine(bootstrap);
    const state = await engine.initialize();
    assert.equal(state.engineVersion, "PILLOW-CIE-001");
    assert.equal(state.missionId, "R4-01");
    assert.equal(state.status, "active");
    assert.equal(state.configuration.maskSensitiveValues, true);
  });

  test("connect produces engine record", async () => {
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
    const engine = createCustomerIdentityEngine(bootstrap);
    await engine.initialize();
    const report = engine.connectCustomerIdentityEngine();
    assert.equal(report.action, "connect");
    assert.equal(report.metadataVersion, CIE_METADATA_VERSION);
    assert.ok(report.engineRecord);
    assert.equal(report.engineRecord!.engineId, "customer-identity-engine");
    assert.ok(report.validation.decision === "pass" || report.validation.decision === "partial");
  });

  test("creates customer identity", async () => {
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
    const engine = createCustomerIdentityEngine(bootstrap);
    await engine.initialize();
    engine.connectCustomerIdentityEngine();
    const report = engine.createCustomerIdentity({
      customerName: "Jane Doe",
      customerIdentifiers: [
        { identifierType: "email", identifierValue: "jane@example.com", channel: null },
      ],
      contactReferences: ["contact-001"],
    });
    assert.equal(report.action, "create_identity");
    assert.equal(report.customerRecords.length, 1);
    assert.equal(report.customerRecords[0].customerName, "Jane Doe");
    assert.match(report.customerRecords[0].customerId, /^cie-rec-/);
    assert.notEqual(report.validation.decision, "fail");
  });

  test("links customer identity across channels", async () => {
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
    const engine = createCustomerIdentityEngine(bootstrap);
    await engine.initialize();
    engine.connectCustomerIdentityEngine();
    const created = engine.createCustomerIdentity({
      customerName: "John Smith",
      customerIdentifiers: [
        { identifierType: "email", identifierValue: "john@example.com", channel: null },
      ],
    });
    const customerId = created.customerRecords[0].customerId;
    const linked = engine.linkCustomerIdentity({
      customerId,
      channel: "whatsapp",
      reference: "wa-12345",
      identifierType: "communication",
      identifierValue: "wa-12345",
    });
    assert.equal(linked.action, "link_identity");
    assert.equal(linked.customerRecords[0].identityStatus, "linked");
    assert.ok(linked.customerRecords[0].communicationReferences.some((r) => r.includes("whatsapp")));
  });

  test("detects duplicate identities", async () => {
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
    const engine = createCustomerIdentityEngine(bootstrap);
    await engine.initialize();
    engine.connectCustomerIdentityEngine();
    engine.createCustomerIdentity({
      customerName: "Alice Dup",
      customerIdentifiers: [
        { identifierType: "email", identifierValue: "alice@example.com", channel: null },
      ],
    });
    engine.createCustomerIdentity({
      customerName: "Alice Dup",
      customerIdentifiers: [
        { identifierType: "email", identifierValue: "alice@example.com", channel: null },
      ],
    });
    const report = engine.detectDuplicateIdentities();
    assert.equal(report.action, "detect_duplicates");
    assert.ok(report.duplicateMatches.length >= 1);
    assert.equal(report.duplicateMatches[0].matchReason, "Email match: email");
  });

  test("merges duplicate identities with validation", async () => {
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
    const engine = createCustomerIdentityEngine(bootstrap);
    await engine.initialize();
    engine.connectCustomerIdentityEngine();
    const a = engine.createCustomerIdentity({
      customerName: "Bob Merge",
      customerIdentifiers: [
        { identifierType: "email", identifierValue: "bob@example.com", channel: null },
      ],
      marketplaceReferences: ["mp-001"],
    });
    const b = engine.createCustomerIdentity({
      customerIdentifiers: [
        { identifierType: "phone", identifierValue: "+15551234567", channel: null },
      ],
      contactReferences: ["contact-bob"],
    });
    const sourceId = b.customerRecords[0].customerId;
    const targetId = a.customerRecords[0].customerId;
    const merged = engine.mergeCustomerIdentities({
      sourceCustomerId: sourceId,
      targetCustomerId: targetId,
    });
    assert.equal(merged.action, "merge_identities");
    assert.notEqual(merged.validation.decision, "fail");
    const target = merged.customerRecords.find((r) => r.customerId === targetId);
    const source = merged.customerRecords.find((r) => r.customerId === sourceId);
    assert.ok(target);
    assert.equal(source?.identityStatus, "merged");
    assert.ok(target!.customerIdentifiers.length >= 2);
    assert.ok(target!.contactReferences.includes("contact-bob"));
  });

  test("resolves customer identity by identifier", async () => {
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
    const engine = createCustomerIdentityEngine(bootstrap);
    await engine.initialize();
    engine.connectCustomerIdentityEngine();
    engine.createCustomerIdentity({
      customerName: "Carol Resolve",
      customerIdentifiers: [
        { identifierType: "email", identifierValue: "carol@example.com", channel: null },
      ],
    });
    const report = engine.resolveCustomerIdentity({
      identifierType: "email",
      identifierValue: "carol@example.com",
    });
    assert.equal(report.action, "resolve_identity");
    assert.equal(report.customerRecords.length, 1);
    assert.equal(report.customerRecords[0].customerName, "Carol Resolve");
  });

  test("produces machine-readable customer records", async () => {
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
    const engine = createCustomerIdentityEngine(bootstrap);
    await engine.initialize();
    engine.connectCustomerIdentityEngine();
    const created = engine.createCustomerIdentity({
      customerName: "Dave Machine",
      customerIdentifiers: [
        { identifierType: "external", identifierValue: "ext-999", channel: null },
      ],
    });
    const customerId = created.customerRecords[0].customerId;
    const machine = engine.getMachineReadableRecord(customerId);
    assert.ok(machine);
    assert.equal(machine!.customerId, customerId);
    assert.equal(machine!.metadataVersion, CIE_METADATA_VERSION);
    assert.ok(Array.isArray(machine!.customerIdentifiers));
  });

  test("redacts sensitive values in logs", () => {
    appendCieLog({
      event: "test_redaction",
      level: "info",
      details: "token=secret123 password=hidden",
    });
    const logs = getCieLogs(5);
    const entry = logs.find((l) => l.event === "test_redaction");
    assert.ok(entry);
    assert.ok(entry!.details.includes("redacted"));
    assert.ok(!entry!.details.includes("secret123"));
  });

  test("cockpit and supervisor sync", async () => {
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
    const engine = createCustomerIdentityEngine(bootstrap);
    await engine.initialize();
    engine.connectCustomerIdentityEngine();
    engine.createCustomerIdentity({
      customerName: "Eve Sync",
      customerIdentifiers: [
        { identifierType: "email", identifierValue: "eve@example.com", channel: null },
      ],
    });
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.engineStatus, "active");
    assert.ok(cockpit.totalCustomerRecords >= 1);
    assert.ok(cockpit.activeIdentities >= 1);
    const sync = engine.validateForSupervisorSync();
    assert.ok(sync.valid);
    assert.ok(sync.readinessScore >= 50);
    assert.ok(sync.notes.length > 0);
  });

  test("exports capabilities and governance path", () => {
    assert.equal(CUSTOMER_IDENTITY_ENGINE_SYSTEM_PATH, "docs/governance/EMPIREAI_CUSTOMER_IDENTITY_ENGINE_SYSTEM.md");
    assert.ok(CIE_CAPABILITIES.includes("customer_identity_creation"));
    assert.ok(CIE_CAPABILITIES.includes("identity_merging"));
    assert.ok(CIE_CAPABILITIES.includes("duplicate_detection"));
  });
});
