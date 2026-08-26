/**
 * Canonical evidence-strength ranking.
 * Distinguishes RANK_BY_EVIDENCE_STRENGTH from RANK_BY_PERFORMANCE_VALUE.
 * Does not encode sealed examination content.
 */

export type RankingObjective =
  | "EVIDENCE_STRENGTH"
  | "PERFORMANCE_VALUE"
  | "BUSINESS_VALUE"
  | "ELIGIBILITY"
  | "CONFIDENCE"
  | "UNKNOWN";

export type CanonicalEvidenceRecord = {
  evidenceId: string;
  subject: string;
  source: string;
  verified: boolean;
  current: boolean;
  populationSize: number | null;
  observedSize: number | null;
  coverageRatio: number | null;
  samplingMethod: "FULL_POPULATION" | "SAMPLE" | "UNKNOWN";
  directOrInferred: "DIRECT" | "INFERRED" | "UNKNOWN";
  knownLimitations: string[];
  measuredValue: number | null;
  evidenceStrength: number;
};

export function classifyRankingObjective(userMessage: string): RankingObjective {
  const t = String(userMessage || "");
  if (
    /\b(?:strongest|stronger|weakest|weaker)\s+(?:current\s+)?evidence\b/i.test(t) ||
    /\bevidence[- ](?:strength|base|quality|completeness|coverage)\b/i.test(t) ||
    /\brank(?:ing)?\b.{0,80}\b(?:evidence|verified|population|sample)\b/i.test(t) ||
    /\b(?:by|on)\s+(?:the\s+)?(?:strength|completeness|quality)\s+of\s+(?:the\s+)?(?:supplied\s+)?evidence\b/i.test(
      t,
    )
  ) {
    return "EVIDENCE_STRENGTH";
  }
  if (/\brank(?:ing)?\b.{0,60}\b(?:eligib|gate|authoris)/i.test(t)) return "ELIGIBILITY";
  if (/\brank(?:ing)?\b.{0,60}\b(?:business|profit|roi|revenue)\b/i.test(t)) {
    return "BUSINESS_VALUE";
  }
  if (/\brank(?:ing)?\b.{0,60}\b(?:confidence|certainty)\b/i.test(t)) return "CONFIDENCE";
  if (
    /\brank(?:ing)?\b.{0,60}\b(?:performance|rate|percent|%|highest|lowest)\b/i.test(t) ||
    /\bhighest\s+(?:observed\s+)?(?:rate|percent|%)\b/i.test(t)
  ) {
    return "PERFORMANCE_VALUE";
  }
  return "UNKNOWN";
}

function num(m: RegExpExecArray | null, i = 1): number | null {
  if (!m?.[i]) return null;
  const n = Number(String(m[i]).replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

/**
 * Parse subject evidence rows from owner pack (generic entity labels).
 */
export function parseCanonicalEvidenceRecords(userMessage: string): CanonicalEvidenceRecord[] {
  const text = String(userMessage || "");
  const lines = text.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  const out: CanonicalEvidenceRecord[] = [];
  let idx = 0;
  for (const line of lines) {
    // "Store Pine: verified full-population … 240/240 … 95.0%."
    const head =
      /^(?:(?:store|lane|ward|dock|hub|site|depot|property|substation|line)\s+)?([A-Z][A-Za-z0-9_-]{1,40})\s*[:—-]\s*(.+)$/i.exec(
        line,
      ) ||
      /^([A-Z][A-Za-z0-9_-]{1,40})\s*[:—-]\s*(.+)$/i.exec(line);
    if (!head) continue;
    const subject = head[1]!;
    const body = head[2]!;
    if (!/\b(?:verified|sample|census|audit|population|jobs|encounters|picks|rooms|%\b)/i.test(body)) {
      continue;
    }
    const coverage =
      num(/(\d{1,5})\s*\/\s*(\d{1,5})/.exec(body)) != null
        ? (() => {
            const m = /(\d{1,5})\s*\/\s*(\d{1,5})/.exec(body)!;
            return { observed: Number(m[1]), pop: Number(m[2]) };
          })()
        : null;
    const measured = num(/(\d{1,3}(?:\.\d+)?)\s*%/.exec(body));
    const verified = /\bverified\b/i.test(body) && !/\bunverified\b|\bno\s+verified\b/i.test(body);
    const deniesFullPop = /\bno\s+verified\s+full[- ]population\b/i.test(body);
    const fullPop =
      !deniesFullPop &&
      (/\bfull[- ]population\b|\bcensus\b|\bcomplete\s+population\b/i.test(body) ||
        (coverage != null && coverage.observed === coverage.pop && coverage.pop > 0));
    const sample =
      (/\brandom\s+sample\b|\bsample\s+rate\b|\bsample\b/i.test(body) || deniesFullPop) &&
      !fullPop;
    const samplingMethod: CanonicalEvidenceRecord["samplingMethod"] = fullPop
      ? "FULL_POPULATION"
      : sample
        ? "SAMPLE"
        : "UNKNOWN";
    const populationSize = coverage?.pop ?? null;
    const observedSize = coverage?.observed ?? null;
    const coverageRatio =
      populationSize && observedSize != null && populationSize > 0
        ? observedSize / populationSize
        : fullPop
          ? 1
          : null;
    const knownLimitations: string[] = [];
    if (sample) knownLimitations.push("sample_not_full_population");
    if (/\bno\s+verified\s+full[- ]population\b/i.test(body)) {
      knownLimitations.push("no_verified_full_population_rate");
    }
    if (/\bstale|outdated|superseded\b/i.test(body)) knownLimitations.push("staleness");
    if (/\bmanagement\s+opinion|self[- ]report\b/i.test(body)) {
      knownLimitations.push("interested_or_opinion_source");
    }

    // Strength: verification + coverage dominate; measured value does NOT.
    let strength = 0;
    if (verified) strength += 40;
    if (samplingMethod === "FULL_POPULATION") strength += 35;
    else if (samplingMethod === "SAMPLE") strength += 10;
    if (coverageRatio != null) strength += Math.round(Math.min(1, coverageRatio) * 20);
    if (/\bcurrent|july|this\s+month|latest\b/i.test(body)) strength += 5;
    if (knownLimitations.includes("no_verified_full_population_rate")) strength -= 15;
    if (knownLimitations.includes("staleness")) strength -= 20;
    if (knownLimitations.includes("interested_or_opinion_source")) strength -= 25;
    strength = Math.max(0, Math.min(100, strength));

    out.push({
      evidenceId: `ev_${++idx}_${subject.toLowerCase()}`,
      subject,
      source: body.slice(0, 160),
      verified,
      current: !/\bstale|outdated|superseded\b/i.test(body),
      populationSize,
      observedSize,
      coverageRatio,
      samplingMethod,
      directOrInferred: /\binferred|extrapolat/i.test(body) ? "INFERRED" : "DIRECT",
      knownLimitations,
      measuredValue: measured,
      evidenceStrength: strength,
    });
  }
  return out;
}

export function rankByEvidenceStrength(
  records: CanonicalEvidenceRecord[],
): CanonicalEvidenceRecord[] {
  return [...records].sort((a, b) => {
    if (b.evidenceStrength !== a.evidenceStrength) {
      return b.evidenceStrength - a.evidenceStrength;
    }
    const aFull = a.samplingMethod === "FULL_POPULATION" ? 1 : 0;
    const bFull = b.samplingMethod === "FULL_POPULATION" ? 1 : 0;
    if (bFull !== aFull) return bFull - aFull;
    const aPop = a.populationSize ?? 0;
    const bPop = b.populationSize ?? 0;
    if (bPop !== aPop) return bPop - aPop;
    const aCov = a.coverageRatio ?? 0;
    const bCov = b.coverageRatio ?? 0;
    if (bCov !== aCov) return bCov - aCov;
    // Never use measuredValue as tie-break for evidence strength.
    return a.subject.localeCompare(b.subject);
  });
}

export function formatEvidenceStrengthRankingBlock(
  records: CanonicalEvidenceRecord[],
): string {
  const ranked = rankByEvidenceStrength(records);
  if (ranked.length < 2) return "";
  const lines = [
    "Evidence-strength order (verification + population coverage; not observed % alone):",
    ...ranked.map((r, i) => {
      const cov =
        r.observedSize != null && r.populationSize != null
          ? `${r.observedSize}/${r.populationSize}`
          : "coverage unspecified";
      return `${i + 1}. ${r.subject} — ${r.samplingMethod.toLowerCase().replace(/_/g, " ")}, ${
        r.verified ? "verified" : "unverified"
      }, ${cov} (strength ${r.evidenceStrength})`;
    }),
  ];
  return lines.join("\n");
}

/**
 * When ranking objective is evidence strength, rewrite a malformed ranking section
 * that ordered by measured value alone.
 */
export function repairEvidenceStrengthRanking(
  answer: string,
  userMessage: string,
): { message: string; repaired: boolean; objective: RankingObjective } {
  const objective = classifyRankingObjective(userMessage);
  if (objective !== "EVIDENCE_STRENGTH") {
    return { message: String(answer || ""), repaired: false, objective };
  }
  const records = parseCanonicalEvidenceRecords(userMessage);
  if (records.length < 2) {
    return { message: String(answer || ""), repaired: false, objective };
  }
  const ranked = rankByEvidenceStrength(records);
  const expectedOrder = ranked.map((r) => r.subject.toLowerCase());

  // Detect value-for-strength substitution: sample with higher % ranked above full pop.
  const samples = records.filter((r) => r.samplingMethod === "SAMPLE");
  const fulls = records.filter((r) => r.samplingMethod === "FULL_POPULATION");
  let valueSubstitution = false;
  const text = String(answer || "");
  for (const s of samples) {
    for (const f of fulls) {
      if (s.measuredValue == null || f.measuredValue == null) continue;
      if (s.measuredValue <= f.measuredValue) continue;
      const sPos = text.toLowerCase().indexOf(s.subject.toLowerCase());
      const fPos = text.toLowerCase().indexOf(f.subject.toLowerCase());
      if (sPos >= 0 && fPos >= 0 && sPos < fPos) {
        valueSubstitution = true;
      }
    }
  }

  // Also check if order of first mentions disagrees with strength order among known subjects.
  const firstMentions = expectedOrder
    .map((name) => {
      const re = new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
      const m = re.exec(text);
      return m ? { name, idx: m.index } : null;
    })
    .filter(Boolean) as { name: string; idx: number }[];
  firstMentions.sort((a, b) => a.idx - b.idx);
  const mentionedOrder = firstMentions.map((x) => x.name);
  const orderMismatch =
    mentionedOrder.length >= 2 &&
    mentionedOrder.some((n, i) => expectedOrder.indexOf(n) !== i && expectedOrder.includes(n));

  if (!valueSubstitution && !orderMismatch) {
    return { message: text, repaired: false, objective };
  }

  const block = formatEvidenceStrengthRankingBlock(records);
  // Replace a "ranking" section body if present; else append under a clear marker.
  let message = text;
  const rankingSection =
    /((?:^|\n)\s*\d+[.)]\s*[^\n]*(?:rank|evidence)[^\n]*\n)([\s\S]*?)(?=(?:\n\s*\d+[.)]\s+)|\s*$)/i.exec(
      message,
    );
  if (rankingSection) {
    message =
      message.slice(0, rankingSection.index) +
      rankingSection[1] +
      block +
      "\n" +
      message.slice((rankingSection.index ?? 0) + rankingSection[0].length);
  } else if (!/Evidence-strength order/i.test(message)) {
    message = `${message}\n\n${block}`;
  } else {
    message = message.replace(
      /Evidence-strength order[\s\S]*?(?=\n\s*\d+[.)]\s+|\s*$)/i,
      `${block}\n`,
    );
  }
  return { message: message.replace(/\n{3,}/g, "\n\n").trim(), repaired: true, objective };
}

export function sampleOvergeneralizedToPopulation(answer: string, userMessage: string): boolean {
  const records = parseCanonicalEvidenceRecords(userMessage);
  const samples = records.filter((r) => r.samplingMethod === "SAMPLE" && r.measuredValue != null);
  if (samples.length < 1) return false;
  const t = String(answer || "");
  for (const s of samples) {
    const rate = String(s.measuredValue);
    if (
      new RegExp(
        `\\b(?:full[- ]population|fleet[- ]wide|all\\s+\\d+|population\\s+rate)\\b[^.\\n]{0,40}${rate.replace(
          ".",
          "\\.",
        )}\\s*%`,
        "i",
      ).test(t) ||
      new RegExp(
        `${rate.replace(".", "\\.")}\\s*%[^.\\n]{0,40}\\b(?:full[- ]population|fleet[- ]wide|all\\s+\\d+)\\b`,
        "i",
      ).test(t)
    ) {
      return true;
    }
  }
  return false;
}
