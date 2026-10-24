import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {projectWork8ComparableContext} from '../../runtime/commerce-runtime/governed/work8-comparable-context.js';
import {digest, type Evidence} from '../../intelligence/model.js';
const at = Date.parse('2026-10-12T17:12:00Z');
const retained = (): Evidence[] => JSON.parse(fs.readFileSync(new URL('../fixtures/work8-o9-genuine.json', import.meta.url), 'utf8'));
const project = (records = retained(), now = at, workspace = 'ws_empire_1') => projectWork8ComparableContext((ws, id) => ws === 'ws_empire_1' ? records.find(record => record.id === id) ?? null : null, workspace, records.map(record => record.id), now);

test('genuine retained card-box sources yield only an attributable functional comparator with unknown demand', () => {
  const result = project();
  assert.equal(result.comparisons.length, 1);
  const comparison = result.comparisons[0]!;
  assert.equal(comparison.supplier.productId, '2610111119571636000');
  assert.equal(comparison.marketplace.asin, 'B0HGNRNC8M');
  assert.equal(comparison.marketplace.price, 14);
  assert.equal(comparison.marketplace.currency, 'USD');
  assert.equal(comparison.supplier.freshness, 'HISTORICAL');
  assert.equal(comparison.marketplace.freshness, 'FRESH');
  assert.equal(comparison.marketplace.observedAt, '2026-10-12T17:02:48.797Z');
  assert.equal(comparison.supplier.source.evidenceId, 'ev_322d5bba8afed3b6e979f2951ded24c43190698b');
  assert.equal(comparison.marketplace.source.offerEvidenceId, 'ev_5a16ad30c77d6155567f2fb91f76e43e679e3434');
  assert.match(comparison.marketplace.title, /4\.1 X 3\.3 X \.1in/);
  assert.ok(comparison.supplier.observedVariants.some(variant => variant.title?.includes('10.5x9x8cm')));
  assert.equal(comparison.classification, 'FUNCTIONAL_COMPARABLE_ONLY');
  assert.equal(comparison.exactMatch, false);
  assert.equal(comparison.demand.status, 'UNKNOWN');
  assert.equal(comparison.demand.unitSales, null);
  assert.equal(comparison.screening, 'DEFERRED_FOR_EVIDENCE');
  assert.ok(comparison.screeningReasons.includes('SUPPLIER_OBSERVATION_HISTORICAL'));
  assert.ok(result.observedCandidates.products.some(product => product.productId === '2610120908411602000'));
  assert.ok(!result.comparisons.some(value => value.supplier.productId === '2610120908411602000'));
  assert.equal(result.qualified, 0);
  assert.equal(result.grantsAuthority, false);
});

test('untrusted or missing sources, wrong workspace and expired context never imply comparison qualification', () => {
  assert.equal(project(retained(), at, 'ws_foreign').comparisons.length, 0);
  assert.equal(project(retained().filter(record => record.provider !== 'CJ')).comparisons.length, 0);
  for (const mutate of [(record: Evidence) => {record.digest = 'tampered';}, (record: Evidence) => {record.authenticity = 'SYNTHETIC';}, (record: Evidence) => {record.subject.id = 'wrong-product';}]) {
    const records = retained();mutate(records[0]!);
    assert.equal(project(records).comparisons.length, 0);
  }
  const wrongOffer = retained();const offer = wrongOffer.find(record => record.capabilityId === 'amazon.offers')!;
  (offer.facts.response as any).payload.Identifier.ASIN = 'B000000000';offer.digest = digest(offer.facts);
  assert.equal(project(wrongOffer).comparisons.length, 0);
  const historical = project(retained(), Date.parse('2026-10-13T02:00:00Z')).comparisons[0]!;
  assert.equal(historical.marketplace.freshness, 'HISTORICAL');
  assert.ok(historical.screeningReasons.includes('MARKET_OBSERVATION_HISTORICAL'));
  assert.equal(historical.exactMatch, false);
});
