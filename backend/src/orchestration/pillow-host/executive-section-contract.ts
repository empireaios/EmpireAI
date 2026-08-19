/**
 * Exact top-level numbered section contract for final-visible answers.
 * Validates AFTER reconstruction/polish. Does not invent missing content.
 */

export type SectionContractReport = {
  expected: number | null;
  visible: number;
  sequenceOk: boolean;
  duplicateNumbers: number[];
  missingNumbers: number[];
  markers: number[];
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
  // Explicit "answer in N numbered parts/sections"
  const parts = t.match(
    /\b(?:in|as|use)\s+(\d+|five|six|seven|eight)\s+(?:numbered\s+)?(?:parts|sections|headings)\b/i,
  );
  if (parts) {
    const raw = parts[1]!.toLowerCase();
    const n = WORD_TO_NUM[raw] ?? Number(raw);
    if (Number.isFinite(n) && n >= 2 && n <= 20) return n;
  }
  return null;
}

/** Top-level markers: line-start N. or N) only (not nested bullets). */
export function extractTopLevelSectionMarkers(answer: string): number[] {
  const lines = String(answer || "").split(/\n/);
  const markers: number[] = [];
  for (const line of lines) {
    const m = /^\s*(\d{1,2})[.)]\s+\S/.exec(line);
    if (!m) continue;
    // Skip deeply indented nested items (4+ spaces / tab)
    if (/^[ \t]{4,}/.test(line)) continue;
    const n = Number(m[1]);
    if (n >= 1 && n <= 30) markers.push(n);
  }
  return markers;
}

export function assessSectionContract(
  answer: string,
  expected: number | null,
): SectionContractReport {
  const markers = extractTopLevelSectionMarkers(answer);
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
      uniqDups.length === 0;
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
  };
}

/**
 * Renumber top-level section markers to 1..K in document order.
 * Does not invent sections. Collapses duplicate numbers.
 */
export function renumberTopLevelSections(answer: string, expected?: number | null): string {
  const lines = String(answer || "").split(/\n/);
  let idx = 0;
  const out = lines.map((line) => {
    const m = /^(\s*)(\d{1,2})([.)]\s+)(\S.*)$/.exec(line);
    if (!m) return line;
    if (/^[ \t]{4,}/.test(line)) return line;
    idx += 1;
    if (expected != null && idx > expected) {
      // Extra markers beyond expected — keep content, drop number collision by continuing
    }
    return `${m[1]}${idx}${m[3]}${m[4]}`;
  });
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

/**
 * Enforce exact section contract when expected N is known.
 * If too few sections, cannot invent — leave content and append an honest note.
 */
export function enforceExactSectionContract(
  answer: string,
  expected: number | null,
): { message: string; report: SectionContractReport; repaired: boolean } {
  let message = String(answer || "").trim();
  let repaired = false;
  if (expected == null || expected < 2) {
    return { message, report: assessSectionContract(message, expected), repaired: false };
  }

  let report = assessSectionContract(message, expected);
  if (report.duplicateNumbers.length > 0 || !report.markers.every((n, i) => n === i + 1)) {
    message = renumberTopLevelSections(message, expected);
    repaired = true;
    report = assessSectionContract(message, expected);
  }

  // If still short after renumber (content lacked enough markers), do not invent bodies.
  if (report.visible < expected && !/section contract|could not materialise all/i.test(message)) {
    message = `${message}\n\n**Section contract:** ${report.visible} of ${expected} requested top-level numbered sections are visible; missing section numbers remain open rather than invented.`;
    repaired = true;
    report = assessSectionContract(message, expected);
  }

  return { message, report, repaired };
}
