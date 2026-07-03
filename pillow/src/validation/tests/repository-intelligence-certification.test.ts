/**
 * Phase 2 Repository Intelligence Certification Suite.
 * Validates all target engineering question types from the canonical mission.
 */
import assert from "node:assert/strict";
import path from "node:path";
import { test, describe, before, after } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import { isBootstrapReady } from "../../bootstrap/types.js";
import { runRepositoryIntelligence } from "../../intelligence/engine.js";
import {
  formatRepositoryKnowledgeAnswer,
  queryRepositoryKnowledge,
} from "../../repository-intelligence/query-engine.js";
import { formatKnowledgeModelSummary } from "../../repository-intelligence/knowledge-model.js";
import { resetPillowSession } from "../../session.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

interface CertificationCase {
  question: string;
  mustMatch: RegExp;
}

const CERTIFICATION_CASES: CertificationCase[] = [
  {
    question: "Where is pillow-host implemented?",
    mustMatch: /backend\/src\/orchestration\/pillow-host/i,
  },
  {
    question: "Who owns the business automation module?",
    mustMatch: /business-automation|Business Automation/i,
  },
  {
    question: "Which mission introduced PILLOW-016?",
    mustMatch: /PILLOW-016|openai/i,
  },
  {
    question: "Which file renders the development pillow screen?",
    mustMatch: /DevelopmentPillowExperience|development\/pillow/i,
  },
  {
    question: "What depends on the brain service?",
    mustMatch: /bff|cockpit|pillow-host|depends/i,
  },
  {
    question: "What happens if the BFF proxy changes?",
    mustMatch: /cockpit|bff|brain|affect/i,
  },
  {
    question: "How does the deployment runtime flow work?",
    mustMatch: /GitHub|Railway|Vercel|deploy/i,
  },
  {
    question: "What is the system boundary between frontend and backend?",
    mustMatch: /frontend|bff|brain|Cockpit|layer/i,
  },
];

describe("Phase 2 Repository Intelligence Certification", () => {
  before(() => resetPillowSession());
  after(() => resetPillowSession());

  test("Knowledge model consolidates all repository domains", async () => {
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT });
    if (!isBootstrapReady(bootstrap)) assert.fail();

    const intelligence = await runRepositoryIntelligence({ bootstrap });
    const model = intelligence.knowledgeModel;

    assert.ok(model.domains.length >= 6, "Expected source, frontend, pillow, governance, deployment, tests");
    assert.ok(model.criticalPaths.length >= 3);
    assert.ok(model.missions.length >= 8);
    assert.ok(model.architecture.some((b) => b.id === "grand-king"));
    assert.ok(model.architecture.some((b) => b.id === "automation"));
    assert.ok(model.architecture.some((b) => b.id === "registry"));

    const summary = formatKnowledgeModelSummary(model);
    assert.match(summary, /Repository Intelligence PILLOW-RI-001/);
    assert.match(summary, /Critical path/);
  });

  for (const certCase of CERTIFICATION_CASES) {
    test(`Certification: ${certCase.question}`, async () => {
      const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT });
      if (!isBootstrapReady(bootstrap)) assert.fail();

      const intelligence = await runRepositoryIntelligence({ bootstrap });
      const result = queryRepositoryKnowledge(certCase.question, intelligence.knowledgeModel);

      assert.equal(result.matched, true, `No match for: ${certCase.question}`);
      const text = formatRepositoryKnowledgeAnswer(result) ?? "";
      assert.match(
        text,
        certCase.mustMatch,
        `Answer for "${certCase.question}" did not match ${certCase.mustMatch}: ${text}`,
      );
    });
  }
});
