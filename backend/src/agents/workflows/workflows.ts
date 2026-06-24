import type { WorkflowDefinition } from "../../brain/types.js";

export const workflowDefinitions: WorkflowDefinition[] = [
  {
    id: "manufacture-company",
    name: "Manufacture Company",
    description:
      "End-to-end company manufacturing pipeline from intelligence to store launch",
    steps: [
      {
        id: "scan",
        agentId: "product-intelligence",
        input: { objective: "Scan market for winning products" },
      },
      {
        id: "suppliers",
        agentId: "supplier-network",
        dependsOn: ["scan"],
        input: { objective: "Validate supplier network for selected products" },
      },
      {
        id: "store",
        agentId: "store-builder",
        dependsOn: ["suppliers"],
        input: { objective: "Build storefront and brand assets" },
      },
      {
        id: "marketing",
        agentId: "marketing-ai",
        dependsOn: ["store"],
        input: { objective: "Launch initial marketing campaign" },
      },
    ],
  },
  {
    id: "daily-portfolio-review",
    name: "Daily Portfolio Review",
    description: "CEO-led daily portfolio analysis and priority setting",
    steps: [
      {
        id: "finance",
        agentId: "finance-analyst",
        input: { objective: "Generate daily P&L summary" },
      },
      {
        id: "ceo-review",
        agentId: "ai-ceo",
        dependsOn: ["finance"],
        input: { objective: "Review portfolio and set daily priorities" },
      },
      {
        id: "founder-brief",
        agentId: "founder-dashboard",
        dependsOn: ["ceo-review"],
        input: { objective: "Prepare founder dashboard briefing" },
      },
    ],
  },
];
