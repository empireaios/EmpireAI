/**
 * G3-01 — Product Intelligence Engine Cockpit / Brain view loader.
 */

import {
  loadProductIntelligenceEngineView,
  type ProductIntelligenceEngineView,
} from "../../intelligence/product-intelligence-engine/engine-architecture.js";
import { productIntelligenceService } from "../../intelligence/product-intelligence-engine/service.js";

export type { ProductIntelligenceEngineView };
export type {
  ProductIntelligenceAnalysisContract,
  ProductIntelligenceEngineArchitecture,
} from "../../intelligence/product-intelligence-engine/engine-architecture.js";

export function loadProductIntelligenceEngineViewForWorkspace(
  workspaceId: string,
): ProductIntelligenceEngineView {
  productIntelligenceService.seedCatalog(workspaceId);
  const products = productIntelligenceService.listProducts(workspaceId);
  return loadProductIntelligenceEngineView(products);
}
