/** R3-06 — Profit calculation engine (core math). */

import { appendPcLog } from "./pc-logging.js";
import type { RevenueEngine } from "../revenue-engine/engine.js";
import type { ExpenseEngine } from "../expense-engine/engine.js";
import type { ProfitCalculationEngineConfiguration } from "./configuration.js";
import type { MarginCalculationEngine } from "./margin-calculation-engine.js";
import type { ProfitMetadataGenerator } from "./profit-metadata-generator.js";
import type { ProfitValidationEngine } from "./profit-validator.js";
import type { ProfitRegistry } from "./profit-registry.js";
import type {
  CalculateProfitByMarketplaceInput,
  CalculateProfitByOrderInput,
  CalculateProfitByProductInput,
  CalculateProfitBySupplierInput,
  CalculateProfitInput,
  ProfitRecord,
} from "./types.js";

type FilterContext = {
  marketplaceReference?: string;
  supplierReference?: string;
  productReference?: string;
  orderReference?: string;
  revenueReference?: string;
  expenseReference?: string;
  currency: string;
};

export class ProfitCalculationEngineCore {
  constructor(
    private readonly registry: ProfitRegistry,
    private readonly metadataGenerator: ProfitMetadataGenerator,
    private readonly marginEngine: MarginCalculationEngine,
    private readonly validationEngine: ProfitValidationEngine,
    private readonly revenueEngine: RevenueEngine | null,
    private readonly expenseEngine: ExpenseEngine | null,
  ) {}

  private getFinancialData(ctx: FilterContext): {
    grossRevenue: number;
    netRevenue: number;
    directCosts: number;
    operatingExpenses: number;
    totalExpenses: number;
    revenueRef: string | null;
    expenseRef: string | null;
    warnings: string[];
  } {
    const warnings: string[] = [];
    if (!this.revenueEngine) {
      return {
        grossRevenue: 0,
        netRevenue: 0,
        directCosts: 0,
        operatingExpenses: 0,
        totalExpenses: 0,
        revenueRef: null,
        expenseRef: null,
        warnings: ["Revenue Engine unavailable"],
      };
    }
    if (!this.expenseEngine) {
      return {
        grossRevenue: 0,
        netRevenue: 0,
        directCosts: 0,
        operatingExpenses: 0,
        totalExpenses: 0,
        revenueRef: null,
        expenseRef: null,
        warnings: ["Expense Engine unavailable"],
      };
    }

    let revenues = this.revenueEngine
      .getRevenueRecords()
      .filter((r) => r.validationStatus === "passed" && r.currency === ctx.currency);

    let expenses = this.expenseEngine
      .getExpenseRecords()
      .filter((r) => r.validationStatus === "passed" && r.currency === ctx.currency);

    if (ctx.marketplaceReference) {
      revenues = revenues.filter((r) => r.marketplaceReference === ctx.marketplaceReference);
    }
    if (ctx.supplierReference) {
      expenses = expenses.filter((r) => r.supplierReference === ctx.supplierReference);
    }
    if (ctx.revenueReference) {
      revenues = revenues.filter((r) => r.revenueRecordId === ctx.revenueReference);
    }
    if (ctx.expenseReference) {
      expenses = expenses.filter((r) => r.expenseRecordId === ctx.expenseReference);
    }
    if (ctx.orderReference) {
      revenues = revenues.filter(
        (r) => r.paymentReference?.includes(ctx.orderReference!) ?? false,
      );
    }
    if (ctx.productReference) {
      revenues = revenues.filter(
        (r) => r.customerReference?.includes(ctx.productReference!) ?? false,
      );
    }

    if (revenues.length === 0) warnings.push("No matching revenue records");
    if (expenses.length === 0) warnings.push("No matching expense records");

    const grossRevenue = revenues.reduce((s, r) => s + r.grossRevenue, 0);
    const netRevenue = revenues.reduce((s, r) => s + r.netRevenue, 0);
    const directCosts = expenses
      .filter((e) => e.expenseCategory === "supplier_payment")
      .reduce((s, e) => s + e.expenseAmount, 0);
    const operatingExpenses = expenses
      .filter((e) =>
        ["shipping", "advertising", "platform_fee", "operational", "recurring"].includes(
          e.expenseCategory,
        ),
      )
      .reduce((s, e) => s + e.expenseAmount, 0);
    const totalExpenses = expenses.reduce((s, e) => s + e.expenseAmount, 0);

    return {
      grossRevenue,
      netRevenue,
      directCosts,
      operatingExpenses,
      totalExpenses,
      revenueRef: revenues[0]?.revenueRecordId ?? null,
      expenseRef: expenses[0]?.expenseRecordId ?? null,
      warnings,
    };
  }

  private buildRecord(
    ctx: FilterContext,
    config: ProfitCalculationEngineConfiguration,
    dedupeKey: string,
  ): { record: ProfitRecord | null; error: string | null; warnings: string[] } {
    if (this.registry.hasDedupeKey(dedupeKey)) {
      return { record: null, error: "Duplicate profit calculation", warnings: [] };
    }

    const data = this.getFinancialData(ctx);
    if (!config.calculationRulesEnabled) {
      return { record: null, error: "Profit calculation rules disabled", warnings: data.warnings };
    }

    const margins = this.marginEngine.calculate(
      {
        grossRevenue: data.grossRevenue,
        netRevenue: data.netRevenue,
        directCosts: data.directCosts,
        operatingExpenses: data.operatingExpenses,
        totalExpenses: data.totalExpenses,
      },
      config,
    );

    let record = this.metadataGenerator.buildProfitRecord({
      revenueReference: data.revenueRef,
      expenseReference: data.expenseRef,
      marketplaceReference: ctx.marketplaceReference ?? null,
      supplierReference: ctx.supplierReference ?? null,
      productReference: ctx.productReference ?? null,
      orderReference: ctx.orderReference ?? null,
      grossProfit: margins.grossProfit,
      operatingProfit: margins.operatingProfit,
      netProfit: margins.netProfit,
      profitMargin: margins.profitMargin,
      validationStatus: "pending",
    });

    const validation = this.validationEngine.validateForCalculation(record, config);
    if (validation.decision === "fail") {
      return { record: null, error: validation.errors.join("; "), warnings: data.warnings };
    }

    record = { ...record, validationStatus: "passed" };
    this.registry.store(record, dedupeKey);

    appendPcLog({
      event: "profit_calculation",
      level: "info",
      details: `Calculated profit ${record.profitRecordId} · net ${record.netProfit}`,
    });

    return { record, error: null, warnings: data.warnings };
  }

  calculateProfit(
    input: CalculateProfitInput,
    config: ProfitCalculationEngineConfiguration,
  ): { record: ProfitRecord | null; error: string | null; warnings: string[] } {
    const currency = input.currency ?? config.defaultCurrency;
    const dedupeKey = `global:${currency}:${input.revenueReference ?? ""}:${input.expenseReference ?? ""}`;
    return this.buildRecord(
      {
        currency,
        revenueReference: input.revenueReference,
        expenseReference: input.expenseReference,
      },
      config,
      dedupeKey,
    );
  }

  calculateByMarketplace(
    input: CalculateProfitByMarketplaceInput,
    config: ProfitCalculationEngineConfiguration,
  ): { record: ProfitRecord | null; error: string | null; warnings: string[] } {
    const currency = input.currency ?? config.defaultCurrency;
    const dedupeKey = `marketplace:${input.marketplaceReference}:${currency}`;
    return this.buildRecord(
      { currency, marketplaceReference: input.marketplaceReference },
      config,
      dedupeKey,
    );
  }

  calculateBySupplier(
    input: CalculateProfitBySupplierInput,
    config: ProfitCalculationEngineConfiguration,
  ): { record: ProfitRecord | null; error: string | null; warnings: string[] } {
    const currency = input.currency ?? config.defaultCurrency;
    const dedupeKey = `supplier:${input.supplierReference}:${currency}`;
    return this.buildRecord(
      { currency, supplierReference: input.supplierReference },
      config,
      dedupeKey,
    );
  }

  calculateByProduct(
    input: CalculateProfitByProductInput,
    config: ProfitCalculationEngineConfiguration,
  ): { record: ProfitRecord | null; error: string | null; warnings: string[] } {
    const currency = input.currency ?? config.defaultCurrency;
    const dedupeKey = `product:${input.productReference}:${currency}`;
    return this.buildRecord(
      { currency, productReference: input.productReference },
      config,
      dedupeKey,
    );
  }

  calculateByOrder(
    input: CalculateProfitByOrderInput,
    config: ProfitCalculationEngineConfiguration,
  ): { record: ProfitRecord | null; error: string | null; warnings: string[] } {
    const currency = input.currency ?? config.defaultCurrency;
    const dedupeKey = `order:${input.orderReference}:${currency}`;
    return this.buildRecord(
      { currency, orderReference: input.orderReference },
      config,
      dedupeKey,
    );
  }
}
