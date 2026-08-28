/**
 * Final-visible contract corpus — objective parser + evidence quality.
 * Domains: Harbor, Atlas, Cobalt, Riverton, Quartz (no sealed exams).
 */

export type FinalContractCase = {
  id: string;
  userMessage: string;
  answer: string;
  expectOk: boolean;
  expectedSections?: number;
  expectedClaims?: number;
};

const DOMAINS = ["Harbor", "Atlas", "Cobalt", "Riverton", "Quartz", "Marble", "Cedar", "Orchid"] as const;

function claimBlock(n: number, verdict = true, reason = true): string {
  const v = verdict
    ? `**Verdict:** Unproven\n${reason ? `The supplied pack does not establish claim ${n} as supported.` : ""}`
    : "";
  return `### Claim ${n}\n"Synthetic claim ${n} about operations at site ${n}."\n${v}`.trim();
}

function sections(n: number, nestIn = 0): string {
  const titles = [
    "Snapshot",
    "Evidence-strength ranking",
    "Population-scope note",
    "Claim audit",
    "Recommendation",
    "Closing",
    "Risks",
    "Appendix",
  ];
  const lines: string[] = [];
  for (let i = 1; i <= n; i++) {
    lines.push(`${i}. ${titles[i - 1] || `Section ${i}`}`);
    if (i === nestIn) {
      lines.push("    - Nested Alpha");
      lines.push("    - Nested Beta");
      lines.push("    - Nested Gamma");
    } else {
      lines.push(`Body for section ${i}.`);
    }
  }
  return lines.join("\n");
}

export function buildSectionContractCorpus(): FinalContractCase[] {
  const out: FinalContractCase[] = [];
  const counts = [3, 5, 6, 8];
  for (let i = 0; i < 100; i++) {
    const expected = counts[i % counts.length]!;
    const domain = DOMAINS[i % DOMAINS.length]!;
    const userMessage = [
      `${domain} logistics analysis only. Do not mention Mini Fan or Birth.`,
      `Answer in exactly ${expected} numbered sections:`,
      ...Array.from({ length: expected }, (_, j) => `${j + 1}. Section ${j + 1}`),
    ].join("\n");
    const good = sections(expected, 2);
    const badShort = sections(Math.max(2, expected - 1));
    const badExtra = sections(expected) + `\n${expected + 1}. Extra\n${expected + 2}. Extra2`;
    const withDiag =
      sections(expected) +
      `\n\n**Section contract:** 0 of ${expected} requested top-level numbered sections are visible; missing section numbers remain open rather than invented.`;
    out.push({
      id: `sec_good_${i}`,
      userMessage,
      answer: good,
      expectOk: true,
      expectedSections: expected,
    });
    if (i % 4 === 0) {
      out.push({
        id: `sec_diag_${i}`,
        userMessage,
        answer: withDiag,
        expectOk: false,
        expectedSections: expected,
      });
    }
    if (i % 5 === 0) {
      out.push({
        id: `sec_short_${i}`,
        userMessage,
        answer: badShort,
        expectOk: false,
        expectedSections: expected,
      });
    }
    if (i % 7 === 0) {
      out.push({
        id: `sec_extra_${i}`,
        userMessage,
        answer: badExtra,
        expectOk: false,
        expectedSections: expected,
      });
    }
  }
  return out.slice(0, 120);
}

export function buildClaimContractCorpus(): FinalContractCase[] {
  const out: FinalContractCase[] = [];
  const ns = [1, 2, 5, 8, 12];
  for (let i = 0; i < 100; i++) {
    const n = ns[i % ns.length]!;
    const domain = DOMAINS[i % DOMAINS.length]!;
    const quotes = Array.from(
      { length: n },
      (_, j) => `"${domain} line-${j + 1} shortage is independent of peer-${j + 1}."`,
    );
    const userMessage = [
      `${domain} claim audit only. Synthetic scenario.`,
      `Audit each of the following ${n} quoted claims separately with an explicit Verdict and reason for every claim:`,
      ...quotes,
    ].join("\n");
    const good = Array.from({ length: n }, (_, j) => claimBlock(j + 1, true, true)).join("\n\n");
    const missingVerdict = Array.from({ length: n }, (_, j) =>
      claimBlock(j + 1, j >= Math.ceil(n / 2), true),
    ).join("\n\n");
    const missingReason = Array.from({ length: n }, (_, j) => claimBlock(j + 1, true, j !== 0)).join(
      "\n\n",
    );
    out.push({ id: `cl_good_${i}`, userMessage, answer: good, expectOk: true, expectedClaims: n });
    if (i % 2 === 0) {
      out.push({
        id: `cl_miss_v_${i}`,
        userMessage,
        answer: missingVerdict,
        expectOk: false,
        expectedClaims: n,
      });
    }
    if (i % 3 === 0) {
      out.push({
        id: `cl_miss_r_${i}`,
        userMessage,
        answer: missingReason,
        expectOk: false,
        expectedClaims: n,
      });
    }
  }
  return out.slice(0, 120);
}

export function buildEvidenceStrengthCorpus(): FinalContractCase[] {
  const out: FinalContractCase[] = [];
  for (let i = 0; i < 100; i++) {
    const a = DOMAINS[i % DOMAINS.length]!;
    const b = DOMAINS[(i + 3) % DOMAINS.length]!;
    const partialPct = (8.5 + (i % 5) * 0.1).toFixed(1);
    const fullPct = (8 + (i % 3) * 0.1).toFixed(1);
    const userMessage = [
      `${a}/${b} fleet evidence ranking only.`,
      "Rank by strength of fleet-wide evidence (not observed %).",
      `${a}:`,
      `28 valid measured / 40 deployed`,
      `${partialPct}%.`,
      `${b}:`,
      `25 valid measured / 25 deployed`,
      `${fullPct}%.`,
    ].join("\n");
    const good = [
      "Evidence-strength order (verification + population coverage; measured % is not strength):",
      `1. ${b} — full population, verified, 25/25; scope: ${fullPct}% across the full deployed population (25/25) (strength 99)`,
      `2. ${a} — partial, verified, 28/40; scope: ${partialPct}% across the 28 valid measured units (of 40 deployed; not full population) (strength 70)`,
    ].join("\n");
    const bad = [
      `Strongest evidence is the ${partialPct}% result versus the ${fullPct}% result.`,
      `1. ${a} at ${partialPct}%`,
      `2. ${b} at ${fullPct}%`,
    ].join("\n");
    out.push({ id: `ev_good_${i}`, userMessage, answer: good, expectOk: true });
    out.push({ id: `ev_bad_${i}`, userMessage, answer: bad, expectOk: false });
  }
  return out;
}

export function buildPopulationScopeCorpus(): FinalContractCase[] {
  const out: FinalContractCase[] = [];
  for (let i = 0; i < 100; i++) {
    const subj = DOMAINS[i % DOMAINS.length]!;
    const userMessage = [
      `${subj} population scope check.`,
      "Report measured reduction with correct scope.",
      `${subj}: verified 28 valid measured / 40 deployed 8.5%.`,
      "Peer: verified full-population 25/25 8%.",
    ].join("\n");
    const good = `${subj} shows 8.5% across the 28 valid measured units (of 40 deployed; not full population).`;
    const bad = `${subj} has verified 8.5% performance fleet-wide across the entire deployed population.`;
    out.push({ id: `sc_good_${i}`, userMessage, answer: good, expectOk: true });
    out.push({ id: `sc_bad_${i}`, userMessage, answer: bad, expectOk: false });
  }
  return out;
}

export function buildCombinedCorpus(): FinalContractCase[] {
  const out: FinalContractCase[] = [];
  for (let i = 0; i < 150; i++) {
    const domain = DOMAINS[i % DOMAINS.length]!;
    const peer = DOMAINS[(i + 2) % DOMAINS.length]!;
    const userMessage = [
      `${domain} combined executive pack. Synthetic only.`,
      "Answer in exactly 6 numbered sections:",
      "1. Snapshot",
      "2. Evidence-strength ranking (nest items)",
      "3. Population-scope note",
      "4. Claim audit",
      "5. Recommendation",
      "6. Closing",
      `Rank by strength of fleet-wide evidence.`,
      `${domain}: 28 valid measured / 40 deployed 8.5%.`,
      `${peer}: verified full-population 25/25 8%.`,
      "Audit each of the following 3 quoted claims separately with an explicit Verdict and reason:",
      `"${domain} shortage is independent."`,
      `"Forecast equals realised for batch Z${i}."`,
      `"${peer} is blocked."`,
    ].join("\n");
    const good = [
      "1. Snapshot",
      "Metrics as supplied.",
      "2. Evidence-strength ranking",
      `    - ${peer} full population 25/25`,
      `    - ${domain} partial 28/40`,
      "3. Population-scope note",
      `${domain} 8.5% across the 28 valid measured units (of 40 deployed; not full population).`,
      "4. Claim audit",
      claimBlock(1),
      claimBlock(2),
      claimBlock(3),
      "5. Recommendation",
      "Prefer the stronger evidence base before fleet expansion.",
      "6. Closing",
      "End.",
    ].join("\n");
    const bad = [
      good,
      "",
      "**Section contract:** 0 of 6 requested top-level numbered sections are visible.",
    ].join("\n");
    out.push({ id: `comb_good_${i}`, userMessage, answer: good, expectOk: true, expectedSections: 6, expectedClaims: 3 });
    if (i % 2 === 0) {
      out.push({
        id: `comb_bad_${i}`,
        userMessage,
        answer: bad,
        expectOk: false,
        expectedSections: 6,
        expectedClaims: 3,
      });
    }
  }
  return out.slice(0, 200);
}

export function buildNegativeControls(): FinalContractCase[] {
  return [
    {
      id: "neg_diag_tail",
      userMessage: "Answer in exactly 6 numbered sections:\n1. A\n2. B\n3. C\n4. D\n5. E\n6. F",
      answer:
        "1. A\n2. B\n3. C\n4. D\n5. E\n6. F\n\n**Section contract:** 0 of 6 requested top-level numbered sections are visible.",
      expectOk: false,
      expectedSections: 6,
    },
    {
      id: "neg_missing_verdicts",
      userMessage: [
        "Audit each of the following 5 quoted claims separately with an explicit Verdict and reason:",
        '"Alpha shortage is independent."',
        '"Beta never lost staff."',
        '"Gamma equals Partner Assembly."',
        '"Delta forecast equals realised."',
        '"Epsilon is blocked."',
      ].join("\n"),
      answer: [claimBlock(4), claimBlock(5), '### Claim 1\n"A"', '### Claim 2\n"B"', '### Claim 3\n"C"'].join(
        "\n\n",
      ),
      expectOk: false,
      expectedClaims: 5,
    },
    {
      id: "neg_value_for_strength",
      userMessage:
        "Rank by strength of fleet-wide evidence.\nNereid: 28 valid measured / 40 deployed 8.5%.\nPelican: 25 valid measured / 25 deployed 8%.",
      answer: "1. Nereid 8.5%\n2. Pelican 8%",
      expectOk: false,
    },
    {
      id: "neg_scope_drop",
      userMessage: "Harbor: verified 28 valid measured / 40 deployed 8.5%.",
      answer: "Harbor has verified 8.5% performance fleet-wide across the entire deployed population.",
      expectOk: false,
    },
    {
      id: "neg_wrong_section_count",
      userMessage: "Answer in exactly 6 numbered sections:\n1. A\n2. B\n3. C\n4. D\n5. E\n6. F",
      answer: "1. A\n2. B\n3. C\n4. D\n5. E",
      expectOk: false,
      expectedSections: 6,
    },
    {
      id: "neg_claim_text_no_verdict",
      userMessage:
        'Audit each of the following 1 quoted claims separately with an explicit Verdict and reason:\n"Alpha equals Partner Assembly."',
      answer: '### Claim 1\n"Alpha equals Partner Assembly."',
      expectOk: false,
      expectedClaims: 1,
    },
  ];
}
