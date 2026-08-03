export class FinancialSimulationEngine { project(score = 50) { return { financialProjection: Math.max(0, Math.min(100, score)), structuralSignalOnly: true as const }; } }
