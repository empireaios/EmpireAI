import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { tier0IsolationEnabled } from "../../runtime/tier0-isolated-primary.js";

describe("tier0 isolated primary", () => {
  it("disables isolation for brain-worker role", () => {
    const prevRole = process.env.EMPIRE_ROLE;
    const prevIso = process.env.EMPIRE_TIER0_ISOLATION;
    process.env.EMPIRE_ROLE = "brain-worker";
    process.env.EMPIRE_TIER0_ISOLATION = "true";
    assert.equal(tier0IsolationEnabled(), false);
    process.env.EMPIRE_ROLE = prevRole;
    process.env.EMPIRE_TIER0_ISOLATION = prevIso;
  });

  it("can force isolation outside production", () => {
    const prevRole = process.env.EMPIRE_ROLE;
    const prevIso = process.env.EMPIRE_TIER0_ISOLATION;
    delete process.env.EMPIRE_ROLE;
    process.env.EMPIRE_TIER0_ISOLATION = "force";
    assert.equal(tier0IsolationEnabled(), true);
    process.env.EMPIRE_ROLE = prevRole;
    process.env.EMPIRE_TIER0_ISOLATION = prevIso;
  });

  it("enables isolation when Railway env is present", () => {
    const prevRole = process.env.EMPIRE_ROLE;
    const prevIso = process.env.EMPIRE_TIER0_ISOLATION;
    const prevRail = process.env.RAILWAY_DEPLOYMENT_ID;
    delete process.env.EMPIRE_ROLE;
    process.env.EMPIRE_TIER0_ISOLATION = "true";
    process.env.RAILWAY_DEPLOYMENT_ID = "test-deploy";
    assert.equal(tier0IsolationEnabled(), true);
    process.env.EMPIRE_ROLE = prevRole;
    process.env.EMPIRE_TIER0_ISOLATION = prevIso;
    process.env.RAILWAY_DEPLOYMENT_ID = prevRail;
  });
});
