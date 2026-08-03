export class ExecutiveNavigationEngine { drillDown(region = "GLOBAL", country = "GLOBAL") { return { region, country, structuralSignalOnly: true as const }; } }
