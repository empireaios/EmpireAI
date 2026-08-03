import type { TaxSupportWorkerConfiguration } from "./configuration.js";
import { moneyFromMinor, moneySum, moneyZero } from "./money.js";
import {
  nextFlagId,
  nextMissingId,
  nextReminderId,
} from "./tax-store.js";
import type {
  ExpenseSummary,
  FilingReminder,
  IncomeSummary,
  MissingDocumentationItem,
  ProfessionalReviewFlag,
  TaxCategorySummaryEntry,
  TaxSupportCategory,
  TaxSupportDocument,
  TaxSupportTransaction,
} from "./types.js";

const INCOME_CATEGORIES: TaxSupportCategory[] = ["income_revenue", "income_other"];
const EXPENSE_CATEGORIES: TaxSupportCategory[] = [
  "expense_cogs",
  "expense_opex",
  "expense_payroll",
  "expense_advertising",
  "expense_fees",
];

export function buildIncomeSummary(
  transactions: readonly TaxSupportTransaction[],
  currency: string,
): IncomeSummary {
  const income = transactions.filter((t) => INCOME_CATEGORIES.includes(t.category));
  const revenue = income.filter((t) => t.category === "income_revenue");
  const other = income.filter((t) => t.category === "income_other");
  return {
    totalIncome: moneySum(
      income.map((t) => moneyFromMinor(t.amountMinor, t.currency)),
      currency,
    ),
    revenueIncome: moneySum(
      revenue.map((t) => moneyFromMinor(t.amountMinor, t.currency)),
      currency,
    ),
    otherIncome: moneySum(
      other.map((t) => moneyFromMinor(t.amountMinor, t.currency)),
      currency,
    ),
    transactionCount: income.length,
    recordKind: "factual_financial_record",
    fabricated: false,
  };
}

export function buildExpenseSummary(
  transactions: readonly TaxSupportTransaction[],
  currency: string,
): ExpenseSummary {
  const expenses = transactions.filter((t) => EXPENSE_CATEGORIES.includes(t.category));
  const by = (category: TaxSupportCategory) =>
    moneySum(
      expenses.filter((t) => t.category === category).map((t) => moneyFromMinor(t.amountMinor, t.currency)),
      currency,
    );
  return {
    totalExpenses: moneySum(
      expenses.map((t) => moneyFromMinor(t.amountMinor, t.currency)),
      currency,
    ),
    cogs: by("expense_cogs"),
    opex: by("expense_opex"),
    payroll: by("expense_payroll"),
    advertising: by("expense_advertising"),
    fees: by("expense_fees"),
    transactionCount: expenses.length,
    recordKind: "factual_financial_record",
    fabricated: false,
  };
}

export function buildTaxCategorySummaries(
  transactions: readonly TaxSupportTransaction[],
  currency: string,
): TaxCategorySummaryEntry[] {
  const map = new Map<TaxSupportCategory, TaxSupportTransaction[]>();
  for (const t of transactions) {
    const list = map.get(t.category) ?? [];
    list.push(t);
    map.set(t.category, list);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([category, rows]) => ({
      category,
      total:
        rows.length === 0
          ? moneyZero(currency)
          : moneySum(
              rows.map((t) => moneyFromMinor(t.amountMinor, t.currency)),
              currency,
            ),
      transactionCount: rows.length,
      recordKind: "factual_financial_record" as const,
      fabricated: false as const,
    }));
}

export function detectMissingDocumentation(params: {
  businessId: string;
  reportingPeriod: string;
  documents: readonly TaxSupportDocument[];
  requiredKinds: readonly TaxSupportDocument["kind"][];
}): MissingDocumentationItem[] {
  const present = new Set(params.documents.map((d) => d.kind));
  return params.requiredKinds
    .filter((kind) => !present.has(kind))
    .map((kind) => ({
      missingId: nextMissingId(),
      kind,
      businessId: params.businessId,
      reportingPeriod: params.reportingPeriod,
      reason: `Required tax-support document kind '${kind}' not present for period ${params.reportingPeriod}`,
      signalKind: "missing_documentation_signal" as const,
      fabricated: false as const,
    }));
}

function addDaysIso(periodEndDate: string, offsetDays: number): string {
  const base = new Date(`${periodEndDate}T00:00:00.000Z`);
  if (Number.isNaN(base.getTime())) {
    return periodEndDate;
  }
  base.setUTCDate(base.getUTCDate() + offsetDays);
  return base.toISOString().slice(0, 10);
}

/**
 * Generate filing-reminder schedule entries. These are calendar/support
 * reminders only — never tax advice and never automatic filing instructions.
 */
export function generateFilingReminders(params: {
  businessId: string;
  reportingPeriod: string;
  periodEndDate: string;
  schedule: TaxSupportWorkerConfiguration["filingReminderSchedule"];
}): FilingReminder[] {
  return params.schedule.map((entry) => ({
    reminderId: nextReminderId(),
    kind: entry.kind,
    businessId: params.businessId,
    reportingPeriod: params.reportingPeriod,
    dueDate: addDaysIso(params.periodEndDate, entry.offsetDaysAfterPeriodEnd),
    title: entry.title,
    description: `Support reminder for ${params.reportingPeriod} (${entry.kind}). Not legal advice. Not a filing instruction. Not an automatic submission.`,
    signalKind: "filing_reminder_schedule" as const,
    isAdvice: false as const,
    isFilingInstruction: false as const,
    fabricated: false as const,
  }));
}

export function buildProfessionalReviewFlags(params: {
  businessId: string;
  reportingPeriod: string;
  transactions: readonly TaxSupportTransaction[];
  missing: readonly MissingDocumentationItem[];
  jurisdictionExtensionPoint: string | null;
  highValueThresholdMinor: number;
}): ProfessionalReviewFlag[] {
  const flags: ProfessionalReviewFlag[] = [];
  if (params.missing.length > 0) {
    flags.push({
      flagId: nextFlagId(),
      reason: "missing_documentation",
      businessId: params.businessId,
      reportingPeriod: params.reportingPeriod,
      severity: "attention",
      description: `${params.missing.length} missing tax-support document kind(s) — professional review recommended.`,
      evidenceRefs: params.missing.map((m) => m.missingId),
      signalKind: "professional_review_flag",
      isAdvice: false,
      fabricated: false,
    });
  }
  const currencies = new Set(params.transactions.map((t) => t.currency));
  if (currencies.size > 1) {
    flags.push({
      flagId: nextFlagId(),
      reason: "multi_currency_present",
      businessId: params.businessId,
      reportingPeriod: params.reportingPeriod,
      severity: "attention",
      description: "Multiple currencies present in verified records — professional review recommended before any filing preparation outside this worker.",
      evidenceRefs: [...currencies],
      signalKind: "professional_review_flag",
      isAdvice: false,
      fabricated: false,
    });
  }
  const uncategorised = params.transactions.filter((t) => t.category === "other");
  if (uncategorised.length > 0) {
    flags.push({
      flagId: nextFlagId(),
      reason: "uncategorised_transactions",
      businessId: params.businessId,
      reportingPeriod: params.reportingPeriod,
      severity: "info",
      description: `${uncategorised.length} transaction(s) tagged 'other' — confirm categorisation with a professional.`,
      evidenceRefs: uncategorised.map((t) => t.sourceRef),
      signalKind: "professional_review_flag",
      isAdvice: false,
      fabricated: false,
    });
  }
  for (const t of params.transactions) {
    if (Math.abs(t.amountMinor) >= params.highValueThresholdMinor) {
      flags.push({
        flagId: nextFlagId(),
        reason: "high_value_transaction",
        businessId: params.businessId,
        reportingPeriod: params.reportingPeriod,
        severity: "elevated",
        description: `High-value verified transaction ${t.transactionId} meets review threshold — not a tax calculation.`,
        evidenceRefs: [t.sourceRef, t.transactionId],
        signalKind: "professional_review_flag",
        isAdvice: false,
        fabricated: false,
      });
    }
  }
  if (params.jurisdictionExtensionPoint) {
    flags.push({
      flagId: nextFlagId(),
      reason: "jurisdiction_extension_point",
      businessId: params.businessId,
      reportingPeriod: params.reportingPeriod,
      severity: "info",
      description: `Jurisdiction extension point '${params.jurisdictionExtensionPoint}' recorded — future jurisdiction packs may attach without redesign; no obligation calculated.`,
      evidenceRefs: [params.jurisdictionExtensionPoint],
      signalKind: "professional_review_flag",
      isAdvice: false,
      fabricated: false,
    });
  }
  if (params.transactions.length === 0) {
    flags.push({
      flagId: nextFlagId(),
      reason: "incomplete_period_coverage",
      businessId: params.businessId,
      reportingPeriod: params.reportingPeriod,
      severity: "attention",
      description: "No verified tax-support transactions for period — incomplete coverage signal only.",
      evidenceRefs: [],
      signalKind: "professional_review_flag",
      isAdvice: false,
      fabricated: false,
    });
  }
  return flags;
}

export function computeConfidenceScore(params: {
  transactionCount: number;
  missingCount: number;
  documentCount: number;
  requiredDocumentCount: number;
}): number {
  if (params.transactionCount === 0) return 20;
  let score = 55;
  score += Math.min(25, params.transactionCount * 2);
  const covered = Math.max(0, params.requiredDocumentCount - params.missingCount);
  if (params.requiredDocumentCount > 0) {
    score += Math.floor((covered * 20) / params.requiredDocumentCount);
  }
  score += Math.min(10, params.documentCount);
  return Math.max(0, Math.min(100, score));
}

/** Map period label YYYY-MM to period-end date YYYY-MM-DD (last day), deterministic. */
export function resolvePeriodEndDate(reportingPeriod: string, explicit?: string | null): string {
  if (explicit?.trim()) return explicit.trim().slice(0, 10);
  const m = /^(\d{4})-(\d{2})$/.exec(reportingPeriod.trim());
  if (!m) return `${reportingPeriod.trim().slice(0, 10) || "1970-01-01"}`;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return `${m[1]}-${m[2]}-${String(lastDay).padStart(2, "0")}`;
}
