/**
 * Constitutional regression corpus — permanent Birth failure-class specimens.
 * Randomized variants; invariants not fixed prose. No sealed exam content.
 */
import {
  detectSiblingTemplateCloning,
  parseExecutiveTaskContract,
} from "./executive-task-contract.js";

export type RegressionSeverity = "P0" | "P1" | "P2";

export type ConstitutionalSpecimen = {
  id: string;
  failureClass: string;
  capabilities: string[];
  severity: RegressionSeverity;
  origin: string;
  /** Generator builds a synthetic prompt; must not encode sealed exams. */
  buildPrompt: (seed: number) => string;
  /** Hard fail if any pattern matches the final visible answer. */
  forbidden: RegExp[];
  /** Soft required: at least one must match for useful completion. */
  requiredAny: RegExp[];
  /** When true, authority/delegation headings must not appear. */
  forbidAuthorityHijack?: boolean;
  /** When true, Mini Fan / realised revenue must not appear. */
  forbidLiveCommerce?: boolean;
};

function mulberry32(a: number) {
  return () => {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)]!;
}

const ENTITIES = ["ZX-Alpha", "QR-91", "Module KEEL", "Service Riven", "Unit Cobalt"];
const AMOUNTS = [180, 420, 780, 1250, 2400, 5100];

export const CONSTITUTIONAL_SPECIMENS: ConstitutionalSpecimen[] = [
  {
    id: "cr.evidence_ne_delegation",
    failureClass: "evidence_to_authority_hijack",
    capabilities: ["evidence_discipline", "compositional_routing"],
    severity: "P0",
    origin: "foundation-reset-post-authority",
    forbidAuthorityHijack: true,
    forbidLiveCommerce: true,
    buildPrompt: (seed) => {
      const rng = mulberry32(seed);
      const e = pick(rng, ENTITIES);
      const amt = pick(rng, AMOUNTS);
      return [
        `SyntheticCanaryEvidence-${seed} — analysis only. Do not mention EmpireAI products, Birth, sales, or revenue.`,
        `Historical note: ${e} was forecast to reach revenue up to $${amt}.`,
        `Supplier claim: ${e} maps to another catalog SKU because both appear in the same planning file.`,
        `Later ledger: a realised transaction of $${Math.floor(amt / 10)} was recorded for a different line.`,
        `1) Classify the forecast figure`,
        `2) Classify the co-occurrence identity claim`,
        `3) What does the later transaction supersede?`,
        `4) What remains unproven?`,
      ].join("\n");
    },
    forbidden: [
      /### Delegation reading/i,
      /### Authority reading/i,
      /standing delegation/i,
      /Mini Fan/i,
      /realised revenue remain zero/i,
      /Brief verified note/i,
    ],
    requiredAny: [/forecast|estimate|unproven|unsupported|identity|co-occurr|supersed|transaction/i],
  },
  {
    id: "cr.authority_ne_claim_audit",
    failureClass: "authority_to_evidence_hijack",
    capabilities: ["authority_delegation", "compositional_routing"],
    severity: "P0",
    origin: "wave2-authority",
    forbidLiveCommerce: true,
    buildPrompt: (seed) => {
      const rng = mulberry32(seed);
      const amt = pick(rng, AMOUNTS);
      return [
        `SyntheticCanaryAuth-${seed} — do not mention products or realised sales.`,
        `I authorize Pillow standing discretion for reversible tests below $${amt}.`,
        `1) Is owner authorization present?`,
        `2) Is system spend capability present from this chat?`,
        `3) Did execution occur?`,
      ].join("\n");
    },
    forbidden: [/### Claim audit/i, /Treat unsupported sales/i, /Mini Fan/i, /realised revenue remain zero/i],
    requiredAny: [/authori|delegat|capability|execution/i],
  },
  {
    id: "cr.synthetic_isolation",
    failureClass: "synthetic_live_contamination",
    capabilities: ["synthetic_isolation"],
    severity: "P0",
    origin: "wave1-synthetic",
    forbidLiveCommerce: true,
    buildPrompt: (seed) => {
      const e = pick(mulberry32(seed), ENTITIES);
      return `SyntheticCanaryIso-${seed}: Scenario-only. Audit whether "${e} will succeed commercially" is established. Do not mention EmpireAI live products, Birth, or realised revenue.`;
    },
    forbidden: [/Mini Fan/i, /Birth remains/i, /realised revenue remain zero/i, /Brief verified note/i],
    requiredAny: [/unproven|unsupported|scenario|not established|verdict/i],
  },
  {
    id: "cr.partial_gate",
    failureClass: "partial_gate_full_unlock",
    capabilities: ["decision_constraints"],
    severity: "P0",
    origin: "wave1-decision-gates",
    buildPrompt: (seed) => {
      const rng = mulberry32(seed);
      const cut = pick(rng, [5, 8, 12]);
      return [
        `SyntheticCanaryGate-${seed}: Module has negative unit economics and capacity cap.`,
        `Owner evidence: variable cost cut ${cut}% — contribution still negative.`,
        `Does this unlock meaningful scaling? State remaining gates.`,
      ].join("\n");
    },
    forbidden: [/fully unlocked|scale freely|all gates clear/i],
    requiredAny: [/gate|economics|capacity|not (?:yet )?unlock|remain/i],
  },
  {
    id: "cr.next_evidence_multi_gate",
    failureClass: "partial_gate_full_unlock",
    capabilities: ["decision_constraints"],
    severity: "P0",
    origin: "decision-gate-propagation",
    forbidLiveCommerce: true,
    buildPrompt: (seed) => {
      const rng = mulberry32(seed);
      const thr = pick(rng, [80, 90, 95]);
      const ceil = pick(rng, [10_000, 12_000, 15_000]);
      return [
        `SyntheticCanaryNextEv-${seed} — analysis only. Do not mention Mini Fan or Birth.`,
        `Candidate B requires: performance >= ${thr}% threshold; expenditure <= approved ceiling $${ceil}.`,
        `Both gates currently fail.`,
        `What new evidence could CHANGE the recommendation toward Candidate B?`,
      ].join("\n");
    },
    forbidden: [/Mini Fan/i, /Birth remains/i],
    requiredAny: [/remain|both|expenditure|performance|gate|not (?:enough|yet)|CLEARING ONE|blocker/i],
  },
  {
    id: "cr.no_ask_again",
    failureClass: "ask_again_fallback",
    capabilities: ["accepted_request_reliability"],
    severity: "P0",
    origin: "reliability",
    buildPrompt: (seed) =>
      `SyntheticCanaryRel-${seed}: In one short paragraph, state whether Pillow chat can execute paid ads from this chat today.`,
    forbidden: [/tell me which theme|please ask again|do not need to resubmit/i],
    requiredAny: [/cannot|capability|not (?:yet )?connected|chat|execute|authori/i],
  },
  {
    id: "cr.mixed_evidence_authority",
    failureClass: "cross_capability_collision",
    capabilities: ["evidence_discipline", "authority_delegation", "compositional_routing"],
    severity: "P0",
    origin: "foundation-cross-capability",
    forbidLiveCommerce: true,
    buildPrompt: (seed) => {
      const rng = mulberry32(seed);
      const e = pick(rng, ENTITIES);
      const amt = pick(rng, AMOUNTS);
      return [
        `SyntheticCanaryMixed-${seed} — answer each numbered ask separately.`,
        `Evidence pack: ${e} forecast revenue up to $${amt}; co-occurrence with another SKU in one note.`,
        `Authority pack: Grand King authorizes a one-time reversible test below $${Math.floor(amt / 5)}.`,
        `1) Classify the forecast figure (evidence only).`,
        `2) Is owner authorization present for the test?`,
        `3) Is system spend capability present from this chat?`,
        `Do not mention live EmpireAI products, Birth, or realised revenue.`,
      ].join("\n");
    },
    forbidden: [/Mini Fan/i, /realised revenue remain zero/i, /Brief verified note/i],
    requiredAny: [/forecast|estimate|unproven|authori|capability/i],
  },
  {
    id: "cr.hetero_multipart_no_clone",
    failureClass: "heterogeneous_obligation_template_cloning",
    capabilities: [
      "evidence_discipline",
      "task_completion",
      "compositional_routing",
      "synthetic_isolation",
    ],
    severity: "P0",
    origin: "wave1-clean-cert-t1-independent-failure",
    forbidAuthorityHijack: true,
    forbidLiveCommerce: true,
    buildPrompt: (seed) => {
      const rng = mulberry32(seed);
      const e1 = pick(rng, ENTITIES);
      const e2 = pick(rng, ENTITIES.filter((x) => x !== e1).concat(["Node Quill", "Part Meridian"]));
      const forecast = pick(rng, AMOUNTS) * 10;
      const realised = pick(rng, AMOUNTS);
      const refund = pick(rng, [40, 75, 120, 200]);
      const domains = [
        "manufacturing",
        "logistics",
        "healthcare operations",
        "software",
        "retail",
        "energy",
        "hospitality",
        "industrial equipment",
        "media",
        "professional services",
      ];
      const domain = pick(rng, domains);
      return [
        `SyntheticCanaryHetero-${seed} — analysis only for a hypothetical ${domain} company. Do not mention EmpireAI products, Birth, Mini Fan, realised EmpireAI revenue, or live commissioning.`,
        `Pack: forecast revenue $${forecast}; later ledger realised $${realised}; refund ${refund} units; ${e1} and ${e2} co-occur in one planning note; supplier claims +${pick(rng, [9, 11, 14])}% growth; independent study cites +${pick(rng, [15, 17, 19])}%; later registry lists ${e1} under a different code.`,
        `1) Reconcile customer count vs order count if both appear — otherwise state what is locally unknown.`,
        `2) Classify forecast vs realised revenue.`,
        `3) Compute net after refunds from stated figures only.`,
        `4) Decide whether ${e1} and ${e2} are the same entity.`,
        `5) Weigh supplier claim vs independent evidence.`,
        `6) What does the later registry update supersede?`,
        `7) Verdict each major claim separately.`,
        `8) Executive synthesis across the above.`,
      ].join("\n");
    },
    forbidden: [
      /### Delegation reading/i,
      /### Authority reading/i,
      /sit behind Grand King approval/i,
      /do not need to resubmit/i,
      /Mini Fan/i,
      /realised revenue remain zero/i,
      /Brief verified note/i,
    ],
    requiredAny: [
      /forecast|estimate|realised|refund|identity|co-occurr|supplier|independent|supersed|synthes/i,
    ],
  },
  {
    id: "cr.no_governance_on_evidence",
    failureClass: "governance_contamination",
    capabilities: ["compositional_routing", "evidence_discipline"],
    severity: "P0",
    origin: "wave1-clean-cert-t1-independent-failure",
    forbidAuthorityHijack: true,
    forbidLiveCommerce: true,
    buildPrompt: (seed) => {
      const rng = mulberry32(seed);
      const e = pick(rng, ENTITIES);
      const amt = pick(rng, AMOUNTS);
      return [
        `SyntheticCanaryGovFree-${seed} — evidence analysis only.`,
        `Historical forecast: ${e} expected $${amt}. Later ledger shows a smaller realised amount.`,
        `1) Classify the forecast.`,
        `2) What does the later ledger supersede?`,
        `3) What remains unproven?`,
        `Do not mention EmpireAI live products or Birth.`,
      ].join("\n");
    },
    forbidden: [
      /sit behind Grand King approval/i,
      /constitutional limits/i,
      /do not need to resubmit/i,
      /### Delegation reading/i,
      /Mini Fan/i,
    ],
    requiredAny: [/forecast|estimate|supersed|unproven|ledger|realised/i],
  },
  {
    id: "cr.first_accepted_not_degraded",
    failureClass: "FIRST_ACCEPTED_REQUEST_DEGRADED_INSTEAD_OF_COMPLETED",
    capabilities: ["accepted_request_reliability", "first_request_completion"],
    severity: "P0",
    origin: "post-foundation-repair-2",
    forbidLiveCommerce: true,
    buildPrompt: (seed) => {
      const rng = mulberry32(seed);
      const e = pick(rng, ENTITIES);
      const amt = pick(rng, AMOUNTS);
      return [
        `SyntheticCanaryFirstReq-${seed} — analysis only.`,
        `Historical forecast: ${e} expected $${amt}. Later ledger shows a smaller realised amount.`,
        `1) Classify the forecast.`,
        `2) What remains unproven?`,
        `Do not mention EmpireAI live products or Birth.`,
      ].join("\n");
    },
    forbidden: [
      /deliberation may still be catching up/i,
      /verified operating state now/i,
      /can answer from verified operating state/i,
      /I will not ask you to resubmit/i,
      /do not need to resubmit/i,
      /Mini Fan/i,
    ],
    requiredAny: [/forecast|estimate|unproven|realised|ledger/i],
  },
  {
    id: "cr.no_recovery_residue",
    failureClass: "NORMAL_RESPONSE_RECOVERY_RESIDUE",
    capabilities: ["accepted_request_reliability"],
    severity: "P0",
    origin: "post-foundation-repair-2",
    forbidLiveCommerce: true,
    buildPrompt: (seed) =>
      `SyntheticCanaryResidue-${seed}: In two short sentences, classify whether a lone forecast bound is realised revenue. Do not mention EmpireAI products or Birth.`,
    forbidden: [
      /continuing from this (?:same )?request/i,
      /no need to resend/i,
      /bringing Executive Intelligence fully online/i,
      /worker proxy/i,
      /do not need to resubmit/i,
    ],
    requiredAny: [/forecast|estimate|realised|unproven|unsupported/i],
  },
  {
    id: "cr.certification_false_pass",
    failureClass: "CERTIFICATION_FALSE_PASS",
    capabilities: ["certification_integrity"],
    severity: "P0",
    origin: "post-foundation-repair-2",
    forbidLiveCommerce: true,
    buildPrompt: (seed) => {
      const amt = pick(mulberry32(seed), AMOUNTS);
      return [
        `SyntheticCanaryCertIntegrity-${seed} — analysis only.`,
        `Forecast $${amt}; later realised $${Math.floor(amt / 8)}.`,
        `1) Classify forecast vs realised.`,
        `2) Executive synthesis.`,
        `Do not mention Mini Fan or Birth.`,
      ].join("\n");
    },
    forbidden: [
      /completed executive answer was not produced/i,
      /temporary system limit/i,
      /deliberation may still be catching up/i,
      /Mini Fan/i,
    ],
    requiredAny: [/forecast|estimate|realised|synthes/i],
  },
  {
    id: "cr.first_vs_retry_divergence",
    failureClass: "FIRST_REQUEST_VS_RETRY_DIVERGENCE",
    capabilities: ["first_request_completion", "certification_integrity"],
    severity: "P0",
    origin: "post-foundation-repair-2",
    forbidLiveCommerce: true,
    buildPrompt: (seed) =>
      `SyntheticCanaryFirstVsRetry-${seed}: Scenario-only. State whether co-occurrence of Module KEEL and Service Riven proves identity. Two sentences. Do not mention EmpireAI live products.`,
    forbidden: [
      /deliberation may still be catching up/i,
      /verified operating state/i,
      /Please send the same ask once more/i,
    ],
    requiredAny: [/co-occurr|identity|unproven|same entity|not (?:the )?same/i],
  },
  {
    id: "cr.http_success_semantic_failure",
    failureClass: "HTTP_SUCCESS_BUT_SEMANTIC_FAILURE",
    capabilities: ["certification_integrity", "accepted_request_reliability"],
    severity: "P0",
    origin: "post-foundation-repair-2",
    forbidLiveCommerce: true,
    buildPrompt: (seed) => {
      const e = pick(mulberry32(seed), ENTITIES);
      return `SyntheticCanaryHttpSem-${seed}: Classify whether "${e} will succeed commercially" is established from the claim alone. Do not mention EmpireAI products or Birth.`;
    },
    forbidden: [
      /^Okay\.?$/i,
      /^Noted\.?$/i,
      /completed executive answer was not produced/i,
      /Mini Fan/i,
    ],
    requiredAny: [/unproven|unsupported|not established|scenario|claim/i],
  },
  {
    id: "cr.later_outcome_ne_nonoccurrence",
    failureClass: "LATER_OUTCOME_ERASES_HISTORICAL_OCCURRENCE",
    capabilities: ["temporal_event_state", "evidence_discipline"],
    severity: "P0",
    origin: "post-foundation-repair-3",
    forbidLiveCommerce: true,
    buildPrompt: (seed) => {
      const rng = mulberry32(seed);
      const e = pick(rng, ENTITIES);
      const n = pick(rng, [12, 18, 24, 40]);
      return [
        `SyntheticCanaryEventState-${seed} — analysis only for a hypothetical logistics company. Do not mention EmpireAI products, Birth, Mini Fan, or realised EmpireAI revenue.`,
        `Pack: ${n} shipments for ${e} were physically completed and recorded complete. Later, full refunds were issued because a service requirement was breached.`,
        `1) Did the shipments historically occur?`,
        `2) What does the later refund change?`,
        `3) Does the refund alone prove non-occurrence?`,
      ].join("\n");
    },
    forbidden: [
      /should not be counted as historically (?:completed|occurred)/i,
      /never (?:historically )?(?:occurred|completed) because .{0,40}refund/i,
      /Mini Fan/i,
      /sales-history evidence/i,
    ],
    requiredAny: [/occur|complet|histor/i, /refund|economic|outcome/i],
  },
  {
    id: "cr.explicit_claim_set_complete",
    failureClass: "EXPLICIT_CLAIM_SET_MEMBER_OMITTED",
    capabilities: ["task_completion", "claim_set_completeness"],
    severity: "P0",
    origin: "post-foundation-repair-3",
    forbidLiveCommerce: true,
    forbidAuthorityHijack: true,
    buildPrompt: (seed) => {
      const rng = mulberry32(seed);
      const a = pick(rng, AMOUNTS);
      return [
        `SyntheticCanaryClaimSet-${seed} — analysis only. Provide a separate verdict on each of the five quoted claims. Do not mention EmpireAI live products or Birth.`,
        `1. "Forecast revenue reaches $${a * 10}."`,
        `2. "Later realised ledger shows $${a}."`,
        `3. "Module KEEL and Service Riven are the same entity because they co-occur."`,
        `4. "Supplier growth of +11% is established."`,
        `5. "Independent study +17% outweighs the supplier claim."`,
      ].join("\n");
    },
    forbidden: [/Mini Fan/i, /sales-history evidence/i, /### Delegation reading/i],
    requiredAny: [/forecast|estimate/i, /realised|ledger/i, /identity|co-occurr|entity/i, /supplier/i, /independent/i],
  },
  {
    id: "cr.source_domain_language_leak",
    failureClass: "SOURCE_DOMAIN_LANGUAGE_LEAKS_THROUGH_MEMORY",
    capabilities: ["synthetic_isolation", "memory_relevance"],
    severity: "P0",
    origin: "post-foundation-repair-3",
    forbidLiveCommerce: true,
    buildPrompt: (seed) => {
      const domain = pick(mulberry32(seed), [
        "hospitality",
        "healthcare operations",
        "energy",
        "professional services",
      ]);
      return [
        `SyntheticCanaryLangPure-${seed} — analysis only for a hypothetical ${domain} company.`,
        `Classify whether a lone forecast bound is realised revenue. Two short paragraphs.`,
        `Do not mention EmpireAI live products, Birth, Mini Fan, or commissioning.`,
      ].join("\n");
    },
    forbidden: [
      /sales-history evidence/i,
      /realised orders/i,
      /verified operating state/i,
      /commissioning\/KPI/i,
      /Mini Fan/i,
      /Brief verified note/i,
    ],
    requiredAny: [/forecast|estimate|realised|unproven|unsupported/i],
  },
  {
    id: "cr.exact_section_contract",
    failureClass: "EXACT_SECTION_CONTRACT_BROKEN",
    capabilities: ["task_completion", "structure_contract"],
    severity: "P0",
    origin: "post-foundation-repair-3",
    forbidLiveCommerce: true,
    buildPrompt: (seed) => {
      const e = pick(mulberry32(seed), ENTITIES);
      return [
        `SyntheticCanarySections-${seed} — analysis only. Answer in exactly 7 numbered sections.`,
        `Pack: forecast $2400; realised $410; co-occurrence of ${e} and Part Meridian; later registry update.`,
        `Cover: unknown counts, forecast vs realised, identity, provenance, supersession, unknowns, synthesis.`,
        `Do not mention Mini Fan or Birth.`,
      ].join("\n");
    },
    forbidden: [/Mini Fan/i, /sales-history evidence/i],
    requiredAny: [/forecast|estimate/i, /identity|co-occurr/i, /supersed|synthes/i],
  },
  {
    id: "cr.explicit_middle_claim_dropped",
    failureClass: "EXPLICIT_MIDDLE_CLAIM_DROPPED",
    capabilities: ["claim_set_completeness", "task_completion"],
    severity: "P0",
    origin: "post-foundation-repair-4",
    forbidLiveCommerce: true,
    forbidAuthorityHijack: true,
    buildPrompt: (seed) => {
      const a = pick(mulberry32(seed), AMOUNTS);
      return [
        `SyntheticCanaryMiddleClaim-${seed} — analysis only. Provide a separate verdict on each of the five quoted claims in original order.`,
        `1. "Forecast revenue reaches $${a * 8}."`,
        `2. "Later realised ledger shows $${a}."`,
        `3. "HT-88 is Harbour Crown Hotel."`,
        `4. "Independent rating +12% outweighs supplier."`,
        `5. "The completed stay never historically occurred because of a later refund."`,
      ].join("\n");
    },
    forbidden: [/Mini Fan/i, /sales-history evidence/i, /### Delegation reading/i],
    requiredAny: [/Claim\s*1/i, /Claim\s*2/i, /Claim\s*3/i, /Claim\s*4/i, /Claim\s*5/i],
  },
  {
    id: "cr.later_section_contradicts_earlier",
    failureClass: "LATER_SECTION_CONTRADICTS_EARLIER_VERIFIED_CONCLUSION",
    capabilities: ["cross_section_consistency"],
    severity: "P0",
    origin: "post-foundation-repair-4",
    forbidLiveCommerce: true,
    buildPrompt: (seed) => {
      return [
        `SyntheticCanaryLedger-${seed} — analysis only. Do not mention Mini Fan or Birth.`,
        `Pack: property registry shows HT-88 = Hillside Transit Hotel; Harbour Crown Hotel = HC-11; they are distinct.`,
        `Then provide a separate verdict on each quoted claim:`,
        `1. "HT-88 is Harbour Crown Hotel."`,
        `2. "Forecast equals realised."`,
      ].join("\n");
    },
    forbidden: [/Mini Fan/i, /Claim\s*1[\s\S]{0,200}\*\*Verdict:\*\*\s*Supported/i],
    requiredAny: [/Hillside|distinct|Contradict/i],
  },
  {
    id: "cr.retrieved_lesson_text_leak",
    failureClass: "RETRIEVED_LESSON_TEXT_LEAKS_INTO_FINAL_RESPONSE",
    capabilities: ["memory_realization"],
    severity: "P0",
    origin: "post-foundation-repair-4",
    forbidLiveCommerce: true,
    buildPrompt: (seed) => {
      return [
        `SyntheticCanaryLessonSurf-${seed} — hospitality analysis only.`,
        `Stays completed; later refund after service breach. Did stays historically occur?`,
        `Do not dump doctrine templates.`,
      ].join("\n");
    },
    forbidden: [/\*\*Event-state reading:\*\*/i, /chargeback, compensation, SLA breach/i, /sales-history evidence/i],
    requiredAny: [/occur|complet|refund|economic/i],
  },
  {
    id: "cr.source_domain_surface_contamination",
    failureClass: "SOURCE_DOMAIN_SURFACE_LANGUAGE_CONTAMINATION",
    capabilities: ["synthetic_isolation", "memory_realization"],
    severity: "P0",
    origin: "post-foundation-repair-4",
    forbidLiveCommerce: true,
    buildPrompt: (seed) => {
      return [
        `SyntheticCanaryDomainPure-${seed} — analysis only for a hypothetical healthcare clinic.`,
        `Classify whether forecast patient volume equals realised visits. Two short paragraphs.`,
        `Do not mention EmpireAI live products, Birth, Mini Fan, or commissioning.`,
      ].join("\n");
    },
    forbidden: [
      /sales-history evidence/i,
      /realised orders/i,
      /verified operating state/i,
      /commissioning\/KPI/i,
      /Mini Fan/i,
    ],
    requiredAny: [/forecast|patient|visit|realised|unproven/i],
  },
  {
    id: "cr.verified_registry_ignored_for_identity",
    failureClass: "VERIFIED_REGISTRY_IGNORED_FOR_IDENTITY",
    capabilities: ["entity_identity", "evidence_precedence"],
    severity: "P0",
    origin: "reasoning-core-simplification",
    forbidLiveCommerce: true,
    buildPrompt: (seed) => {
      const e = pick(mulberry32(seed), ENTITIES);
      return [
        `SyntheticCanaryRegistry-${seed} — analysis only.`,
        `Verified asset registry: ZX-11 = North Pier Module. ${e} = Partner Assembly; distinct.`,
        `Separate verdict on: "ZX-11 is Partner Assembly."`,
        `Do not mention Mini Fan or Birth.`,
      ].join("\n");
    },
    forbidden: [/Mini Fan/i, /\*\*Verdict:\*\*\s*Supported/i],
    requiredAny: [/North Pier|Contradict|distinct|registry/i],
  },
  {
    id: "cr.measured_subset_generalized_to_full_population",
    failureClass: "MEASURED_SUBSET_GENERALIZED_TO_FULL_POPULATION",
    capabilities: ["population_scope"],
    severity: "P0",
    origin: "reasoning-core-simplification",
    forbidLiveCommerce: true,
    buildPrompt: (seed) => {
      return [
        `SyntheticCanaryPopulation-${seed} — industrial analysis only.`,
        `120 deployed sites. 80 currently valid measured. 10% average reduction across the 80 valid measured sites.`,
        `Separate verdict on: "All 120 deployed sites demonstrate a 10% saving."`,
        `Do not mention Mini Fan.`,
      ].join("\n");
    },
    forbidden: [/Mini Fan/i, /All 120[\s\S]{0,120}\*\*Verdict:\*\*\s*Supported/i],
    requiredAny: [/80|valid measured|Contradict|does not apply to all/i],
  },
  {
    id: "cr.request_schema_misread_as_claim_set",
    failureClass: "REQUEST_SCHEMA_MISREAD_AS_CLAIM_SET",
    capabilities: ["claim_set_completeness"],
    severity: "P0",
    origin: "reasoning-core-simplification",
    forbidLiveCommerce: true,
    buildPrompt: (seed) => {
      return [
        `SyntheticCanarySchema-${seed} — analysis only. Answer in exactly 4 numbered sections.`,
        `Cover: forecast vs realised; identity; then claim audit of:`,
        `1. "Forecast equals realised."`,
        `2. "ZX-11 is Partner Assembly."`,
        `Then synthesis. Section headings are not claims.`,
      ].join("\n");
    },
    forbidden: [/Mini Fan/i],
    requiredAny: [/Claim\s*1/i, /Claim\s*2/i],
  },
  {
    id: "cr.duplicate_post_answer_synthesis",
    failureClass: "DUPLICATE_POST_ANSWER_SYNTHESIS",
    capabilities: ["structure_contract"],
    severity: "P1",
    origin: "reasoning-core-simplification",
    forbidLiveCommerce: true,
    buildPrompt: (seed) => {
      return [
        `SyntheticCanaryDupSynth-${seed} — analysis only.`,
        `Provide a separate verdict on each of the three quoted claims.`,
        `1. "Forecast $900."`,
        `2. "Realised $200."`,
        `3. "Identity is proven by co-occurrence."`,
      ].join("\n");
    },
    forbidden: [/Mini Fan/i],
    requiredAny: [/Claim\s*1/i, /Claim\s*2/i, /Claim\s*3/i],
  },
];

export type SpecimenGrade = {
  id: string;
  ok: boolean;
  reasons: string[];
};

export function gradeConstitutionalAnswer(
  specimen: ConstitutionalSpecimen,
  answer: string,
): SpecimenGrade {
  const reasons: string[] = [];
  const text = String(answer || "");
  for (const f of specimen.forbidden) {
    if (f.test(text)) reasons.push(`forbidden:${f}`);
  }
  if (specimen.forbidAuthorityHijack && /###\s*(Delegation|Authority) reading/i.test(text)) {
    reasons.push("authority_hijack");
  }
  if (
    specimen.forbidLiveCommerce &&
    /\b(Mini Fan|realised revenue remain zero|Brief verified note)\b/i.test(text)
  ) {
    reasons.push("live_commerce");
  }
  if (text.trim().length < 40) reasons.push("empty");
  if (!specimen.requiredAny.some((r) => r.test(text))) reasons.push("missing_required_signal");

  if (specimen.id === "cr.hetero_multipart_no_clone") {
    const contract = parseExecutiveTaskContract(specimen.buildPrompt(1));
    const clone = detectSiblingTemplateCloning(text, contract);
    if (clone.cloned) reasons.push(`template_cloning:${clone.reason ?? "yes"}`);
    const sections = (text.match(/^#{1,3}\s+/gm) || []).length;
    if (sections < 6) reasons.push(`insufficient_sections:${sections}`);
    if (!/refund|net after|arithmetic|operand|occurrence preserved|EVENT_OCCURRED/i.test(text)) {
      reasons.push("missing_refund_arithmetic_signal");
    }
    if (!/identity|co-occurr|same entity|unproven identity/i.test(text)) {
      reasons.push("missing_identity_signal");
    }
    if (!/supersed/i.test(text)) reasons.push("missing_supersession_signal");
  }

  if (specimen.id === "cr.explicit_claim_set_complete") {
    const contract = parseExecutiveTaskContract(specimen.buildPrompt(1));
    if (contract.expectedClaims < 5) reasons.push(`expected_claims:${contract.expectedClaims}`);
    const claimHits = (text.match(/claim\s*[1-5]|###\s*Claim|Verdict/gi) || []).length;
    if (claimHits < 4) reasons.push(`weak_claim_coverage:${claimHits}`);
  }

  if (specimen.id === "cr.exact_section_contract") {
    const markers = (text.match(/^\s*\d{1,2}[.)]\s+\S/gm) || []).map((l) =>
      Number(/^\s*(\d+)/.exec(l)?.[1] ?? 0),
    );
    const dups = markers.filter((n, i) => markers.indexOf(n) !== i);
    if (dups.length > 0) reasons.push(`duplicate_sections:${dups.join(",")}`);
  }

  if (specimen.id === "cr.source_domain_language_leak") {
    if (/sales-history|realised orders|verified operating state|commissioning\/KPI/i.test(text)) {
      reasons.push("source_domain_language_leak");
    }
  }

  if (specimen.id === "cr.explicit_middle_claim_dropped") {
    for (const n of [1, 2, 3, 4, 5]) {
      if (!new RegExp(`Claim\\s*${n}\\b`, "i").test(text)) {
        reasons.push(`missing_claim_${n}`);
      }
    }
  }

  if (specimen.id === "cr.later_section_contradicts_earlier") {
    if (/Claim\s*1[\s\S]{0,280}\*\*Verdict:\*\*\s*Supported/i.test(text)) {
      reasons.push("identity_claim_supported_against_ledger");
    }
  }

  if (specimen.id === "cr.retrieved_lesson_text_leak") {
    if (/\*\*Event-state reading:\*\*|chargeback, compensation, SLA breach/i.test(text)) {
      reasons.push("lesson_text_dumped");
    }
  }

  if (specimen.id === "cr.source_domain_surface_contamination") {
    if (/sales-history|realised orders|verified operating state|commissioning\/KPI/i.test(text)) {
      reasons.push("source_domain_surface_contamination");
    }
  }

  if (specimen.id === "cr.request_schema_misread_as_claim_set") {
    const contract = parseExecutiveTaskContract(specimen.buildPrompt(1));
    if (contract.expectedClaims !== 2) reasons.push(`expected_claims:${contract.expectedClaims}`);
  }

  if (specimen.id === "cr.duplicate_post_answer_synthesis") {
    const headings = (text.match(/^#{1,3}\s*Claim\s+(?:Verdicts?|Audit)\b/gim) || []).length;
    if (headings > 1) reasons.push(`duplicate_claim_audit_headings:${headings}`);
  }

  return { id: specimen.id, ok: reasons.length === 0, reasons };
}

export function runConstitutionalCorpus(
  synthesize: (prompt: string) => string,
  variantsPerSpecimen = 3,
): {
  totalSpecimens: number;
  totalVariants: number;
  pass: number;
  fail: number;
  results: SpecimenGrade[];
} {
  const results: SpecimenGrade[] = [];
  let pass = 0;
  let fail = 0;
  let totalVariants = 0;
  for (const specimen of CONSTITUTIONAL_SPECIMENS) {
    for (let v = 0; v < variantsPerSpecimen; v++) {
      totalVariants += 1;
      const prompt = specimen.buildPrompt(1000 + CONSTITUTIONAL_SPECIMENS.indexOf(specimen) * 10 + v);
      const answer = synthesize(prompt);
      const g = gradeConstitutionalAnswer(specimen, answer);
      results.push(g);
      if (g.ok) pass += 1;
      else fail += 1;
    }
  }
  return {
    totalSpecimens: CONSTITUTIONAL_SPECIMENS.length,
    totalVariants,
    pass,
    fail,
    results,
  };
}
