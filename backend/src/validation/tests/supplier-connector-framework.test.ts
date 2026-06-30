import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  createInMemorySupplierConnectorFrameworkRepository,
  createSupplierConnectorFrameworkModule,
  prepareAllSupplierConnectors,
  prepareSupplierConnector,
  SUPPLIER_ADAPTER_TEMPLATES,
  SUPPLIER_PLATFORMS,
} from "../../suppliers/supplier-connector-framework/index.js";

const WORKSPACE_ID = "ws-m066";

describe("Mission 066 Real Supplier Connector Framework", () => {
  it("prepares a supplier connector with required output fields", async () => {
    const module = createSupplierConnectorFrameworkModule();
    const record = await module.persistConnector(WORKSPACE_ID, {
      platform: "CJ_DROPSHIPPING",
    });

    assert.ok(record.recordId);
    assert.equal(record.supplierConnector.platform, "CJ_DROPSHIPPING");
    assert.equal(record.supplierConnector.connectorId, "cj-dropshipping");
    assert.equal(record.supplierConnector.integrationMode, "SANDBOX");
    assert.ok(record.supplierCapabilities.length >= 5);
    assert.equal(record.syncMetadata.syncMode, "SANDBOX");
    assert.equal(record.syncMetadata.orderingEnabled, false);
    assert.ok(record.confidence >= 70);
    assert.ok(record.signals.some((signal) => signal.signalType === "connector_composite"));
  });

  it("prepares all target supplier platforms", () => {
    const records = prepareAllSupplierConnectors();

    assert.equal(records.length, SUPPLIER_PLATFORMS.length);
    for (const platform of SUPPLIER_PLATFORMS) {
      assert.ok(records.some((record) => record.supplierConnector.platform === platform));
    }
  });

  it("declares supplier capabilities with order placement disabled", () => {
    for (const template of SUPPLIER_ADAPTER_TEMPLATES) {
      const record = prepareSupplierConnector({ platform: template.platform });
      const orderPlacement = record.supplierCapabilities.find(
        (capability) => capability.kind === "ORDER_PLACEMENT",
      );

      assert.ok(orderPlacement);
      assert.equal(orderPlacement!.enabled, false);
      assert.equal(orderPlacement!.liveModeSupported, false);
      assert.ok(
        record.supplierCapabilities.some(
          (capability) => capability.kind === "CATALOG_SYNC" && capability.enabled,
        ),
      );
    }
  });

  it("initializes supplier health and sync metadata for stub integration mode", () => {
    const record = prepareSupplierConnector({ platform: "ALIEXPRESS" });

    assert.equal(record.supplierHealth.healthState, "UNKNOWN");
    assert.equal(record.supplierHealth.credentialsConfigured, false);
    assert.equal(record.supplierHealth.apiReachable, false);
    assert.equal(record.supplierConnector.integrationMode, "STUB");
    assert.equal(record.syncMetadata.recordsSynced, 0);
    assert.match(record.syncMetadata.notes, /No live ordering enabled/);
  });

  it("marks connector configured when credentials are supplied", () => {
    const record = prepareSupplierConnector({
      platform: "ZENDROP",
      credentialsConfigured: true,
    });

    assert.equal(record.supplierConnector.status, "CONFIGURED");
    assert.equal(record.supplierHealth.healthState, "READY");
    assert.equal(record.supplierHealth.credentialsConfigured, true);
    assert.ok(record.supplierConnector.credentialsRequired.includes("ZENDROP_API_KEY"));
  });

  it("exposes platform-specific API endpoints and credential requirements", () => {
    const autods = prepareSupplierConnector({ platform: "AUTODS" });

    assert.equal(autods.supplierConnector.displayName, "AutoDS");
    assert.match(autods.supplierConnector.apiBaseUrl, /autods\.com/);
    assert.ok(autods.supplierConnector.credentialsRequired.includes("AUTODS_API_TOKEN"));
    assert.ok(autods.supplierConnector.documentationUrl.startsWith("https://"));
  });

  it("persists supplier connector records in the repository", async () => {
    const repository = createInMemorySupplierConnectorFrameworkRepository();
    const module = createSupplierConnectorFrameworkModule(repository);

    const saved = await module.persistConnector(WORKSPACE_ID, { platform: "AUTODS" });
    const loadedByPlatform = await module.getConnectorByPlatform(WORKSPACE_ID, "AUTODS");
    const loadedById = await module.getConnectorRecord(WORKSPACE_ID, saved.recordId);

    assert.ok(loadedByPlatform);
    assert.ok(loadedById);
    assert.equal(loadedByPlatform!.supplierConnector.connectorId, "autods");
    assert.equal(
      loadedById!.supplierCapabilities.length,
      saved.supplierCapabilities.length,
    );

    const listed = await repository.list({
      workspaceId: WORKSPACE_ID,
      connectorId: "autods",
    });
    assert.equal(listed.length, 1);
  });
});
