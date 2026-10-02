import assert from "node:assert/strict";
import test from "node:test";
import {
  validateAmazonOfferInput, validateAmazonCatalogIdentity, buildVerifiedAmazonOfferBody,
  validateAmazonSubmissionReceipt, type AmazonSubmissionBinding,
} from "../../runtime/marketplace-publishing/services/amazon-listing-proof.js";
import type { MarketplaceListingPackage } from "../../runtime/marketplace-publishing/models/marketplace-adapter.js";

const marketplace = "ATVPDKIKX0DER";
function fixture(): MarketplaceListingPackage {
  return {
    packageId: "offline-package", workspaceId: "offline-workspace", companyId: "offline-company",
    productId: "offline-product", marketplaceId: "amazon-us", title: "Matching title cannot establish identity",
    description: "Offline proof contract fixture", bulletPoints: [], images: [], price: 12.34, currency: "USD",
    specifications: { asin: "B000000000", sku: "offline-sku", quantity: "3", productIdentifierType: "UPC", productIdentifier: "012345678905" },
    status: "PUBLISH_BLOCKED", governanceApproved: false, kingApproved: false,
    blockers: ["Offline fixture"], computedAt: "2026-09-21T00:00:00.000Z",
  };
}
const offer = validateAmazonOfferInput(fixture()).offer!;
const binding: AmazonSubmissionBinding = { sellerId: "offline-seller", sku: offer.sku, marketplaceId: marketplace, asin: offer.asin };
function catalog() { return { asin: offer.asin, identifiers: [{ marketplaceId: marketplace, identifiers: [{ identifierType: "UPC", identifier: "012345678905" }] }] }; }
function acknowledgement() { return { sku: offer.sku, status: "ACCEPTED", submissionId: "offline-submission-receipt-1", issues: [] }; }
function receipt(json: unknown, status = 200, context = binding) {
  return validateAmazonSubmissionReceipt({ ok: status >= 200 && status < 300, status, json }, context);
}

test("known zero stock stays zero; unknown, fractional and nondecimal stock cannot become inventory", () => {
  const pkg = fixture(); pkg.specifications.quantity = "0";
  const valid = validateAmazonOfferInput(pkg); assert.ok(valid.offer);
  const body = buildVerifiedAmazonOfferBody(valid.offer, marketplace) as { attributes: { fulfillment_availability: Array<{ quantity: number }> } };
  assert.equal(body.attributes.fulfillment_availability[0]?.quantity, 0);
  for (const quantity of [undefined, "", " ", "unknown", "NaN", "-1", "1.5", "1e2", "0x10", "Infinity", "9007199254740992"]) {
    const pkg = fixture();
    if (quantity === undefined) delete pkg.specifications.quantity; else pkg.specifications.quantity = quantity;
    assert.equal(validateAmazonOfferInput(pkg).offer, null, String(quantity));
  }
});

test("title-only identity, malformed or conflicting ASINs and missing SKU are blocked", () => {
  for (const change of [
    (pkg: MarketplaceListingPackage) => { delete pkg.specifications.asin; },
    (pkg: MarketplaceListingPackage) => { pkg.specifications.asin = "incorrect"; },
    (pkg: MarketplaceListingPackage) => { pkg.specifications.ASIN = "B111111111"; },
    (pkg: MarketplaceListingPackage) => { pkg.specifications.sku = ""; },
  ]) { const pkg = fixture(); change(pkg); assert.equal(validateAmazonOfferInput(pkg).offer, null); }
});

test("price and currency remain explicit; new catalog creation is not assumed supported", () => {
  for (const price of [NaN, Infinity, -1, 0]) { const pkg = fixture(); pkg.price = price; assert.equal(validateAmazonOfferInput(pkg).offer, null); }
  for (const currency of ["", "unknown", "usd"]) { const pkg = fixture(); pkg.currency = currency; assert.equal(validateAmazonOfferInput(pkg).offer, null); }
  const pkg = fixture(); pkg.specifications.requirements = "LISTING"; assert.equal(validateAmazonOfferInput(pkg).offer, null);
  const body = buildVerifiedAmazonOfferBody(offer, marketplace) as { attributes: { purchasable_offer: Array<{ currency: string; our_price: Array<{ schedule: Array<{ value_with_tax: number }> }> }> } };
  assert.equal(body.attributes.purchasable_offer[0]?.currency, "USD");
  assert.equal(body.attributes.purchasable_offer[0]?.our_price[0]?.schedule[0]?.value_with_tax, 12.34);
});

test("a supplier product identifier with known format is necessary for catalog comparison", () => {
  for (const [type, value] of [["", ""], ["TITLE", "Same item"], ["UPC", "01234567890"], ["UPC", "01234567890X"], ["EAN", "012345678905"]]) {
    const pkg = fixture(); pkg.specifications.productIdentifierType = type!; pkg.specifications.productIdentifier = value!;
    assert.equal(validateAmazonOfferInput(pkg).offer, null);
  }
});

test("catalog evidence must bind exact ASIN, marketplace and supplier identifier", () => {
  assert.deepEqual(validateAmazonCatalogIdentity(catalog(), offer, marketplace), []);
  const bad: unknown[] = [null, [], {}, { ...catalog(), asin: "B111111111" }, { asin: offer.asin },
    { asin: offer.asin, identifiers: [{ marketplaceId: "wrong", identifiers: catalog().identifiers[0]!.identifiers }] },
    { asin: offer.asin, identifiers: [catalog().identifiers[0], catalog().identifiers[0]] },
    { asin: offer.asin, identifiers: [{ marketplaceId: marketplace, identifiers: [null, ...catalog().identifiers[0]!.identifiers] }] }];
  for (const payload of bad) assert.ok(validateAmazonCatalogIdentity(payload, offer, marketplace).length > 0);
});

test("a matching title never overrides a different product identifier or identifier type", () => {
  for (const identifier of [{ identifierType: "UPC", identifier: "111111111111" }, { identifierType: "EAN", identifier: "012345678905" }]) {
    const payload = { asin: offer.asin, title: fixture().title, identifiers: [{ marketplaceId: marketplace, identifiers: [identifier] }] };
    assert.ok(validateAmazonCatalogIdentity(payload, offer, marketplace).length > 0);
  }
});

test("a documented acknowledgement proves processing admission only, never listing availability", () => {
  const result = receipt(acknowledgement());
  assert.equal(result.accepted, true); assert.equal(result.listingVerified, false); assert.deepEqual(result.binding, binding);
  const { issues: _issues, ...withoutOptionalIssues } = acknowledgement();
  assert.equal(receipt(withoutOptionalIssues).accepted, true);
});

test("empty or unexpected provider responses, preview success and other HTTP statuses fail closed", () => {
  for (const payload of [null, [], {}, ...[undefined, null, "VALID", "INVALID", "SUCCESS"].map(status => ({ ...acknowledgement(), status })),
    ...[undefined, "other-sku"].map(sku => ({ ...acknowledgement(), sku })),
    ...[undefined, "", " ", "receipt\nforged"].map(submissionId => ({ ...acknowledgement(), submissionId }))]) {
    assert.equal(receipt(payload).accepted, false, JSON.stringify(payload));
  }
  for (const status of [201, 202, 204, 400, 429, 500]) assert.equal(receipt(acknowledgement(), status).accepted, false, String(status));
});

test("contradictory identity and malformed or error issue evidence cannot be accepted", () => {
  const bad = [
    ...[null, {}, [null], [{ code: "BAD", message: "Rejected", severity: "ERROR" }], [{ code: "ODD", message: "Unknown", severity: "SUCCESS" }], [{ code: "REJECTED", message: "Cannot list", severity: ["ERROR"] }]].map(issues => ({ ...acknowledgement(), issues })),
    { ...acknowledgement(), errors: [{ code: "error" }] }, { ...acknowledgement(), sellerId: "different" },
    { ...acknowledgement(), marketplaceId: "different" },
    { ...acknowledgement(), identifiers: [{ marketplaceId: marketplace, asin: "B111111111" }] },
    { ...acknowledgement(), identifiers: [{ marketplaceId: "different", asin: offer.asin }] },
  ];
  for (const payload of bad) assert.equal(receipt(payload).accepted, false, JSON.stringify(payload));
  const warning = receipt({ ...acknowledgement(), issues: [{ code: "WARNING", message: "Review required", severity: "WARNING" }] });
  assert.equal(warning.accepted, true); assert.equal(warning.listingVerified, false);
});

test("missing exact seller, SKU, marketplace or ASIN request binding cannot produce a receipt", () => {
  for (const key of Object.keys(binding) as Array<keyof AmazonSubmissionBinding>) {
    const result = receipt(acknowledgement(), 200, { ...binding, [key]: "" });
    assert.equal(result.accepted, false); assert.equal(result.binding, null);
  }
});
