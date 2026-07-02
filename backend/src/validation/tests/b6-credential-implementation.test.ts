import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  assessB6CredentialImplementation,
  hasStripeProductionCredentials,
  isB5CertificationFrozen,
} from "../../orchestration/version-1-activation/b6-credential-implementation.js";

const B5_PRODUCTION_ENV: NodeJS.ProcessEnv = {
  NODE_ENV: "production",
  DATABASE_PATH: "/data/empireai-brain.db",
  REDIS_URL: "rediss://default:pass@endpoint.upstash.io:6379",
  SESSION_SECRET: "production-session-secret-with-32-characters-minimum",
  CORS_ORIGIN: "https://empireai-five.vercel.app",
  EMPIREAI_REPO_ROOT: "/app",
  OPENAI_API_KEY: "sk-test",
  LIVE_COMMERCE_INTEGRATION_MODE: "sandbox",
  PRODUCTION_DEPLOY_VERIFIED: "true",
};

describe("B6 credential implementation tracking", () => {
  it("freezes B5 when production deploy is certified", () => {
    const tracking = assessB6CredentialImplementation(B5_PRODUCTION_ENV);
    assert.equal(tracking.b5Closed, true);
    assert.equal(tracking.b5Frozen, true);
    assert.equal(isB5CertificationFrozen(B5_PRODUCTION_ENV), true);
  });

  it("identifies Amazon SP-API as first required integration", () => {
    const tracking = assessB6CredentialImplementation(B5_PRODUCTION_ENV);
    assert.equal(tracking.currentObjectiveId, "B6-01");
    assert.equal(tracking.firstRequiredIntegration, "Amazon SP-API production credentials");
    assert.equal(tracking.items[0]!.id, "B6-01");
    assert.equal(tracking.items[0]!.status, "PENDING");
  });

  it("tracks CJ API key without secret for B6-02", () => {
    const env: NodeJS.ProcessEnv = {
      ...B5_PRODUCTION_ENV,
      CJ_API_KEY: "cj-api-key-only",
    };
    const tracking = assessB6CredentialImplementation(env);
    const cj = tracking.items.find((i) => i.id === "B6-02")!;
    assert.equal(cj.configured, true);
    assert.equal(cj.status, "CONFIGURED");
  });

  it("tracks stripe and vault objectives independently", () => {
    const env: NodeJS.ProcessEnv = {
      ...B5_PRODUCTION_ENV,
      STRIPE_SECRET_KEY: "sk_test_123",
      STRIPE_WEBHOOK_SECRET: "whsec_test",
      CREDENTIAL_VAULT_KEY: "short",
    };
    assert.equal(hasStripeProductionCredentials(env), true);
    const tracking = assessB6CredentialImplementation(env);
    const stripe = tracking.items.find((i) => i.id === "B6-03")!;
    const vault = tracking.items.find((i) => i.id === "B6-04")!;
    assert.equal(stripe.status, "CONFIGURED");
    assert.equal(vault.status, "CONFIGURED");
    assert.equal(vault.verified, false);
  });
});
