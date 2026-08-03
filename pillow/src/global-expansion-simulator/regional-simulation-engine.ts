export class RegionalSimulationEngine { project(region = "GLOBAL") { return { targetRegion: region.toUpperCase(), structuralSignalOnly: true as const }; } }
