import assert from "node:assert/strict";
import { test } from "node:test";
import {
  getBootstrapCredentialReadiness,
  requireSafeBootstrapCredentials,
  UnsafeBootstrapCredentialsError,
} from "../../auth/bootstrap-credential-policy.js";

const configured = {
  production: true,
  founderPassword: "test-fixture-founder-unique-only",
  adminPassword: "test-fixture-admin-unique-only",
};

test("production requires both bootstrap accounts to be configured", () => {
  for (const key of ["founderPassword", "adminPassword"] as const) {
    for (const unsafe of [undefined, "", "  ", "EmpireAI2026!", " EmpireAI2026! "]) {
      const input = { ...configured, [key]: unsafe };
      assert.equal(getBootstrapCredentialReadiness(input).ready, false);
      assert.throws(() => requireSafeBootstrapCredentials(input), UnsafeBootstrapCredentialsError);
    }
  }
});

test("configured production credentials pass without exposing their values", () => {
  assert.deepEqual(getBootstrapCredentialReadiness(configured), { ready: true, unsafeAccounts: [] });
  assert.doesNotThrow(() => requireSafeBootstrapCredentials(configured));
  const report = JSON.stringify(getBootstrapCredentialReadiness({ ...configured, adminPassword: "" }));
  assert.equal(report.includes(configured.founderPassword), false);
});

test("development fixtures remain available only outside production", () => {
  assert.equal(getBootstrapCredentialReadiness({ production: false }).ready, true);
  assert.doesNotThrow(() => requireSafeBootstrapCredentials({ production: false, founderPassword: "EmpireAI2026!" }));
});

test("unsafe-configuration error discloses no password values", () => {
  try {
    requireSafeBootstrapCredentials({ ...configured, adminPassword: "EmpireAI2026!" });
    assert.fail("unsafe production credentials were accepted");
  } catch (error) {
    assert.ok(error instanceof UnsafeBootstrapCredentialsError);
    assert.equal(error.code, "BOOTSTRAP_CREDENTIALS_UNSAFE");
    assert.equal(error.message.includes(configured.founderPassword), false);
    assert.equal(error.message.includes("EmpireAI2026!"), false);
  }
});
