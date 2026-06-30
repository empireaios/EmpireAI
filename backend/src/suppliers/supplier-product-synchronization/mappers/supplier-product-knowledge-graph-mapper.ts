import type { RegisterProductAliasesInput } from "../../../intelligence/product-knowledge-graph/mappers/knowledge-graph-mapper.js";
import { defaultKnowledgeGraphMapper } from "../../../intelligence/product-knowledge-graph/mappers/knowledge-graph-mapper.js";
import type { SupplierPlatform } from "../../supplier-connector-framework/models/supplier-platform.js";
import type { SupplierCatalogItemInput } from "../models/supplier-catalog-item.js";

/** Maps supplier catalog items into Product Knowledge Graph registration inputs. */
export class SupplierProductKnowledgeGraphMapper {
  constructor(
    private readonly mapper = defaultKnowledgeGraphMapper,
  ) {}

  mapCatalogItemToKnowledgeGraphInput(
    connectorId: string,
    platform: SupplierPlatform,
    item: SupplierCatalogItemInput,
  ): RegisterProductAliasesInput {
    const aliases = [item.title, item.supplierSku, `${platform} ${item.title}`];
    const canonicalSlug = this.mapper.generateCanonicalSlug(aliases, item.title);

    return {
      displayName: item.title,
      aliases,
      description: item.description,
      targetBuyerPersonaIds: [],
      supplierRefs: [
        {
          supplierId: connectorId,
          supplierSku: item.supplierSku,
          supplierName: platform,
          isPrimary: true,
        },
      ],
      sourceObservationIds: [`supplier-sync:${connectorId}:${item.supplierSku}`],
      confidence: 76,
      tags: item.tags ?? [],
    };
  }

  resolveCanonicalSlug(title: string, supplierSku: string, platform: SupplierPlatform): string {
    return this.mapper.generateCanonicalSlug(
      [title, supplierSku, `${platform} ${title}`],
      title,
    );
  }
}

export const defaultSupplierProductKnowledgeGraphMapper =
  new SupplierProductKnowledgeGraphMapper();
