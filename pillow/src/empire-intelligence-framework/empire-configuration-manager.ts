import type { EmpireIntelligenceFrameworkConfiguration } from "./configuration.js";
export class EmpireConfigurationManager {
  constructor(private configuration: EmpireIntelligenceFrameworkConfiguration) {}
  get(): EmpireIntelligenceFrameworkConfiguration { return this.configuration; }
  update(configuration: EmpireIntelligenceFrameworkConfiguration): void { this.configuration = configuration; }
}
