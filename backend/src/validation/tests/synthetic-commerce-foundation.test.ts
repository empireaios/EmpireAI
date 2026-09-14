/**
 * Synthetic Amazon US Commerce Foundation V1 — node:test
 * Proves ledger reconciliation math and mandatory synthetic flag.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  COST_CENTRE_KINDS,
  ELIGIBILITY_HARD_STOPS,
  SyntheticLedgerError,
  assertLedgerHasNoLiveFields,
  computeProfitLedger,
  computeUnitEconomics,
  evaluateEligibilityRiskFilter,
  moneyRound,
  realisedNetProfitFromLines,
  seedSyntheticAmazonUsCatalog,
  type TrueProfitLedgerEntry,
} from "../../orchestration/synthetic-commerce/index.js";

describe("synthetic-commerce-foundation — TrueProfitLedger", () => {
  it("reconciles realisedNetProfit exactly across multi-line entries", () => {
    const entries: TrueProfitLedgerEntry[] = [
      {
        entryId: "e1",
        synthetic: true,
        currency: "USD",
        revenue: 100,
        productCost: 20,
        shipping: 10,
        fees: 15,
        ads: 5,
        refunds: 0,
        returns: 0,
        opex: 0,
      },
      {
        entryId: "e2",
        synthetic: true,
        currency: "USD",
        revenue: 50.5,
        productCost: 8.25,
        shipping: 4.1,
        fees: 7.55,
        ads: 2.0,
        refunds: 10,
        returns: 3.5,
        opex: 1.25,
      },
    ];

    const ledger = computeProfitLedger(entries, { ledgerId: "test-ledger" });
    assert.equal(ledger.synthetic, true);
    assert.equal(ledger.currency, "USD");
    assert.equal(ledger.entries.length, 2);

    const expectedRevenue = moneyRound(100 + 50.5);
    const expectedProductCost = moneyRound(20 + 8.25);
    const expectedShipping = moneyRound(10 + 4.1);
    const expectedFees = moneyRound(15 + 7.55);
    const expectedAds = moneyRound(5 + 2);
    const expectedRefunds = moneyRound(0 + 10);
    const expectedReturns = moneyRound(0 + 3.5);
    const expectedOpex = moneyRound(0 + 1.25);
    const expectedNet = realisedNetProfitFromLines({
      revenue: expectedRevenue,
      productCost: expectedProductCost,
      shipping: expectedShipping,
      fees: expectedFees,
      ads: expectedAds,
      refunds: expectedRefunds,
      returns: expectedReturns,
      opex: expectedOpex,
    });

    assert.equal(ledger.totals.revenue, expectedRevenue);
    assert.equal(ledger.totals.productCost, expectedProductCost);
    assert.equal(ledger.totals.shipping, expectedShipping);
    assert.equal(ledger.totals.fees, expectedFees);
    assert.equal(ledger.totals.ads, expectedAds);
    assert.equal(ledger.totals.refunds, expectedRefunds);
    assert.equal(ledger.totals.returns, expectedReturns);
    assert.equal(ledger.totals.opex, expectedOpex);
    assert.equal(ledger.totals.realisedNetProfit, expectedNet);
    assert.equal(
      ledger.totals.realisedNetProfit,
      moneyRound(
        expectedRevenue -
          expectedProductCost -
          expectedShipping -
          expectedFees -
          expectedAds -
          expectedRefunds -
          expectedReturns -
          expectedOpex,
      ),
    );

    assertLedgerHasNoLiveFields(ledger);
    assert.equal("liveSales" in ledger, false);
    assert.equal("realisedLiveProfit" in ledger, false);
    assert.equal("liveSales" in ledger.totals, false);
    assert.equal("realisedLiveProfit" in ledger.totals, false);
  });

  it("requires synthetic: true on every ledger entry", () => {
    const bad = [
      {
        entryId: "missing-flag",
        currency: "USD",
        revenue: 10,
        productCost: 1,
        shipping: 1,
        fees: 1,
        ads: 0,
        refunds: 0,
        returns: 0,
        opex: 0,
      },
    ] as unknown as TrueProfitLedgerEntry[];

    assert.throws(
      () => computeProfitLedger(bad),
      (err: unknown) =>
        err instanceof SyntheticLedgerError && err.code === "SYNTHETIC_FLAG_REQUIRED",
    );
  });

  it("rejects synthetic: false", () => {
    const bad = [
      {
        entryId: "false-flag",
        synthetic: false,
        currency: "USD",
        revenue: 10,
        productCost: 1,
        shipping: 1,
        fees: 1,
        ads: 0,
        refunds: 0,
        returns: 0,
        opex: 0,
      },
    ] as unknown as TrueProfitLedgerEntry[];

    assert.throws(
      () => computeProfitLedger(bad),
      (err: unknown) =>
        err instanceof SyntheticLedgerError && err.code === "SYNTHETIC_FLAG_REQUIRED",
    );
  });

  it("forbids liveSales and realisedLiveProfit fields on inputs", () => {
    const withLiveSales = [
      {
        entryId: "live-leak",
        synthetic: true,
        currency: "USD",
        revenue: 10,
        productCost: 1,
        shipping: 1,
        fees: 1,
        ads: 0,
        refunds: 0,
        returns: 0,
        opex: 0,
        liveSales: 999,
      },
    ] as unknown as TrueProfitLedgerEntry[];

    assert.throws(
      () => computeProfitLedger(withLiveSales),
      (err: unknown) =>
        err instanceof SyntheticLedgerError && err.code === "FORBIDDEN_LIVE_FIELD",
    );

    const withLiveProfit = [
      {
        entryId: "live-profit-leak",
        synthetic: true,
        currency: "USD",
        revenue: 10,
        productCost: 1,
        shipping: 1,
        fees: 1,
        ads: 0,
        refunds: 0,
        returns: 0,
        opex: 0,
        realisedLiveProfit: 42,
      },
    ] as unknown as TrueProfitLedgerEntry[];

    assert.throws(
      () => computeProfitLedger(withLiveProfit),
      (err: unknown) =>
        err instanceof SyntheticLedgerError && err.code === "FORBIDDEN_LIVE_FIELD",
    );
  });

  it("refuses mixed currencies without segregation", () => {
    const mixed: TrueProfitLedgerEntry[] = [
      {
        entryId: "usd",
        synthetic: true,
        currency: "USD",
        revenue: 10,
        productCost: 1,
        shipping: 1,
        fees: 1,
        ads: 0,
        refunds: 0,
        returns: 0,
        opex: 0,
      },
      {
        entryId: "sgd",
        synthetic: true,
        currency: "SGD",
        revenue: 0,
        productCost: 0,
        shipping: 0,
        fees: 0,
        ads: 0,
        refunds: 0,
        returns: 0,
        opex: 5,
      },
    ];

    assert.throws(
      () => computeProfitLedger(mixed),
      (err: unknown) => err instanceof SyntheticLedgerError && err.code === "CURRENCY_MIX",
    );
  });
});

describe("synthetic-commerce-foundation — CostCentre / Eligibility / UnitEconomics", () => {
  it("exposes all CostCentre kinds and eligibility hard stops", () => {
    assert.deepEqual([...COST_CENTRE_KINDS], [
      "ai_api",
      "infra",
      "storage",
      "saas",
      "marketplace",
      "other",
    ]);
    assert.deepEqual([...ELIGIBILITY_HARD_STOPS], [
      "policy",
      "ip",
      "approval",
      "stock",
      "quality",
      "delivery",
      "economic",
    ]);
  });

  it("marks ineligible when any hard stop fires", () => {
    const clear = evaluateEligibilityRiskFilter("p1", {
      stockAvailable: true,
      qualityAcceptable: true,
      deliveryAcceptable: true,
      economicsViable: true,
    });
    assert.equal(clear.eligible, true);
    assert.equal(clear.synthetic, true);

    const blocked = evaluateEligibilityRiskFilter("p2", {
      policyBlocked: true,
      stockAvailable: true,
      qualityAcceptable: true,
      deliveryAcceptable: true,
      economicsViable: true,
    });
    assert.equal(blocked.eligible, false);
    assert.equal(blocked.hardStops.policy, true);
    assert.ok(blocked.reasons.some((r) => /policy/i.test(r)));
  });

  it("computes unit economics with synthetic source", () => {
    const ue = computeUnitEconomics({
      productId: "p-ue",
      landedCost: 4.21,
      sellingPrice: 24.21,
      fees: 3.63,
      shipping: 8.3,
      ads: 1.2,
      expectedRefundEffect: 1.21,
      currency: "USD",
    });
    assert.equal(ue.source, "synthetic");
    assert.equal(ue.currency, "USD");
    assert.equal(ue.contributionBeforeAds, moneyRound(24.21 - 4.21 - 3.63 - 8.3));
    assert.equal(ue.contributionAfterAds, moneyRound(ue.contributionBeforeAds - 1.2));
    assert.equal(
      ue.realisedContribution,
      moneyRound(ue.contributionAfterAds - ue.expectedRefundEffect),
    );
  });
});

describe("synthetic-commerce-foundation — seedSyntheticAmazonUsCatalog", () => {
  it("seeds V1 fixtures with USD marketplace lines and labelled SGD opex", () => {
    const catalog = seedSyntheticAmazonUsCatalog();
    assert.equal(catalog.version, "v1");
    assert.equal(catalog.marketplace, "amazon-us");
    assert.equal(catalog.currency, "USD");
    assert.equal(catalog.synthetic, true);

    assert.ok(catalog.suppliers.length >= 1);
    assert.ok(catalog.suppliers.every((s) => s.synthetic === true));
    assert.ok(catalog.suppliers.some((s) => s.apiCapabilities.length > 0));

    assert.ok(catalog.warehouses.length >= 1);
    assert.ok(catalog.products.length >= 2);
    assert.ok(catalog.products.every((p) => p.synthetic === true && p.variants.length >= 1));
    assert.ok(catalog.stock.length >= 1);
    assert.ok(catalog.orders.length >= 1);
    assert.ok(catalog.orders.some((o) => o.cancelled === true));
    assert.ok(catalog.orders.some((o) => o.fulfilmentOutcome === "returned"));

    assert.equal(catalog.costCentres.length, COST_CENTRE_KINDS.length);
    for (const kind of COST_CENTRE_KINDS) {
      assert.ok(catalog.costCentres.some((c) => c.kind === kind));
    }
    assert.ok(catalog.costCentres.some((c) => c.currency === "SGD" && c.sourceLabel === "synthetic"));
    assert.ok(catalog.costCentres.some((c) => c.currency === "USD"));
    assert.ok(catalog.costCentres.every((c) => c.sourceLabel === "verified" || c.sourceLabel === "synthetic"));

    assert.ok(catalog.unitEconomics.every((u) => u.source === "synthetic" && u.currency === "USD"));
    assert.ok(catalog.eligibility.every((e) => e.synthetic === true));
    assert.ok(catalog.eligibility.some((e) => e.eligible === false));

    assert.ok(catalog.ledgerEntries.every((e) => e.synthetic === true && e.currency === "USD"));
    const ledger = computeProfitLedger(catalog.ledgerEntries);
    assert.equal(ledger.synthetic, true);
    assertLedgerHasNoLiveFields(ledger);
    assert.equal(
      ledger.totals.realisedNetProfit,
      realisedNetProfitFromLines(ledger.totals),
    );

    assert.ok(catalog.experiments.every((x) => x.synthetic === true));
    assert.equal(catalog.portfolio.synthetic, true);
    assert.equal(catalog.portfolio.marketplace, "amazon-us");
    assert.ok(catalog.portfolio.candidates.length === catalog.products.length);
    assert.equal(
      catalog.portfolio.totals.candidateCount,
      catalog.portfolio.candidates.length,
    );
  });
});
