export class RiskSimulationEngine { project(score = 50) { return { riskProjection: Math.max(0, Math.min(100, score)), structuralSignalOnly: true as const }; } }
