import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

import { clearCjAuthCache } from "../../suppliers/cj-dropshipping/cj-auth.js";
import { runCjLiveAuthProof } from "../../suppliers/cj-dropshipping/cj-live-auth-proof.js";

const BASE_URL = "https://developers.cjdropshipping.com/api2.0/v1";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("CJ live auth proof (B6-02B)", () => {
  afterEach(() => {
    clearCjAuthCache();
    delete process.env.CJ_API_KEY;
  });

  it("reports missing credentials without exposing secrets", async () => {
    const proof = await runCjLiveAuthProof({ ...process.env, CJ_API_KEY: "" });
    assert.equal(proof.success, false);
    assert.equal(proof.credentialSource, "missing");
    assert.ok(proof.blockers.some((b) => b.includes("not configured")));
  });

  it("passes redacted proof when auth and product list succeed", async () => {
    process.env.CJ_API_KEY = "live-proof-key";
    let authCalls = 0;

    const fetchImpl = async (input: string | URL | Request, init?: RequestInit) => {
      const target = String(input);
      if (target.includes("/authentication/getAccessToken")) {
        authCalls += 1;
        return jsonResponse({
          code: 200,
          result: true,
          message: "Success",
          data: {
            accessToken: "proof-access-token",
            accessTokenExpiryDate: new Date(Date.now() + 3_600_000).toISOString(),
            refreshToken: "proof-refresh-token",
            refreshTokenExpiryDate: new Date(Date.now() + 86_400_000).toISOString(),
          },
        });
      }
      if (target.includes("/product/list")) {
        assert.equal(init?.method ?? "GET", "GET");
        const headers = init?.headers as Record<string, string> | undefined;
        assert.equal(headers?.["CJ-Access-Token"], "proof-access-token");
        return jsonResponse({
          code: 200,
          result: true,
          message: "Success",
          data: { list: [{ pid: "p1" }], pageNum: 1, pageSize: 1, total: 1 },
        });
      }
      throw new Error(`Unexpected URL: ${target}`);
    };

    const proof = await runCjLiveAuthProof(process.env, fetchImpl);
    assert.equal(proof.success, true);
    assert.equal(proof.auth.endpoint, `${BASE_URL}/authentication/getAccessToken`);
    assert.equal(proof.auth.httpStatus, 200);
    assert.equal(proof.auth.accessTokenReceived, true);
    assert.equal(proof.auth.refreshTokenReceived, true);
    assert.equal(proof.auth.accessTokenExpiryParsed, true);
    assert.equal(proof.tokenCache.populated, true);
    assert.equal(proof.tokenCache.reuseVerified, true);
    assert.equal(proof.authenticatedCall.productCount, 1);
    assert.equal(authCalls, 1);
  });
});
