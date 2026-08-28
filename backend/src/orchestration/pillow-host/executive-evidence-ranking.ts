/**
 * Canonical evidence-strength ranking.
 * Distinguishes RANK_BY_EVIDENCE_STRENGTH from RANK_BY_PERFORMANCE_VALUE.
 * MEASURED_VALUE must never determine EVIDENCE_STRENGTH.
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
  samplingMethod: "FULL_POPULATION" | "SAMPLE" | "PARTIAL" | "UNKNOWN";
  directOrInferred: "DIRECT" | "INFERRED" | "UNKNOWN";
  knownLimitations: string[];
  measuredValue: number | null;
  evidenceStrength: number;
  /** Visible scope qualifier for measured value. */
  scopeQualifier: string;
};

export function classifyRankingObjective(userMessage: string): RankingObjective {
  const t = String(userMessage || "");
  // Evidence cues win even when % / highest also appear.
  if (
    /\b(?:strongest|stronger|weakest|weaker)\s+(?:current\s+)?evidence\b/i.test(t) ||
    /\bevidence[- ](?:strength|base|quality|completeness|coverage)\b/i.test(t) ||
    /\brank(?:ing)?\b.{0,80}\b(?:evidence|verified|population|sample)\b/i.test(t) ||
    /\b(?:by|on)\s+(?:the\s+)?(?:strength|completeness|quality)\s+of\s+(?:the\s+)?(?:supplied\s+)?evidence\b/i.test(
      t,
    ) ||
    /\bfleet[- ]wide\s+evidence\b/i.test(t) ||
    /\bstrength\s+of\s+(?:the\s+)?(?:fleet|population|evidence)\b/i.test(t)
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

function scoreRecord(args: {
  verified: boolean;
  samplingMethod: CanonicalEvidenceRecord["samplingMethod"];
  coverageRatio: number | null;
  body: string;
  knownLimitations: string[];
}): number {
  let strength = 0;
  if (args.verified) strength += 40;
  if (args.samplingMethod === "FULL_POPULATION") strength += 35;
  else if (args.samplingMethod === "PARTIAL") strength += 15;
  else if (args.samplingMethod === "SAMPLE") strength += 10;
  if (args.coverageRatio != null) strength += Math.round(Math.min(1, args.coverageRatio) * 25);
  if (/\bcurrent|july|this\s+month|latest\b/i.test(args.body)) strength += 5;
  if (args.knownLimitations.includes("no_verified_full_population_rate")) strength -= 15;
  if (args.knownLimitations.includes("incomplete_coverage")) strength -= 10;
  if (args.knownLimitations.includes("staleness")) strength -= 20;
  if (args.knownLimitations.includes("interested_or_opinion_source")) strength -= 25;
  return Math.max(0, Math.min(100, strength));
}

function buildScopeQualifier(
  observed: number | null,
  pop: number | null,
  samplingMethod: CanonicalEvidenceRecord["samplingMethod"],
  measured: number | null,
): string {
  if (observed != null && pop != null && observed < pop) {
    const pct = measured != null ? `${measured}% ` : "";
    return `${pct}across the ${observed} valid measured units (of ${pop} deployed; not full population)`;
  }
  if (samplingMethod === "FULL_POPULATION" && observed != null && pop != null) {
    const pct = measured != null ? `${measured}% ` : "";
    return `${pct}across the full deployed population (${observed}/${pop})`;
  }
  if (samplingMethod === "SAMPLE" && observed != null) {
    const pct = measured != null ? `${measured}% ` : "";
    return `${pct}within the observed sample of ${observed}`;
  }
  return measured != null ? `measured ${measured}% (scope as supplied)` : "scope as supplied";
}

/**
 * Parse subject evidence rows from owner pack (generic entity labels).
 * Supports single-line and multi-line "Subject: … N/M … %" blocks.
 */
export function parseCanonicalEvidenceRecords(userMessage: string): CanonicalEvidenceRecord[] {
  const text = String(userMessage || "");
  // Collapse multi-line subject blocks into pseudo-lines for parsing.
  const collapsed = text
    .replace(
      /(?:^|\n)((?:(?:store|lane|ward|dock|hub|site|depot|property|substation|line|fleet)\s+)?[A-Z][A-Za-z0-9_-]{1,40})\s*:\s*\n+([\s\S]*?)(?=(?:\n(?:(?:store|lane|ward|dock|hub|site|depot|property|substation|line|fleet)\s+)?[A-Z][A-Za-z0-9_-]{1,40}\s*:)|$)/gi,
      (_m, subj: string, body: string) => `\n${subj}: ${body.replace(/\n+/g, " ").trim()}\n`,
    )
    .replace(/\n{3,}/g, "\n\n");

  const lines = collapsed.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  const out: CanonicalEvidenceRecord[] = [];
  let idx = 0;
  for (const line of lines) {
    const head =
      /^(?:(?:store|lane|ward|dock|hub|site|depot|property|substation|line|fleet)\s+)?([A-Z][A-Za-z0-9_-]{1,40})\s*[:—-]\s*(.+)$/i.exec(
        line,
      ) ||
      /^([A-Z][A-Za-z0-9_-]{1,40})\s*[:—-]\s*(.+)$/i.exec(line);
    if (!head) continue;
    const subject = head[1]!;
    const body = head[2]!;
    if (
      !/\b(?:verified|sample|census|audit|population|jobs|encounters|picks|rooms|deployed|measured|valid|%\b)/i.test(
        body,
      )
    ) {
      continue;
    }
    const coverage =
      num(/(\d{1,5})\s*(?:valid\s+)?(?:measured|observed|sampled)?\s*\/\s*(\d{1,5})/.exec(body)) !=
      null
        ? (() => {
            const m = /(\d{1,5})\s*(?:valid\s+)?(?:measured|observed|sampled)?\s*\/\s*(\d{1,5})/.exec(
              body,
            )!;
            return { observed: Number(m[1]), pop: Number(m[2]) };
          })()
        : num(/(\d{1,5})\s*\/\s*(\d{1,5})/.exec(body)) != null
          ? (() => {
              const m = /(\d{1,5})\s*\/\s*(\d{1,5})/.exec(body)!;
              return { observed: Number(m[1]), pop: Number(m[2]) };
            })()
          : null;
    const measured = num(/(\d{1,3}(?:\.\d+)?)\s*%/.exec(body));
    const verified = /\bverified\b/i.test(body) && !/\bunverified\b|\bno\s+verified\b/i.test(body);
    const deniesFullPop = /\bno\s+verified\s+full[- ]population\b/i.test(body);
    const incomplete =
      coverage != null && coverage.pop > 0 && coverage.observed < coverage.pop;
    // obs < pop can NEVER be FULL_POPULATION, even if body says census/full-population.
    const claimsFullKeyword =
      !deniesFullPop &&
      /\bfull[- ]population\b|\bcensus\b|\bcomplete\s+population\b|\bentire\s+deployed\b/i.test(body);
    const fullPop =
      !incomplete &&
      !deniesFullPop &&
      (claimsFullKeyword ||
        (coverage != null && coverage.observed === coverage.pop && coverage.pop > 0));
    const sample =
      (/\brandom\s+sample\b|\bsample\s+rate\b|\bsample\b/i.test(body) || deniesFullPop) &&
      !fullPop &&
      !incomplete;
    const samplingMethod: CanonicalEvidenceRecord["samplingMethod"] = fullPop
      ? "FULL_POPULATION"
      : incomplete
        ? "PARTIAL"
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
    if (incomplete) knownLimitations.push("incomplete_coverage");
    if (/\bno\s+verified\s+full[- ]population\b/i.test(body)) {
      knownLimitations.push("no_verified_full_population_rate");
    }
    if (/\bstale|outdated|superseded\b/i.test(body)) knownLimitations.push("staleness");
    if (/\bmanagement\s+opinion|self[- ]report\b/i.test(body)) {
      knownLimitations.push("interested_or_opinion_source");
    }

    const strength = scoreRecord({
      verified,
      samplingMethod,
      coverageRatio,
      body,
      knownLimitations,
    });
    const scopeQualifier = buildScopeQualifier(
      observedSize,
      populationSize,
      samplingMethod,
      measured,
    );

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
      scopeQualifier,
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
    const classRank = (m: CanonicalEvidenceRecord["samplingMethod"]) =>
      m === "FULL_POPULATION" ? 3 : m === "PARTIAL" ? 2 : m === "SAMPLE" ? 1 : 0;
    const aC = classRank(a.samplingMethod);
    const bC = classRank(b.samplingMethod);
    if (bC !== aC) return bC - aC;
    const aCov = a.coverageRatio ?? 0;
    const bCov = b.coverageRatio ?? 0;
    if (bCov !== aCov) return bCov - aCov;
    const aPop = a.populationSize ?? 0;
    const bPop = b.populationSize ?? 0;
    if (bPop !== aPop) return bPop - aPop;
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
    "Evidence-strength order (verification + population coverage; measured % is not strength):",
    ...ranked.map((r, i) => {
      const cov =
        r.observedSize != null && r.populationSize != null
          ? `${r.observedSize}/${r.populationSize}`
          : "coverage unspecified";
      return `${i + 1}. ${r.subject} — ${r.samplingMethod.toLowerCase().replace(/_/g, " ")}, ${
        r.verified ? "verified" : "unverified"
      }, ${cov}; scope: ${r.scopeQualifier} (strength ${r.evidenceStrength})`;
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
  const text = String(answer || "");

  // Higher measured % subject appears before higher-strength subject.
  let valueSubstitution = false;
  for (let i = 0; i < ranked.length; i++) {
    for (let j = i + 1; j < ranked.length; j++) {
      const stronger = ranked[i]!;
      const weaker = ranked[j]!;
      if (stronger.measuredValue == null || weaker.measuredValue == null) continue;
      if (weaker.measuredValue <= stronger.measuredValue) continue;
      const sPos = text.toLowerCase().indexOf(stronger.subject.toLowerCase());
      const wPos = text.toLowerCase().indexOf(weaker.subject.toLowerCase());
      if (wPos >= 0 && sPos >= 0 && wPos < sPos) valueSubstitution = true;
    }
  }

  // SAMPLE / PARTIAL with higher % ranked above FULL_POPULATION.
  const fulls = records.filter((r) => r.samplingMethod === "FULL_POPULATION");
  const incompletes = records.filter(
    (r) => r.samplingMethod === "SAMPLE" || r.samplingMethod === "PARTIAL",
  );
  for (const s of incompletes) {
    for (const f of fulls) {
      if (s.measuredValue == null || f.measuredValue == null) continue;
      if (s.measuredValue <= f.measuredValue) continue;
      const sPos = text.toLowerCase().indexOf(s.subject.toLowerCase());
      const fPos = text.toLowerCase().indexOf(f.subject.toLowerCase());
      if (sPos >= 0 && fPos >= 0 && sPos < fPos) valueSubstitution = true;
    }
  }

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

  // %-led answers with no subject order still need the strength block.
  const percentLed =
    /\b\d{1,3}(?:\.\d+)?\s*%\s+(?:is\s+)?(?:stronger|strongest|better\s+evidence)\b/i.test(text) ||
    /\bstrongest\s+evidence\s+is\s+the\s+\d/i.test(text);

  // Missing subjects / stub collapse: force strength block when evidence objective is clear.
  const subjectsPresent = expectedOrder.filter((name) =>
    new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(text),
  ).length;
  const missingSubjects = subjectsPresent < Math.min(2, expectedOrder.length);

  if (!valueSubstitution && !orderMismatch && !percentLed && !missingSubjects) {
    return { message: text, repaired: false, objective };
  }

  const block = formatEvidenceStrengthRankingBlock(records);
  let message = text;
  // Prefer replacing ranking section body over soft append.
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
  // Strip "X% is strongest evidence" claims that contradict coverage ranking.
  message = message.replace(
    /\b\d{1,3}(?:\.\d+)?\s*%\s+(?:is\s+)?(?:stronger|strongest)\s+(?:evidence|because)[^.!\n]*/gi,
    "evidence strength follows verification and coverage, not observed % alone",
  );
  return { message: message.replace(/\n{3,}/g, "\n\n").trim(), repaired: true, objective };
}

export function sampleOvergeneralizedToPopulation(answer: string, userMessage: string): boolean {
  const records = parseCanonicalEvidenceRecords(userMessage);
  const incompletes = records.filter(
    (r) =>
      (r.samplingMethod === "SAMPLE" || r.samplingMethod === "PARTIAL") &&
      r.measuredValue != null,
  );
  if (incompletes.length < 1) return false;
  const t = String(answer || "");
  for (const s of incompletes) {
    const rate = String(s.measuredValue);
    if (
      new RegExp(
        `\\b(?:full[- ]population|fleet[- ]wide|all\\s+\\d+|population\\s+rate|entire\\s+deployed)\\b[^.\\n]{0,40}${rate.replace(
          ".",
          "\\.",
        )}\\s*%`,
        "i",
      ).test(t) ||
      new RegExp(
        `${rate.replace(".", "\\.")}\\s*%[^.\\n]{0,40}\\b(?:full[- ]population|fleet[- ]wide|all\\s+\\d+|entire\\s+deployed)\\b`,
        "i",
      ).test(t)
    ) {
      return true;
    }
    // "Subject has verified X% performance" without scope when incomplete.
    if (
      new RegExp(
        `\\b${s.subject.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b[^.\\n]{0,60}verified\\s+${rate.replace(
          ".",
          "\\.",
        )}\\s*%\\s+performance\\b`,
        "i",
      ).test(t) &&
      !new RegExp(
        `${rate.replace(".", "\\.")}\\s*%[^\\n]{0,80}\\b(?:valid\\s+measured|observed|of\\s+${s.observedSize}|sample)\\b`,
        "i",
      ).test(t)
    ) {
      return true;
    }
  }
  return false;
}

/** Inject scope qualifiers for incomplete-coverage subjects when missing. */
export function preservePopulationScopeQualifiers(
  answer: string,
  userMessage: string,
): { message: string; repaired: boolean } {
  const records = parseCanonicalEvidenceRecords(userMessage);
  const incompletes = records.filter(
    (r) => r.samplingMethod === "PARTIAL" || r.samplingMethod === "SAMPLE",
  );
  if (incompletes.length < 1) return { message: String(answer || ""), repaired: false };
  let message = String(answer || "");
  let repaired = false;
  for (const r of incompletes) {
    if (r.measuredValue == null || r.observedSize == null) continue;
    const rate = String(r.measuredValue);
    const hasScope = new RegExp(
      `${rate.replace(".", "\\.")}\\s*%[^\\n]{0,100}\\b(?:valid\\s+measured|observed\\s+sample|of\\s+${r.observedSize}|not\\s+full\\s+population|scope:)`,
      "i",
    ).test(message);
    const mentionsRateNearSubject = new RegExp(
      `\\b${r.subject.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b[^\\n]{0,120}${rate.replace(
        ".",
        "\\.",
      )}\\s*%`,
      "i",
    ).test(message);
    if (mentionsRateNearSubject && !hasScope) {
      message = message.replace(
        new RegExp(
          `(\\b${r.subject.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b[^\\n]{0,120})(${rate.replace(
            ".",
            "\\.",
          )}\\s*%)`,
          "i",
        ),
        `$1$2 (${r.scopeQualifier})`,
      );
      repaired = true;
    }
  }
  return { message: message.replace(/\n{3,}/g, "\n\n").trim(), repaired };
}
