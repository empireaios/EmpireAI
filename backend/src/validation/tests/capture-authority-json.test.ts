import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import {
  acquireAuthorityJsonCaptureFence,
  emptyAuthorityStore,
  resolveStorePath,
  saveAuthorityStore,
} from "../../orchestration/shadow-ceo-authority/repository/json-authority-store.js";
import { withLocalJsonAuthorityCapture } from "../../orchestration/shadow-ceo-integration/local-json-capture.js";
import {
  acquireRequestOwnerCaptureFence,
  persistRequestOwner,
  type RequestOwnerRecord,
} from "../../orchestration/shadow-ceo-integration/request-owner.js";

function owner(id: string): RequestOwnerRecord {
  return {
    requestId: id, runId: `run_${id}`, correlationId: `corr_${id}`,
    completeInstruction: `synthetic ${id}`, suppliedProducts: [], eligibilityRules: {},
    requestedBusinessOperation: "synthetic evaluation", permittedActions: [], prohibitedActions: [],
    requestedAnswerFormat: { expectedLineCount: null, fieldNames: [], requiredToken: null,
      prohibitsExtraProse: false, template: "unspecified" },
    operatingMode: "SYNTHETIC", birthStatus: "NOT_BORN",
    realCommerceAuthority: "unauthorized", createdAt: new Date().toISOString(),
    workspaceId: "ws_capture", instructionDigest: `digest_${id}`,
  };
}

test("candidate capture fences both authority JSON writers through asynchronous readback", async t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "capture-authority-"));
  const previous = process.env.SHADOW_CEO_DATA_DIR;
  process.env.SHADOW_CEO_DATA_DIR = root;
  t.after(() => {
    if (previous === undefined) delete process.env.SHADOW_CEO_DATA_DIR;
    else process.env.SHADOW_CEO_DATA_DIR = previous;
    fs.rmSync(root, { recursive: true, force: true });
  });
  saveAuthorityStore(emptyAuthorityStore());
  persistRequestOwner(owner("one"));
  const authority = resolveStorePath();
  const owners = path.join(root, "shadow-ceo-request-owners.json");
  const before = [fs.readFileSync(authority, "utf8"), fs.readFileSync(owners, "utf8")];
  let release!: () => void;
  const readback = new Promise<void>(resolve => { release = resolve; });
  t.after(() => release());
  const capture = withLocalJsonAuthorityCapture(async () => {
    await readback;
    assert.deepEqual([fs.readFileSync(authority, "utf8"), fs.readFileSync(owners, "utf8")], before);
    return "read back";
  });
  assert.throws(() => saveAuthorityStore(emptyAuthorityStore()), /AUTHORITY_JSON_CAPTURE_FENCED/);
  assert.throws(() => persistRequestOwner(owner("two")), /REQUEST_OWNER_CAPTURE_FENCED/);
  assert.throws(() => persistRequestOwner(owner("one")), /REQUEST_OWNER_CAPTURE_FENCED/);
  await assert.rejects(withLocalJsonAuthorityCapture(() => "overlap"), /CAPTURE_BUSY/);
  assert.deepEqual([fs.readFileSync(authority, "utf8"), fs.readFileSync(owners, "utf8")], before);
  release();
  assert.equal(await capture, "read back");
  persistRequestOwner(owner("two"));
  saveAuthorityStore(emptyAuthorityStore());
  assert.equal(Object.keys(JSON.parse(fs.readFileSync(owners, "utf8"))).length, 2);
});

test("candidate authority fence releases both stores on failure and partial acquisition", async () => {
  await assert.rejects(withLocalJsonAuthorityCapture(() => { throw new Error("copy failed"); }), /copy failed/);
  const releaseAuthority = acquireAuthorityJsonCaptureFence();
  try {
    await assert.rejects(withLocalJsonAuthorityCapture(() => "must not run"), /AUTHORITY_JSON_CAPTURE_BUSY/);
    const releaseOwner = acquireRequestOwnerCaptureFence();
    releaseOwner();
  } finally { releaseAuthority(); }
  assert.equal(await withLocalJsonAuthorityCapture(() => "recovered"), "recovered");
});
