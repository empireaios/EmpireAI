#!/usr/bin/env node
/**
 * Adversarial qualification for deterministic resolved-verdict finalization.
 * No sealed examination content.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildResolvedVerdictAdversarialCorpus } from "../src/validation/resolved-verdict-adversarial-corpus.ts";
import { buildCanonicalCaseState } from "../src/orchestration/pillow-host/executive-canonical-state.ts";
import { assessClaimAgainstCanonical } from "../src/orchestration/pillow-host/executive-claim-proposition.ts";
import {
  buildFinalVerdictObject,
  countLeftoverSupportedOverrides,
} from "../src/orchestration/pillow-host/executive-final-verdict.ts";
import { polishFinalVisibleAnswer } from "../src/orchestration/pillow-host/executive-response-polish.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const OUT_DIR = path.join(ROOT, "docs/audits/complete-state");
const OUT_FILE = path.join(OUT_DIR, "DETERMINISTIC_RESOLVED_VERDICT_ADVERSARIAL_QUAL.json");

function buildPack(c) {
  return [...c.packFacts, `Assess this claim: ${c.claimText}`].join("\n");
}

function explicitClaimVerdict(text, index = 1) {
  const claimHdr = new RegExp(
    `Claim\\s*${index}\\b[\\s\\S]{0,500}?\\*\\*Verdict:\\*\\*\\s*(?:\\*\\*)?(Supported|Contradicted|Unproven)`,
    "i",
  );
  return claimHdr.exec(text)?.[1] || null;
}

function normalizeVisible(label) {
  if (!label) return null;
  const l = label.toLowerCase();
  if (l.startsWith("unproven")) return "Unproven";
  if (l === "supported") return "Supported";
  if (l === "contradicted") return "Contradicted";
  return label;
}

function mapOverallToExpected(overall) {
  if (overall === "supported") return "Supported";
  if (overall === "contradicted") return "Contradicted";
  return "Unproven";
}

function softSupportedDraft(claimText) {
  return [
    "### Conclusions",
    "Transfer path noted. Shortage may be indirectly related.",
    "**Verdict:** Supported",
    `"${claimText}"`,
    "Different direct mechanism implies unrelated.",
    "### Claim 1",
    "**Verdict:** Supported",
    `"${claimText}"`,
  ].join("\n");
}

const corpus = buildResolvedVerdictAdversarialCorpus();

let resolvedFinalVerdictError = 0;
let leftoverOverrides = 0;
let overDeterminization = 0;
const resolvedErrors = [];
const overDetErrors = [];

for (const c of corpus) {
  const pack = buildPack(c);
  const canonical = buildCanonicalCaseState(pack);
  const assessed = assessClaimAgainstCanonical(c.claimText, canonical);
  const finalObj = buildFinalVerdictObject(`claim_${c.id}`, c.claimText, canonical);

  if (c.resolutionStatus === "RESOLVED") {
    const softDraft = softSupportedDraft(c.claimText);
    const polished = polishFinalVisibleAnswer(softDraft, pack);
    const got = normalizeVisible(explicitClaimVerdict(polished, 1));
    const leftover = countLeftoverSupportedOverrides(polished);

    if (got !== c.expectedVerdict) {
      resolvedFinalVerdictError += 1;
      if (resolvedErrors.length < 12) {
        resolvedErrors.push(
          `${c.id} domain=${c.domain} want=${c.expectedVerdict} got=${got} can=${assessed.overall}`,
        );
      }
    }
    if (leftover > 0) {
      leftoverOverrides += leftover;
      if (resolvedErrors.length < 12) {
        resolvedErrors.push(`${c.id} LEFTOVER_SUPPORTED=${leftover}`);
      }
    }

    const canonExpected = mapOverallToExpected(assessed.overall);
    if (canonExpected !== c.expectedVerdict && resolvedErrors.length < 12) {
      resolvedErrors.push(
        `${c.id} CORPUS_CANONICAL_MISMATCH want=${c.expectedVerdict} assess=${canonExpected}`,
      );
    }
  } else if (c.judgmentControl) {
    if (
      finalObj.resolutionStatus === "RESOLVED" &&
      (finalObj.canonicalVerdict === "supported" || finalObj.canonicalVerdict === "contradicted")
    ) {
      overDeterminization += 1;
      if (overDetErrors.length < 12) {
        overDetErrors.push(
          `${c.id} OVER_DET can=${finalObj.canonicalVerdict} res=${finalObj.resolutionStatus}`,
        );
      }
    }
  }
}

const resolvedCount = corpus.filter((c) => c.resolutionStatus === "RESOLVED").length;
const compoundCount = corpus.filter((c) => c.compound).length;
const temptationCount = corpus.filter((c) => c.wrongVerdictTemptation).length;
const judgmentCount = corpus.filter((c) => c.judgmentControl).length;

const summary = {
  generatedAt: new Date().toISOString(),
  corpusTotal: corpus.length,
  resolvedCount,
  compoundCount,
  temptationCount,
  judgmentCount,
  RESOLVED_FINAL_VERDICT_ERROR: resolvedFinalVerdictError,
  LEFTOVER_SUPPORTED_OVERRIDES: leftoverOverrides,
  OVER_DETERMINIZATION: overDeterminization,
  resolvedErrors,
  overDetErrors,
  thresholds: {
    resolvedMin: 200,
    compoundMin: 100,
    temptationMin: 50,
    judgmentMin: 50,
  },
  pass:
    resolvedFinalVerdictError === 0 &&
    leftoverOverrides === 0 &&
    overDeterminization === 0 &&
    resolvedCount >= 200 &&
    compoundCount >= 100 &&
    temptationCount >= 50 &&
    judgmentCount >= 50,
};

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT_FILE, JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));

if (!summary.pass) {
  console.error("DETERMINISTIC_RESOLVED_VERDICT_ADVERSARIAL_QUAL: FAIL");
  process.exit(1);
}
console.log("DETERMINISTIC_RESOLVED_VERDICT_ADVERSARIAL_QUAL: PASS");
process.exit(0);
