#!/usr/bin/env node
/**
 * B6-03B — Live Stripe authentication proof harness.
 *
 * Usage:
 *   node --import tsx backend/scripts/b6-03b-live-stripe-auth-proof.mjs
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { runStripeLiveAuthProof } from "../src/revenue/shared/stripe-live-auth-proof.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..", "..");
const artifactsDir = join(repoRoot, "artifacts");

async function main() {
  const proof = await runStripeLiveAuthProof();
  mkdirSync(artifactsDir, { recursive: true });
  const evidencePath = join(artifactsDir, "b6-03b-stripe-live-auth-evidence.json");
  writeFileSync(evidencePath, `${JSON.stringify(proof, null, 2)}\n`, "utf8");

  console.log(`Mission: ${proof.mission}`);
  console.log(`Certification: ${proof.certification}`);
  console.log(`Secret key present: ${proof.credentials.secretKeyPresent}`);
  console.log(`Webhook secret present: ${proof.credentials.webhookSecretPresent}`);
  console.log(`Stripe API accessible: ${proof.stripeApi.accountAccessible}`);
  console.log(`Signature round-trip: ${proof.webhookVerification.signatureRoundTripVerified}`);
  console.log(`Webhook endpoint operational: ${proof.webhookEndpoint.operational}`);
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
