import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

import {
  buildCjAuthHeaders,
  clearCjAuthCache,
  getCjAccessToken,
  getCjAuthCacheStatus,
} from "../../suppliers/cj-dropshipping/cj-auth.js";
import { loadCjConfig } from "../../suppliers/cj-dropshipping/cj-config.js";

const BASE_URL = "https://developers.cjdropshipping.com/api2.0/v1";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("CJ API 2.0 authentication", () => {
  afterEach(() => {
    clearCjAuthCache();
    delete process.env.CJ_API_KEY;
    delete process.env.CJ_API_SECRET;
  });

  it("obtains access token with apiKey only (CJ API 2.0)", async () => {
    process.env.CJ_API_KEY = "CJUserNum@api@test-key";
    const config = loadCjConfig();
    let requestBody: string | undefined;

    const fetchImpl = async (input: string | URL | Request, init?: RequestInit) => {
      assert.equal(String(input), `${BASE_URL}/authentication/getAccessToken`);
      assert.equal(init?.method, "POST");
      requestBody = String(init?.body);
      return jsonResponse({
        code: 200,
        result: true,
        message: "Success",
        data: {
          accessToken: "access-token-1",
          accessTokenExpiryDate: new Date(Date.now() + 3_600_000).toISOString(),
          refreshToken: "refresh-token-1",
          refreshTokenExpiryDate: new Date(Date.now() + 86_400_000).toISOString(),
        },
      });
    };

    const token = await getCjAccessToken(config, fetchImpl);
    assert.equal(token, "access-token-1");
    assert.deepEqual(JSON.parse(requestBody!), { apiKey: "CJUserNum@api@test-key" });
  });

  it("includes legacy apiSecret when configured", async () => {
    process.env.CJ_API_KEY = "key-only";
    process.env.CJ_API_SECRET = "legacy-secret";
    const config = loadCjConfig();
    let requestBody: string | undefined;

    const fetchImpl = async (_input: string | URL | Request, init?: RequestInit) => {
      requestBody = String(init?.body);
      return jsonResponse({
        code: 200,
        result: true,
        message: "Success",
        data: {
          accessToken: "access-token-legacy",
          accessTokenExpiryDate: new Date(Date.now() + 3_600_000).toISOString(),
          refreshToken: "refresh-token-legacy",
        },
      });
    };

    await getCjAccessToken(config, fetchImpl);
    assert.deepEqual(JSON.parse(requestBody!), {
      apiKey: "key-only",
      apiSecret: "legacy-secret",
    });
  });

  it("refreshes access token when cached access token expires", async () => {
    process.env.CJ_API_KEY = "refresh-key";
    const config = loadCjConfig();
    const calls: string[] = [];

    const fetchImpl = async (input: string | URL | Request, init?: RequestInit) => {
      calls.push(String(input));
      if (String(input).endsWith("/authentication/getAccessToken")) {
        return jsonResponse({
          code: 200,
          result: true,
          message: "Success",
          data: {
            accessToken: "initial-access",
            accessTokenExpiryDate: new Date(Date.now() - 1_000).toISOString(),
            refreshToken: "refresh-token-active",
            refreshTokenExpiryDate: new Date(Date.now() + 86_400_000).toISOString(),
          },
        });
      }
      assert.equal(init?.method, "POST");
      assert.deepEqual(JSON.parse(String(init?.body)), { refreshToken: "refresh-token-active" });
      return jsonResponse({
        code: 200,
        result: true,
        message: "Success",
        data: {
          accessToken: "refreshed-access",
          accessTokenExpiryDate: new Date(Date.now() + 3_600_000).toISOString(),
          refreshToken: "refresh-token-active",
        },
      });
    };

    const token = await getCjAccessToken(config, fetchImpl);
    assert.equal(token, "refreshed-access");
    assert.equal(calls.length, 2);
    assert.ok(calls[1]!.endsWith("/authentication/refreshAccessToken"));
  });

  it("reuses cached access token without network call", async () => {
    process.env.CJ_API_KEY = "cached-key";
    const config = loadCjConfig();
    let callCount = 0;

    const fetchImpl = async () => {
      callCount += 1;
      return jsonResponse({
        code: 200,
        result: true,
        message: "Success",
        data: {
          accessToken: "cached-access",
          accessTokenExpiryDate: new Date(Date.now() + 3_600_000).toISOString(),
          refreshToken: "cached-refresh",
        },
      });
    };

    const first = await getCjAccessToken(config, fetchImpl);
    const second = await getCjAccessToken(config, fetchImpl);
    assert.equal(first, "cached-access");
    assert.equal(second, "cached-access");
    assert.equal(callCount, 1);
  });

  it("isolates concurrent CJ account tokens and coalesces same-account auth", async () => {
    const base = loadCjConfig();
    const accountA = { ...base, apiKey: "account-A" };
    const accountB = { ...base, apiKey: "account-B" };
    const calls: string[] = [];
    const fetchImpl = async (_input: string | URL | Request, init?: RequestInit) => {
      const key = JSON.parse(String(init?.body)).apiKey as string;
      calls.push(key);
      await new Promise(resolve => setTimeout(resolve, 10));
      return jsonResponse({ code: 200, result: true, data: {
        accessToken: `token-for-${key}`,
        accessTokenExpiryDate: new Date(Date.now() + 3_600_000).toISOString(),
      } });
    };
    const tokens = await Promise.all([
      getCjAccessToken(accountA, fetchImpl),
      getCjAccessToken(accountB, fetchImpl),
      getCjAccessToken(accountA, fetchImpl),
    ]);
    assert.deepEqual(tokens, ["token-for-account-A", "token-for-account-B", "token-for-account-A"]);
    assert.deepEqual(calls.sort(), ["account-A", "account-B"]);
    assert.equal(await getCjAccessToken(accountA, fetchImpl), "token-for-account-A");
    assert.equal(await getCjAccessToken(accountB, fetchImpl), "token-for-account-B");
    assert.equal(calls.length, 2);
  });

  it("does not reuse an access token after API secret or endpoint changes", async () => {
    const base = { ...loadCjConfig(), apiKey: "same-key" };
    let calls = 0;
    const fetchImpl = async () => jsonResponse({ code: 200, result: true, data: {
      accessToken: `token-${++calls}`,
      accessTokenExpiryDate: new Date(Date.now() + 3_600_000).toISOString(),
    } });
    assert.equal(await getCjAccessToken(base, fetchImpl), "token-1");
    assert.equal(await getCjAccessToken({ ...base, apiSecret: "rotated" }, fetchImpl), "token-2");
    assert.equal(await getCjAccessToken({ ...base, apiBaseUrl: "https://other.example/api2.0/v1" }, fetchImpl), "token-3");
    assert.equal(await getCjAccessToken(base, fetchImpl), "token-1");
  });

  it("refuses token responses without an independently valid expiry", async () => {
    const config = { ...loadCjConfig(), apiKey: "expiry-key" };
    let expiry: string | undefined;
    const fetchImpl = async () => jsonResponse({ code: 200, result: true, data: {
      accessToken: "unsafe-token", accessTokenExpiryDate: expiry,
    } });
    await assert.rejects(getCjAccessToken(config, fetchImpl), /expiry missing or invalid/);
    assert.equal(getCjAuthCacheStatus().populated, false);
    expiry = new Date(Date.now() + 15_000).toISOString();
    await assert.rejects(getCjAccessToken(config, fetchImpl), /access token expired/);
    assert.equal(getCjAuthCacheStatus().accessValid, false);
  });

  it("buildCjAuthHeaders sets CJ-Access-Token header", async () => {
    process.env.CJ_API_KEY = "header-key";
    const config = loadCjConfig();

    const fetchImpl = async () =>
      jsonResponse({
        code: 200,
        result: true,
        message: "Success",
        data: {
          accessToken: "header-access",
          accessTokenExpiryDate: new Date(Date.now() + 3_600_000).toISOString(),
        },
      });

    const headers = await buildCjAuthHeaders(config, fetchImpl);
    assert.equal(headers["CJ-Access-Token"], "header-access");
  });
});
