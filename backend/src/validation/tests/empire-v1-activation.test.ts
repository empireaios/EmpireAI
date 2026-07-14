import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";

import {
  assessEmpireV1Activation,
  createEmpireV1ActivationCertification,
  EMPIRE_ACTIVATION_READINESS_RATINGS,
  EMPIRE_V1_PROGRAMME_MISSIONS,
  EMPIRE_V1_PRODUCTION_DOMAIN,
} from "../../orchestration/empire-activation/index.js";
import {
  createIdentityAuthorizationProgrammeCertification,
} from "../../orchestration/identity-authorization-platform/index.js";
import { configureValidationEnvironment } from "../harness.js";

configureValidationEnvironment();

const REPO_ROOT = join(import.meta.dirname, "../../../..");
const ARTIFACTS = join(REPO_ROOT, "artifacts");
const EMPIREAI_WEB = join(REPO_ROOT, "empireai-web");

describe("Empire Activation — Version 1 Completion", () => {
  it("certifies EmpireAI V1 programme with G0 through G8 missions", () => {
    assert.equal(EMPIRE_V1_PROGRAMME_MISSIONS.length, 10);
    assert.equal(EMPIRE_V1_PROGRAMME_MISSIONS[9], "V1-ACTIVATION");
    assert.equal(EMPIRE_V1_PRODUCTION_DOMAIN, "https://empire-ai.co");

    const certification = createEmpireV1ActivationCertification({
      validationSuitePass: true,
      backendTypecheckPass: true,
      frontendTypecheckPass: true,
    });

    assert.equal(certification.status, "activated");
    assert.equal(certification.readinessRating, "PASS_WITH_CONDITIONS");
    assert.equal(certification.productionEligible, true);
    assert.equal(certification.blockers.length, 0);
    assert.ok(certification.conditions.length > 0);
  });

  it("rejects activation when validation gates fail", () => {
    const failed = createEmpireV1ActivationCertification({
      validationSuitePass: false,
      backendTypecheckPass: true,
      frontendTypecheckPass: true,
    });
    assert.equal(failed.status, "not_activated");
    assert.equal(failed.readinessRating, "FAIL");
    assert.ok(failed.blockers.length > 0);
  });

  it("produces comprehensive activation verification report", () => {
    const report = assessEmpireV1Activation({
      validationSuitePass: true,
      backendTypecheckPass: true,
      frontendTypecheckPass: true,
    });

    assert.ok(EMPIRE_ACTIVATION_READINESS_RATINGS.includes(report.readinessRating));
    assert.equal(report.readinessRating, "PASS_WITH_CONDITIONS");
    assert.equal(report.productionEligible, true);
    assert.ok(Object.values(report.verificationAreas).every(Boolean));
    assert.equal(report.ownershipMatrix.pillow, "Pillow — governance and operating shell");
    assert.equal(report.integrationMatrix.brain, true);
    assert.equal(report.securityChecks.searchEngineBlocked, true);
    assert.equal(report.securityChecks.noPublicAnonymousAccess, true);
  });

  it("confirms G8 programme certification is prerequisite for V1 activation", () => {
    const g8 = createIdentityAuthorizationProgrammeCertification({
      validationSuitePass: true,
      typecheckPass: true,
      frontendTypecheckPass: true,
    });
    assert.equal(g8.status, "certified");
    assert.equal(g8.readinessRating, "PASS_WITH_CONDITIONS");
  });

  it("confirms frontend private gateway and search engine protection files exist", () => {
    assert.ok(existsSync(join(EMPIREAI_WEB, "public", "robots.txt")));
    const robots = readFileSync(join(EMPIREAI_WEB, "public", "robots.txt"), "utf8");
    assert.match(robots, /Disallow: \//);
    assert.match(robots, /Googlebot/);
    assert.match(robots, /Bingbot/);

    assert.ok(existsSync(join(EMPIREAI_WEB, "middleware.ts")));
    const middleware = readFileSync(join(EMPIREAI_WEB, "middleware.ts"), "utf8");
    assert.match(middleware, /X-Robots-Tag/);
    assert.match(middleware, /\/login/);

    assert.ok(existsSync(join(EMPIREAI_WEB, "lib", "cockpit", "pillow", "pillow-session-store.ts")));
    assert.ok(existsSync(join(EMPIREAI_WEB, "lib", "cockpit", "pillow", "use-pillow-voice.ts")));
  });

  it("confirms G8-10 and empire activation executive artifacts are present", () => {
    assert.ok(
      existsSync(join(ARTIFACTS, "g8-10-identity-authorization-production-readiness-executive-audit.md")),
    );
    assert.ok(existsSync(join(ARTIFACTS, "g8-identity-authorization-completion-summary.md")));
    assert.ok(existsSync(join(ARTIFACTS, "empire-v1-activation-executive-audit.md")));
  });
});
