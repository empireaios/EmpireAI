/**
 * Deterministic commercial arithmetic for executive unit economics.
 * Calculator owns arithmetic; Pillow explains results.
 * Does not invent missing costs or FX rates.
 */
export type CurrencyCode = "SGD" | "USD" | "UNKNOWN" | "MIXED";

export type CommercialOperands = {
  sellingPrice: number | null;
  supplierCost: number | null;
  shippingCost: number | null;
  marketplaceFixedFee: number | null;
  marketplacePercentFee: number | null;
  expectedReturnCost: number | null;
  otherExplicitCost: number | null;
  currency: CurrencyCode;
  currenciesSeen: string[];
  askContribution: boolean;
  askMargin: boolean;
  askUpdate: boolean;
  forecastVsRealised: boolean;
  feeMentionedWithoutValue: boolean;
};

export type CommercialArithmeticResult = {
  ok: boolean;
  contribution: number | null;
  marginPercent: number | null;
  marketplacePercentFeeAmount: number | null;
  marketplaceFixedFeeAmount: number | null;
  totalCosts: number | null;
  currency: CurrencyCode;
  currencySymbol: string;
  unknownReason: string | null;
  formula: string;
  displayContribution: string | null;
  displayMargin: string | null;
  operands: CommercialOperands;
  breakdownLines: string[];
};

/** INTERNAL: full floating precision until final display. */
export const INTERNAL_PRECISION_POLICY =
  "IEEE float64 for intermediates; percentage fee = price × (pct/100) at full precision before subtraction.";

/** VISIBLE: ordinary SGD/USD executive presentation — 2 decimal places. */
export const VISIBLE_ROUNDING_POLICY =
  "Round only the final contribution/margin for display to 2 decimal places; do not round intermediate fee amounts before contribution.";

export function roundMoneyVisible(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function formatMoneyVisible(n: number, currency: CurrencyCode): string {
  const v = roundMoneyVisible(n);
  const fixed = v.toFixed(2);
  if (currency === "SGD") return `S$${fixed}`;
  if (currency === "USD") return `$${fixed}`;
  return fixed;
}

function detectCurrency(text: string): { code: CurrencyCode; seen: string[] } {
  const seen: string[] = [];
  if (/S\$|SGD\b/i.test(text)) seen.push("SGD");
  if (/\bUS\$\b|\bUSD\b|(?<![A-Za-z])\$(?!\s*$)/.test(text) && !/S\$/.test(text)) {
    // Also count bare $ when not S$
  }
  if (/\bUS\$\b|\bUSD\b/.test(text)) seen.push("USD");
  else if (/(?<!S)\$\s*\d/.test(text) || /(?<!S)\$\d/.test(text)) seen.push("USD");
  if (seen.length >= 2) return { code: "MIXED", seen: [...new Set(seen)] };
  if (seen.includes("SGD")) return { code: "SGD", seen };
  if (seen.includes("USD")) return { code: "USD", seen };
  return { code: "UNKNOWN", seen };
}

function moneyNear(text: string, label: RegExp): number | null {
  const t = String(text || "");
  const re = new RegExp(
    label.source +
      String.raw`\s*(?:=|:)?\s*(?:S\$|SGD|US\$|USD|\$)?\s*(-?\d+(?:\.\d+)?)`,
    "i",
  );
  const m = re.exec(t);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

function pctNear(text: string, label: RegExp): number | null {
  const t = String(text || "");
  // Do not let the gap consume digits — otherwise "14.5%" can capture only "5".
  const re = new RegExp(
    `(?:${label.source})[^\\d\\n%]{0,40}(-?\\d+(?:\\.\\d+)?)\\s*%`,
    "i",
  );
  const m = re.exec(t);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

/** True when message asks for unit economics / contribution arithmetic. */
export function isCommercialArithmeticAsk(message: string): boolean {
  const t = String(message || "");
  if (
    /\b(?:contribution(?:\s*\/\s*order|\s+per\s+order)?|unit economics|contribution\s+margin)\b/i.test(
      t,
    )
  ) {
    return true;
  }
  return (
    /\b(?:price|selling\s+price)\b/i.test(t) &&
    /\b(?:cost|supplier)\b/i.test(t) &&
    /\b(?:fee|shipping|refund|contribution)\b/i.test(t)
  );
}

export function parseCommercialOperands(message: string): CommercialOperands {
  const t = String(message || "");
  const { code, seen } = detectCurrency(t);

  const sellingPrice =
    moneyNear(t, /(?:selling\s+)?price/) ?? moneyNear(t, /\bASP\b/) ?? null;
  const supplierCost =
    moneyNear(t, /supplier(?:\s+cost)?/) ??
    moneyNear(t, /(?:unit\s+)?cost(?!\s*(?:ceiling|cap|limit))/) ??
    moneyNear(t, /\bCOGS\b/) ??
    null;
  const shippingCost =
    moneyNear(t, /ship(?:ping)?(?:\s+cost)?/) ?? moneyNear(t, /freight/) ?? null;

  const marketplacePercentFee =
    pctNear(t, /(?:marketplace\s+)?fee/) ??
    pctNear(t, /marketplace\s+percent(?:age)?(?:\s+fee)?/) ??
    null;

  let marketplaceFixedFee: number | null = moneyNear(t, /(?:marketplace\s+)?fixed\s+fee/);
  if (marketplacePercentFee == null && marketplaceFixedFee == null) {
    const feeFrag = /(?:marketplace\s+)?fee[^\n]{0,60}/i.exec(t)?.[0] || "";
    if (feeFrag && !/\d+(?:\.\d+)?\s*%/.test(feeFrag)) {
      marketplaceFixedFee = moneyNear(t, /(?:marketplace\s+)?fee\b/);
    }
  }

  const expectedReturnCost =
    moneyNear(t, /refund(?:\s+allowance)?/) ??
    moneyNear(t, /(?:expected\s+)?return(?:\s+cost|s?\s+allowance)?/) ??
    moneyNear(t, /return\s+allowance/) ??
    null;
  const otherExplicitCost =
    moneyNear(t, /other(?:\s+explicit)?(?:\s+cost)?/) ??
    moneyNear(t, /brand(?:\s+cost)?/) ??
    null;

  const feeMentionedWithoutValue =
    /\b(?:marketplace\s+)?fee\b/i.test(t) &&
    marketplacePercentFee == null &&
    marketplaceFixedFee == null;

  return {
    sellingPrice,
    supplierCost,
    shippingCost,
    marketplaceFixedFee,
    marketplacePercentFee,
    expectedReturnCost,
    otherExplicitCost,
    currency: code,
    currenciesSeen: seen,
    askContribution: /\bcontribution\b/i.test(t) || isCommercialArithmeticAsk(t),
    askMargin: /\bmargin\b/i.test(t),
    askUpdate:
      /\b(?:now|revise|update|recompute|after|cost (?:rises?|increases?|becomes?|is now))\b/i.test(
        t,
      ),
    forecastVsRealised: /\bforecast\b/i.test(t) && /\brealis/i.test(t),
    feeMentionedWithoutValue,
  };
}

export function computeCommercialContribution(
  operands: CommercialOperands,
): CommercialArithmeticResult {
  const sym =
    operands.currency === "SGD" ? "S$" : operands.currency === "USD" ? "$" : "";

  if (operands.currency === "MIXED") {
    return {
      ok: false,
      contribution: null,
      marginPercent: null,
      marketplacePercentFeeAmount: null,
      marketplaceFixedFeeAmount: operands.marketplaceFixedFee,
      totalCosts: null,
      currency: "MIXED",
      currencySymbol: "",
      unknownReason:
        "Mixed currencies without an explicit FX conversion rate — keep ledgers separate.",
      formula: "price - costs - fees (blocked: MIXED currency)",
      displayContribution: null,
      displayMargin: null,
      operands,
      breakdownLines: [
        "**Currency:** MIXED — no invented FX. Provide a conversion rate or keep one currency.",
      ],
    };
  }

  if (operands.sellingPrice == null) {
    return {
      ok: false,
      contribution: null,
      marginPercent: null,
      marketplacePercentFeeAmount: null,
      marketplaceFixedFeeAmount: null,
      totalCosts: null,
      currency: operands.currency,
      currencySymbol: sym,
      unknownReason: "SELLING_PRICE unknown — cannot compute contribution.",
      formula: "price - supplier - shipping - fees - return - other",
      displayContribution: null,
      displayMargin: null,
      operands,
      breakdownLines: ["**Need:** selling price."],
    };
  }

  const price = operands.sellingPrice;
  const supplier = operands.supplierCost ?? 0;
  const ship = operands.shippingCost ?? 0;
  const fixedFee = operands.marketplaceFixedFee ?? 0;
  const returnCost = operands.expectedReturnCost ?? 0;
  const other = operands.otherExplicitCost ?? 0;
  const pctFeeAmount =
    operands.marketplacePercentFee != null
      ? price * (operands.marketplacePercentFee / 100)
      : 0;

  const totalCosts = supplier + ship + pctFeeAmount + fixedFee + returnCost + other;
  const contribution = price - totalCosts;
  const marginPercent = price !== 0 ? (contribution / price) * 100 : null;

  const breakdown: string[] = [];
  breakdown.push(`Price: ${formatMoneyVisible(price, operands.currency)}`);
  if (operands.supplierCost != null) {
    breakdown.push(`Supplier cost: ${formatMoneyVisible(supplier, operands.currency)}`);
  }
  if (operands.shippingCost != null) {
    breakdown.push(`Shipping: ${formatMoneyVisible(ship, operands.currency)}`);
  }
  if (operands.marketplacePercentFee != null) {
    breakdown.push(
      `Marketplace fee (${operands.marketplacePercentFee}% of price): ${formatMoneyVisible(pctFeeAmount, operands.currency)}`,
    );
  }
  if (operands.marketplaceFixedFee != null) {
    breakdown.push(
      `Marketplace fixed fee: ${formatMoneyVisible(fixedFee, operands.currency)}`,
    );
  }
  if (operands.expectedReturnCost != null) {
    breakdown.push(
      `Refund/return allowance: ${formatMoneyVisible(returnCost, operands.currency)}`,
    );
  }
  if (operands.otherExplicitCost != null) {
    breakdown.push(`Other cost: ${formatMoneyVisible(other, operands.currency)}`);
  }
  breakdown.push(
    `**Contribution/order:** ${formatMoneyVisible(contribution, operands.currency)}`,
  );
  if (operands.askMargin && marginPercent != null) {
    breakdown.push(
      `**Contribution margin:** ${roundMoneyVisible(marginPercent).toFixed(2)}%`,
    );
  }

  return {
    ok: true,
    contribution: roundMoneyVisible(contribution),
    marginPercent: marginPercent == null ? null : roundMoneyVisible(marginPercent),
    marketplacePercentFeeAmount: roundMoneyVisible(pctFeeAmount),
    marketplaceFixedFeeAmount: operands.marketplaceFixedFee,
    totalCosts: roundMoneyVisible(totalCosts),
    currency: operands.currency,
    currencySymbol: sym,
    unknownReason: null,
    formula:
      "contribution = price − supplier − shipping − marketplace_%fee − marketplace_fixed − return − other",
    displayContribution: formatMoneyVisible(contribution, operands.currency),
    displayMargin:
      marginPercent == null ? null : `${roundMoneyVisible(marginPercent).toFixed(2)}%`,
    operands,
    breakdownLines: breakdown,
  };
}

export function resolveCommercialArithmetic(message: string): CommercialArithmeticResult {
  const operands = parseCommercialOperands(message);

  if (operands.currency === "MIXED") {
    return computeCommercialContribution(operands);
  }

  if (operands.feeMentionedWithoutValue && operands.askContribution) {
    return {
      ok: false,
      contribution: null,
      marginPercent: null,
      marketplacePercentFeeAmount: null,
      marketplaceFixedFeeAmount: null,
      totalCosts: null,
      currency: operands.currency,
      currencySymbol:
        operands.currency === "SGD" ? "S$" : operands.currency === "USD" ? "$" : "",
      unknownReason:
        "Marketplace fee is mentioned but neither a percentage nor a fixed amount is supplied — CONTRIBUTION=UNKNOWN.",
      formula: "price - costs - fees",
      displayContribution: null,
      displayMargin: null,
      operands,
      breakdownLines: ["**Need:** marketplace fee % of price or fixed fee amount."],
    };
  }

  if (/\bcost\b[^.\n]{0,24}\b(?:unknown|missing|unstated)\b/i.test(message)) {
    return {
      ok: false,
      contribution: null,
      marginPercent: null,
      marketplacePercentFeeAmount: null,
      marketplaceFixedFeeAmount: null,
      totalCosts: null,
      currency: operands.currency,
      currencySymbol: "",
      unknownReason: "Supplier cost unknown — CONTRIBUTION=UNKNOWN.",
      formula: "price - costs - fees",
      displayContribution: null,
      displayMargin: null,
      operands,
      breakdownLines: ["**Need:** supplier/unit cost."],
    };
  }

  return computeCommercialContribution(operands);
}

export function synthesizeCommercialArithmeticAnswer(
  message: string,
  subject = "Unit economics",
): string | null {
  if (!isCommercialArithmeticAsk(message) && !isCommercialArithmeticAsk(subject)) {
    return null;
  }
  const r = resolveCommercialArithmetic(message);
  // Forecast/realised ledger asks without a unit selling price are not unit-econ calculator cases.
  if (
    !r.ok &&
    r.operands.forecastVsRealised &&
    /SELLING_PRICE unknown/i.test(r.unknownReason || "")
  ) {
    return null;
  }
  if (!r.ok && r.unknownReason) {
    return [
      `### ${subject.slice(0, 100)}`,
      "**Scope:** scenario arithmetic — deterministic calculator.",
      "",
      r.displayContribution
        ? `**Contribution/order:** ${r.displayContribution}`
        : "**Contribution/order:** UNKNOWN",
      r.unknownReason,
      ...r.breakdownLines,
    ].join("\n");
  }
  if (!r.ok || r.displayContribution == null) return null;

  return [
    `### ${subject.slice(0, 100)}`,
    "**Scope:** scenario arithmetic — deterministic calculator (authoritative).",
    "",
    ...r.breakdownLines.map((l) => `- ${l}`),
    "",
    `Formula: ${r.formula}`,
    "",
    `**Contribution/order = ${r.displayContribution}** (exact; do not round to a whole number).`,
  ].join("\n");
}

export function detectArithmeticMismatch(
  answer: string,
  expected: CommercialArithmeticResult,
): boolean {
  if (!expected.ok || expected.contribution == null) return false;
  const t = String(answer || "");
  const exact = expected.contribution.toFixed(2);
  if (t.includes(exact)) return false;
  const contribMentions = [
    ...t.matchAll(
      /contribution[^\n.]{0,48}?(?:S\$|SGD|US\$|\$)?\s*(-?\d+(?:\.\d+)?)/gi,
    ),
  ];
  for (const m of contribMentions) {
    const n = Number(m[1]);
    if (!Number.isFinite(n)) continue;
    if (Math.abs(n - expected.contribution) >= 0.05) return true;
  }
  return false;
}

function answerInventsFx(answer: string): boolean {
  return /(?:exchange\s+rate|assuming\s+(?:an\s+)?(?:exchange\s+)?rate|1\s*USD\s*=|convert(?:ed|ing)?\s+(?:to|into)\s+S\$|USD\s+\d+[^\n]{0,40}S\$)/i.test(
    answer,
  );
}

/** True when calculator already authored an authoritative UNKNOWN block. */
function hasAuthoritativeUnknown(answer: string): boolean {
  return (
    /\*\*Contribution\/order:\*\*\s*UNKNOWN\b/i.test(answer) ||
    /Contribution\/order:\s*UNKNOWN\b/i.test(answer) ||
    /CONTRIBUTION\s*=\s*UNKNOWN\b/i.test(answer) ||
    (/deterministic calculator/i.test(answer) && /\bUNKNOWN\b/.test(answer))
  );
}

function answerAssertsNumericContribution(answer: string): boolean {
  return (
    /contribution[^\n]{0,80}(?:S\$|SGD|US\$|\$)?\s*-?\d+(?:\.\d+)?/i.test(answer) &&
    !hasAuthoritativeUnknown(answer)
  );
}

function answerAssumesMissingFeeZero(answer: string): boolean {
  return /assume(?:s|d|ing)?\s+(?:the\s+)?(?:marketplace\s+)?fee\s+is\s+zero/i.test(answer);
}

/**
 * Calculator authority on release: exact numbers win; UNKNOWN/MIXED overrides
 * invented FX or false-complete contribution claims.
 */
export function repairAnswerWithCalculator(answer: string, message: string): string {
  if (!isCommercialArithmeticAsk(message)) return answer;
  if (/Deterministic contribution\/order|deterministic calculator \(authoritative\)/i.test(answer)) {
    return answer;
  }
  const r = resolveCommercialArithmetic(message);
  const synth = synthesizeCommercialArithmeticAnswer(message);

  if (!r.ok) {
    // Forecast vs realised ledgers are not unit-price contribution — do not force UNKNOWN.
    if (
      r.operands.forecastVsRealised &&
      /SELLING_PRICE unknown/i.test(r.unknownReason || "")
    ) {
      return answer;
    }
    if (!synth) return answer;
    const needsOverride =
      answerInventsFx(answer) ||
      answerAssertsNumericContribution(answer) ||
      answerAssumesMissingFeeZero(answer) ||
      (r.currency === "MIXED" && !/no invented FX|MIXED|conversion rate/i.test(answer)) ||
      (r.operands.feeMentionedWithoutValue && !hasAuthoritativeUnknown(answer));
    if (needsOverride) return synth;
    if (!hasAuthoritativeUnknown(answer) && !/no invented FX/i.test(answer)) {
      return `${answer.trim()}\n\n${synth}`;
    }
    return answer;
  }

  if (r.displayContribution == null) return answer;
  if (answerInventsFx(answer)) return synth || answer;
  if (!detectArithmeticMismatch(answer, r) && answer.includes(r.contribution!.toFixed(2))) {
    return answer;
  }
  // Pure arithmetic asks: replace with calculator body. Decision asks: append exact figure.
  if (
    synth &&
    !/\b(?:select|eligible|granted|pending|recommend)\b/i.test(message) &&
    detectArithmeticMismatch(answer, r)
  ) {
    return synth;
  }
  return `${answer.trim()}\n\n**Deterministic contribution/order:** ${r.displayContribution} (calculator-authoritative; do not use a rounded whole-number substitute).`;
}

/** Brief line for LLM context — calculator is authoritative. */
export function formatCommercialArithmeticBrief(message: string): string | null {
  if (!isCommercialArithmeticAsk(message)) return null;
  const r = resolveCommercialArithmetic(message);
  if (!r.ok || r.displayContribution == null) {
    if (r.unknownReason) {
      return `DETERMINISTIC_ARITHMETIC: ${r.unknownReason}`;
    }
    return null;
  }
  return [
    "DETERMINISTIC_ARITHMETIC (authoritative — do not approximate):",
    ...r.breakdownLines,
    `Final contribution/order = ${r.displayContribution}`,
  ].join("\n");
}
