import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {ReadAcquirer} from './acquisition.js';
import {IntelligenceStore} from './store.js';
import {digest} from './model.js';

test('catalog acquisition preserves bounded per-ASIN rank and measurements through durable store, without granting demand or matches', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'catalog-facts-'));
  const keys = ['AMAZON_SP_API_CLIENT_ID', 'AMAZON_SP_API_CLIENT_SECRET', 'AMAZON_SP_API_REFRESH_TOKEN'];
  const old = keys.map(key => process.env[key]);
  keys.forEach(key => { process.env[key] = 'synthetic-secret-for-offline-test'; });
  const market = 'ATVPDKIKX0DER';
  const payload = {numberOfResults: 2, items: [
    {asin: 'B0HGNRNC8M', summaries: [{marketplaceId: market, itemName: 'Selected candidate'}], salesRanks: [{marketplaceId: market, classificationRanks: [], displayGroupRanks: []}], dimensions: []},
    {asin: 'B0FJ7DRVWM', summaries: [{marketplaceId: market, itemName: 'Other product'}],
      salesRanks: [{marketplaceId: market, classificationRanks: [
        {classificationId: '2522048011', title: 'Cases', rank: 123, link: 'https://example.invalid/?secret=synthetic-secret-for-offline-test', extra: 'not permitted'},
        {classificationId: 'invalid', title: 'Unknown', rank: -1},
        {classificationId: 'fraction', title: 'Unknown', rank: 1.5},
        {classificationId: 'secret', title: 'synthetic-secret-for-offline-test', rank: 12}],
        displayGroupRanks: [{websiteDisplayGroup: 'toy_display_on_website', title: 'Toys & Games', rank: 456}]},
        {marketplaceId: 'WRONG_MARKET', classificationRanks: [{classificationId: 'wrong', title: 'Other market', rank: 1}]}],
      dimensions: [{marketplaceId: market, item: {height: {unit: 'inches', value: 3.3, extra: 'omit'}, width: {unit: 'centimeters', value: 10.5}, length: {unit: 'unknown', value: 4}, weight: {unit: 'grams', value: -1}}, package: {weight: {unit: 'grams', value: 171}}}],
      token: 'synthetic-secret-for-offline-test'}]};
  try {
    const store = new IntelligenceStore(path.join(dir, 'i.sqlite'));
    store.enqueue('test', 'OFFLINE_TEST', {id: 'catalog', objective: 'Offline observed-shape catalog regression', capabilities: ['amazon.catalog'], subject: {id: 'research', marketplace: 'US', query: 'card box'}, requestLimit: 2});
    const job = store.claim('test', 'catalog')!;
    let calls = 0;
    const acquire = new ReadAcquirer(store, async url => {
      calls++;
      if (String(url) === 'https://api.amazon.com/auth/o2/token') return Response.json({access_token: 'synthetic-access', expires_in: 3600});
      assert.equal(new URL(String(url)).pathname, '/catalog/2022-04-01/items');
      return Response.json(payload);
    });
    const evidence = await acquire.acquire('test', job, 'amazon.catalog');
    store.evidence('test', evidence);
    const reopened = new IntelligenceStore(store.filename).get('test', 'evidence', evidence.id)!;
    assert.equal(calls, 2);
    assert.equal(reopened.digest, digest(reopened.facts));
    const items = reopened.facts.response.items;
    assert.deepEqual(items[0].salesRanks[0].classificationRanks, []);
    assert.deepEqual(items[1].salesRanks, [{marketplaceId: market, classificationRanks: [{classificationId: '2522048011', title: 'Cases', rank: 123}], displayGroupRanks: [{websiteDisplayGroup: 'toy_display_on_website', title: 'Toys & Games', rank: 456}]}]);
    assert.deepEqual(items[1].dimensions, [{marketplaceId: market, item: {height: {unit: 'inches', value: 3.3}, width: {unit: 'centimeters', value: 10.5}}, package: {weight: {unit: 'grams', value: 171}}}]);
    assert.equal(items[1].token, undefined);
    assert.ok(!JSON.stringify(reopened).includes('synthetic-secret-for-offline-test'));
    assert.equal(reopened.grantsAuthority, false);
    assert.match(reopened.facts.interpretation, /not unit demand/);
    assert.equal(reopened.facts.unitSales, undefined);
    assert.equal(reopened.facts.verifiedCandidateMatch, undefined);
  } finally {
    keys.forEach((key, i) => { if (old[i] === undefined) delete process.env[key]; else process.env[key] = old[i]; });
    fs.rmSync(dir, {recursive: true, force: true});
  }
});
