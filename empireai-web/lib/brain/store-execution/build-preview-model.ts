import type { StoreManufacturingData } from "@/lib/brain/store-execution/types";
import type {
  PreviewNavLink,
  PreviewPage,
  PreviewPageSection,
  PreviewPageType,
  StorefrontPreviewModel,
} from "@/lib/brain/store-execution/preview-types";

const PAGE_TYPE_ORDER: PreviewPageType[] = [
  "HOME",
  "COLLECTION",
  "PRODUCT",
  "ABOUT",
  "FAQ",
  "CONTACT",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" ? value : fallback;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function normalizeSection(value: unknown, index: number): PreviewPageSection | null {
  if (!isRecord(value)) return null;

  return {
    sectionId: asString(value.sectionId, `section-${index}`),
    sectionType: asString(value.sectionType, "BODY"),
    headline: asString(value.headline, "Section"),
    body: asString(value.body),
    bullets: asStringArray(value.bullets),
    callToAction: typeof value.callToAction === "string" ? value.callToAction : null,
    order: asNumber(value.order, index),
  };
}

function normalizeSections(value: unknown): PreviewPageSection[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((section, index) => normalizeSection(section, index))
    .filter((section): section is PreviewPageSection => section !== null)
    .sort((left, right) => left.order - right.order);
}

function normalizeMetadata(value: unknown): PreviewPage["metadata"] {
  if (!isRecord(value)) return undefined;
  return {
    description: asString(value.description) || undefined,
    keywords: asStringArray(value.keywords),
    ogTitle: asString(value.ogTitle) || undefined,
    ogDescription: asString(value.ogDescription) || undefined,
  };
}

function normalizePage(value: unknown): PreviewPage | null {
  if (!isRecord(value)) return null;

  const pageType = asString(value.pageType, "HOME");
  const route = asString(value.route, "/");

  return {
    pageId: asString(value.pageId, route),
    route,
    pageType,
    title: asString(value.title, pageType),
    confidence: asNumber(value.confidence, 0),
    metadata: normalizeMetadata(value.metadata),
    sections: normalizeSections(value.sections),
  };
}

function pageTypeLabel(pageType: string): string {
  return pageType.charAt(0) + pageType.slice(1).toLowerCase();
}

function buildFallbackSections(page: PreviewPage): PreviewPageSection[] {
  if (page.sections.length > 0) return page.sections;

  return [
    {
      sectionId: `${page.pageId}-hero`,
      sectionType: "HERO",
      headline: page.title,
      body: page.metadata?.description ?? "Generated storefront page preview.",
      bullets: [],
      callToAction: "Shop now",
      order: 0,
    },
  ];
}

function sortPages(pages: PreviewPage[]): PreviewPage[] {
  return [...pages].sort((left, right) => {
    const leftIndex = PAGE_TYPE_ORDER.indexOf(left.pageType as PreviewPageType);
    const rightIndex = PAGE_TYPE_ORDER.indexOf(right.pageType as PreviewPageType);
    const normalizedLeft = leftIndex === -1 ? PAGE_TYPE_ORDER.length : leftIndex;
    const normalizedRight = rightIndex === -1 ? PAGE_TYPE_ORDER.length : rightIndex;
    return normalizedLeft - normalizedRight || left.route.localeCompare(right.route);
  });
}

function resolveStoreName(
  data: Pick<StoreManufacturingData, "brand" | "storeBlueprint" | "storefront">,
): string {
  if (data.brand?.brandName) return data.brand.brandName;

  const blueprintNav = isRecord(data.storeBlueprint?.navigation)
    ? data.storeBlueprint.navigation
    : null;
  if (blueprintNav && typeof blueprintNav.storeName === "string") {
    return blueprintNav.storeName;
  }

  const storefrontNav = isRecord(data.storefront?.navigation)
    ? data.storefront.navigation
    : null;
  if (storefrontNav && typeof storefrontNav.storeName === "string") {
    return storefrontNav.storeName;
  }

  return "Generated Storefront";
}

function buildRoutesFromStorefront(
  data: Pick<StoreManufacturingData, "storefront">,
  pages: PreviewPage[],
): PreviewNavLink[] | null {
  const routes = data.storefront?.routes;
  if (!Array.isArray(routes) || routes.length === 0) return null;

  const pageByRoute = new Map(pages.map((page) => [page.route, page]));
  const pageByType = new Map(pages.map((page) => [page.pageType, page]));

  const links = routes
    .map((routeValue, index) => {
      if (!isRecord(routeValue)) return null;
      const path = asString(routeValue.path);
      const pageType = asString(routeValue.pageType);
      const matched =
        (path ? pageByRoute.get(path) : null) ??
        (pageType ? pageByType.get(pageType) : null) ??
        pages[index] ??
        null;

      if (!matched) return null;

      return {
        label: asString(routeValue.title, matched.title),
        route: path || matched.route,
        pageType: pageType || matched.pageType,
        pageId: matched.pageId,
      };
    })
    .filter((link): link is PreviewNavLink => link !== null);

  return links.length > 0 ? links : null;
}

function buildRoutesFromPages(pages: PreviewPage[]): PreviewNavLink[] {
  return pages.map((page) => ({
    label: page.pageType === "HOME" ? "Home" : page.title || pageTypeLabel(page.pageType),
    route: page.route,
    pageType: page.pageType,
    pageId: page.pageId,
  }));
}

export function buildStorefrontPreviewModel(
  data: Pick<
    StoreManufacturingData,
    "brand" | "storeBlueprint" | "storePages" | "storefront" | "materializedProject"
  >,
): StorefrontPreviewModel | null {
  const rawPages = data.storePages?.pages ?? [];
  const pages = sortPages(
    rawPages
      .map((page) => normalizePage(page))
      .filter((page): page is PreviewPage => page !== null)
      .map((page) => ({ ...page, sections: buildFallbackSections(page) })),
  );

  if (pages.length === 0) return null;

  const routes = buildRoutesFromStorefront(data, pages) ?? buildRoutesFromPages(pages);
  const homePage = pages.find((page) => page.pageType === "HOME") ?? pages[0];

  return {
    storeName: resolveStoreName(data),
    brandSlogan: data.brand?.slogan,
    projectId: data.materializedProject?.projectId,
    projectRoot: data.materializedProject?.projectStructure.rootDirectory,
    framework: data.materializedProject?.projectStructure.framework,
    storeId: data.storePages?.storeId ?? data.storeBlueprint?.storeId,
    routes,
    pages,
    defaultRoute: homePage.route,
  };
}

export function findPreviewPage(
  model: StorefrontPreviewModel,
  route: string,
): PreviewPage | null {
  return model.pages.find((page) => page.route === route) ?? null;
}
