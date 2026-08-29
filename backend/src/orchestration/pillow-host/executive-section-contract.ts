/**
 * Exact top-level numbered section contract for final-visible answers.
 * Distinguishes TOP_LEVEL sections from nested numbered items inside a section.
 * Does not invent missing content. Does not encode sealed exams.
 */

export type SectionContractReport = {
  expected: number | null;
  visible: number;
  sequenceOk: boolean;
  duplicateNumbers: number[];
  missingNumbers: number[];
  markers: number[];
  nestedPromoted: number;
};

const WORD_TO_NUM: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
};

export function detectExpectedTopLevelSections(userMessage: string): number | null {
  const t = String(userMessage || "");
  const word = t.match(
    /\b(?:exactly\s+)?(one|two|three|four|five|six|seven|eight|nine|ten|\d+)\s+(?:numbered\s+)?(?:top-?level\s+)?sections?\b/i,
  );
  if (word) {
    const raw = word[1]!.toLowerCase();
    const n = WORD_TO_NUM[raw] ?? Number(raw);
    if (Number.isFinite(n) && n >= 2 && n <= 20) return n;
  }
  const parts = t.match(
    /\b(?:in|as|use|with|answer(?:\s+with)?)\s+(\d+|five|six|seven|eight)\s+(?:numbered\s+)?(?:parts|sections|headings)\b/i,
  );
  if (parts) {
    const raw = parts[1]!.toLowerCase();
    const n = WORD_TO_NUM[raw] ?? Number(raw);
    if (Number.isFinite(n) && n >= 2 && n <= 20) return n;
  }
  return null;
}

/**
 * Extract requested section title hints from the user ask (for matching).
 * Prefers Cover:/structure prose over numbered claim quotes nested under a claim audit.
 */
export function extractRequestedSectionTitles(userMessage: string): string[] {
  const expected = detectExpectedTopLevelSections(userMessage);
  if (expected == null) return [];
  const text = String(userMessage || "");

  // "Cover: forecast vs realised; identity; then claim audit of: … Then synthesis."
  const cover = /\bCover:\s*([^\n]+)/i.exec(text);
  if (cover?.[1]) {
    const parts = cover[1]
      .split(/\s*;\s*|\s+then\s+/i)
      .map((s) =>
        s
          .replace(/\bclaim\s+audit\s+of:?\s*$/i, "Claim audit")
          .replace(/\bof:?\s*$/i, "")
          .trim(),
      )
      .filter((s) => s.length >= 3 && !/^["“]/.test(s));
    const titles = parts.map((t) =>
      /claim\s+audit/i.test(t) ? "Claim audit" : t.replace(/^of:?\s*/i, "").trim(),
    );
    if (/\bThen\s+synthesis\b/i.test(text) && !titles.some((t) => /synthesis/i.test(t))) {
      titles.push("Synthesis");
    }
    if (titles.length >= 2) {
      while (titles.length < expected) {
        titles.push(`Section ${titles.length + 1}`);
      }
      return titles.slice(0, expected);
    }
  }

  const titles: string[] = [];
  for (let i = 1; i <= expected; i++) {
    const m = new RegExp(
      `(?:^|\\n)\\s*${i}[.)]\\s+([^\\n]{3,120})`,
      "i",
    ).exec(text);
    if (!m?.[1]) continue;
    const title = m[1].trim();
    // Numbered quoted lines under a claim-audit ask are claims, not section titles.
    if (/^["“]/.test(title) && /\bclaim\s+audit\b/i.test(text)) continue;
    titles.push(title);
  }
  return titles;
}

function isNestedIndent(line: string): boolean {
  return /^[ \t]{2,}/.test(line);
}

/**
 * Top-level markers when no expected N: line-start N. / N) excluding nested indent.
 */
export function extractTopLevelSectionMarkers(answer: string): number[] {
  const lines = String(answer || "").split(/\n/);
  const markers: number[] = [];
  for (const line of lines) {
    // Plain "1. Title" / "1) Title" or markdown "### 1. Title" / "### 1) Title"
    const m =
      /^\s*(?:#{1,3}\s*)?(\d{1,2})[.)]\s+\S/.exec(line) ||
      /^\s*#{1,3}\s*(\d{1,2})\s+[A-Za-z]/.exec(line);
    if (!m) continue;
    if (isNestedIndent(line)) continue;
    const n = Number(m[1]);
    if (n >= 1 && n <= 30) markers.push(n);
  }
  return markers;
}

/**
 * When expected N is known, keep only the N top-level section starts.
 * Nested lists that continue numbering (3,4,5 inside section 2) or restart at 1
 * are excluded from top-level count.
 */
export function extractContractTopLevelMarkers(
  answer: string,
  expected: number | null,
  sectionTitles: string[] = [],
): { markers: number[]; nestedPromoted: number } {
  if (expected == null || expected < 2) {
    return { markers: extractTopLevelSectionMarkers(answer), nestedPromoted: 0 };
  }
  const lines = String(answer || "").split(/\n/);
  const markers: number[] = [];
  let nestedPromoted = 0;
  let nextExpected = 1;
  let openSection = false;

  for (const line of lines) {
    const m = /^(\s*)(?:#{1,3}\s*)?(\d{1,2})[.)]\s+(\S.*)$/.exec(line) ||
      /^(\s*)#{1,3}\s*(\d{1,2})\s+(\S.*)$/.exec(line);
    if (!m) continue;
    if (isNestedIndent(line)) continue;
    const n = Number(m[2]);
    const body = m[3]!.trim();
    const titleHint =
      sectionTitles[nextExpected - 1] &&
      sectionTitles[nextExpected - 1]!.length >= 4 &&
      body.toLowerCase().includes(
        sectionTitles[nextExpected - 1]!.toLowerCase().slice(0, 24),
      );

    // Accept as next top-level if number matches nextExpected, or title matches.
    if (n === nextExpected || (titleHint && nextExpected <= expected)) {
      markers.push(nextExpected);
      nextExpected += 1;
      openSection = true;
      if (nextExpected > expected) openSection = false;
      continue;
    }

    // Extra numbered line while collecting 1..N — nested item promoted to top-level shape.
    if (nextExpected <= expected + 1 && markers.length >= 1) {
      nestedPromoted += 1;
      continue;
    }
    if (markers.length >= expected) {
      nestedPromoted += 1;
    }
  }

  // Fallback: if we failed to bind titles and got nothing, use first contiguous 1..N run.
  if (markers.length < expected) {
    const all = extractTopLevelSectionMarkers(answer);
    const run: number[] = [];
    for (let i = 1; i <= expected; i++) {
      if (all.includes(i)) run.push(i);
      else break;
    }
    if (run.length === expected) {
      return {
        markers: run,
        nestedPromoted: Math.max(0, all.length - expected),
      };
    }
  }

  return { markers, nestedPromoted };
}

export function assessSectionContract(
  answer: string,
  expected: number | null,
  sectionTitles: string[] = [],
): SectionContractReport {
  const { markers, nestedPromoted } =
    expected != null
      ? extractContractTopLevelMarkers(answer, expected, sectionTitles)
      : { markers: extractTopLevelSectionMarkers(answer), nestedPromoted: 0 };
  const visible = markers.length;
  const duplicateNumbers = markers.filter((n, i) => markers.indexOf(n) !== i);
  const uniqDups = [...new Set(duplicateNumbers)];
  const missingNumbers: number[] = [];
  let sequenceOk = true;
  if (expected != null) {
    for (let i = 1; i <= expected; i++) {
      if (!markers.includes(i)) missingNumbers.push(i);
    }
    sequenceOk =
      markers.length === expected &&
      markers.every((n, i) => n === i + 1) &&
      uniqDups.length === 0 &&
      nestedPromoted === 0;
  } else {
    sequenceOk = uniqDups.length === 0;
  }
  return {
    expected,
    visible,
    sequenceOk,
    duplicateNumbers: uniqDups,
    missingNumbers,
    markers,
    nestedPromoted,
  };
}

/**
 * Demote numbered lines that are not the N contract section headers into nested bullets.
 */
export function demoteNestedNumberedItems(
  answer: string,
  expected: number,
  sectionTitles: string[] = [],
): string {
  const lines = String(answer || "").split(/\n/);
  let nextExpected = 1;
  const out: string[] = [];
  let nestedIdx = 0;

  for (const line of lines) {
    const m =
      /^(\s*)(?:#{1,3}\s*)?(\d{1,2})([.)]\s+)(\S.*)$/.exec(line) ||
      /^(\s*)(#{1,3}\s*)(\d{1,2})(\s+)(\S.*)$/.exec(line);
    if (!m || isNestedIndent(line)) {
      out.push(line);
      continue;
    }
    // Normalize ### N Title → N. Title for contract demotion path.
    let n: number;
    let sep: string;
    let body: string;
    if (m.length === 5) {
      n = Number(m[2]);
      sep = m[3]!;
      body = m[4]!.trim();
    } else {
      n = Number(m[3]);
      sep = ". ";
      body = m[5]!.trim();
    }
    const titleHint =
      sectionTitles[nextExpected - 1] &&
      sectionTitles[nextExpected - 1]!.length >= 4 &&
      body.toLowerCase().includes(
        sectionTitles[nextExpected - 1]!.toLowerCase().slice(0, 24),
      );

    if (nextExpected <= expected && (n === nextExpected || titleHint)) {
      out.push(`${nextExpected}${sep}${body}`);
      nextExpected += 1;
      nestedIdx = 0;
      continue;
    }

    // Nested item — indent and use bullet to avoid top-level collision.
    nestedIdx += 1;
    out.push(`    - ${body}`);
  }
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

/**
 * Renumber only the N top-level contract sections; leave nested bullets alone.
 */
export function renumberTopLevelSections(answer: string, expected?: number | null): string {
  if (expected != null && expected >= 2) {
    // Prefer demotion path for exact contracts.
    return demoteNestedNumberedItems(answer, expected);
  }
  const lines = String(answer || "").split(/\n/);
  let idx = 0;
  const out = lines.map((line) => {
    const m = /^(\s*)(\d{1,2})([.)]\s+)(\S.*)$/.exec(line);
    if (!m) return line;
    if (isNestedIndent(line)) return line;
    idx += 1;
    return `${m[1]}${idx}${m[3]}${m[4]}`;
  });
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

export function enforceExactSectionContract(
  answer: string,
  expected: number | null,
  sectionTitles: string[] = [],
): { message: string; report: SectionContractReport; repaired: boolean } {
  let message = String(answer || "").trim();
  let repaired = false;
  if (expected == null || expected < 2) {
    return { message, report: assessSectionContract(message, expected), repaired: false };
  }

  let report = assessSectionContract(message, expected, sectionTitles);
  if (
    report.nestedPromoted > 0 ||
    report.visible !== expected ||
    report.duplicateNumbers.length > 0 ||
    !report.markers.every((n, i) => n === i + 1)
  ) {
    message = demoteNestedNumberedItems(message, expected, sectionTitles);
    repaired = true;
    report = assessSectionContract(message, expected, sectionTitles);
  }

  // Never append section-contract diagnostics into user-visible text.
  // Shortfall is reported via assessSectionContract / final-visible gate (fail/regenerate).
  return { message, report, repaired };
}
