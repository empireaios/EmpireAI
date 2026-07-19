/** R2-05 — Product synchronization engine (catalog merge). */

import { appendSpsLog } from "./sps-logging.js";
import type { SupplierProductSyncConfiguration } from "./configuration.js";
import type {
  ProductChangeFinding,
  RawSupplierProductPayload,
  SupplierProductRecord,
} from "./types.js";
import { ProductChangeDetector } from "./product-change-detector.js";
import { ProductDuplicateDetector } from "./product-duplicate-detector.js";
import { SupplierProductMapper } from "./supplier-product-mapper.js";

export class ProductSynchronizationEngine {
  private readonly mapper = new SupplierProductMapper();
  private readonly changeDetector = new ProductChangeDetector();
  private readonly duplicateDetector = new ProductDuplicateDetector();

  synchronizeCatalog(input: {
    previousCatalog: SupplierProductRecord[];
    rawProducts: RawSupplierProductPayload[];
    config: SupplierProductSyncConfiguration;
  }): {
    products: SupplierProductRecord[];
    changes: ProductChangeFinding[];
    duplicates: ReturnType<ProductDuplicateDetector["detect"]>;
  } {
    appendSpsLog({
      event: "synchronization_start",
      level: "info",
      details: `Synchronizing ${input.rawProducts.length} raw supplier product(s)`,
    });

    const mapped = this.mapper.mapBatch(input.rawProducts, input.config);
    const changes = this.changeDetector.detect(input.previousCatalog, mapped, input.config);
    const duplicates = this.duplicateDetector.detect(mapped, input.config);

    const mappedKeys = new Set(mapped.map((p) => `${p.supplierId}::${p.supplierProductId}`));
    const discontinued = input.previousCatalog
      .filter((p) => !mappedKeys.has(`${p.supplierId}::${p.supplierProductId}`))
      .map((p) => ({
        ...p,
        productStatus: "discontinued" as const,
        synchronizationStatus: "synchronized" as const,
        synchronizedAt: new Date().toISOString(),
      }));

    const products = [...mapped, ...discontinued];

    appendSpsLog({
      event: "product_discovery",
      level: "info",
      details: `Changes: ${changes.filter((c) => c.changeType === "new").length} new, ${changes.filter((c) => c.changeType === "updated").length} updated, ${changes.filter((c) => c.changeType === "discontinued").length} discontinued`,
    });

    return { products, changes, duplicates };
  }
}
