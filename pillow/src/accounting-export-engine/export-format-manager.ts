/** R3-17 — Export format manager. */

import type { AccountingFinancialSnapshot } from "./accounting-data-source.js";
import type { ExportFormat, ExportRecord } from "./types.js";

export class ExportFormatManager {
  format(snapshot: AccountingFinancialSnapshot, record: ExportRecord): string {
    switch (record.exportFormat) {
      case "json":
        return this.toJson(snapshot, record);
      case "quickbooks":
        return this.toQuickBooks(snapshot, record);
      case "xero":
        return this.toXero(snapshot, record);
      case "generic":
        return this.toGeneric(snapshot, record);
      case "csv":
      default:
        return this.toCsv(snapshot, record);
    }
  }

  isFormatSupported(format: ExportFormat): boolean {
    return ["csv", "json", "quickbooks", "xero", "generic"].includes(format);
  }

  private toCsv(snapshot: AccountingFinancialSnapshot, record: ExportRecord): string {
    const lines = ["type,reference,amount,currency,timestamp"];
    for (const ref of record.revenueReferences) {
      const r = snapshot.revenues.find((x) => x.revenueRecordId === ref);
      if (r) lines.push(`revenue,${ref},${r.netRevenue ?? r.grossRevenue ?? 0},${r.currency ?? "USD"},${r.timestamp}`);
    }
    for (const ref of record.expenseReferences) {
      const e = snapshot.expenses.find((x) => x.expenseRecordId === ref);
      if (e) lines.push(`expense,${ref},${e.expenseAmount ?? 0},${e.currency ?? "USD"},${e.timestamp}`);
    }
    for (const ref of record.invoiceReferences) {
      const i = snapshot.invoices.find((x) => x.invoiceId === ref);
      if (i) lines.push(`invoice,${ref},${i.invoiceAmount ?? 0},${i.currency ?? "USD"},${i.timestamp}`);
    }
    for (const ref of record.refundReferences) {
      const rf = snapshot.refunds.find((x) => x.refundId === ref);
      if (rf) lines.push(`refund,${ref},${rf.refundAmount ?? 0},${rf.currency ?? "USD"},${rf.timestamp}`);
    }
    for (const ref of record.taxReferences) {
      const t = snapshot.taxes.find((x) => x.taxRecordId === ref);
      if (t) lines.push(`tax,${ref},${t.taxAmount ?? 0},USD,${t.timestamp}`);
    }
    for (const ref of record.reconciliationReferences) {
      const rc = snapshot.reconciliations.find((x) => x.reconciliationRecordId === ref);
      if (rc) lines.push(`reconciliation,${ref},${rc.differenceAmount ?? 0},USD,${rc.timestamp}`);
    }
    return lines.join("\n");
  }

  private toJson(snapshot: AccountingFinancialSnapshot, record: ExportRecord): string {
    return JSON.stringify(
      {
        exportId: record.exportRecordId,
        format: record.exportFormat,
        scope: record.exportScope,
        revenues: snapshot.revenues.filter((r) => record.revenueReferences.includes(r.revenueRecordId)),
        expenses: snapshot.expenses.filter((e) => record.expenseReferences.includes(e.expenseRecordId)),
        invoices: snapshot.invoices.filter((i) => record.invoiceReferences.includes(i.invoiceId)),
        refunds: snapshot.refunds.filter((r) => record.refundReferences.includes(r.refundId)),
        taxes: snapshot.taxes.filter((t) => record.taxReferences.includes(t.taxRecordId)),
        reconciliations: snapshot.reconciliations.filter((r) =>
          record.reconciliationReferences.includes(r.reconciliationRecordId),
        ),
      },
      null,
      2,
    );
  }

  private toQuickBooks(snapshot: AccountingFinancialSnapshot, record: ExportRecord): string {
    const lines = ["!TRNS\tTRNSTYPE\tDATE\tACCNT\tNAME\tAMOUNT\tMEMO"];
    for (const ref of record.revenueReferences) {
      const r = snapshot.revenues.find((x) => x.revenueRecordId === ref);
      if (r) {
        lines.push(
          `TRNS\tDEP\t${r.timestamp.slice(0, 10)}\tIncome\tRevenue\t${r.netRevenue ?? r.grossRevenue ?? 0}\t${ref}`,
        );
      }
    }
    for (const ref of record.expenseReferences) {
      const e = snapshot.expenses.find((x) => x.expenseRecordId === ref);
      if (e) {
        lines.push(
          `TRNS\tEXP\t${e.timestamp.slice(0, 10)}\tExpenses\tSupplier\t-${e.expenseAmount ?? 0}\t${ref}`,
        );
      }
    }
    return lines.join("\n");
  }

  private toXero(snapshot: AccountingFinancialSnapshot, record: ExportRecord): string {
    const lines = ["*ContactName,EmailAddress,POAddressLine1,POCity,PORegion,POPostalCode,POCountry"];
    for (const ref of record.invoiceReferences) {
      const i = snapshot.invoices.find((x) => x.invoiceId === ref);
      if (i) {
        lines.push(`${i.customerReference ?? "Customer"},,,,,,`);
      }
    }
    lines.push("*InvoiceNumber,ContactName,InvoiceDate,DueDate,InventoryItemCode,Description,Quantity,UnitAmount");
    for (const ref of record.invoiceReferences) {
      const i = snapshot.invoices.find((x) => x.invoiceId === ref);
      if (i) {
        lines.push(
          `${ref},${i.customerReference ?? "Customer"},${i.timestamp.slice(0, 10)},${i.timestamp.slice(0, 10)},,Invoice,1,${i.invoiceAmount ?? 0}`,
        );
      }
    }
    return lines.join("\n");
  }

  private toGeneric(snapshot: AccountingFinancialSnapshot, record: ExportRecord): string {
    return [
      `EXPORT:${record.exportRecordId}`,
      `SCOPE:${record.exportScope}`,
      `REVENUE:${record.revenueReferences.length}`,
      `EXPENSE:${record.expenseReferences.length}`,
      `INVOICE:${record.invoiceReferences.length}`,
      `REFUND:${record.refundReferences.length}`,
      `TAX:${record.taxReferences.length}`,
      `RECONCILIATION:${record.reconciliationReferences.length}`,
      `TOTAL_RECORDS:${record.recordCount}`,
      `DATA:${this.toCsv(snapshot, record)}`,
    ].join("\n");
  }
}
