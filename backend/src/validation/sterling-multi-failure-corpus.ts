/**
 * Sterling multi-failure qualification corpus — structure / claims / evidence / combined.
 * Does not encode sealed examination content.
 */

export type SterlingStructCase = {
  id: string;
  pack: string;
  badDraft: string;
  expectedSections: number;
};

export type SterlingClaimCase = {
  id: string;
  pack: string;
  badDraft: string;
  expectedClaims: number;
};

export type SterlingRankCase = {
  id: string;
  pack: string;
  expectedOrder: string[];
};

export type SterlingCombinedCase = {
  id: string;
  pack: string;
  badDraft: string;
  expectedSections: number;
  expectedClaims: number;
  expectedOrder: string[];
};

const DOMAINS = [
  "logistics",
  "hospitality",
  "energy",
  "retail",
  "clinic",
  "warehouse",
  "manufacturing",
  "finance",
  "transit",
  "labs",
] as const;

function synth(domain: string, i: number): string {
  return `SyntheticSterlingQual-${domain}-${i} — ${domain} analysis only. Do not mention Mini Fan or Birth.`;
}

function entities(i: number): [string, string, string] {
  const pool = [
    ["Apex", "Basin", "Cove"],
    ["Elm", "Fir", "Oak"],
    ["Red", "Blue", "Green"],
    ["Pine", "Maple", "Birch"],
    ["WardA", "WardB", "WardC"],
    ["DockX", "DockY", "DockZ"],
    ["Alpha", "Beta", "Gamma"],
    ["West", "East", "SouthHub"],
    ["HubOne", "HubTwo", "HubThree"],
    ["SiteP", "SiteQ", "SiteR"],
  ] as const;
  return [...pool[i % pool.length]!] as [string, string, string];
}

export function buildSterlingStructureCorpus(): SterlingStructCase[] {
  const out: SterlingStructCase[] = [];
  const counts = [3, 5, 6, 8];
  let n = 0;
  while (out.length < 100) {
    const expected = counts[n % counts.length]!;
    const domain = DOMAINS[n % DOMAINS.length]!;
    const [a, b, c] = entities(n);
    const titles = Array.from({ length: expected }, (_, i) => {
      if (i === 1) return `Evidence-strength ranking of ${a}/${b}/${c} (nest items under this section)`;
      if (i === expected - 2) return "Recommendation";
      if (i === expected - 1) return "Closing summary";
      return `Section topic ${i + 1}`;
    });
    const pack = [
      synth(domain, n),
      `Answer in exactly ${expected} numbered sections:`,
      ...titles.map((t, i) => `${i + 1}. ${t}`),
      `${a}: verified full-population audit 200/200, 94%.`,
      `${b}: verified full-population audit 150/150, 92%.`,
      `${c}: random sample 50/250, 97% sample; no verified full-population rate.`,
    ].join("\n");
    const badDraft = [
      ...Array.from({ length: 2 }, (_, i) => `${i + 1}. ${titles[i]} body.`),
      `3. ${a}`,
      `4. ${c}`,
      `5. ${b}`,
      ...Array.from({ length: Math.max(0, expected + 3 - 5) }, (_, i) => `${i + 6}. Extra section body.`),
    ].join("\n");
    out.push({ id: `struct_${n}`, pack, badDraft, expectedSections: expected });
    n += 1;
  }
  return out;
}

export function buildSterlingClaimCorpus(): SterlingClaimCase[] {
  const out: SterlingClaimCase[] = [];
  const sizes = [1, 2, 5, 8, 12];
  let n = 0;
  while (out.length < 100) {
    const expected = sizes[n % sizes.length]!;
    const domain = DOMAINS[n % DOMAINS.length]!;
    const [a, b] = entities(n);
    const claims = Array.from({ length: expected }, (_, i) => {
      if (i === 0) return `"${b} shortage has nothing to do with ${a} because ${b} never lost staff."`;
      if (i === 1) return `"Forecast equals realised for batch Z${n}."`;
      if (i === 2) return `"All ${12 + (n % 5)} units demonstrate the retrofit savings."`;
      return `"Proposition ${i + 1} for ${domain} case ${n} is currently blocked."`;
    });
    const pack = [
      synth(domain, n),
      `Audit these ${expected} claims separately with verdict and reason each:`,
      ...claims.map((c, i) => `${i + 1}. ${c}`),
      `${a} staffing shortage. Work reassigned to ${b}. ${b} shortage resulted. ${b} never lost staff.`,
      `Forecast for batch Z${n} was $40. Realised is $18.`,
      `Exactly ${5 + (n % 4)} of ${12 + (n % 5)} units received the upgrade.`,
    ].join("\n");
    const badDraft = [
      `### Claim 1`,
      claims[0],
      `### Claim 2`,
      `**Verdict:** Supported`,
      claims[1] ?? claims[0],
      ...claims.slice(2).map((c, i) => `### Claim ${i + 3}\n${c}`),
    ].join("\n");
    out.push({ id: `claim_${n}`, pack, badDraft, expectedClaims: expected });
    n += 1;
  }
  return out;
}

export function buildSterlingRankingCorpus(): SterlingRankCase[] {
  const out: SterlingRankCase[] = [];
  let n = 0;
  while (out.length < 100) {
    const domain = DOMAINS[n % DOMAINS.length]!;
    const [a, b, c] = entities(n);
    const fullA = 90 + (n % 5);
    const fullB = 88 + (n % 4);
    const sample = 96 + (n % 3);
    const packClean = [
      synth(domain, n),
      `Rank from strongest to weakest current evidence strength/completeness supporting current performance.`,
      `${a}: verified full-population audit, ${210 + n}/${210 + n} jobs, ${fullA}.0%.`,
      `${b}: verified full-population audit, ${170 + n}/${170 + n} jobs, ${fullB}.0%.`,
      `${c}: random sample ${40 + (n % 20)}/${250 + n} jobs, ${sample}.0% sample rate; no verified full-population rate.`,
    ].join("\n");
    out.push({
      id: `rank_${n}`,
      pack: packClean,
      expectedOrder: [a, b, c],
    });
    n += 1;
  }
  return out;
}

export function buildSterlingCombinedCorpus(): SterlingCombinedCase[] {
  const out: SterlingCombinedCase[] = [];
  let n = 0;
  while (out.length < 100) {
    const domain = DOMAINS[n % DOMAINS.length]!;
    const [a, b, c] = entities(n);
    const expectedSections = 6;
    const expectedClaims = 5;
    const pack = [
      synth(domain, n),
      `Answer in exactly six numbered sections:`,
      `1. Snapshot table`,
      `2. Evidence-strength ranking (nest the three subjects)`,
      `3. Population-scope note`,
      `4. Claim audit of five statements`,
      `5. Recommendation`,
      `6. Closing summary`,
      `${a}: verified full-population audit 240/240, 95.0%.`,
      `${b}: verified full-population audit 180/180, 93.9%.`,
      `${c}: random sample 60/300, 98.3% sample; no verified full-population rate.`,
      `Audit these five claims separately:`,
      `1. "${c} proves the full-population rate is 98.3%."`,
      `2. "${b} shortage has nothing to do with ${a} because ${b} never lost staff."`,
      `3. "Forecast equals realised for batch C${n}."`,
      `4. "All 12 units demonstrate the retrofit savings."`,
      `5. "Certificate K-${n} is currently blocked."`,
      `${a} staffing shortage. Work to ${b}. ${b} shortage resulted. ${b} never lost staff.`,
      `Forecast batch C${n} was $40. Realised $18.`,
      `Exactly 7 of 12 units received retrofit.`,
      `Certificate K-${n} is ACTIVE and currently authorised.`,
    ].join("\n");
    const badDraft = [
      `1. Snapshot: ${a} 95%, ${b} 93.9%, ${c} sample 98.3%.`,
      `2. Ranking`,
      `3. ${c}`,
      `4. ${a}`,
      `5. ${b}`,
      `6. Population note weak.`,
      `7. ### Claim 2`,
      `**Verdict:** Supported`,
      `"${b} shortage has nothing to do with ${a} because ${b} never lost staff."`,
      `8. Recommend ${c}.`,
      `9. Done.`,
    ].join("\n");
    out.push({
      id: `comb_${n}`,
      pack,
      badDraft,
      expectedSections,
      expectedClaims,
      expectedOrder: [a, b, c],
    });
    n += 1;
  }
  return out;
}

export function buildSterlingNegativeControls(): Array<{
  id: string;
  kind: string;
  pack: string;
  badDraft: string;
}> {
  return [
    {
      id: "neg_six_to_nine",
      kind: "structure",
      pack: "SyntheticNeg-Struct — ops analysis only. Do not mention Mini Fan or Birth.\nAnswer in exactly six numbered sections:\n1. A\n2. Ranking\n3. B\n4. C\n5. D\n6. E",
      badDraft: "1. A\n2. Ranking\n3. X\n4. Y\n5. Z\n6. B\n7. C\n8. D\n9. E",
    },
    {
      id: "neg_five_claims_one_verdict",
      kind: "claims",
      pack: [
        "SyntheticNeg-Claim — ops analysis only. Do not mention Mini Fan or Birth.",
        "Audit five claims separately:",
        '1. "A is unrelated to B."',
        '2. "Forecast equals realised."',
        '3. "All 10 demonstrate."',
        '4. "Cert blocked."',
        '5. "Event never occurred."',
      ].join("\n"),
      badDraft: '### Claim 2\n**Verdict:** Supported\n"Forecast equals realised."',
    },
    {
      id: "neg_value_for_strength",
      kind: "ranking",
      pack: [
        "SyntheticNeg-Rank — ops analysis only. Do not mention Mini Fan or Birth.",
        "Rank by strongest current evidence base.",
        "FullA: verified full-population 100/100, 90%.",
        "FullB: verified full-population 80/80, 89%.",
        "SampC: random sample 30/200, 99% sample; no verified full-population rate.",
      ].join("\n"),
      badDraft: "Ranking: SampC, FullA, FullB because 99% is highest.",
    },
  ];
}
