import type { RegisteredTool } from "../../../brain/types.js";
import { buildProductPortfolioCommand } from "../services/product-portfolio-command-service.js";

export const productPortfolioCommandTools: RegisteredTool[] = [{
  name: "product_portfolio_command.dashboard",
  description: "REAL-054 Product portfolio command dashboard",
  module: "product-portfolio-command",
  authorityLevel: "L1",
  parameters: { type: "object", properties: { workspaceId: { type: "string" }, companyId: { type: "string" } } },
  handler: async (args) => buildProductPortfolioCommand(String(args.workspaceId ?? "ws_empire_1"), String(args.companyId ?? "co-grand-king")),
}];
