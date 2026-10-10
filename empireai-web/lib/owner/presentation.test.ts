import test from 'node:test';
import assert from 'node:assert/strict';
import {ownerMetric, homeRecommendationVisible, ownerNavigationParent} from './presentation';

test('Missing metric displays do not invent zero or suppress financial exceptions', () => {
  assert.equal(ownerMetric('Not measured'), '—');
  for (const value of ['$0.00', '$12.50', 'US$0.288479 reserved', 'failed_uncertain', 'UNKNOWN_OUTCOME', 'Coverage requires review']) {
    assert.equal(ownerMetric(value), value);
  }
});
test('Home keeps actionable risk regardless of historical identity; source remains unchanged', () => {
  const original = Object.freeze({id:'decision_cdd63cfa788060b6d2d30f1511efabdae0f182d6', classification:'MODEL_GENERATED_CLAIM', status:'AWAITING_OWNER_REVIEW', ownerDecision:null, domain:'risk'});
  assert.equal(homeRecommendationVisible(original), true);
  assert.equal(homeRecommendationVisible({...original, status:'CLOSED'}), false);
  assert.equal(homeRecommendationVisible({...original, ownerDecision:{decision:'REJECT'}}), false);
  assert.equal(homeRecommendationVisible({...original, classification:'SYNTHETIC'}), false);
  assert.equal(original.status, 'AWAITING_OWNER_REVIEW');
});
test('Chat and historic performance retain CEO context; assurance retains governance context', () => {
  assert.equal(ownerNavigationParent('/cockpit/development/pillow'), '/cockpit/ceo');
  assert.equal(ownerNavigationParent('/cockpit/founder/executive-performance'), '/cockpit/ceo');
  assert.equal(ownerNavigationParent('/cockpit/assurance'), '/cockpit/assurance');
  assert.equal(ownerNavigationParent('/cockpit/governance/settings'), '/cockpit/assurance');
  assert.equal(ownerNavigationParent('/cockpit/operations/authorizations'), '/cockpit/approvals');
  assert.equal(ownerNavigationParent('/cockpit/operations/fulfillment'), '/cockpit/orders');
  assert.equal(ownerNavigationParent('/cockpit/founder/executive-finance'), '/cockpit/finance');
  assert.equal(ownerNavigationParent('/cockpit/infrastructure/health'), '/cockpit/system');
  assert.equal(ownerNavigationParent('/cockpit/products/history'), '/cockpit/products/history');
  assert.equal(ownerNavigationParent('/cockpit/intelligence/products'), '/cockpit/eyes');
});
