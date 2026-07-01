export const PREVIEW_PAGE_TYPES = [
  "HOME",
  "PRODUCT",
  "COLLECTION",
  "ABOUT",
  "FAQ",
  "CONTACT",
] as const;

export type PreviewPageType = (typeof PREVIEW_PAGE_TYPES)[number];

export type PreviewPageSection = {
  sectionId: string;
  sectionType: string;
  headline: string;
  body: string;
  bullets: string[];
  callToAction: string | null;
  order: number;
};

export type PreviewPageMetadata = {
  description?: string;
  keywords?: string[];
  ogTitle?: string;
  ogDescription?: string;
};

export type PreviewPage = {
  pageId: string;
  route: string;
  pageType: PreviewPageType | string;
  title: string;
  confidence: number;
  metadata?: PreviewPageMetadata;
  sections: PreviewPageSection[];
};

export type PreviewNavLink = {
  label: string;
  route: string;
  pageType: string;
  pageId: string;
};

export type StorefrontPreviewModel = {
  storeName: string;
  brandSlogan?: string;
  projectId?: string;
  projectRoot?: string;
  framework?: string;
  storeId?: string;
  routes: PreviewNavLink[];
  pages: PreviewPage[];
  defaultRoute: string;
};
