#!/usr/bin/env node
/**
 * B6-02B — Live CJ authentication proof harness.
 *
 * Usage:
 *   node --import tsx backend/scripts/b6-02b-live-cj-auth-proof.mjs
 *   CJ_API_KEY=... node --import tsx backend/scripts/b6-02b-live-cj-auth-proof.mjs
 *
 * Writes redacted evidence to artifacts/b6-02b-live-cj-auth-evidence.json
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { runCjLiveAuthProof } from "../src/suppliers/cj-dropshipping/cj-live-auth-proof.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..", "..");
const artifactsDir = join(repoRoot, "artifacts");

async function main() {
  const proof = await runCjLiveAuthProof();
  mkdirSync(artifactsDir, { recursive: true });
  const evidencePath = join(artifactsDir, "b6-02b-live-cj-auth-evidence.json");
  writeFileSync(evidencePath, `${JSON.stringify(proof, null, 2)}\n`, "utf8");

  console.log(`Mission: ${proof.mission}`);
  console.log(`Success: ${proof.success}`);
  console.log(`Credential source: ${proof.credentialSource}`);
  console.log(`Auth HTTP status: ${proof.auth.httpStatus ?? "n/a"}`);
  console.log(`Access token received: ${proof.auth.accessTokenReceived}`);
  console.log(`Refresh token received: ${proof.auth.refreshTokenReceived}`);
  console.log(`Token cache populated: ${proof.tokenCache.populated}`);
  console.log(`Token cache reuse verified: ${proof.tokenCache.reuseVerified}`);
  console.log(`Product list HTTP status: ${proof.authenticatedCall.httpStatus ?? "n/a"}`);
  console.log(`Product list result: ${proof.authenticatedCall.apiResult ?? "n/a"}`);
  if (proof.blockers.length > 0) {
    console.log(`Blockers: ${proof.blockers.join("; ")}`);
  }
  console.log(`Evidence: ${evidencePath}`);

  process.exit(proof.success ? 0 : 1);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
