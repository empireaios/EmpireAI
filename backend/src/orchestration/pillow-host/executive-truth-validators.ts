/**
 * Pure truth draft validators — no DB/env side effects.
 */

import type { ExecutiveTruthSnapshot } from "./executive-truth-types.js";

const FABRICATED_COMMERCE_CLAIM =
  /\b(last quarter|last three months|past (three|3) months|historical sales|sales (data|figures|performance|trend)|declining .{0,40}sales|customer feedback ratings?|competitor pricing analysis|internal sales tracking|market research reports?|revenue (of|totaling|was)|units? sold|conversion rate of)\b/i;

const ZERO_OR_UNKNOWN_COMMERCE =
  /\b(0|zero|none|no verified|no realised|unknown)\b/i;

const DEPLOY_AUTHORITY_CLAIM =
  /\b(i can (initiate|execute|perform|run|complete)|i will (initiate|execute|perform|run)|i am able to (initiate|execute)|under (an |the )?operational playbook.{0,80}(deploy|deployment))\b.{0,80}\b(production deployment|deploy(ment)? to production|railway deploy)\b/i;

const STALE_DEPLOY_BLOCKER_AS_CURRENT =
  /\b(blocker\s*b[0-9]+|b5\s+proves|production deployment has not occurred|complete production deployment\s*\(p0-1\)|p0-1\b.{0,60}\b(not |still |blocked)|production deployment is currently blocked|still blocked by (an )?unresolved historical)\b/i;

const EVIDENCED_LABEL = /\b(evidenced|\[know\]|classified as\s+know)\b/i;

const ALTERNATE_PRODUCT_CLAIM =
  /\b(?:is|was|titled|called|named)\s+(?:the\s+)?["']?[A-Z][A-Za-z0-9]+(?:[\s\-][A-Za-z0-9]+){1,8}/;

function significantTokens(name: string): string[] {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 4)
    .filter((t) => !["with", "from", "that", "this", "high", "speed", "portable", "digital", "display"].includes(t));
}

function answerMentionsAuthoritativeProduct(answer: string, productName: string): boolean {
  const tokens = significantTokens(productName);
  if (tokens.length === 0) return true;
  const lower = answer.toLowerCase();
  const strong = tokens.filter((t) => t.length >= 5);
  const pool = strong.length > 0 ? strong : tokens;
  return pool.some((t) => lower.includes(t));
}

/** Pure truth validation — violations only. */
export function validateTruthDraft(
  message: string,
  truth: ExecutiveTruthSnapshot,
): string[] {
  const violations: string[] = [];
  const asin = truth.product.asin?.toUpperCase() ?? null;
  const productName = truth.product.productName;

  if (asin && productName && message.toUpperCase().includes(asin)) {
    const mentionsAuth = answerMentionsAuthoritativeProduct(message, productName);
    const assertsAlternate =
      ALTERNATE_PRODUCT_CLAIM.test(message) && !mentionsAuth;
    if (assertsAlternate) {
      violations.push("PRODUCT_IDENTITY_MISMATCH");
    }
  }

  if (
    truth.financial.orders === 0 &&
    truth.financial.realisedRevenueUsd === 0 &&
    FABRICATED_COMMERCE_CLAIM.test(message) &&
    !ZERO_OR_UNKNOWN_COMMERCE.test(message)
  ) {
    violations.push("FABRICATED_COMMERCE_OR_FINANCIAL_CLAIM");
  }

  if (DEPLOY_AUTHORITY_CLAIM.test(message) || /\bi can execute production deployment\b/i.test(message)) {
    violations.push("FALSE_DEPLOY_AUTHORITY");
  }

  if (
    (truth.birth.technicallyReady || Boolean(truth.deploy.gitCommitSha)) &&
    STALE_DEPLOY_BLOCKER_AS_CURRENT.test(message)
  ) {
    violations.push("STALE_HISTORICAL_BLOCKER_AS_CURRENT");
  }

  if (
    violations.includes("FABRICATED_COMMERCE_OR_FINANCIAL_CLAIM") &&
    EVIDENCED_LABEL.test(message)
  ) {
    violations.push("UNSUPPORTED_MARKED_EVIDENCED");
  }

  return [...new Set(violations)];
}
