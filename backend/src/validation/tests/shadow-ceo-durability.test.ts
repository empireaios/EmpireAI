import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import { openShadowCeoRepository } from "../../orchestration/shadow-ceo/repository.js";
import {
  resolveShadowCeoAuthorityDir,
  resolveShadowCeoDataRoot,
  resolveShadowCeoDbPath,
} from "../../orchestration/shadow-ceo-integration/durable-paths.js";
import {
  findOwnerByDigest,
  getRequestOwner,
  persistRequestOwner,
  type RequestOwnerRecord,
} from "../../orchestration/shadow-ceo-integration/request-owner.js";

const envKeys = [
  "RAILWAY_ENVIRONMENT", "RAILWAY_SERVICE_ID", "RAILWAY_VOLUME_MOUNT_PATH",
  "SHADOW_CEO_DATA_DIR", "EMPIRE_DATA_DIR",
] as const;

function isolatedEnvironment(t: import("node:test").TestContext): string {
  const previous = Object.fromEntries(envKeys.map((key) => [key, process.env[key]]));
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "shadow-durability-"));
  for (const key of envKeys) delete process.env[key];
  t.after(() => {
    for (const key of envKeys) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
    fs.rmSync(root, { recursive: true, force: true });
  });
  return root;
}

function owner(id: string): RequestOwnerRecord {
  return {
    requestId: id, runId: `run_${id}`, correlationId: `corr_${id}`,
    completeInstruction: `synthetic request ${id}`, suppliedProducts: [],
    eligibilityRules: {}, requestedBusinessOperation: "synthetic evaluation",
    permittedActions: [], prohibitedActions: [],
    requestedAnswerFormat: {
      expectedLineCount: null, fieldNames: [], requiredToken: null,
      prohibitsExtraProse: false, template: "unspecified",
    },
    operatingMode: "SYNTHETIC", birthStatus: "NOT_BORN",
    realCommerceAuthority: "unauthorized", createdAt: new Date().toISOString(),
    workspaceId: "ws_durability", instructionDigest: `digest_${id}`,
  };
}

test("Railway Shadow CEO records and authority use its volume, never the application directory", (t) => {
  const root = isolatedEnvironment(t);
  const volume = path.join(root, "volume");
  fs.mkdirSync(volume);
  process.env.RAILWAY_ENVIRONMENT = "production";
  process.env.RAILWAY_VOLUME_MOUNT_PATH = volume;

  const expected = path.join(volume, "shadow-ceo");
  assert.equal(resolveShadowCeoDataRoot(), expected);
  assert.equal(resolveShadowCeoDbPath(), path.join(expected, "shadow-ceo.db"));
  assert.equal(resolveShadowCeoAuthorityDir(), path.join(expected, "shadow-ceo-authority"));
  const repo = openShadowCeoRepository();
  assert.equal(repo.dbPath, resolveShadowCeoDbPath());
  repo.close();
  persistRequestOwner(owner("one"));
  assert.equal(getRequestOwner("one")?.requestId, "one");
  assert.ok(fs.existsSync(path.join(expected, "shadow-ceo-request-owners.json")));

  process.env.SHADOW_CEO_DATA_DIR = path.join(root, "ephemeral");
  assert.throws(() => resolveShadowCeoDataRoot(), /within the attached Railway volume/);
  delete process.env.SHADOW_CEO_DATA_DIR;
  if (process.platform !== "win32") {
    fs.symlinkSync(root, path.join(volume, "escape"), "dir");
    process.env.SHADOW_CEO_DATA_DIR = path.join(volume, "escape", "new-directory");
    assert.throws(() => resolveShadowCeoDataRoot(), /resolves outside the attached Railway volume/);
    assert.equal(fs.existsSync(path.join(root, "new-directory")), false);
    delete process.env.SHADOW_CEO_DATA_DIR;
  }
  process.env.RAILWAY_VOLUME_MOUNT_PATH = path.join(root, "absent-mount");
  assert.throws(() => resolveShadowCeoDataRoot(), /volume mount is missing/);
  delete process.env.RAILWAY_VOLUME_MOUNT_PATH;
  assert.throws(() => resolveShadowCeoDataRoot(), /requires an attached Railway volume/);
});

test("corrupt request-owner state refuses retry and an interrupted atomic write preserves old authority", (t) => {
  const root = isolatedEnvironment(t);
  process.env.SHADOW_CEO_DATA_DIR = root;
  const file = path.join(root, "shadow-ceo-request-owners.json");
  persistRequestOwner(owner("one"));
  const original = fs.readFileSync(file, "utf8");

  const rename = t.mock.method(fs, "renameSync", () => { throw new Error("simulated rename failure"); });
  assert.throws(() => persistRequestOwner(owner("two")), /simulated rename failure/);
  rename.mock.restore();
  assert.equal(fs.readFileSync(file, "utf8"), original);
  assert.equal(findOwnerByDigest("digest_two"), null);
  assert.equal(getRequestOwner("one")?.requestId, "one");

  fs.writeFileSync(file, "{truncated", "utf8");
  assert.throws(() => findOwnerByDigest("digest_one"), /REQUEST_OWNER_STATE_UNREADABLE/);
  assert.throws(() => persistRequestOwner(owner("two")), /REQUEST_OWNER_STATE_UNREADABLE/);
  assert.equal(fs.readFileSync(file, "utf8"), "{truncated");
});
