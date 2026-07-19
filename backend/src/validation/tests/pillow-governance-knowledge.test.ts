import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { after, describe, it } from "node:test";

import {
  auditGovernanceKnowledge,
  REQUIRED_KNOWLEDGE_FILES,
} from "../../orchestration/pillow-host/governance-knowledge.js";
import {
  resolvePillowRepositoryRootWithAudit,
} from "../../orchestration/pillow-host/resolve-repo-root.js";

describe("Pillow governance knowledge audit", () => {
  let tempRoot: string;

  after(async () => {
    if (tempRoot) await rm(tempRoot, { recursive: true, force: true });
  });

  it("passes when required executive knowledge is present", async () => {
    const resolution = await resolvePillowRepositoryRootWithAudit();
    assert.ok(resolution.governanceAudit.requiredKnowledgeFilesFound);
    assert.ok(resolution.governanceAudit.bootstrapRequiredFilesFound);
    assert.equal(resolution.governanceAudit.missingKnowledgeFiles.length, 0);
    assert.equal(resolution.governanceAudit.missingBootstrapFiles.length, 0);
    assert.ok(resolution.governanceAudit.doctrineFilesFound >= 2);
  });

  it("fails clearly when mandatory knowledge files are missing", async () => {
    tempRoot = await mkdtemp(path.join(os.tmpdir(), "pillow-gov-audit-"));
    await writeFile(path.join(tempRoot, "JOURNEY.md"), "# Journey", "utf8");
    await writeFile(
      path.join(tempRoot, "PILLOW_ARCHITECTURE_CONTRACT.md"),
      "# Contract",
      "utf8",
    );

    const audit = await auditGovernanceKnowledge(tempRoot);
    assert.equal(audit.requiredKnowledgeFilesFound, false);
    assert.ok(
      audit.missingKnowledgeFiles.some((entry) =>
        REQUIRED_KNOWLEDGE_FILES.slice(0, 3).some((file) => entry.includes(file)),
      ),
    );
  });
});
