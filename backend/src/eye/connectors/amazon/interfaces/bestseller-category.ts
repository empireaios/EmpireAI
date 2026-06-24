/** Contract for bestseller category tree browsing — mock or future live implementations. */

export type BestsellerCategoryNode = {
  categoryId: string;
  name: string;
  parentId: string | null;
  depth: number;
  productCount?: number;
  children?: BestsellerCategoryNode[];
};

export type BestsellerCategoryListing = {
  categoryId: string;
  categoryPath: string[];
  asins: string[];
  observedAt: string;
};

export interface BestsellerCategoryProvider {
  getCategoryTree(marketplace?: string): Promise<BestsellerCategoryNode[]>;
  getBestsellersInCategory(categoryId: string, limit?: number): Promise<BestsellerCategoryListing>;
}
