import type {
  BestsellerCategoryListing,
  BestsellerCategoryNode,
  BestsellerCategoryProvider,
} from "../interfaces/bestseller-category.js";
import {
  MOCK_BESTSELLER_ASINS,
  MOCK_CATEGORY_TREE,
} from "../mock/fixtures.js";

/** Parses bestseller category listings — future live impl swaps here. */
export interface BestsellerParser {
  parseCategoryTree(raw: unknown): BestsellerCategoryNode[];
  parseBestsellerListing(raw: unknown): BestsellerCategoryListing;
}

export class MockBestsellerParser implements BestsellerParser {
  parseCategoryTree(raw: unknown): BestsellerCategoryNode[] {
    if (!Array.isArray(raw)) {
      throw new Error("Invalid bestseller category tree payload");
    }
    return raw as BestsellerCategoryNode[];
  }

  parseBestsellerListing(raw: unknown): BestsellerCategoryListing {
    if (!raw || typeof raw !== "object") {
      throw new Error("Invalid bestseller listing payload");
    }
    const data = raw as BestsellerCategoryListing;
    if (!data.categoryId || !Array.isArray(data.asins)) {
      throw new Error("Bestseller listing missing categoryId or asins");
    }
    return data;
  }
}

export class MockBestsellerCategoryProvider implements BestsellerCategoryProvider {
  private readonly parser: BestsellerParser;

  constructor(parser: BestsellerParser = new MockBestsellerParser()) {
    this.parser = parser;
  }

  async getCategoryTree(_marketplace?: string): Promise<BestsellerCategoryNode[]> {
    return this.parser.parseCategoryTree(MOCK_CATEGORY_TREE);
  }

  async getBestsellersInCategory(
    categoryId: string,
    limit = 10,
  ): Promise<BestsellerCategoryListing> {
    const listing: BestsellerCategoryListing = {
      categoryId,
      categoryPath: [categoryId],
      asins: MOCK_BESTSELLER_ASINS.slice(0, limit),
      observedAt: new Date().toISOString(),
    };
    return this.parser.parseBestsellerListing(listing);
  }
}
