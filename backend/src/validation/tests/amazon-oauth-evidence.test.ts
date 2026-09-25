import assert from "node:assert/strict";
import { afterEach, describe, it, mock } from "node:test";

import { getDatabase, resetDatabaseInstance } from "../../brain/database.js";
import {
  amazonOAuthAuthorizeUrl,
  amazonOAuthExchangeCode,
  amazonOAuthRefreshToken,
} from "../../orchestration/reality-integration/live-commerce/adapters/amazon-sp-api-adapter.js";
import { startMarketplaceOAuth } from "../../orchestration/reality-integration/live-commerce/services/oauth-lifecycle-service.js";
import { resetLiveCommerceRepository } from "../../orchestration/reality-integration/live-commerce/repositories/sqlite-live-commerce-repository.js";

const keys = [
  "LIVE_COMMERCE_INTEGRATION_MODE",
  "AMAZON_SP_API_APPLICATION_ID",
  "AMAZON_SP_API_CLIENT_ID",
  "AMAZON_SP_API_CLIENT_SECRET",
  "DATABASE_PATH",
] as const;
const original = Object.fromEntries(keys.map(key => [key, process.env[key]])) as Record<typeof keys[number], string | undefined>;

afterEach(() => {
  mock.restoreAll();
  for (const key of keys) {
    if (original[key] === undefined) delete process.env[key];
    else process.env[key] = original[key];
  }
  resetLiveCommerceRepository();
  resetDatabaseInstance();
});

function configureProduction(): void {
  process.env.LIVE_COMMERCE_INTEGRATION_MODE = "production";
  process.env.AMAZON_SP_API_APPLICATION_ID = "amzn1.sp.solution.offline";
  process.env.AMAZON_SP_API_CLIENT_ID = "offline-client";
  process.env.AMAZON_SP_API_CLIENT_SECRET = "offline-secret";
  process.env.DATABASE_PATH = ":memory:amazon-oauth-evidence";
  resetLiveCommerceRepository();
  resetDatabaseInstance();
}

describe("Amazon seller authorization request contract", () => {
  it("uses application ID and state on consent URL and refuses missing production config before saving state", () => {
    configureProduction();
    const url = new URL(amazonOAuthAuthorizeUrl({
      registryId: "amazon-us", redirectUri: "https://example.test/callback", state: "offline-state",
    }));
    assert.equal(url.host, "sellercentral.amazon.com");
    assert.equal(url.searchParams.get("application_id"), "amzn1.sp.solution.offline");
    assert.equal(url.searchParams.get("state"), "offline-state");
    assert.equal(url.searchParams.has("client_id"), false);
    assert.equal(url.searchParams.has("redirect_uri"), false);

    delete process.env.AMAZON_SP_API_APPLICATION_ID;
    assert.throws(() => startMarketplaceOAuth({
      workspaceId: "ws_oauth_evidence", providerId: "amazon-us",
      redirectUri: "https://example.test/callback",
    }), /application ID is not configured/);
    const row = getDatabase().prepare(
      "SELECT COUNT(*) AS n FROM live_commerce_oauth_states WHERE workspace_id = @workspaceId"
    ).get({ workspaceId: "ws_oauth_evidence" }) as { n: number };
    assert.equal(row.n, 0);
  });

  it("posts the exact form grant and returns only validated tokens", async () => {
    configureProduction();
    let calls = 0;
    mock.method(globalThis, "fetch", async (input: string | URL | Request, init?: RequestInit) => {
      calls++;
      assert.equal(String(input), "https://api.amazon.com/auth/o2/token");
      assert.equal(init?.method, "POST");
      assert.equal(init?.headers && (init.headers as Record<string, string>)["content-type"],
        "application/x-www-form-urlencoded;charset=UTF-8");
      assert.ok(init?.signal);
      const form = new URLSearchParams(String(init?.body));
      assert.deepEqual(Object.fromEntries(form), {
        grant_type: "authorization_code", code: "offline-auth-code",
        redirect_uri: "https://example.test/callback",
        client_id: "offline-client", client_secret: "offline-secret",
      });
      return new Response(JSON.stringify({
        access_token: "offline-access", refresh_token: "offline-refresh",
        token_type: "bearer", expires_in: 3600,
      }), { status: 200, headers: { "content-type": "application/json" } });
    });
    const token = await amazonOAuthExchangeCode({
      registryId: "amazon-us", code: "offline-auth-code", redirectUri: "https://example.test/callback",
    });
    assert.deepEqual(token, {
      accessToken: "offline-access", refreshToken: "offline-refresh",
      tokenType: "bearer", expiresIn: 3600,
    });
    assert.equal(calls, 1);
  });

  it("keeps failed or malformed token replies from authorizing connection and never exposes raw response", async () => {
    configureProduction();
    let calls = 0;
    mock.method(globalThis, "fetch", async () => {
      calls++;
      return new Response(JSON.stringify({ access_token: "SECRET_ONLY", token_type: "bearer", expires_in: 3600 }),
        { status: 200, headers: { "content-type": "application/json" } });
    });
    await assert.rejects(amazonOAuthExchangeCode({
      registryId: "amazon-us", code: "offline-code", redirectUri: "https://example.test/callback",
    }), error => {
      assert.ok(error instanceof Error);
      assert.match(error.message, /invalid credentials/);
      assert.doesNotMatch(error.message, /SECRET_ONLY/);
      return true;
    });
    assert.equal(calls, 1);
  });

  it("refresh uses its own form grant and a missing refresh token cannot dispatch", async () => {
    configureProduction();
    let calls = 0;
    mock.method(globalThis, "fetch", async (_input: string | URL | Request, init?: RequestInit) => {
      calls++;
      assert.deepEqual(Object.fromEntries(new URLSearchParams(String(init?.body))), {
        grant_type: "refresh_token", refresh_token: "offline-refresh",
        client_id: "offline-client", client_secret: "offline-secret",
      });
      return new Response(JSON.stringify({
        access_token: "offline-new-access", token_type: "bearer", expires_in: 3600,
      }), { status: 200 });
    });
    await assert.rejects(amazonOAuthRefreshToken("amazon-us", ""), /refresh token is required/);
    assert.equal(calls, 0);
    const token = await amazonOAuthRefreshToken("amazon-us", "offline-refresh");
    assert.equal(token.accessToken, "offline-new-access");
    assert.equal(token.refreshToken, "offline-refresh");
    assert.equal(calls, 1);
  });
});
