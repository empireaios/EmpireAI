export class GlobalKpiAggregationEngine { aggregate(values: number[]) { return values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0; } }
