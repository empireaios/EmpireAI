import type { EmpireBuilderBusinessModel } from "./types.js";

/** Authoritative in-memory Empire Builder Model store — blueprint only. */
export class ModelStore {
  private models = new Map<string, EmpireBuilderBusinessModel>();
  private latestModelId: string | null = null;

  seed(models: EmpireBuilderBusinessModel[]) {
    this.models.clear();
    this.latestModelId = null;
    for (const model of models) {
      this.models.set(model.businessModelId, clone(model));
      this.latestModelId = model.businessModelId;
    }
  }

  count() {
    return this.models.size;
  }

  list() {
    return [...this.models.values()]
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      .map(clone);
  }

  get(modelId: string) {
    const model = this.models.get(modelId);
    return model ? clone(model) : null;
  }

  getLatestModelId() {
    return this.latestModelId;
  }

  save(model: EmpireBuilderBusinessModel) {
    this.models.set(model.businessModelId, clone(model));
    this.latestModelId = model.businessModelId;
    return clone(model);
  }
}

function clone(model: EmpireBuilderBusinessModel): EmpireBuilderBusinessModel {
  return {
    ...model,
    productsServices: [...model.productsServices],
    customerSegments: [...model.customerSegments],
    requiredCapabilities: [...model.requiredCapabilities],
    requiredIntegrations: [...model.requiredIntegrations],
    businessAssumptions: [...model.businessAssumptions],
  };
}
