import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

import { resetDatabaseInstance } from "../../brain/database.js";
import type { ToolContext } from "../../brain/types.js";
import { initializeSoulFile } from "../../foundation/soul-file/index.js";
import {
  CANONICAL_ENTITY_IDS,
  identityRegistryTools,
  initializeIdentityRegistry,
  resolveIdentity,
  resolveIdentityDisplayName,
  resetIdentityRegistryRepository,
  updateIdentityDisplayName,
} from "../../foundation/identity-registry/index.js";
import { configureValidationEnvironment } from "../harness.js";

const WORKSPACE_ID = "ws-s004";

function toolContext(): ToolContext {
  return {
    workspaceId: WORKSPACE_ID,
    agentId: "identity-registry",
    correlationId: "corr-s004",
  };
}

async function invokeTool(name: string, args: Record<string, unknown> = {}) {
  const tool = identityRegistryTools.find((entry) => entry.name === name);
  assert.ok(tool, `tool ${name} should be registered`);
  return tool.handler({ workspaceId: WORKSPACE_ID, ...args }, toolContext());
}

beforeEach(() => {
  configureValidationEnvironment();
  resetIdentityRegistryRepository();
});

afterEach(() => {
  resetIdentityRegistryRepository();
  resetDatabaseInstance();
});

describe("S004 Identity Registry", () => {
  it("registers ten identity registry Brain tools", () => {
    assert.equal(identityRegistryTools.length, 10);
    assert.ok(identityRegistryTools.some((tool) => tool.name === "identity_registry.resolve"));
  });

  it("seeds default Empire identity entities with canonical IDs", () => {
    const entities = initializeIdentityRegistry(WORKSPACE_ID);

    assert.equal(entities.length, 5);
    assert.ok(entities.some((entity) => entity.canonicalId === CANONICAL_ENTITY_IDS.EMPIRE_AI));
    assert.ok(entities.some((entity) => entity.canonicalId === CANONICAL_ENTITY_IDS.EMPIRE_CAPITAL));
    assert.ok(entities.some((entity) => entity.canonicalId === CANONICAL_ENTITY_IDS.VENNYA));
    assert.ok(
      entities.some((entity) => entity.canonicalId === CANONICAL_ENTITY_IDS.GRAND_KINGS_ACCOUNT),
    );
    assert.ok(
      entities.some((entity) => entity.canonicalId === CANONICAL_ENTITY_IDS.FOUNDER_ACCOUNTS),
    );
  });

  it("resolves entities by canonical ID, alias, and display name", () => {
    initializeIdentityRegistry(WORKSPACE_ID);

    const byId = resolveIdentity(CANONICAL_ENTITY_IDS.VENNYA, WORKSPACE_ID);
    assert.equal(byId?.matchedBy, "canonical_id");
    assert.equal(byId?.entity.displayName, "Vennya");

    const byAlias = resolveIdentity("GKA", WORKSPACE_ID);
    assert.equal(byAlias?.matchedBy, "alias");
    assert.equal(byAlias?.entity.canonicalId, CANONICAL_ENTITY_IDS.GRAND_KINGS_ACCOUNT);

    const byName = resolveIdentity("Empire Capital", WORKSPACE_ID);
    assert.equal(byName?.matchedBy, "display_name");
    assert.equal(byName?.entity.canonicalId, CANONICAL_ENTITY_IDS.EMPIRE_CAPITAL);
  });

  it("updates display name without changing canonical ID or architecture", () => {
    initializeIdentityRegistry(WORKSPACE_ID);

    const updated = updateIdentityDisplayName(
      CANONICAL_ENTITY_IDS.GRAND_KINGS_ACCOUNT,
      "Sovereign Commerce Account",
      "grand-king",
    );

    assert.equal(updated.canonicalId, CANONICAL_ENTITY_IDS.GRAND_KINGS_ACCOUNT);
    assert.equal(updated.displayName, "Sovereign Commerce Account");

    const resolved = resolveIdentity("GKA", WORKSPACE_ID);
    assert.equal(resolved?.entity.canonicalId, CANONICAL_ENTITY_IDS.GRAND_KINGS_ACCOUNT);
    assert.equal(resolved?.entity.displayName, "Sovereign Commerce Account");

    assert.equal(
      resolveIdentityDisplayName(CANONICAL_ENTITY_IDS.GRAND_KINGS_ACCOUNT, WORKSPACE_ID),
      "Sovereign Commerce Account",
    );
  });

  it("records identity change history for display name updates", async () => {
    initializeIdentityRegistry(WORKSPACE_ID);

    updateIdentityDisplayName(
      CANONICAL_ENTITY_IDS.EMPIRE_AI,
      "EmpireAI Platform",
      "founder",
    );

    const history = (await invokeTool("identity_registry.list_history", {
      canonicalId: CANONICAL_ENTITY_IDS.EMPIRE_AI,
    })) as Array<{ changeType: string; previousValue: string | null; newValue: string | null }>;

    assert.ok(history.some((entry) => entry.changeType === "CREATED"));
    assert.ok(
      history.some(
        (entry) =>
          entry.changeType === "DISPLAY_NAME" &&
          entry.previousValue === "EmpireAI" &&
          entry.newValue === "EmpireAI Platform",
      ),
    );
  });

  it("integrates with Soul File via canonical ID metadata references", () => {
    initializeIdentityRegistry(WORKSPACE_ID);
    updateIdentityDisplayName(
      CANONICAL_ENTITY_IDS.GRAND_KINGS_ACCOUNT,
      "Grand Sovereign Account",
      "system",
    );

    const soulFile = initializeSoulFile(WORKSPACE_ID);

    assert.equal(soulFile.metadata.accountId, CANONICAL_ENTITY_IDS.GRAND_KINGS_ACCOUNT);
    assert.equal(soulFile.metadata.empireId, CANONICAL_ENTITY_IDS.EMPIRE_AI);
    assert.equal(soulFile.identity.empireName, "Grand Sovereign Account");
  });

  it("resolves display name via Brain tool using canonical ID only", async () => {
    initializeIdentityRegistry(WORKSPACE_ID);

    const result = (await invokeTool("identity_registry.get_display_name", {
      canonicalId: CANONICAL_ENTITY_IDS.FOUNDER_ACCOUNTS,
    })) as { canonicalId: string; displayName: string };

    assert.equal(result.canonicalId, CANONICAL_ENTITY_IDS.FOUNDER_ACCOUNTS);
    assert.equal(result.displayName, "Founder Accounts");
  });

  it("initializes idempotently without duplicating entities", () => {
    const first = initializeIdentityRegistry(WORKSPACE_ID);
    const second = initializeIdentityRegistry(WORKSPACE_ID);

    assert.equal(first.length, second.length);
    assert.equal(first.length, 5);
  });
});
