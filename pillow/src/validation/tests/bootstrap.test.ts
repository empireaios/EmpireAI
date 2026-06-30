import assert from "node:assert/strict";
import { mkdtemp, writeFile, mkdir, copyFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { test, describe, before, after } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import { findRepositoryRoot } from "../../bootstrap/find-repo-root.js";
import { RepositoryReader } from "../../bootstrap/repository-reader.js";
import { formatFailureReport } from "../../bootstrap/failure.js";
import {
  runExecutiveSelfAssessment,
  type ExecutiveAssessmentInput,
} from "../../bootstrap/executive-self-assessment.js";
import { discoverCanonicalSources } from "../../bootstrap/scanner.js";
import {
  isBootstrapReady,
  type BootstrapFailureResult,
} from "../../bootstrap/types.js";
import {
  startPillow,
  requirePillowContext,
  resetPillowSession,
  BootstrapFailureError,
  PillowNotBootstrappedError,
} from "../../session.js";

const REPO_ROOT = path.resolve(
  import.meta.dirname,
  "..",
  "..",
  "..",
  "..",
);

describe("PILLOW-002 Repository Reconstruction Bootstrap", () => {
  before(() => {
    resetPillowSession();
  });

  after(() => {
    resetPillowSession();
  });

  test("findRepositoryRoot locates EmpireAI monorepo", async () => {
    const root = await findRepositoryRoot(REPO_ROOT);
    assert.equal(root, REPO_ROOT);
  });

  test("Bootstrap discovers canonical sources via repository reconstruction", async () => {
    const result = await runBootstrap({ repositoryRoot: REPO_ROOT });
    assert.equal(result.status, "ready", "Reconstruction must succeed on real repo");

    if (!isBootstrapReady(result)) return;

    assert.equal(result.executiveReady, true);
    assert.equal(result.reconstruction.phase, "executive_ready");
    assert.equal(result.reconstruction.selfAssessmentPassed, true);
    assert.equal(result.reconstruction.executiveBriefingGenerated, true);
    assert.ok(result.executiveSelfAssessment.coherent);
    assert.ok(result.executiveBriefing.narrative.includes("PILLOW EXECUTIVE BRIEFING"));
    assert.ok(
      result.executiveBriefing.narrative.includes("continuous strategic anchor"),
    );
    assert.ok(result.executiveBriefing.identity.pillowRole.length > 0);
    assert.ok(result.executiveBriefing.direction.supremeDirective.length > 0);
    assert.equal(result.executiveBriefing.currentObjective, "Finish EmpireAI Version 1");
    assert.equal(
      result.executiveBriefing.direction.currentObjective,
      "Finish EmpireAI Version 1",
    );
    assert.ok(result.reconstruction.sourcesDiscovered > 20);
    assert.ok(result.reconstruction.completenessVerified);
    assert.ok(result.knownContracts.length >= 3);
    assert.ok(result.knownDoctrines.length >= 2);
    assert.ok(result.knownDecisions.adrCount > 0);
    assert.ok(result.knownExecutiveAudits.length > 0);
    assert.ok(result.repositoryRoot.endsWith("EmpireAI"));
  });

  test("Bootstrap produces complete runtime Empire context", async () => {
    const result = await runBootstrap({ repositoryRoot: REPO_ROOT });
    assert.equal(result.status, "ready");
    if (!isBootstrapReady(result)) return;

    assert.equal(result.bootstrapVersion, "PILLOW-002");
    assert.ok(result.completedAt);
    assert.ok(result.durationMs >= 0);
    assert.ok(result.journeyPosition !== null || result.currentMission !== null);
    assert.equal(result.repositoryHealth.healthy, true);
    assert.ok(result.knownArchitecture.pillowContractPath);
    assert.ok(Array.isArray(result.realOwners));
    assert.ok(result.artifacts.length > 20, "Reconstruction discovers many canonical sources");
  });

  test("New canonical knowledge is auto-discovered without Bootstrap code changes", async () => {
    const tempRoot = await mkdtemp(path.join(os.tmpdir(), "pillow-reconstruct-"));
    const reader = new RepositoryReader(REPO_ROOT);
    const markers = ["JOURNEY.md", "PILLOW_ARCHITECTURE_CONTRACT.md", "EMPIREAI_CONSTITUTION.md"];
    for (const marker of markers) {
      await copyFile(path.join(REPO_ROOT, marker), path.join(tempRoot, marker));
    }

    const novelDoctrine = path.join(tempRoot, "EMPIREAI_STRATEGIC_INTELLIGENCE_DOCTRINE.md");
    await writeFile(
      novelDoctrine,
      "# Strategic Intelligence Doctrine\nApproved canonical executive knowledge.\n",
      "utf8",
    );

    const before = await discoverCanonicalSources(new RepositoryReader(tempRoot));
    assert.ok(
      before.some((source) => source.includes("EMPIREAI_STRATEGIC_INTELLIGENCE_DOCTRINE")),
      "Novel doctrine must be discovered by convention scan",
    );
  });

  test("Bootstrap completes within reasonable time", async () => {
    const result = await runBootstrap({ repositoryRoot: REPO_ROOT });
    if (!isBootstrapReady(result)) {
      assert.fail("Bootstrap should succeed");
    }
    assert.ok(
      result.durationMs < 5000,
      `Bootstrap took ${result.durationMs}ms — should be under 5s`,
    );
  });

  test("Bootstrap is read-only — no repository writes", async () => {
    const reader = new RepositoryReader(REPO_ROOT);
    const journeyBefore = await reader.readText("JOURNEY.md");
    assert.ok(journeyBefore);

    await runBootstrap({ repositoryRoot: REPO_ROOT });

    const journeyAfter = await reader.readText("JOURNEY.md");
    assert.equal(journeyBefore, journeyAfter);
  });

  test("Failure Mode when reconstruction categories incomplete", async () => {
    const tempRoot = await mkdtemp(path.join(os.tmpdir(), "pillow-bootstrap-"));
    await writeFile(
      path.join(tempRoot, "JOURNEY.md"),
      "# Journey\n",
      "utf8",
    );
    await writeFile(
      path.join(tempRoot, "PILLOW_ARCHITECTURE_CONTRACT.md"),
      "# Contract\n",
      "utf8",
    );

    const result = await runBootstrap({ repositoryRoot: tempRoot });
    assert.equal(result.status, "failure");

    const failure = result as BootstrapFailureResult;
    assert.ok(
      failure.failure.code === "MANDATORY_ARTIFACT_MISSING" ||
        failure.failure.code === "EXECUTIVE_SELF_ASSESSMENT_FAILED",
    );
    assert.ok(failure.failure.missingMandatory.length > 0);
    assert.ok(failure.failure.recommendations.length > 0);

    const report = formatFailureReport(failure.failure);
    assert.match(report, /RECONSTRUCTION FAILURE/);
    assert.match(report, /Executive Ready/);
  });

  test("Failure Mode on invalid repository root", async () => {
    const tempRoot = await mkdtemp(path.join(os.tmpdir(), "pillow-invalid-"));
    const result = await runBootstrap({ repositoryRoot: tempRoot });
    assert.equal(result.status, "failure");
    if (isBootstrapReady(result)) assert.fail();
    assert.equal(result.failure.code, "REPOSITORY_ROOT_INVALID");
  });

  test("startPillow blocks operational reasoning until reconstruction succeeds", async () => {
    resetPillowSession();
    assert.throws(() => requirePillowContext(), PillowNotBootstrappedError);

    const session = await startPillow({ repositoryRoot: REPO_ROOT });
    assert.equal(requirePillowContext(), session.bootstrap);
    assert.equal(session.bootstrap.status, "ready");
    assert.equal(session.bootstrap.executiveReady, true);
    assert.equal(session.intelligence.status, "ready");
    assert.ok(session.executiveDirection);
    assert.ok(session.contextBuilder);
    assert.ok(session.memory);
  });

  test("startPillow throws BootstrapFailureError on incomplete reconstruction", async () => {
    resetPillowSession();
    const tempRoot = await mkdtemp(path.join(os.tmpdir(), "pillow-fail-"));
    await mkdir(tempRoot, { recursive: true });
    await writeFile(path.join(tempRoot, "JOURNEY.md"), "# J", "utf8");
    await writeFile(
      path.join(tempRoot, "PILLOW_ARCHITECTURE_CONTRACT.md"),
      "# C",
      "utf8",
    );

    await assert.rejects(
      () => startPillow({ repositoryRoot: tempRoot }),
      BootstrapFailureError,
    );
    assert.throws(() => requirePillowContext(), PillowNotBootstrappedError);
  });

  test("Executive Self-Assessment fails when executive identity cannot be reconstructed", async () => {
    const input: ExecutiveAssessmentInput = {
      artifacts: [],
      soulText: "# Empty soul\n",
      journeyText: "# Journey\nVersion 1\nPillow Runtime",
      statusText: "# Status\nCurrent position: test",
      constitutionText: "# Constitution\nPrimary mission CTD-002 SUCCESS-001 USD 100,000 net profit",
      pillowEnhancementRegisterText: "| PILLOW-ENH-001 | x | Future |",
    };

    const assessment = runExecutiveSelfAssessment(input);
    assert.equal(assessment.coherent, false);
    assert.ok(
      assessment.criteria.some(
        (criterion) => criterion.id === "executive_identity" && !criterion.passed,
      ),
    );
  });

  test("Executive Self-Assessment passes with coherent executive state", async () => {
    const result = await runBootstrap({ repositoryRoot: REPO_ROOT });
    assert.equal(result.status, "ready");
    if (!isBootstrapReady(result)) assert.fail();

    assert.equal(result.executiveSelfAssessment.coherent, true);
    assert.equal(result.executiveSelfAssessment.criteria.length, 8);
    assert.ok(result.executiveSelfAssessment.criteria.every((criterion) => criterion.passed));
    assert.ok(result.executiveBriefing.narrative.length > 100);
  });

  test("optional enhancement registers tolerated when absent from minimal tree", async () => {
    const result = await runBootstrap({ repositoryRoot: REPO_ROOT });
    if (!isBootstrapReady(result)) assert.fail();

    const optional = result.artifacts.filter(
      (artifact) => artifact.descriptor.requirement === "optional",
    );
    assert.ok(optional.length >= 0);
    assert.equal(result.status, "ready");
  });
});
