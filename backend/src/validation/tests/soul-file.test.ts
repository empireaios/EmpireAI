import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

import { resetDatabaseInstance } from "../../brain/database.js";
import type { ToolContext } from "../../brain/types.js";
import {
  diffSoulFile,
  evolveSoulFile,
  exportSoulFile,
  getSoulFile,
  importSoulFile,
  initializeSoulFile,
  listSoulFileChangeHistory,
  listSoulFileVersions,
  resetSoulFileRepository,
  soulFileTools,
  verifySoulFileIntegrity,
} from "../../foundation/soul-file/index.js";
import { configureValidationEnvironment } from "../harness.js";

const WORKSPACE_ID = "ws-s001";

function toolContext(): ToolContext {
  return {
    workspaceId: WORKSPACE_ID,
    agentId: "soul-file",
    correlationId: "corr-s001",
  };
}

async function invokeTool(name: string, args: Record<string, unknown> = {}) {
  const tool = soulFileTools.find((entry) => entry.name === name);
  assert.ok(tool, `tool ${name} should be registered`);
  return tool.handler({ workspaceId: WORKSPACE_ID, ...args }, toolContext());
}

beforeEach(() => {
  configureValidationEnvironment();
  resetSoulFileRepository();
});

afterEach(() => {
  resetSoulFileRepository();
  resetDatabaseInstance();
});

describe("S001 Soul File Foundation", () => {
  it("registers ten Soul File Brain tools", () => {
    assert.equal(soulFileTools.length, 10);
    assert.ok(soulFileTools.some((tool) => tool.name === "soul_file.export"));
    assert.ok(soulFileTools.some((tool) => tool.name === "soul_file.import"));
  });

  it("initializes Soul File with schema, versioning, and integrity checksum", () => {
    const document = initializeSoulFile(WORKSPACE_ID, "grand-king");

    assert.equal(document.version, 1);
    assert.equal(document.versionLabel, "1.0.0");
    assert.equal(document.soulFileId, `soul-${WORKSPACE_ID}`);
    assert.equal(document.identity.empireName, "Grand King's Account");
    assert.ok(document.identity.principles.length >= 4);
    assert.equal(document.checksum.length, 64);

    const integrity = verifySoulFileIntegrity(document);
    assert.equal(integrity.valid, true);
  });

  it("initializes idempotently without duplicating version snapshots", () => {
    const first = initializeSoulFile(WORKSPACE_ID);
    const second = initializeSoulFile(WORKSPACE_ID);

    assert.equal(first.version, second.version);
    assert.equal(listSoulFileVersions(WORKSPACE_ID).length, 1);
  });

  it("evolves Soul File continuously and records change history", () => {
    initializeSoulFile(WORKSPACE_ID);

    const evolved = evolveSoulFile({
      workspaceId: WORKSPACE_ID,
      actor: "grand-king",
      summary: "Mission S001 complete — Soul File foundation established",
      operationalState: {
        completedMissions: ["M101", "M110", "S001"],
        activeMissions: [],
        grandKingsAccountStatus: "SOUL_FILE_FOUNDATION_ACTIVE",
      },
    });

    assert.equal(evolved.version, 2);
    assert.equal(evolved.versionLabel, "1.0.1");
    assert.equal(evolved.operationalState.grandKingsAccountStatus, "SOUL_FILE_FOUNDATION_ACTIVE");

    const history = listSoulFileChangeHistory(WORKSPACE_ID);
    assert.ok(history.length >= 2);
    assert.ok(history.some((entry) => entry.changeType === "INITIALIZE"));
    assert.ok(history.some((entry) => entry.changeType === "EVOLVE"));
  });

  it("exports Soul File as JSON and Markdown", () => {
    initializeSoulFile(WORKSPACE_ID);

    const jsonExport = exportSoulFile(WORKSPACE_ID, "json");
    assert.equal(jsonExport.format, "json");
    assert.ok(jsonExport.content.includes('"soulFileId"'));
    assert.equal(jsonExport.checksum.length, 64);

    const markdownExport = exportSoulFile(WORKSPACE_ID, "markdown");
    assert.equal(markdownExport.format, "markdown");
    assert.ok(markdownExport.content.includes("# Empire Soul File"));
    assert.ok(markdownExport.content.includes("## Identity"));
    assert.ok(markdownExport.content.includes("not a backup"));
  });

  it("imports Markdown export and validates integrity after roundtrip", () => {
    initializeSoulFile(WORKSPACE_ID);
    const markdown = exportSoulFile(WORKSPACE_ID, "markdown").content;

    const imported = importSoulFile({
      workspaceId: WORKSPACE_ID,
      format: "markdown",
      content: markdown.replace(
        "Grand King's Account",
        "Grand King's Account — Evolved",
      ),
      actor: "grand-king",
    });

    assert.equal(imported.version, 2);
    assert.equal(imported.identity.empireName, "Grand King's Account — Evolved");
    assert.equal(verifySoulFileIntegrity(imported).valid, true);

    const history = listSoulFileChangeHistory(WORKSPACE_ID);
    assert.ok(history.some((entry) => entry.changeType === "IMPORT_MARKDOWN"));
  });

  it("imports JSON export with checksum validation", () => {
    initializeSoulFile(WORKSPACE_ID);
    const jsonExport = exportSoulFile(WORKSPACE_ID, "json");

    const imported = importSoulFile({
      workspaceId: WORKSPACE_ID,
      format: "json",
      content: jsonExport.content,
      actor: "grand-king",
    });

    assert.equal(imported.version, 2);
    assert.equal(verifySoulFileIntegrity(imported).valid, true);

    const history = listSoulFileChangeHistory(WORKSPACE_ID);
    assert.ok(history.some((entry) => entry.changeType === "IMPORT_JSON"));
  });

  it("diffs two Soul File versions with field-level entries", () => {
    initializeSoulFile(WORKSPACE_ID);
    evolveSoulFile({
      workspaceId: WORKSPACE_ID,
      identity: { mission: "Evolved mission statement for the Empire." },
    });

    const diff = diffSoulFile(WORKSPACE_ID, 1, 2);
    assert.equal(diff.fromVersion, 1);
    assert.equal(diff.toVersion, 2);
    assert.ok(diff.entries.some((entry) => entry.path === "identity.mission"));
    assert.ok(diff.entries.length >= 1);
  });

  it("evolves via Brain tool", async () => {
    initializeSoulFile(WORKSPACE_ID);

    const evolved = (await invokeTool("soul_file.evolve", {
      summary: "Brain-driven evolution",
      operationalState: { activeMissions: ["S002"] },
    })) as { version: number; operationalState: { activeMissions: string[] } };

    assert.equal(evolved.version, 2);
    assert.deepEqual(evolved.operationalState.activeMissions, ["S002"]);
  });

  it("exports via Brain tool for Grand King's dashboard download path", async () => {
    initializeSoulFile(WORKSPACE_ID);

    const exported = (await invokeTool("soul_file.export", { format: "json" })) as {
      format: string;
      content: string;
    };

    assert.equal(exported.format, "json");
    assert.ok(exported.content.includes("Grand King's Account"));
  });

  it("getSoulFile auto-initializes when missing", () => {
    const document = getSoulFile(WORKSPACE_ID);
    assert.equal(document.version, 1);
    assert.equal(verifySoulFileIntegrity(document).valid, true);
  });
});
