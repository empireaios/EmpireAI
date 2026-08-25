/**
 * Adversarial corpus for deterministic resolved-verdict finalization qualification.
 * Synthetic entity names only — no sealed examination content.
 */

export type ResolvedVerdictCase = {
  id: string;
  domain: string;
  claimText: string;
  packFacts: string[];
  expectedVerdict: "Supported" | "Contradicted" | "Unproven";
  resolutionStatus: "RESOLVED" | "UNRESOLVED";
  compound?: boolean;
  wrongVerdictTemptation?: boolean;
  judgmentControl?: boolean;
};

const BANNED_NAMES =
  /\b(?:Mini Fan|EmpireAI|Birth|Harbour|Crestline|Meridian|Apex|Orchid|Nova|Summit|Atlas|Redwood|Silverline)\b/i;

const SITES = [
  "Bench Quay",
  "Bench Mesa",
  "Store Cobalt",
  "Store Argon",
  "Nexus Grid",
  "Prism Unit",
  "Cedar Yard",
  "Inlet Dock",
  "Lodge Point",
  "Depot Nine",
  "Cove Field",
  "Flint Ridge",
  "Granite Bay",
  "Copper Vale",
  "Iron Gate",
  "Jade Loop",
  "Keel Port",
  "Lumen Bay",
  "Marble Pier",
  "Onyx Field",
  "Pine Hollow",
  "Quartz Site",
  "River Bend",
  "Stone Mill",
] as const;

const RESOURCES = [
  "operator",
  "capacity",
  "bed",
  "inventory",
  "throughput",
  "staffing",
] as const;

const MECHANISMS = [
  "sealant",
  "thermal",
  "power",
  "cooling",
  "routing",
] as const;

const DOMAINS = [
  "causal",
  "temporal",
  "entity",
  "forecast",
  "population",
  "financial",
  "certificate",
  "historical",
  "decision",
  "compound",
] as const;

function mulberry32(a: number) {
  return () => {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)]!;
}

function pairSites(rng: () => number): [string, string] {
  const a = pick(rng, SITES);
  let b = pick(rng, SITES);
  while (b === a) b = pick(rng, SITES);
  return [a, b];
}

function assertClean(text: string, id: string): void {
  if (BANNED_NAMES.test(text)) {
    throw new Error(`Corpus case ${id} contains banned entity name`);
  }
}

function pushCase(
  out: ResolvedVerdictCase[],
  c: ResolvedVerdictCase,
): void {
  const blob = [c.claimText, ...c.packFacts].join(" ");
  assertClean(blob, c.id);
  out.push(c);
}

function harbourClassCase(
  id: string,
  seed: number,
  phraseIdx: number,
): ResolvedVerdictCase {
  const rng = mulberry32(seed);
  const [a, b] = pairSites(rng);
  const resource = pick(rng, RESOURCES);
  const mech = pick(rng, MECHANISMS);
  const phrases = [
    `${b}'s ${resource} shortage has nothing to do with ${a} because ${b} itself never lost staff.`,
    `${b}'s ${resource} shortage is unrelated to ${a} because ${b} never had a ${mech} failure.`,
    `${b} ${resource} shortage has no causal relationship to ${a} because ${b} never had a ${mech} trip.`,
    `${b}'s current ${resource} constraint has nothing to do with ${a} since ${b} itself never lost staff.`,
  ];
  const claimText = phrases[phraseIdx % phrases.length]!;
  return {
    id,
    domain: "causal",
    claimText,
    packFacts: [
      `SyntheticVerdict-${id} — Ops causal analysis only.`,
      `${a} had a ${resource} shortage.`,
      `Work was reassigned from ${a} to ${b}.`,
      `${b} operators were committed to the reassigned work.`,
      `${b}'s current ${resource} shortage resulted from that commitment.`,
      `${b} itself never lost staff to attrition.`,
    ],
    expectedVerdict: "Contradicted",
    resolutionStatus: "RESOLVED",
    compound: true,
    wrongVerdictTemptation: true,
  };
}

function entityContradictedCase(id: string, seed: number): ResolvedVerdictCase {
  const rng = mulberry32(seed);
  const codes = ["ZX-11", "BT-410", "QR-91", "HT-58", "LP-03", "MK-17"];
  const names = [
    "North Pier Module",
    "Partner Assembly",
    "System K Assembly",
    "Relay Stack",
    "Dock Controller",
    "Filter Manifold",
  ];
  const i = Math.floor(rng() * codes.length);
  let j = Math.floor(rng() * names.length);
  while (j === i) j = Math.floor(rng() * names.length);
  const code = codes[i]!;
  const trueName = names[i]!;
  const wrongName = names[j]!;
  return {
    id,
    domain: "entity",
    claimText: `${code} is ${wrongName}.`,
    packFacts: [
      `SyntheticVerdict-${id} — entity registry analysis only.`,
      `Verified registry: ${code} = ${trueName}. Distinct identities are authoritative.`,
    ],
    expectedVerdict: "Contradicted",
    resolutionStatus: "RESOLVED",
    wrongVerdictTemptation: true,
  };
}

function entitySupportedCase(id: string, seed: number): ResolvedVerdictCase {
  const rng = mulberry32(seed);
  const pairs = [
    ["BT-410", "System K Assembly"],
    ["QR-91", "Relay Stack"],
    ["HT-58", "Filter Manifold"],
    ["LP-03", "Dock Controller"],
  ] as const;
  const [code, name] = pairs[Math.floor(rng() * pairs.length)]!;
  return {
    id,
    domain: "entity",
    claimText: `${code} is ${name}.`,
    packFacts: [
      `SyntheticVerdict-${id} — entity registry analysis only.`,
      `Verified asset registry: ${code} = ${name}.`,
    ],
    expectedVerdict: "Supported",
    resolutionStatus: "RESOLVED",
  };
}

function forecastContradictedCase(id: string, seed: number): ResolvedVerdictCase {
  const rng = mulberry32(seed);
  const forecast = 2000 + Math.floor(rng() * 8000);
  const realised = Math.floor(forecast * (0.1 + rng() * 0.4));
  return {
    id,
    domain: "forecast",
    claimText: "Forecast equals realised.",
    packFacts: [
      `SyntheticVerdict-${id} — forecast reconciliation only.`,
      `Forecast $${forecast}; realised $${realised}.`,
    ],
    expectedVerdict: "Contradicted",
    resolutionStatus: "RESOLVED",
    wrongVerdictTemptation: true,
  };
}

function populationContradictedCase(id: string, seed: number): ResolvedVerdictCase {
  const rng = mulberry32(seed);
  const total = 80 + Math.floor(rng() * 80);
  const valid = Math.floor(total * (0.5 + rng() * 0.4));
  const pct = 5 + Math.floor(rng() * 15);
  return {
    id,
    domain: "population",
    claimText: `All ${total} deployed sites demonstrate a ${pct}% saving.`,
    packFacts: [
      `SyntheticVerdict-${id} — population metrics only.`,
      `${total} deployed sites. ${valid} currently valid measured. ${pct}% average reduction across the ${valid} valid measured sites.`,
    ],
    expectedVerdict: "Contradicted",
    resolutionStatus: "RESOLVED",
    wrongVerdictTemptation: true,
  };
}

function financialContradictedCase(id: string, seed: number): ResolvedVerdictCase {
  const rng = mulberry32(seed);
  const forecast = 3000 + Math.floor(rng() * 5000);
  const realised = Math.floor(forecast * 0.25);
  return {
    id,
    domain: "financial",
    claimText: "Forecast equals realised.",
    packFacts: [
      `SyntheticVerdict-${id} — financial ledger analysis only.`,
      `Forecast revenue $${forecast}; realised revenue $${realised}.`,
    ],
    expectedVerdict: "Contradicted",
    resolutionStatus: "RESOLVED",
    wrongVerdictTemptation: true,
  };
}

function certificateContradictedCase(id: string, seed: number): ResolvedVerdictCase {
  const unit = `Unit ${String.fromCharCode(65 + (seed % 26))}-${10 + (seed % 90)}`;
  return {
    id,
    domain: "certificate",
    claimText: `${unit} should remain blocked because it failed earlier today.`,
    packFacts: [
      `SyntheticVerdict-${id} — certificate eligibility only.`,
      `Candidate ${unit} currently satisfies every eligibility gate and is currently eligible.`,
      `Earlier today ${unit} had a temporary failure; that failure has cleared.`,
      `${unit} certificate was issued and is currently valid.`,
    ],
    expectedVerdict: "Contradicted",
    resolutionStatus: "RESOLVED",
    compound: true,
    wrongVerdictTemptation: true,
  };
}

function historicalContradictedCase(id: string, seed: number): ResolvedVerdictCase {
  const unit = `K-${10 + (seed % 90)}`;
  return {
    id,
    domain: "historical",
    claimText: `Completion for unit ${unit} never historically occurred.`,
    packFacts: [
      `SyntheticVerdict-${id} — historical occurrence analysis only.`,
      `Service for unit ${unit} was completed and recorded as complete in the pack.`,
      `A later refund was issued for unit ${unit}; the refund is a separate later outcome.`,
    ],
    expectedVerdict: "Contradicted",
    resolutionStatus: "RESOLVED",
    wrongVerdictTemptation: true,
  };
}

function temporalContradictedCase(id: string, seed: number): ResolvedVerdictCase {
  const rng = mulberry32(seed);
  const [a, b] = pairSites(rng);
  return {
    id,
    domain: "temporal",
    claimText: `${b}'s outage never occurred even though downstream effects were observed.`,
    packFacts: [
      `SyntheticVerdict-${id} — temporal occurrence only.`,
      `${b} outage was completed and recorded as complete before downstream effects on ${a}.`,
      `Later SLA reversal for ${b} does not erase the verified earlier occurrence.`,
    ],
    expectedVerdict: "Contradicted",
    resolutionStatus: "RESOLVED",
    wrongVerdictTemptation: true,
  };
}

function decisionContradictedCase(id: string, seed: number): ResolvedVerdictCase {
  const rng = mulberry32(seed);
  const site = pick(rng, SITES);
  return {
    id,
    domain: "decision",
    claimText: `${site} should remain blocked because it failed earlier today.`,
    packFacts: [
      `SyntheticVerdict-${id} — decision gate analysis only.`,
      `Candidate ${site} currently satisfies every eligibility gate and is currently eligible.`,
      `Earlier today ${site} had a temporary failure; that failure has cleared.`,
    ],
    expectedVerdict: "Contradicted",
    resolutionStatus: "RESOLVED",
    compound: true,
    wrongVerdictTemptation: true,
  };
}

function decisionSupportedCase(id: string, seed: number): ResolvedVerdictCase {
  const rng = mulberry32(seed);
  const site = pick(rng, SITES);
  return {
    id,
    domain: "decision",
    claimText: `${site} is currently eligible for scaling.`,
    packFacts: [
      `SyntheticVerdict-${id} — decision gate analysis only.`,
      `Candidate ${site} currently satisfies every eligibility gate and is currently eligible.`,
    ],
    expectedVerdict: "Supported",
    resolutionStatus: "RESOLVED",
  };
}

function compoundContradictedCase(id: string, seed: number): ResolvedVerdictCase {
  const rng = mulberry32(seed);
  const forecast = 4000 + Math.floor(rng() * 4000);
  const realised = forecast;
  const wrongName = pick(rng, ["Partner Assembly", "Relay Stack", "Dock Controller"]);
  return {
    id,
    domain: "compound",
    claimText: `ZX-11 is ${wrongName}, therefore forecast equals realised.`,
    packFacts: [
      `SyntheticVerdict-${id} — compound claim analysis only.`,
      `Verified registry: ZX-11 = North Pier Module.`,
      `Forecast $${forecast}; realised $${realised}.`,
    ],
    expectedVerdict: "Contradicted",
    resolutionStatus: "RESOLVED",
    compound: true,
    wrongVerdictTemptation: true,
  };
}

function causalUnprovenCase(id: string, seed: number): ResolvedVerdictCase {
  const rng = mulberry32(seed);
  const [a, b] = pairSites(rng);
  return {
    id,
    domain: "causal",
    claimText: `${a} and ${b} are unrelated.`,
    packFacts: [
      `SyntheticVerdict-${id} — causal independence review only.`,
      `${a} reported a mild delay.`,
      `${b} reported a mild delay.`,
      `No transfer, failover, redirect, or shared root is stated between ${a} and ${b}.`,
    ],
    expectedVerdict: "Unproven",
    resolutionStatus: "RESOLVED",
    wrongVerdictTemptation: true,
  };
}

function directCauseContradictedCase(id: string, seed: number): ResolvedVerdictCase {
  const rng = mulberry32(seed);
  const [a, b] = pairSites(rng);
  return {
    id,
    domain: "causal",
    claimText: `${a} is the direct cause of ${b} overload.`,
    packFacts: [
      `SyntheticVerdict-${id} — causal graph analysis only.`,
      `${a} triggered a failover to ${b}.`,
      `The failover then caused overload on ${b}.`,
      `${a} and ${b} have different direct causes documented in the pack.`,
    ],
    expectedVerdict: "Contradicted",
    resolutionStatus: "RESOLVED",
    compound: true,
    wrongVerdictTemptation: true,
  };
}

function judgmentControlCase(id: string, seed: number): ResolvedVerdictCase {
  const rng = mulberry32(seed);
  const [a, b] = pairSites(rng);
  const claims = [
    `${b} should be preferred over ${a} for next-quarter expansion.`,
    `${b} is the better strategic choice than ${a} under current ambiguity.`,
    `Expansion budget should favour ${b} over ${a} this cycle.`,
    `${a} versus ${b} — ${b} warrants priority pending further evidence.`,
  ];
  return {
    id,
    domain: pick(rng, DOMAINS),
    claimText: claims[seed % claims.length]!,
    packFacts: [
      `SyntheticJudgment-${id} — trade-off analysis only.`,
      `${a} reported a mild delay.`,
      `${b} reported a mild delay.`,
      `No transfer, failover, redirect, or shared root is stated.`,
      `Both options carry comparable upside and downside; no hard canonical winner.`,
    ],
    expectedVerdict: "Unproven",
    resolutionStatus: "UNRESOLVED",
    judgmentControl: true,
  };
}

function genericJudgmentControlCase(id: string, seed: number): ResolvedVerdictCase {
  const rng = mulberry32(seed);
  const site = pick(rng, SITES);
  return {
    id,
    domain: "decision",
    claimText: `${site} presents the strongest overall case for investment.`,
    packFacts: [
      `SyntheticJudgment-${id} — generic preference only.`,
      `${site} shows mixed signals: mild delay, partial upside, incomplete cost data.`,
      `No eligibility registry, causal graph, or forecast reconciliation is provided.`,
    ],
    expectedVerdict: "Unproven",
    resolutionStatus: "UNRESOLVED",
    judgmentControl: true,
  };
}

export function buildResolvedVerdictAdversarialCorpus(): ResolvedVerdictCase[] {
  const out: ResolvedVerdictCase[] = [];
  let n = 0;

  for (let i = 0; i < 95; i++) {
    pushCase(out, harbourClassCase(`rv_causal_harbour_${i}`, 88000 + i, i));
  }
  for (let i = 0; i < 20; i++) {
    pushCase(out, directCauseContradictedCase(`rv_causal_direct_${i}`, 89000 + i));
  }
  for (let i = 0; i < 15; i++) {
    pushCase(out, causalUnprovenCase(`rv_causal_unproven_${i}`, 90000 + i));
  }
  for (let i = 0; i < 25; i++) {
    pushCase(out, entityContradictedCase(`rv_entity_c_${i}`, 91000 + i));
  }
  for (let i = 0; i < 10; i++) {
    pushCase(out, entitySupportedCase(`rv_entity_s_${i}`, 92000 + i));
  }
  for (let i = 0; i < 20; i++) {
    pushCase(out, forecastContradictedCase(`rv_forecast_${i}`, 93000 + i));
  }
  for (let i = 0; i < 20; i++) {
    pushCase(out, populationContradictedCase(`rv_population_${i}`, 94000 + i));
  }
  for (let i = 0; i < 15; i++) {
    pushCase(out, financialContradictedCase(`rv_financial_${i}`, 95000 + i));
  }
  for (let i = 0; i < 15; i++) {
    pushCase(out, certificateContradictedCase(`rv_certificate_${i}`, 96000 + i));
  }
  for (let i = 0; i < 15; i++) {
    pushCase(out, historicalContradictedCase(`rv_historical_${i}`, 97000 + i));
  }
  for (let i = 0; i < 10; i++) {
    pushCase(out, temporalContradictedCase(`rv_temporal_${i}`, 98000 + i));
  }
  for (let i = 0; i < 20; i++) {
    pushCase(out, decisionContradictedCase(`rv_decision_c_${i}`, 99000 + i));
  }
  for (let i = 0; i < 10; i++) {
    pushCase(out, decisionSupportedCase(`rv_decision_s_${i}`, 100000 + i));
  }
  for (let i = 0; i < 25; i++) {
    pushCase(out, compoundContradictedCase(`rv_compound_${i}`, 101000 + i));
  }
  for (let i = 0; i < 35; i++) {
    pushCase(out, judgmentControlCase(`rv_judgment_${i}`, 102000 + i));
  }
  for (let i = 0; i < 20; i++) {
    pushCase(out, genericJudgmentControlCase(`rv_judgment_generic_${i}`, 103000 + i));
  }

  n = out.filter((c) => c.resolutionStatus === "RESOLVED").length;
  const compound = out.filter((c) => c.compound).length;
  const temptation = out.filter((c) => c.wrongVerdictTemptation).length;
  const judgment = out.filter((c) => c.judgmentControl).length;

  if (n < 200) throw new Error(`Corpus RESOLVED count ${n} < 200`);
  if (compound < 100) throw new Error(`Corpus compound count ${compound} < 100`);
  if (temptation < 50) throw new Error(`Corpus wrongVerdictTemptation count ${temptation} < 50`);
  if (judgment < 50) throw new Error(`Corpus judgmentControl count ${judgment} < 50`);

  const domainSet = new Set(out.map((c) => c.domain));
  for (const d of DOMAINS) {
    if (!domainSet.has(d)) throw new Error(`Corpus missing domain ${d}`);
  }

  return out;
}
