import assert from "node:assert/strict";
import { access, constants } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

import {
  PILLOW_HOST_BOOTSTRAP_REQUIRED_FILES,
  auditGovernanceBundle,
} from "@empireai/pillow";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");
const BUNDLE_ROOT = path.join(REPO_ROOT, "backend", ".pillow-governance-bundle");

async function isReadable(absolutePath: string): Promise<boolean> {
  try {
    await access(absolutePath, constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

async function countDoctrineFiles(root: string): Promise<number> {
  const { readdir } = await import("node:fs/promises");
  let count = 0;
  for (const name of await readdir(root)) {
    if (/^EMPIREAI_.*_DOCTRINE.*\.md$/i.test(name)) {
      if (await isReadable(path.join(root, name))) count += 1;
    }
  }
  return count;
}

describe("Pillow governance bundle (Railway production bootstrap)", () => {
  it("manifest lists brain runtime bootstrap companions", () => {
    assert.ok(
      PILLOW_HOST_BOOTSTRAP_REQUIRED_FILES.includes(
        "docs/architecture/EMPIREAI_BRAIN_ARCHITECTURE.md",
      ),
    );
    assert.ok(
      PILLOW_HOST_BOOTSTRAP_REQUIRED_FILES.includes(
        "docs/audits/full-empireai-audit/08_BRAIN_AND_RUNTIME_AUDIT.md",
      ),
    );
  });

  it("repository root passes full bootstrap audit", async () => {
    const audit = await auditGovernanceBundle(REPO_ROOT, isReadable, countDoctrineFiles);
    assert.equal(audit.requiredKnowledgeFilesFound, true);
    assert.equal(audit.bootstrapRequiredFilesFound, true);
    assert.equal(audit.missingBootstrapFiles.length, 0);
  });

  it("governance bundle contains bootstrap-required files after sync", async () => {
    const audit = await auditGovernanceBundle(BUNDLE_ROOT, isReadable, countDoctrineFiles);
    assert.equal(audit.bootstrapRequiredFilesFound, true, audit.missingBootstrapFiles.join(", "));
  });
});
