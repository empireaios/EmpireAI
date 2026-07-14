import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  DERIVED_DISCOVERY_SNAPSHOT,
  FOUNDATION_WIRED_REGISTRY_IDS,
  REG_CHANNEL,
  REG_COUNTRY,
  REG_DOCTRINE,
  REG_MARKETPLACE,
  RegistryLoader,
  RegistryValidationError,
  buildMarketIntelligenceDiscoveryView,
  getRegistryLoader,
  resetRegistryLoaderForTests,
  type DiscoverySnapshotView,
} from "../../registry/index.js";
import {
  buildIntelligenceMarketDiscoverySnapshot,
  resolveDiscoverySnapshot,
  resolveMarketIntelligenceDiscoverySnapshot,
} from "../../intelligence/shared/intelligence-market-discovery.js";
import { configureValidationEnvironment } from "../harness.js";

configureValidationEnvironment();

describe("EA-003 — RegistryLoader foundation", () => {
  it("exposes foundation status for wired vs placeholder registries", () => {
    const loader = getRegistryLoader();
    const status = loader.listFoundationStatus();
    assert.ok(status.length >= 20);
    const wired = status.filter((s) => s.wired).map((s) => s.registryId);
    for (const id of FOUNDATION_WIRED_REGISTRY_IDS) {
      assert.ok(wired.includes(id), `expected wired registry ${id}`);
    }
    const discovery = status.find((s) => s.registryId === DERIVED_DISCOVERY_SNAPSHOT);
    assert.ok(discovery?.wired);
  });

  it("resolves constitutional REG-DOCTRINE rows", () => {
    const result = getRegistryLoader().resolve({}, REG_DOCTRINE);
    assert.ok(result.rows.length >= 25);
    assert.equal(result.meta.wired, true);
    assert.equal(result.meta.tier, "constitutional");
  });

  it("resolves platform catalog registries with query filters", () => {
    const countries = getRegistryLoader().resolve({}, REG_COUNTRY);
    assert.ok(countries.rows.length >= 15);

    const sg = getRegistryLoader().resolve({}, REG_COUNTRY, { countryCode: "SG" });
    assert.equal(sg.rows.length, 1);

    const usMarketplaces = getRegistryLoader().resolve({}, REG_MARKETPLACE, { countryCode: "US" });
    const ids = (usMarketplaces.rows as Array<{ id: string }>).map((r) => r.id);
    assert.ok(ids.includes("mkt-foundation-primary-channel"));
    assert.ok(ids.includes("mkt-foundation-secondary-channel"));
    assert.equal(usMarketplaces.meta.version, "g2-01-v1");
  });

  it("resolves deployment REG-CHANNEL rows", () => {
    const channels = getRegistryLoader().resolve({}, REG_CHANNEL);
    const ids = (channels.rows as Array<{ registryId: string }>).map((r) => r.registryId);
    assert.ok(ids.includes("amazon-us"));
    assert.ok(ids.includes("cj-dropshipping"));
    assert.equal(channels.meta.tier, "deployment");
  });

  it("returns placeholder notice for unwired policy registry", () => {
    const result = getRegistryLoader().resolve({}, "REG-SCORING-POLICY");
    assert.equal(result.meta.wired, false);
    assert.ok(result.rows.length >= 1);
    const notice = result.rows[0] as { status: string };
    assert.equal(notice.status, "placeholder");
  });

  it("requires workspaceId for REG-PRODUCT placeholder", () => {
    assert.throws(
      () => getRegistryLoader().resolve({}, "REG-PRODUCT"),
      RegistryValidationError,
    );
  });

  it("builds DERIVED-DISCOVERY-SNAPSHOT view", () => {
    const { view, meta } = getRegistryLoader().resolveDerivedView<DiscoverySnapshotView>(
      {},
      DERIVED_DISCOVERY_SNAPSHOT,
    );
    assert.equal(meta.wired, true);
    assert.equal(view.registrySource, "RegistryLoader:DERIVED-DISCOVERY-SNAPSHOT");
    assert.ok(view.countries.length >= 10);
    assert.ok(view.intelligenceSources.length >= 5);
    assert.ok(view.expansionMarketplaces.some((p) => p.providerId === "lazada-sg"));
  });

  it("caches derived discovery snapshots within TTL", () => {
    resetRegistryLoaderForTests();
    const loader = new RegistryLoader();
    const first = loader.resolveDerivedView({}, DERIVED_DISCOVERY_SNAPSHOT);
    const second = loader.resolveDerivedView({}, DERIVED_DISCOVERY_SNAPSHOT);
    assert.equal(first.meta.contentHash, second.meta.contentHash);
    assert.equal(first.meta.loadedAt, second.meta.loadedAt);
  });

  it("accepts plugin manifest registration as placeholder", () => {
    resetRegistryLoaderForTests();
    const loader = getRegistryLoader();
    const result = loader.registerPlugin({
      pluginId: "test-marketplace-plugin",
      kind: "marketplace",
      targetRegistryId: REG_MARKETPLACE,
      tier: "platform_catalog",
      version: "0.0.1",
      description: "EA-003 placeholder plugin",
      extensions: {},
    });
    assert.equal(result.accepted, true);
    assert.equal(loader.listRegisteredPlugins().length, 1);
  });

  it("G3-02 entry uses RegistryLoader market intelligence discovery view", () => {
    const g302 = buildMarketIntelligenceDiscoveryView({});
    const pie = resolveMarketIntelligenceDiscoverySnapshot();
    assert.deepEqual(
      g302.intelligenceSources.map((s) => s.id),
      pie.intelligenceSources.map((s) => s.id),
    );
  });
});

describe("EA-003 — Proof consumer (PIE market discovery via RegistryLoader)", () => {
  it("intelligence-market-discovery delegates to RegistryLoader", () => {
    const snapshot = buildIntelligenceMarketDiscoverySnapshot();
    assert.equal(snapshot.registrySource, "RegistryLoader:DERIVED-DISCOVERY-SNAPSHOT");
    assert.ok(snapshot.deploymentChannels.some((c) => c.registryId === "shopee-sg"));
  });

  it("resolveDiscoverySnapshot accepts deployment context", () => {
    const snapshot = resolveDiscoverySnapshot({ deploymentProfileId: "v1-production" });
    assert.equal(snapshot.deploymentProfileId, "v1-production");
  });
});
