import { GRAND_KING_ACCOUNT_NAME, GRAND_KING_COMPANY_ID, GRAND_KING_WORKSPACE_ID } from "../constants.js";
import type { GrandKingAccountDashboard } from "../models/grand-king-account.js";
import { getGrandKingRepository } from "../repositories/sqlite-grand-king-repository.js";
import { seedGrandKingAccount } from "./grand-king-seed-service.js";

/** Grand King unified account dashboard — products, tasks, suppliers, orders, AI decisions. */
export function buildGrandKingAccountDashboard(workspaceId: string = GRAND_KING_WORKSPACE_ID): GrandKingAccountDashboard {
  seedGrandKingAccount(workspaceId);
  const repo = getGrandKingRepository();

  const products = repo.listProducts(workspaceId);
  const tasks = repo.listTasks(workspaceId);
  const suppliers = repo.listSuppliers(workspaceId);
  const orders = repo.listOrders(workspaceId);
  const aiDecisions = repo.listAiDecisions(workspaceId);

  const today = new Date().toISOString().slice(0, 10);
  const revenueTodayCents = orders
    .filter((o) => o.createdAt.startsWith(today) && o.status !== "REFUNDED")
    .reduce((sum, o) => sum + o.totalCents, 0);

  return {
    accountId: "grand-king",
    workspaceId,
    companyId: GRAND_KING_COMPANY_ID,
    accountName: GRAND_KING_ACCOUNT_NAME,
    products,
    tasks,
    suppliers,
    orders,
    aiDecisions,
    summary: {
      productCount: products.length,
      pendingTasks: tasks.filter((t) => t.status === "PENDING" || t.status === "IN_PROGRESS" || t.status === "BLOCKED").length,
      supplierCount: suppliers.length,
      orderCount: orders.length,
      pendingDecisions: aiDecisions.filter((d) => d.status === "PENDING").length,
      revenueTodayCents,
    },
    computedAt: new Date().toISOString(),
  };
}
