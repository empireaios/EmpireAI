/**
 * Unit tests for BFF Set-Cookie rewrite (Grand King login recovery).
 */
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { rewriteSetCookieForBff } from "../../lib/brain/server-proxy";

describe("rewriteSetCookieForBff", () => {
  test("strips Domain and keeps host-only Path for Vercel BFF", () => {
    const previousVercel = process.env.VERCEL;
    process.env.VERCEL = "1";
    try {
      const out = rewriteSetCookieForBff(
        "empireai_session=abc123; Max-Age=604800; Path=/; Domain=empireai-production.up.railway.app; HttpOnly; SameSite=Lax",
      );
      assert.match(out, /^empireai_session=abc123/);
      assert.doesNotMatch(out, /Domain=/i);
      assert.match(out, /Path=\//);
      assert.match(out, /HttpOnly/i);
      assert.match(out, /SameSite=Lax/i);
      assert.match(out, /Secure/i);
    } finally {
      if (previousVercel === undefined) delete process.env.VERCEL;
      else process.env.VERCEL = previousVercel;
    }
  });

  test("adds Secure on production for session cookies missing it", () => {
    const previousVercel = process.env.VERCEL;
    const previousNode = process.env.NODE_ENV;
    process.env.VERCEL = "1";
    process.env.NODE_ENV = "production";
    try {
      const out = rewriteSetCookieForBff(
        "empireai_session=tok; Max-Age=100; Path=/; HttpOnly; SameSite=Lax",
      );
      assert.match(out, /Secure/i);
    } finally {
      if (previousVercel === undefined) delete process.env.VERCEL;
      else process.env.VERCEL = previousVercel;
      if (previousNode === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = previousNode;
    }
  });
});
