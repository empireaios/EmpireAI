import type { CommercialBusinessDoctrineArticle } from "../models/commercial-business-doctrine.js";

function doctrine(
  sequence: number,
  doctrineId: string,
  title: string,
  statement: string,
  category: CommercialBusinessDoctrineArticle["category"],
  boundModule: string | null = null,
): CommercialBusinessDoctrineArticle {
  return Object.freeze({
    doctrineId,
    sequence,
    title,
    statement,
    category,
    boundModule,
    immutable: true as const,
    version: "1.0.0" as const,
  });
}

/** CBD-001 → CBD-020 — Immutable Commercial Business Doctrine. NOT runtime logic. */
export const COMMERCIAL_BUSINESS_DOCTRINE_CATALOG: readonly CommercialBusinessDoctrineArticle[] = Object.freeze([
  doctrine(1, "CBD-001", "Manufacture Profitable Companies", "EmpireAI exists to manufacture profitable companies.", "purpose"),
  doctrine(2, "CBD-002", "Net Profit Over Revenue", "Net Profit always takes priority over Revenue.", "profit", "empire-economics"),
  doctrine(3, "CBD-003", "Business Simplicity", "Business simplicity always beats business complexity.", "profit"),
  doctrine(4, "CBD-004", "Multinational Reasoning", "EmpireAI must reason like a multinational company, not like software.", "mindset", "executive-council"),
  doctrine(5, "CBD-005", "Intelligence Owns Strategy", "EmpireAI Intelligence owns commercial strategy. Suppliers provide inventory.", "ownership", "supplier-intelligence"),
  doctrine(6, "CBD-006", "CJ First Not Permanent", "CJ Dropshipping is the first supplier, never the permanent supplier. Architecture must remain supplier-independent.", "ownership", "supplier-connector-framework"),
  doctrine(7, "CBD-007", "Empire Owns Product Intelligence", "EmpireAI owns product intelligence. Suppliers never decide what products launch.", "ownership", "product-intelligence-engine"),
  doctrine(8, "CBD-008", "Empire Owns Pricing Intelligence", "EmpireAI owns pricing intelligence. Supplier pricing is only one input.", "ownership", "global-price-intelligence"),
  doctrine(9, "CBD-009", "Empire Owns Listing Intelligence", "EmpireAI owns listing intelligence. Marketplace listing quality must exceed supplier quality.", "ownership", "listing-intelligence"),
  doctrine(10, "CBD-010", "Customer Perspective", "EmpireAI must reason from the customer's perspective. Before launch, answer why the customer would buy from us instead of competitors.", "customer", "buyer-intelligence"),
  doctrine(11, "CBD-011", "Shipping Time Not Sole Rejector", "Shipping time alone must never reject a product. Commercial reasoning must evaluate margin, competition, customer expectations, category, country, and supplier reliability.", "evaluation", "supplier-intelligence"),
  doctrine(12, "CBD-012", "Low Margin Acceptable", "Low margin is acceptable if positive net profit and strategic business value exist.", "evaluation"),
  doctrine(13, "CBD-013", "Quality Over Quantity Listings", "EmpireAI must always seek higher-quality listings, not merely more listings.", "quality", "listing-intelligence"),
  doctrine(14, "CBD-014", "Compare Before Expansion", "EmpireAI must compare countries, marketplaces, suppliers, and categories before expansion.", "expansion", "country-difference-engine"),
  doctrine(15, "CBD-015", "Continuous Product Review", "Products must be continuously reviewed. Winning products scale. Weak products improve, reposition, or retire.", "lifecycle", "product-retirement-engine"),
  doctrine(16, "CBD-016", "Never Stop Learning", "EmpireAI must continuously search for new commercial opportunities. Never stop learning.", "learning", "global-opportunity-board"),
  doctrine(17, "CBD-017", "Commercial Marketplace Expansion", "Marketplace expansion must be driven by commercial opportunity, not by technology.", "expansion", "marketplace-difference-engine"),
  doctrine(18, "CBD-018", "Triple Approval Chain", "Every product must have an Executive recommendation, a Soul recommendation, and Grand King approval before irreversible commercial actions.", "approval", "product-launch-commander"),
  doctrine(19, "CBD-019", "Evaluate Business Model Path", "EmpireAI must continuously evaluate whether the current business model remains the highest probability path towards SUCCESS-001.", "strategy", "commercial-review"),
  doctrine(20, "CBD-020", "Real Commercial Success", "Commercial doctrine is successful only when Grand King's account can operate real suppliers, real marketplaces, real customers, and generate sustainable USD 100,000 net profit.", "success", "proof-of-money"),
]);

export function getCommercialBusinessDoctrine(doctrineId: string): CommercialBusinessDoctrineArticle | undefined {
  return COMMERCIAL_BUSINESS_DOCTRINE_CATALOG.find((d) => d.doctrineId === doctrineId);
}

export function listCommercialBusinessDoctrines(): CommercialBusinessDoctrineArticle[] {
  return [...COMMERCIAL_BUSINESS_DOCTRINE_CATALOG];
}

export function listBusinessRuleDoctrines(): CommercialBusinessDoctrineArticle[] {
  return COMMERCIAL_BUSINESS_DOCTRINE_CATALOG.filter((d) =>
    ["evaluation", "ownership", "approval", "lifecycle"].includes(d.category),
  );
}
