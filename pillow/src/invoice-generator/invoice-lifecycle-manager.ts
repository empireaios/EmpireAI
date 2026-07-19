/** R3-09 — Invoice lifecycle manager. */

import { appendIgLog } from "./ig-logging.js";
import type { InvoiceGeneratorConfiguration } from "./configuration.js";
import type { InvoiceRegistry } from "./invoice-registry.js";
import type { InvoiceStatus, UpdateInvoiceStatusInput } from "./types.js";

const ALLOWED_TRANSITIONS: Record<InvoiceStatus, InvoiceStatus[]> = {
  draft: ["issued", "cancelled"],
  issued: ["sent", "paid", "cancelled"],
  sent: ["paid", "cancelled"],
  paid: [],
  cancelled: [],
  failed: ["draft"],
};

export class InvoiceLifecycleManager {
  updateStatus(
    input: UpdateInvoiceStatusInput,
    config: InvoiceGeneratorConfiguration,
    registry: InvoiceRegistry,
  ): { record: import("./types.js").InvoiceRecord | null; error: string | null } {
    if (!config.invoiceLifecycleRulesEnabled) {
      return { record: null, error: "Invoice lifecycle rules disabled" };
    }

    const existing = registry.get(input.invoiceId);
    if (!existing) {
      return { record: null, error: `Invoice not found: ${input.invoiceId}` };
    }

    const allowed = ALLOWED_TRANSITIONS[existing.invoiceStatus] ?? [];
    if (!allowed.includes(input.invoiceStatus)) {
      return {
        record: null,
        error: `Invalid lifecycle transition: ${existing.invoiceStatus} -> ${input.invoiceStatus}`,
      };
    }

    const updated = { ...existing, invoiceStatus: input.invoiceStatus };
    registry.update(updated);

    appendIgLog({
      event: "invoice_lifecycle_change",
      level: "info",
      details: `Invoice ${input.invoiceId} -> ${input.invoiceStatus}`,
    });

    return { record: updated, error: null };
  }
}
