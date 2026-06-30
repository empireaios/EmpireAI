import type { BrandProfile } from "../../brand-genesis/models/brand-profile.js";
import type { Storefront } from "../../storefront-assembly/models/storefront.js";
import type { RenderableStorePage } from "../../store-page-generation/models/renderable-store-page.js";
import type { StorePageContent } from "../../store-page-generation/models/store-page-content.js";
import type { GeneratedStorefrontCreateInput } from "../models/generated-storefront.js";
import type { GeneratedComponent } from "../models/generated-component.js";
import type { GeneratedPage } from "../models/generated-page.js";
import type { DeploymentMetadata, ProjectStructure } from "../models/generated-storefront.js";
import type { CodeGenerationSignal, CodeGenerationSignalType } from "../models/code-generation-signal.js";

export const CODE_GENERATION_SIGNAL_WEIGHTS: Record<CodeGenerationSignalType, number> = {
  storefront_alignment: 0.18,
  page_code_coverage: 0.18,
  component_reuse: 0.14,
  project_structure: 0.14,
  deployment_readiness: 0.12,
  brand_alignment: 0.1,
  page_content_alignment: 0.1,
  code_generation_composite: 0.04,
};

export type CodeBrandInput = Pick<
  BrandProfile,
  | "brandId"
  | "brandName"
  | "slogan"
  | "niche"
  | "targetAudience"
  | "positioning"
  | "valueProposition"
  | "confidence"
>;

export type CodeStorefrontInput = Pick<
  Storefront,
  | "storefrontId"
  | "storeId"
  | "brandId"
  | "routes"
  | "navigation"
  | "assets"
  | "pageMap"
  | "seoMap"
  | "confidence"
>;

export type CodePageInput = Pick<
  RenderableStorePage,
  | "pageId"
  | "route"
  | "pageType"
  | "title"
  | "metadata"
  | "sections"
  | "renderPayload"
  | "confidence"
>;

export type StorefrontCodeGenerationInput = {
  storefront: CodeStorefrontInput;
  pages: CodePageInput[];
  brand: CodeBrandInput;
};

export type StorefrontCodeGenerationBreakdown = GeneratedStorefrontCreateInput;

const SECTION_COMPONENT_MAP: Record<StorePageContent["sectionType"], string> = {
  HERO: "HeroSection",
  BODY: "BodySection",
  BULLETS: "BulletList",
  PRODUCT_GRID: "ProductGrid",
  FAQ: "FAQSection",
  CTA: "CTASection",
  CONTACT: "ContactSection",
};

function clampScore(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function buildSignal(
  signalType: CodeGenerationSignalType,
  score: number,
  detail: string,
): CodeGenerationSignal {
  return {
    signalType,
    score: clampScore(score),
    weight: CODE_GENERATION_SIGNAL_WEIGHTS[signalType],
    detail,
  };
}

function pageFilePath(route: string, pageType: CodePageInput["pageType"]): string {
  if (route === "/") {
    return "src/pages/index.tsx";
  }
  if (pageType === "PRODUCT") {
    return `src/pages/products/${route.split("/").pop()}.tsx`;
  }
  if (pageType === "COLLECTION") {
    return `src/pages/collections/${route.split("/").pop()}.tsx`;
  }
  if (pageType === "ABOUT") {
    return "src/pages/about.tsx";
  }
  if (pageType === "FAQ") {
    return "src/pages/faq.tsx";
  }
  if (pageType === "CONTACT") {
    return "src/pages/contact.tsx";
  }
  return `src/pages/${slugify(route)}.tsx`;
}

function pageNameFromRoute(route: string, title: string): string {
  if (route === "/") {
    return "HomePage";
  }
  const slug = route.split("/").pop() ?? slugify(title);
  return `${slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("")}Page`;
}

function componentImportsForSections(sections: StorePageContent[]): string[] {
  const imports = new Set(["Layout", "Navigation"]);
  for (const section of sections) {
    imports.add(SECTION_COMPONENT_MAP[section.sectionType]);
  }
  return [...imports];
}

function buildComponentSource(
  componentName: string,
  componentType: GeneratedComponent["componentType"],
  brand: CodeBrandInput,
): string {
  return [
    `/** Generated ${componentName} for ${brand.brandName}. */`,
    `export function ${componentName}() {`,
    `  return (`,
    `    <section data-component="${componentName}" data-brand="${brand.brandId}">`,
    `      {/* ${brand.slogan} */}`,
    `    </section>`,
    `  );`,
    `}`,
    ``,
    `export default ${componentName};`,
  ].join("\n");
}

function buildSharedComponents(brand: CodeBrandInput): GeneratedComponent[] {
  const definitions: Array<{
    componentName: string;
    componentType: GeneratedComponent["componentType"];
    filePath: string;
    imports: string[];
    exports: string[];
  }> = [
    {
      componentName: "Layout",
      componentType: "LAYOUT",
      filePath: "src/components/Layout.tsx",
      imports: ["react"],
      exports: ["Layout"],
    },
    {
      componentName: "Navigation",
      componentType: "SHARED",
      filePath: "src/components/Navigation.tsx",
      imports: ["react"],
      exports: ["Navigation"],
    },
    {
      componentName: "HeroSection",
      componentType: "SECTION",
      filePath: "src/components/HeroSection.tsx",
      imports: ["react"],
      exports: ["HeroSection"],
    },
    {
      componentName: "BodySection",
      componentType: "SECTION",
      filePath: "src/components/BodySection.tsx",
      imports: ["react"],
      exports: ["BodySection"],
    },
    {
      componentName: "BulletList",
      componentType: "SECTION",
      filePath: "src/components/BulletList.tsx",
      imports: ["react"],
      exports: ["BulletList"],
    },
    {
      componentName: "ProductGrid",
      componentType: "SECTION",
      filePath: "src/components/ProductGrid.tsx",
      imports: ["react"],
      exports: ["ProductGrid"],
    },
    {
      componentName: "FAQSection",
      componentType: "SECTION",
      filePath: "src/components/FAQSection.tsx",
      imports: ["react"],
      exports: ["FAQSection"],
    },
    {
      componentName: "CTASection",
      componentType: "SECTION",
      filePath: "src/components/CTASection.tsx",
      imports: ["react"],
      exports: ["CTASection"],
    },
    {
      componentName: "ContactSection",
      componentType: "SECTION",
      filePath: "src/components/ContactSection.tsx",
      imports: ["react"],
      exports: ["ContactSection"],
    },
    {
      componentName: "Footer",
      componentType: "SHARED",
      filePath: "src/components/Footer.tsx",
      imports: ["react"],
      exports: ["Footer"],
    },
  ];

  return definitions.map((definition) => ({
    componentId: `component-${slugify(definition.componentName)}-${brand.brandId}`,
    componentName: definition.componentName,
    componentType: definition.componentType,
    filePath: definition.filePath,
    imports: definition.imports,
    exports: definition.exports,
    sourceCode: buildComponentSource(definition.componentName, definition.componentType, brand),
  }));
}

function buildPageSource(
  page: CodePageInput,
  brand: CodeBrandInput,
  componentImports: string[],
): string {
  const sectionBlocks = page.sections
    .sort((left, right) => left.order - right.order)
    .map(
      (section) =>
        `      <${SECTION_COMPONENT_MAP[section.sectionType]} headline="${section.headline.replace(/"/g, '\\"')}" />`,
    )
    .join("\n");

  const importLines = componentImports
    .map((name) => `import { ${name} } from "../components/${name}";`)
    .join("\n");

  return [
    `/** Generated ${pageNameFromRoute(page.route, page.title)} for ${brand.brandName}. */`,
    `import React from "react";`,
    importLines,
    ``,
    `export default function ${pageNameFromRoute(page.route, page.title)}() {`,
    `  return (`,
    `    <Layout title="${page.title.replace(/"/g, '\\"')}">`,
    `      <Navigation storeName="${brand.brandName.replace(/"/g, '\\"')}" />`,
    sectionBlocks,
    `      <Footer />`,
    `    </Layout>`,
    `  );`,
    `}`,
  ].join("\n");
}

function buildGeneratedPages(
  pages: CodePageInput[],
  brand: CodeBrandInput,
): GeneratedPage[] {
  return pages.map((page) => {
    const componentImports = componentImportsForSections(page.sections);
    return {
      pageId: page.pageId,
      route: page.route,
      pageType: page.pageType,
      pageName: pageNameFromRoute(page.route, page.title),
      filePath: pageFilePath(page.route, page.pageType),
      componentImports,
      sourceCode: buildPageSource(page, brand, componentImports),
    };
  });
}

function buildProjectStructure(
  brand: CodeBrandInput,
  storeId: string,
  generatedPages: GeneratedPage[],
  generatedComponents: GeneratedComponent[],
): ProjectStructure {
  const packageName = `@storefront/${slugify(brand.brandName)}`;
  const rootDirectory = `storefronts/${storeId}`;
  const directories = [
    "src",
    "src/pages",
    "src/pages/products",
    "src/pages/collections",
    "src/components",
    "public",
    "public/assets",
  ];
  const files = [
    "package.json",
    "tsconfig.json",
    "next.config.js",
    "README.md",
    ...generatedComponents.map((component) => component.filePath),
    ...generatedPages.map((page) => page.filePath),
    "public/assets/theme.json",
    "public/assets/storefront.css",
  ];

  return {
    rootDirectory,
    packageName,
    framework: "next",
    directories,
    files,
  };
}

function buildDeploymentMetadata(
  brand: CodeBrandInput,
  storefront: CodeStorefrontInput,
  projectStructure: ProjectStructure,
): DeploymentMetadata {
  return {
    platform: "node",
    buildCommand: "npm run build",
    outputDirectory: ".next",
    startCommand: "npm run start",
    envVars: {
      NEXT_PUBLIC_STORE_ID: storefront.storeId,
      NEXT_PUBLIC_BRAND_ID: brand.brandId,
      NEXT_PUBLIC_BRAND_NAME: brand.brandName,
      NEXT_PUBLIC_STOREFRONT_ID: storefront.storefrontId,
    },
    deployNotes: `Deploy ${brand.brandName} from ${projectStructure.rootDirectory} using ${projectStructure.framework}.`,
  };
}

function computeConfidence(
  storefront: CodeStorefrontInput,
  pages: CodePageInput[],
  brand: CodeBrandInput,
  generatedPages: GeneratedPage[],
  generatedComponents: GeneratedComponent[],
  projectStructure: ProjectStructure,
): number {
  const pageConfidence = average(pages.map((page) => page.confidence));
  const coverageScore =
    generatedPages.length === pages.length && generatedPages.length >= 6 ? 88 : 62;
  const componentScore = generatedComponents.length >= 8 ? 86 : 60;
  const structureScore = projectStructure.files.length >= 10 ? 85 : 58;

  return clampScore(
    storefront.confidence * 0.3 +
      pageConfidence * 0.25 +
      brand.confidence * 0.15 +
      coverageScore * 0.15 +
      componentScore * 0.1 +
      structureScore * 0.05,
  );
}

function buildSignals(
  storefront: CodeStorefrontInput,
  pages: CodePageInput[],
  brand: CodeBrandInput,
  generatedPages: GeneratedPage[],
  generatedComponents: GeneratedComponent[],
  projectStructure: ProjectStructure,
  confidence: number,
): CodeGenerationSignal[] {
  const reusedComponents = new Set(
    generatedPages.flatMap((page) => page.componentImports),
  );

  return [
    buildSignal("storefront_alignment", storefront.confidence, `Storefront ${storefront.storefrontId}`),
    buildSignal(
      "page_code_coverage",
      generatedPages.length === pages.length ? 88 : 60,
      `${generatedPages.length} generated page files`,
    ),
    buildSignal(
      "component_reuse",
      reusedComponents.size >= 4 ? 86 : 58,
      `${reusedComponents.size} shared components referenced`,
    ),
    buildSignal(
      "project_structure",
      projectStructure.directories.length >= 6 ? 84 : 60,
      `${projectStructure.files.length} project files planned`,
    ),
    buildSignal(
      "deployment_readiness",
      Object.keys(buildDeploymentMetadata(brand, storefront, projectStructure).envVars).length >= 4
        ? 85
        : 62,
      "Deployment metadata prepared",
    ),
    buildSignal("brand_alignment", brand.confidence, `Brand ${brand.brandName}`),
    buildSignal(
      "page_content_alignment",
      average(pages.map((page) => page.sections.length >= 2 ? 85 : 60)),
      "Renderable page sections mapped to code",
    ),
    buildSignal("code_generation_composite", confidence, `Code generation confidence ${confidence}`),
  ];
}

/** Generates deployable storefront code from assembly, pages, and brand inputs. */
export function scoreStorefrontCodeGeneration(
  input: StorefrontCodeGenerationInput,
): StorefrontCodeGenerationBreakdown {
  const { storefront, pages, brand } = input;

  const generatedComponents = buildSharedComponents(brand);
  const generatedPages = buildGeneratedPages(pages, brand);
  const projectStructure = buildProjectStructure(
    brand,
    storefront.storeId,
    generatedPages,
    generatedComponents,
  );
  const deploymentMetadata = buildDeploymentMetadata(brand, storefront, projectStructure);
  const confidence = computeConfidence(
    storefront,
    pages,
    brand,
    generatedPages,
    generatedComponents,
    projectStructure,
  );
  const signals = buildSignals(
    storefront,
    pages,
    brand,
    generatedPages,
    generatedComponents,
    projectStructure,
    confidence,
  );

  return {
    storefrontId: storefront.storefrontId,
    storeId: storefront.storeId,
    brandId: brand.brandId,
    generatedPages,
    generatedComponents,
    projectStructure,
    deploymentMetadata,
    confidence,
    signals,
  };
}

export const storefrontCodeGenerationScoring = {
  scoreStorefrontCodeGeneration,
  weights: CODE_GENERATION_SIGNAL_WEIGHTS,
};
