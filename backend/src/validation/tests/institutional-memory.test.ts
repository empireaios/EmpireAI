import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

import { resetDatabaseInstance } from "../../brain/database.js";
import {
  buildReasoningBundleForWorkspace,
  captureInstitutionalMemory,
  getCommerceInstitutionalContext,
  listInstitutionalMemory,
  resetExecutiveLearningRepository,
  resetInstitutionalMemoryRepository,
  retrieveInstitutionalMemory,
  seedInstitutionalMemoryBootstrap,
} from "../../orchestration/executive-learning/index.js";
import { formatExecutiveLearningForLlm } from "@empireai/pillow";
import { configureValidationEnvironment } from "../harness.js";

const WS = "ws_empire_1";

describe("Institutional cumulative memory", () => {
  beforeEach(() => {
    configureValidationEnvironment();
    process.env.DATABASE_PATH = ":memory:";
    resetDatabaseInstance();
    resetExecutiveLearningRepository();
    resetInstitutionalMemoryRepository();
  });

  afterEach(() => {
    resetInstitutionalMemoryRepository();
    resetExecutiveLearningRepository();
    resetDatabaseInstance();
  });

  it("seeds durable commerce and Grand King directive memories", () => {
    const seeded = seedInstitutionalMemoryBootstrap(WS);
    assert.ok(seeded.seeded >= 8);
    const again = seedInstitutionalMemoryBootstrap(WS);
    assert.equal(again.seeded, 0);

    const all = listInstitutionalMemory(WS);
    assert.ok(all.some((m) => m.canonicalKey === "commerce.lesson.accepted_ne_buyable"));
    assert.ok(all.some((m) => m.canonicalKey === "commerce.lesson.anker_brand_gate"));
    assert.ok(all.some((m) => m.canonicalKey === "gk.directive.pillow_initiates_commerce"));
    assert.ok(all.every((m) => m.status === "approved"));
    assert.ok(all.some((m) => m.authority === "grand_king_directive"));
    assert.ok(all.some((m) => m.epistemicStatus === "FACT"));
  });

  it("retrieves relevant commerce lessons and feeds reasoning bundle", () => {
    seedInstitutionalMemoryBootstrap(WS);
    const retrieved = retrieveInstitutionalMemory({
      workspaceId: WS,
      tags: ["amazon", "buyable"],
      keywords: ["accepted"],
      limit: 8,
    });
    assert.ok(retrieved.some((m) => m.canonicalKey === "commerce.lesson.accepted_ne_buyable"));

    const bundle = buildReasoningBundleForWorkspace({
      workspaceId: WS,
      currentObjective: "First-dollar dropshipping",
      executiveConstitutionSummary: "Grand King supreme.",
    });
    assert.ok(bundle.approvedExecutiveKnowledge.length + bundle.projectWorkingKnowledge.length >= 5);
    const llm = formatExecutiveLearningForLlm(bundle);
    assert.match(llm, /ACCEPTED|BUYABLE|Anker|dropshipping/i);
    assert.match(llm, /epistemic=/);
  });

  it("commerce context forces Anker/B088NRLMPV avoidance and cites memory", () => {
    seedInstitutionalMemoryBootstrap(WS);
    const ctx = getCommerceInstitutionalContext(WS);
    assert.ok(ctx.mustAvoidAsins.includes("B088NRLMPV"));
    assert.ok(ctx.mustAvoidBrands.includes("anker"));
    assert.match(ctx.formatted, /INSTITUTIONAL COMMERCE MEMORY/);
    assert.ok(ctx.memories.length >= 3);
  });

  it("supersedes prior memory while keeping audit history path", () => {
    captureInstitutionalMemory({
      workspaceId: WS,
      canonicalKey: "supplier.x.speed.v1",
      title: "Supplier X ships in 4 days",
      statement: "Supplier X usually ships in 4 days.",
      memoryClass: "experience",
      authority: "system_observed",
      epistemicStatus: "OBSERVATION",
      tags: ["supplier"],
      category: "C",
    });
    const updated = captureInstitutionalMemory({
      workspaceId: WS,
      canonicalKey: "supplier.x.speed.v2",
      title: "Supplier X average delivery now 9 days",
      statement: "Supplier X average delivery now 9 days.",
      memoryClass: "experience",
      authority: "system_observed",
      epistemicStatus: "OBSERVATION",
      tags: ["supplier"],
      category: "C",
      supersedeCanonicalKey: "supplier.x.speed.v1",
    });
    assert.equal(updated.created, true);
    const active = listInstitutionalMemory(WS);
    assert.ok(active.some((m) => m.canonicalKey === "supplier.x.speed.v2"));
    assert.ok(!active.some((m) => m.canonicalKey === "supplier.x.speed.v1"));
  });
});
