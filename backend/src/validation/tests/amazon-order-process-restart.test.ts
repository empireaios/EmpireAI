import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { closeDatabase, getDatabase } from "../../brain/database.js";
import { ConnectorConnectionRepository } from "../../connectors/connection-repository.js";
import { getCredentialVaultRepository } from "../../orchestration/reality-integration/repositories/sqlite-credential-vault-repository.js";
import { getAmazonOrderImportStatus, listImportedAmazonOrders } from "../../orchestration/reality-integration/live-commerce/adapters/amazon-order-import.js";
import { setHttpTransportOverride } from "../../orchestration/reality-integration/live-commerce/http-transport.js";
import { continueOneAmazonOrderImport } from "../../orchestration/reality-integration/live-commerce/services/amazon-order-continuation.js";
import { runLiveCommerceSync } from "../../orchestration/reality-integration/live-commerce/services/live-commerce-integration-service.js";

const ws = "process-restart-offline-proof";
function order(status: string) {
  return {
    orderId: "112-2222222-3333333",
    salesChannel: { marketplaceId: "ATVPDKIKX0DER" },
    createdTime: "2026-09-20T00:00:00Z",
    lastUpdatedTime: status === "Shipped" ? "2026-09-22T00:00:00Z" : "2026-09-21T00:00:00Z",
    fulfillment: { fulfillmentStatus: status, fulfilledBy: "MERCHANT" },
    orderItems: [{ orderItemId: "offline-item", quantityOrdered: 1,
      product: { sellerSku: "offline-sku" } }],
    buyer: { buyerEmail: "process-proof-should-not-save@example.test" },
  };
}
async function child(stage: string): Promise<void> {
  assert.equal(process.env.LIVE_COMMERCE_INTEGRATION_MODE, "production");
  try {
    if (stage === "seed") {
      const vault = getCredentialVaultRepository().storeCredential({
        workspaceId: ws, providerId: "amazon-us", credentialType: "oauth",
        secretPayload: { accessToken: "offline-process-token" },
      });
      new ConnectorConnectionRepository().upsert({
        workspaceId: ws, connectorId: "amazon-us", category: "commerce",
        status: "connected", credentialsRef: vault.credentialsRef,
      });
      setHttpTransportOverride(async request => {
        assert.equal(request.headers?.["x-amz-access-token"], "offline-process-token");
        return { status: 200, ok: true, json: {
          orders: [order("Unshipped")], pagination: { nextToken: "private-process-token" },
        }, latencyMs: 1 };
      });
      const job = await runLiveCommerceSync({
        workspaceId: ws, providerId: "amazon-us", syncType: "orders",
      });
      assert.equal(job.status, "queued");
      await getDatabase().requestCriticalPersist();
    } else if (stage === "resume") {
      assert.equal(getAmazonOrderImportStatus(ws)?.status, "pending");
      getDatabase().prepare(`
        UPDATE amazon_order_request_gate SET next_allowed_at = @past
        WHERE workspace_id = @workspaceId AND provider_id = 'amazon-us'
      `).run({ past: "2000-01-01T00:00:00Z", workspaceId: ws });
      await getDatabase().requestCriticalPersist(); // Simulated passage of rate interval.
      setHttpTransportOverride(async request => {
        assert.equal(request.headers?.["x-amz-access-token"], "offline-process-token");
        assert.equal(new URL(request.url).searchParams.get("paginationToken"), "private-process-token");
        return { status: 200, ok: true, json: { orders: [order("Shipped")] }, latencyMs: 1 };
      });
      assert.equal(await continueOneAmazonOrderImport(), "completed");
      await getDatabase().requestCriticalPersist();
    } else {
      assert.equal(getAmazonOrderImportStatus(ws)?.status, "completed");
      const snapshots = listImportedAmazonOrders(ws);
      assert.equal(snapshots.length, 1);
      assert.equal(snapshots[0]?.fulfillmentStatus, "Shipped");
      assert.doesNotMatch(JSON.stringify(snapshots), /process-proof-should-not-save/);
    }
    const state = getAmazonOrderImportStatus(ws);
    process.stdout.write(`__RECEIPT__${JSON.stringify({ stage, status: state?.status })}\n`);
  } finally {
    closeDatabase();
  }
}
const stage = process.argv[2];
if (stage === "seed" || stage === "resume" || stage === "verify") {
  await child(stage);
} else {
  test("independent Node processes resume a durable Amazon cursor and verify sanitized result", () => {
    const dir = mkdtempSync(join(tmpdir(), "amazon-process-proof-"));
    try {
      const childEnv = {
        ...process.env, DATABASE_PATH: join(dir, "brain.db"),
        LIVE_COMMERCE_INTEGRATION_MODE: "production",
        EMPIRE_ENGINEERING_TEST_MODE: "true",
      };
      const path = fileURLToPath(import.meta.url);
      for (const phase of ["seed", "resume", "verify"]) {
        const raw = execFileSync(process.execPath, ["--import", "tsx", path, phase], {
          cwd: process.cwd(), env: childEnv, timeout: 30_000, maxBuffer: 1024 * 1024,
        }).toString();
        const match = raw.match(/__RECEIPT__(\{[^\n]+\})/);
        assert.ok(match, `Missing child receipt for ${phase}`);
        assert.equal(JSON.parse(match[1]!).status, phase === "seed" ? "pending" : "completed");
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
}
