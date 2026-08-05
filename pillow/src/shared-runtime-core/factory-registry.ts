import { SRTC_METADATA_VERSION } from "./paths.js";
import type { RuntimeStore } from "./runtime-store.js";
import type { FactoryRegistration } from "./types.js";

export class FactoryRegistry {
  constructor(private readonly store: RuntimeStore) {}

  register(factory: FactoryRegistration): FactoryRegistration {
    if (factory.fabricated !== false) {
      throw new Error(`Factory ${factory.factoryKey} rejected: fabricated must be false`);
    }
    return this.store.registerFactory({
      ...factory,
      metadataVersion: factory.metadataVersion || SRTC_METADATA_VERSION,
      fabricated: false,
      neverReplaceFactoryLogic: true,
      neverReplaceWorkerLogic: true,
      neverExecuteBusinessSpecificDecisions: true,
      neverFabricateRuntimeState: true,
      neverImplementQ1002OrLater: true,
      structuralSignalOnly: true,
    });
  }

  registerMany(factories: FactoryRegistration[]) {
    return factories.map((f) => this.register(f));
  }

  list(): FactoryRegistration[] {
    return this.store.listFactories();
  }

  get(factoryKey: string) {
    return this.store.getFactory(factoryKey);
  }

  has(factoryKey: string) {
    return this.store.getFactory(factoryKey) != null;
  }
}
