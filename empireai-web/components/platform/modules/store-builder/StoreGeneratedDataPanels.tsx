"use client";

import {
  Badge,
  DataTable,
  Panel,
  StatCard,
} from "@/components/platform/ui/PlatformPrimitives";
import { ArtifactPreviewSection } from "@/components/platform/modules/store-builder/ArtifactPreviewSection";
import type {
  ManufacturingPipelineView,
  MaterializedFileView,
  StoreBlueprintView,
  StoreBrandView,
  StoreLandingPageView,
  StoreManufacturingData,
  StoreOfferView,
  StorePageRow,
  StorePortfolioView,
  StorefrontRouteView,
} from "@/lib/brain/store-execution/types";

type StoreGeneratedDataPanelsProps = {
  data: StoreManufacturingData;
  artifactsLoading?: boolean;
  artifactsError?: string | null;
};

function toMaterializedFilePreviews(
  files: MaterializedFileView[] | undefined,
): MaterializedFileView[] {
  if (!files) return [];
  return files.filter(
    (file): file is MaterializedFileView =>
      typeof file.artifactId === "string" && typeof file.content === "string",
  );
}

function ConfidenceBadge({ value }: { value: number }) {
  const variant = value >= 75 ? "success" : value >= 50 ? "gold" : "warning";
  return <Badge variant={variant}>{value}% confidence</Badge>;
}

function BulletList({ items }: { items: string[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-[#6f6a60]">No items generated.</p>;
  }
  return (
    <ul className="space-y-2 text-sm text-[#c8c0b0]">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <span className="text-gold/60">•</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function formatRoute(route: StorefrontRouteView): string {
  return route.path ?? route.title ?? "—";
}

function PipelineStagesPanel({ pipeline }: { pipeline: ManufacturingPipelineView }) {
  return (
    <Panel
      title="Manufacturing Pipeline"
      subtitle={`Session ${pipeline.sessionId.slice(0, 8)} · ${pipeline.summary.brandName}`}
    >
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Overall confidence" value={`${pipeline.summary.overallConfidence}%`} />
        <StatCard label="Artifacts" value={String(pipeline.summary.artifactCount)} />
        <StatCard label="Store ID" value={pipeline.summary.storeId.slice(0, 12)} />
        <StatCard label="Project ID" value={pipeline.summary.projectId.slice(0, 12)} />
      </div>
      <div className="space-y-3">
        {pipeline.stages.map((stage) => (
          <div key={stage.moduleId} className="flex items-center justify-between text-sm">
            <span className="text-[#c8c0b0]">{stage.stage}</span>
            <Badge variant={stage.status === "complete" ? "success" : "default"}>
              {stage.status.replace("_", " ")}
            </Badge>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function BrandPanel({ brand }: { brand: StoreBrandView }) {
  return (
    <Panel title="Generated Brand" subtitle={brand.brandId}>
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-display text-xl text-[#f0d78c]">{brand.brandName}</h3>
          <ConfidenceBadge value={brand.confidence} />
        </div>
        <p className="text-sm italic text-[#a8a095]">&ldquo;{brand.slogan}&rdquo;</p>
        <p className="text-sm text-[#c8c0b0]">{brand.valueProposition}</p>
        <div className="grid gap-3 sm:grid-cols-2 text-sm">
          <div>
            <p className="text-xs uppercase tracking-wider text-[#6f6a60]">Niche</p>
            <p className="text-[#c8c0b0]">{brand.niche}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-[#6f6a60]">Positioning</p>
            <p className="text-[#c8c0b0]">{brand.positioning}</p>
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs uppercase tracking-wider text-[#6f6a60]">
            Recommended products
          </p>
          <BulletList items={brand.recommendedProducts} />
        </div>
      </div>
    </Panel>
  );
}

function PortfolioPanel({ portfolio }: { portfolio: StorePortfolioView }) {
  return (
    <Panel title="Product Portfolio" subtitle={`Score ${portfolio.portfolioScore}`}>
      <div className="mb-4">
        <ConfidenceBadge value={portfolio.confidence} />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <p className="mb-2 text-xs uppercase tracking-wider text-[#6f6a60]">Hero products</p>
          <BulletList items={portfolio.heroProducts.map((p) => p.displayName)} />
        </div>
        <div>
          <p className="mb-2 text-xs uppercase tracking-wider text-[#6f6a60]">Supporting</p>
          <BulletList items={portfolio.supportingProducts.map((p) => p.displayName)} />
        </div>
        <div>
          <p className="mb-2 text-xs uppercase tracking-wider text-[#6f6a60]">Bundles</p>
          <BulletList items={portfolio.bundleProducts.map((p) => p.displayName)} />
        </div>
      </div>
    </Panel>
  );
}

function OfferPanel({ offer }: { offer: StoreOfferView }) {
  return (
    <Panel title="Product Offer" subtitle={offer.offerStyle}>
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-lg text-[#f0d78c]">{offer.offerTitle}</h3>
          <ConfidenceBadge value={offer.confidence} />
        </div>
        <p className="text-sm text-[#c8c0b0]">{offer.headline}</p>
        <p className="text-sm text-[#a8a095]">{offer.valueProposition}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-xs uppercase tracking-wider text-[#6f6a60]">Key benefits</p>
            <BulletList items={offer.keyBenefits} />
          </div>
          <div>
            <p className="mb-2 text-xs uppercase tracking-wider text-[#6f6a60]">Key features</p>
            <BulletList items={offer.keyFeatures} />
          </div>
        </div>
        <Badge variant="gold">{offer.callToAction}</Badge>
      </div>
    </Panel>
  );
}

function LandingPagePanel({ landingPage }: { landingPage: StoreLandingPageView }) {
  return (
    <Panel title="Landing Page" subtitle={landingPage.pageTitle}>
      <div className="mb-3">
        <ConfidenceBadge value={landingPage.content.confidence} />
      </div>
      <div className="space-y-3 text-sm text-[#c8c0b0]">
        <div>
          <p className="text-xs uppercase tracking-wider text-[#6f6a60]">Hero copy</p>
          <p>{landingPage.content.heroCopy}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-[#6f6a60]">Benefits</p>
          <p>{landingPage.content.benefitsCopy}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-[#6f6a60]">CTA</p>
          <p>{landingPage.content.ctaCopy}</p>
        </div>
      </div>
    </Panel>
  );
}

function BlueprintPanel({ blueprint }: { blueprint: StoreBlueprintView }) {
  return (
    <Panel title="Store Blueprint" subtitle={blueprint.storeId}>
      <div className="mb-3">
        <ConfidenceBadge value={blueprint.confidence} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 text-sm">
        <div>
          <p className="text-xs uppercase tracking-wider text-[#6f6a60]">Collection pages</p>
          <p className="text-[#c8c0b0]">{blueprint.collectionPages.length} planned</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-[#6f6a60]">Product pages</p>
          <p className="text-[#c8c0b0]">{blueprint.productPages.length} planned</p>
        </div>
      </div>
    </Panel>
  );
}

function PagesPanel({ pages }: { pages: StorePageRow[] }) {
  return (
    <Panel title="Generated Pages" subtitle={`${pages.length} renderable pages`}>
      <DataTable
        keyField="pageId"
        data={pages}
        columns={[
          { key: "title", header: "Title" },
          { key: "route", header: "Route" },
          { key: "pageType", header: "Type" },
          {
            key: "confidence",
            header: "Confidence",
            render: (row) => `${row.confidence}%`,
          },
        ]}
      />
    </Panel>
  );
}

function StorefrontPanel({
  routes,
  confidence,
}: {
  routes: StorefrontRouteView[];
  confidence: number;
}) {
  return (
    <Panel title="Storefront Routes" subtitle={`${routes.length} routes assembled`}>
      <div className="mb-3">
        <ConfidenceBadge value={confidence} />
      </div>
      <DataTable
        keyField="id"
        data={routes.map((route, index) => ({
          id: `${formatRoute(route)}-${index}`,
          path: formatRoute(route),
          title: route.title ?? "—",
          pageType: route.pageType ?? "—",
        }))}
        columns={[
          { key: "path", header: "Path" },
          { key: "title", header: "Title" },
          { key: "pageType", header: "Type" },
        ]}
      />
    </Panel>
  );
}

function MaterializedProjectPanel({
  project,
}: {
  project: NonNullable<StoreManufacturingData["materializedProject"]>;
}) {
  const structure = project.projectStructure;
  const build = project.buildMetadata;

  return (
    <Panel title="Materialized Project" subtitle={project.projectId}>
      <div className="mb-3">
        <ConfidenceBadge value={project.confidence} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 text-sm">
        <div>
          <p className="text-xs uppercase tracking-wider text-[#6f6a60]">Root directory</p>
          <p className="font-mono text-[#c8c0b0]">{structure.rootDirectory ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-[#6f6a60]">Framework</p>
          <p className="text-[#c8c0b0]">{structure.framework ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-[#6f6a60]">Build command</p>
          <p className="font-mono text-[#c8c0b0]">{build.buildCommand ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-[#6f6a60]">Materialized files</p>
          <p className="text-[#c8c0b0]">{project.materializedFiles.length} files</p>
        </div>
      </div>
      {structure.files && structure.files.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-xs uppercase tracking-wider text-[#6f6a60]">Project files</p>
          <BulletList items={structure.files.slice(0, 8)} />
        </div>
      )}
    </Panel>
  );
}

function GeneratedCodePanel({
  generatedCode,
}: {
  generatedCode: NonNullable<StoreManufacturingData["generatedCode"]>;
}) {
  return (
    <Panel title="Generated Code" subtitle={generatedCode.generatedStorefrontId}>
      <div className="mb-3">
        <ConfidenceBadge value={generatedCode.confidence} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 text-sm">
        <div>
          <p className="text-xs uppercase tracking-wider text-[#6f6a60]">Generated pages</p>
          <p className="text-[#c8c0b0]">{generatedCode.generatedPages.length}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-[#6f6a60]">Components</p>
          <p className="text-[#c8c0b0]">{generatedCode.generatedComponents.length}</p>
        </div>
      </div>
    </Panel>
  );
}

export function StoreGeneratedDataPanels({
  data,
  artifactsLoading = false,
  artifactsError = null,
}: StoreGeneratedDataPanelsProps) {
  const {
    pipeline,
    brand,
    portfolio,
    offer,
    landingPage,
    storeBlueprint,
    storePages,
    storefront,
    generatedCode,
    artifacts,
    materializedProject,
  } = data;

  const materializedFiles = toMaterializedFilePreviews(materializedProject?.materializedFiles);
  const artifactRows = artifacts?.artifacts ?? [];
  const showArtifactSection =
    artifactsLoading || artifactsError || artifactRows.length > 0 || Boolean(pipeline);

  if (!pipeline) {
    return null;
  }

  return (
    <div className="mt-8 space-y-6">
      <PipelineStagesPanel pipeline={pipeline} />

      <div className="grid gap-6 lg:grid-cols-2">
        {brand && <BrandPanel brand={brand} />}
        {portfolio && <PortfolioPanel portfolio={portfolio} />}
        {offer && <OfferPanel offer={offer} />}
        {landingPage && <LandingPagePanel landingPage={landingPage} />}
        {storeBlueprint && <BlueprintPanel blueprint={storeBlueprint} />}
        {generatedCode && <GeneratedCodePanel generatedCode={generatedCode} />}
        {materializedProject && (
          <MaterializedProjectPanel project={materializedProject} />
        )}
      </div>

      {storePages && storePages.pages.length > 0 && (
        <PagesPanel pages={storePages.pages} />
      )}

      {storefront && storefront.routes.length > 0 && (
        <StorefrontPanel routes={storefront.routes} confidence={storefront.confidence} />
      )}

      {showArtifactSection && (
        <ArtifactPreviewSection
          artifacts={artifactRows}
          materializedFiles={materializedFiles}
          loading={artifactsLoading}
          error={artifactsError}
        />
      )}
    </div>
  );
}
