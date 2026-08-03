export class LogisticsSimulationEngine { project(score = 50) { return { logisticsProjection: Math.max(0, Math.min(100, score)), structuralSignalOnly: true as const }; } }
