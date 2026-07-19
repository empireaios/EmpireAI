/** R3-09 — Invoice number generator. */

import type { InvoiceGeneratorConfiguration } from "./configuration.js";
import type { InvoiceRegistry } from "./invoice-registry.js";

export class InvoiceNumberGenerator {
  generate(config: InvoiceGeneratorConfiguration, registry: InvoiceRegistry): string {
    if (!config.invoiceNumberingRulesEnabled) {
      return `INV-${Date.now()}`;
    }
    const seq = registry.nextSequence();
    const year = new Date().getUTCFullYear();
    return `${config.invoiceNumberPrefix}-${year}-${String(seq).padStart(6, "0")}`;
  }
}
