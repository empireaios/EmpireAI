import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { GRAND_KING_WORKSPACE_ID } from "../../grand-king/constants.js";
import { getOneProductCommissioningRecord } from "../../orchestration/pillow-commissioning/one-product-commissioning.js";
import {
  buildAndPersistOneProductDecisionDossier,
  getPersistedOneProductDecisionDossier,
} from "../../orchestration/pillow-commissioning/one-product-decision-dossier.js";

describe("CQ-04 one-product decision dossier", () => {
  it("builds durable dossier when commissioning record exists", () => {
    const commissioning = getOneProductCommissioningRecord(GRAND_KING_WORKSPACE_ID);
    if (!commissioning) {
      // Local DB may not have live production selection — skip without inventing a product.
      assert.ok(true);
      return;
    }
    const built = buildAndPersistOneProductDecisionDossier(GRAND_KING_WORKSPACE_ID);
    assert.equal(built.ok, true);
    assert.ok(built.dossier);
    assert.equal(built.dossier!.selection.selectionAuthority, "pillow");
    assert.equal(built.dossier!.selection.cursorSelected, false);
    assert.equal(built.dossier!.governance.publicationAttempted, false);
    assert.equal(built.dossier!.governance.supplierSpendAttempted, false);
    assert.equal(built.dossier!.challengeInterface.cq05Status, "AWAITING_GRAND_KING_AND_CHATGPT");
    assert.equal(built.dossier!.postLaunchAutonomyReadiness.hardCodedPriceCutForbidden, true);
    assert.equal(
      built.dossier!.identityReconciliation.nordicBeddingStatus,
      "HISTORICAL_MISSION_004_ONLY",
    );
    const persisted = getPersistedOneProductDecisionDossier(GRAND_KING_WORKSPACE_ID);
    assert.ok(persisted);
    assert.equal(persisted!.selection.opportunityId, commissioning.opportunityId);
  });
});
