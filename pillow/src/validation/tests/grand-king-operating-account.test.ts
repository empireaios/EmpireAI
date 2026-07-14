import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { assembleCommerceOperatingModel } from "../../commerce-operating-model/assembler.js";
import { assembleBusinessFactoryArchitecture } from "../../business-factory/assembler.js";
import {
  assembleGrandKingOperatingAccount,
  buildFallbackGrandKingOperatingAccount,
  GRAND_KING_ACCOUNT_ID,
  GRAND_KING_WORKSPACE_ID,
} from "../../grand-king-operating-account/index.js";

describe("P8-06 Grand King Operating Account", () => {
  test("buildFallbackGrandKingOperatingAccount returns constitutional account", () => {
    const account = buildFallbackGrandKingOperatingAccount();
    assert.equal(account.architectureVersion, "P8-06");
    assert.equal(account.accountId, GRAND_KING_ACCOUNT_ID);
    assert.equal(account.workspaceId, GRAND_KING_WORKSPACE_ID);
    assert.ok(account.experienceStack.length >= 10);
    assert.ok(account.governedDomains.length >= 10);
    assert.ok(account.productionRequirements.length >= 10);
  });

  test("assembleGrandKingOperatingAccount consolidates P8 layers", () => {
    const commerce = assembleCommerceOperatingModel({
      founderShell: { executiveHome: { revenue: "$1,200" } },
    });
    const factory = assembleBusinessFactoryArchitecture({
      founderShell: { grandKingSummary: "Grand King portfolio building" },
    });

    const account = assembleGrandKingOperatingAccount({
      founderShell: { grandKingSummary: "Constitutional production account", shellHealth: "healthy" },
      factory,
      commerce,
    });

    assert.equal(account.architectureVersion, "P8-06");
    assert.ok(account.businessPortfolio.length >= 1);
    assert.ok(account.experienceStack.some((l) => l.layer === "business_factory"));
    assert.ok(account.experienceStack.some((l) => l.layer === "commercial_intelligence"));
    assert.equal(account.executiveControl.revenue, commerce.revenueSummary);
  });
});
