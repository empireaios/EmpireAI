import test from 'node:test';
import assert from 'node:assert/strict';
import {ownerMetric, homeRecommendationVisible, ownerNavigationParent, recommendationHeadline} from './presentation';

test('Transcript-length titles remain bounded excerpts without inventing or changing source advice', () => {
  const source = Object.freeze({title: 'Do not purchase: supplier identity remains unverified. ' + 'Retained evidence detail. '.repeat(200)});
  const headline = recommendationHeadline(source.title);
  assert.ok(headline.length <= 160);
  assert.ok(headline.startsWith('Do not purchase: supplier identity remains unverified.'));
  assert.ok(headline.endsWith('…'));
  assert.equal(source.title.length > 4000, true);
  assert.equal(recommendationHeadline('Review supplier evidence'), 'Review supplier evidence');
  assert.equal(recommendationHeadline('**Do not purchase**: evidence remains unverified.'), 'Do not purchase: evidence remains unverified.');
});

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
  assert.equal(ownerNavigationParent('/cockpit/operations/authorizations'), '/cockpit/products');
  assert.equal(ownerNavigationParent('/cockpit/operations/fulfillment'), '/cockpit/orders');
  assert.equal(ownerNavigationParent('/cockpit/founder/executive-finance'), '/cockpit/finance');
  assert.equal(ownerNavigationParent('/cockpit/infrastructure/health'), '/cockpit/system');
  assert.equal(ownerNavigationParent('/cockpit/products/history'), '/cockpit/products/history');
  assert.equal(ownerNavigationParent('/cockpit/intelligence/products'), '/cockpit/eyes');
  assert.equal(ownerNavigationParent('/cockpit/commerce/governed'), '/cockpit/products');
  for (const path of ['/cockpit/command', '/cockpit/missions', '/cockpit/relationship', '/cockpit/development']) {
    assert.equal(ownerNavigationParent(path), '/cockpit/ceo');
  }
  assert.equal(ownerNavigationParent('/cockpit/operations'), '/cockpit/orders');
});

test('Legacy commerce contexts map to functional parents without changing routes',()=>{
 const expected={
 '/cockpit/commerce/ad-intelligence':'/cockpit/eyes', '/cockpit/commerce/ads':'/cockpit/listings',
 '/cockpit/commerce/automation':'/cockpit/system', '/cockpit/commerce/factory':'/cockpit/products',
 '/cockpit/commerce/intelligence':'/cockpit/eyes', '/cockpit/commerce/launch':'/cockpit/listings',
 '/cockpit/commerce/marketing':'/cockpit/listings', '/cockpit/commerce/marketplace':'/cockpit/listings',
 '/cockpit/commerce/operating':'/cockpit/ceo', '/cockpit/commerce/store':'/cockpit/listings',
 '/cockpit/commerce/workspace':'/cockpit/products', '/cockpit/commerce/workspace/actual-id':'/cockpit/products',
 '/cockpit/commerce':'/cockpit/ceo', '/cockpit/operations/automation':'/cockpit/system',
 '/cockpit/approvals':'/cockpit/products'};
 for(const [path,parent] of Object.entries(expected))assert.equal(ownerNavigationParent(path),parent);
});
