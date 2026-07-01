import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  assessProductionInfrastructureReadiness,
} from "../../orchestration/version-1-activation/production-infrastructure-readiness.js";

const PRODUCTION_HOSTING_ENV: NodeJS.ProcessEnv = {
  NODE_ENV: "production",
  DATABASE_PATH: "/data/empireai-brain.db",
  REDIS_URL: "rediss://default:test@example.upstash.io:6379",
  SESSION_SECRET: "production-session-secret-32chars-minimum-ok",
  CORS_ORIGIN: "https://empireai-cockpit.vercel.app",
  EMPIREAI_REPO_ROOT: "/app",
  OPENAI_API_KEY: "sk-test",
  LIVE_COMMERCE_INTEGRATION_MODE: "sandbox",
  PRODUCTION_DEPLOY_VERIFIED: "true",
  RAILWAY_ENVIRONMENT: "production",
};

describe("P0-1 production infrastructure readiness (B5)", () => {
  it("blocks B5 when production env incomplete", () => {
    const assessment = assessProductionInfrastructureReadiness({ NODE_ENV: "development" });
    assert.equal(assessment.b5Closed, false);
    assert.equal(assessment.hostingConfigured, false);
    assert.ok(assessment.blockers.length > 0);
  });

  it("closes B5 when hosting configured and runtime verified", () => {
    const assessment = assessProductionInfrastructureReadiness(PRODUCTION_HOSTING_ENV);
    assert.equal(assessment.hostingConfigured, true);
    assert.equal(assessment.runtimeVerified, true);
    assert.equal(assessment.b5Closed, true);
    assert.equal(assessment.liveCommerceSafelyBlocked, true);
  });

  it("blocks live commerce production mode without B6 credentials", () => {
    const assessment = assessProductionInfrastructureReadiness({
      ...PRODUCTION_HOSTING_ENV,
      LIVE_COMMERCE_INTEGRATION_MODE: "production",
      PRODUCTION_DEPLOY_VERIFIED: "true",
    });
    assert.equal(assessment.liveCommerceSafelyBlocked, false);
    assert.equal(assessment.b5Closed, false);
    assert.ok(
      assessment.blockers.some((b) => b.includes("LIVE_COMMERCE_INTEGRATION_MODE=production")),
    );
  });

  it("reports B6 credential checklist without requiring them for hosting", () => {
    const assessment = assessProductionInfrastructureReadiness(PRODUCTION_HOSTING_ENV);
    assert.equal(assessment.credentialReadinessForB6.amazon, false);
    assert.equal(assessment.credentialReadinessForB6.cj, false);
    const amazonEntry = assessment.secretsChecklist.find((s) => s.key.includes("AMAZON"));
    assert.equal(amazonEntry?.requiredForHosting, false);
  });
});
