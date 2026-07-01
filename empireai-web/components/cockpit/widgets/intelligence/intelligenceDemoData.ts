export const INTELLIGENCE_OVERVIEW_METRICS = [
  { label: "Products scanned", value: "128", change: "Demo catalogue", trend: "neutral" as const },
  { label: "Sell signals", value: "34", change: "High confidence", trend: "up" as const },
  { label: "Avg margin", value: "42%", change: "Portfolio weighted", trend: "up" as const },
];

export const INTELLIGENCE_PRODUCTS = [
  { id: "p1", name: "Wireless ambient lamp", score: 88, demand: "High", margin: "38%", trend: "up", recommendation: "Sell" },
  { id: "p2", name: "Modular desk organizer", score: 76, demand: "Medium", margin: "44%", trend: "stable", recommendation: "Sell" },
  { id: "p3", name: "Generic phone case", score: 41, demand: "Saturated", margin: "12%", trend: "down", recommendation: "Avoid" },
];

export const INTELLIGENCE_DISCOVERY_SESSIONS = [
  { id: "d1", keyword: "home ambient lighting", products: 24, status: "complete", confidence: 82 },
  { id: "d2", keyword: "modular storage", products: 18, status: "in_progress", confidence: 71 },
  { id: "d3", keyword: "linen home textiles", products: 0, status: "queued", confidence: 0 },
];

export const INTELLIGENCE_TRENDS = [
  { id: "t1", trend: "Warm minimalism", velocity: "+18%", category: "Home", signal: "strong" },
  { id: "t2", trend: "Smart ambient lighting", velocity: "+24%", category: "Electronics", signal: "strong" },
  { id: "t3", trend: "Mass phone accessories", velocity: "-8%", category: "Mobile", signal: "weak" },
];

export const INTELLIGENCE_SUPPLIERS = [
  { id: "s1", name: "LumenCraft Co.", rating: 4.8, leadTime: "5–8 days", products: 142, status: "verified" },
  { id: "s2", name: "HomeNest Supply", rating: 4.5, leadTime: "7–12 days", products: 89, status: "review" },
  { id: "s3", name: "Global Gadget Hub", rating: 3.9, leadTime: "14–21 days", products: 1200, status: "caution" },
];

export const INTELLIGENCE_RESEARCH_NOTES = [
  "Nova Home hero SKU validated against warm minimalism trend cluster.",
  "Supplier LumenCraft Co. matched for ambient lamp category.",
  "Margin model projects 38% net at $79 price point — demo only.",
];
