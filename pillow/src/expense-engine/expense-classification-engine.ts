/** R3-05 — Expense classification engine. */

import type { ExpenseEngineConfiguration } from "./configuration.js";
import type { ExpenseCategory, ExpenseSource } from "./types.js";

export type ExpenseClassification = {
  expenseSource: ExpenseSource;
  expenseCategory: ExpenseCategory;
  classificationLabel: string;
};

export class ExpenseClassificationEngine {
  classify(
    input: {
      expenseSource: ExpenseSource;
      expenseCategory?: ExpenseCategory;
      recurring?: boolean;
      supplierReference?: string | null;
    },
    config: ExpenseEngineConfiguration,
  ): ExpenseClassification {
    if (!config.classificationRulesEnabled) {
      return {
        expenseSource: input.expenseSource,
        expenseCategory: input.expenseCategory ?? "operational",
        classificationLabel: "unclassified",
      };
    }

    if (input.recurring) {
      return {
        expenseSource: input.expenseSource,
        expenseCategory: "recurring",
        classificationLabel: `recurring:${input.expenseSource}`,
      };
    }

    const categoryMap: Partial<Record<ExpenseSource, ExpenseCategory>> = {
      supplier_payment: "supplier_payment",
      shipping: "shipping",
      advertising: "advertising",
      platform_fee: "platform_fee",
      operational: "operational",
    };

    const category =
      input.expenseCategory ?? categoryMap[input.expenseSource] ?? "operational";

    return {
      expenseSource: input.expenseSource,
      expenseCategory: category,
      classificationLabel: input.supplierReference
        ? `${category}:${input.supplierReference}`
        : category,
    };
  }
}
