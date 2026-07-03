import assert from "node:assert/strict";
import path from "node:path";
import { test, describe, before, after } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import { isBootstrapReady } from "../../bootstrap/types.js";
import { runRepositoryIntelligence } from "../../intelligence/engine.js";
import { detectContextTask } from "../../context/intent.js";
import { runContextBuild } from "../../context/engine.js";
import {
  createTechnicalChiefEngine,
  reviewCursorEngineeringOutput,
  formatExecutiveEngineeringReport,
} from "../../technical-chief/index.js";
import {
  startPillow,
  requirePillowTechnicalChief,
  resetPillowSession,
} from "../../session.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

describe("Phase 3 Technical Chief (PILLOW-TC-001)", () => {
  before(() => resetPillowSession());
  after(() => resetPillowSession());

  test("Technical Chief initializes with startPillow", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const chief = requirePillowTechnicalChief();
    const state = chief.getState();
    assert.equal(state.chiefVersion, "PILLOW-TC-001");
    assert.equal(state.status, "ready");
  });

  test("Diagnoses Failed to fetch with frontend and API categories", async () => {
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT });
    if (!isBootstrapReady(bootstrap)) assert.fail();
    const intelligence = await runRepositoryIntelligence({ bootstrap });
    const chief = createTechnicalChiefEngine(bootstrap, intelligence);
    await chief.initialize();

    const analysis = chief.analyzeIssue({
      problemDescription:
        "Pillow Operating Shell shows Failed to fetch banner while mission data loads",
    });

    assert.ok(analysis.diagnosis.categories.includes("frontend"));
    assert.ok(
      analysis.diagnosis.categories.includes("api") ||
        analysis.diagnosis.categories.includes("authentication"),
    );
    assert.ok(analysis.rootCause.confidenceScore >= 0.85);
    assert.match(analysis.rootCause.rootCause, /fetch|BFF|auth|retry|proxy/i);
    assert.ok(analysis.plan.steps.length >= 2);
    assert.ok(analysis.plan.acceptanceCriteria.length >= 3);
  });

  test("Root cause analysis includes upstream and downstream consequences", async () => {
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT });
    if (!isBootstrapReady(bootstrap)) assert.fail();
    const intelligence = await runRepositoryIntelligence({ bootstrap });
    const chief = createTechnicalChiefEngine(bootstrap, intelligence);
    await chief.initialize();

    const analysis = chief.analyzeIssue({
      problemDescription: "502 Bad Gateway on /api/pillow/session through Vercel BFF",
    });

    assert.ok(analysis.rootCause.upstreamCauses.length >= 1);
    assert.ok(analysis.rootCause.downstreamConsequences.length >= 1);
    assert.ok(analysis.risks.productionRisk === "high" || analysis.risks.productionRisk === "critical");
  });

  test("Cursor review rejects unsafe patterns and hallucinated paths", () => {
    const review = reviewCursorEngineeringOutput({
      changedFiles: ["frontend/src/microservices/pillow-gateway.ts"],
      diffSummary: "Use localhost:4000 in production and force push to main",
    });

    assert.equal(review.approved, false);
    assert.ok(review.incorrectAssumptions.length > 0);
    assert.ok(review.requiredCorrections.length > 0);
  });

  test("Certification produces Executive Engineering Report", async () => {
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT });
    if (!isBootstrapReady(bootstrap)) assert.fail();
    const intelligence = await runRepositoryIntelligence({ bootstrap });
    const chief = createTechnicalChiefEngine(bootstrap, intelligence);
    await chief.initialize();

    const report = chief.certifyWork({
      problemDescription: "Failed to fetch in Pillow shell",
      changedFiles: [
        "empireai-web/lib/pillow/client.ts",
        "empireai-web/components/cockpit/shell/CockpitShell.tsx",
      ],
      validationOverrides: {
        productionHealthOk: true,
        pillowSessionOk: true,
      },
    });

    assert.equal(report.version, "PILLOW-TC-001");
    assert.ok(["certified", "conditional", "rejected"].includes(report.certificationDecision));
    const formatted = formatExecutiveEngineeringReport(report);
    assert.match(formatted, /Executive Engineering Report/);
    assert.match(formatted, /Certification Decision/);
  });

  test("Intent detection routes diagnosis to technical_chief task", () => {
    assert.equal(detectContextTask("What is the root cause of the Failed to fetch error?"), "technical_chief");
    assert.equal(detectContextTask("Diagnose why Pillow session fails"), "technical_chief");
  });

  test("Context builder attaches Technical Chief brief", async () => {
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT });
    if (!isBootstrapReady(bootstrap)) assert.fail();
    const intelligence = await runRepositoryIntelligence({ bootstrap });
    const chief = createTechnicalChiefEngine(bootstrap, intelligence);
    await chief.initialize();

    const context = await runContextBuild(
      bootstrap,
      intelligence,
      { userMessage: "Why did Pillow show Failed to fetch?" },
      undefined,
      chief,
    );

    assert.equal(context.manifest.task, "technical_chief");
    assert.ok(context.technicalChiefBrief);
    assert.match(context.technicalChiefBrief, /Technical Chief Analysis/);
    assert.match(context.technicalChiefBrief, /Root cause/i);
  });
});
