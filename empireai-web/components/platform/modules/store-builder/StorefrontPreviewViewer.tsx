"use client";

import { useMemo, useState } from "react";
import { Badge, Panel } from "@/components/platform/ui/PlatformPrimitives";
import { findPreviewPage } from "@/lib/brain/store-execution/build-preview-model";
import type {
  PreviewPage,
  PreviewPageSection,
  StorefrontPreviewModel,
} from "@/lib/brain/store-execution/preview-types";

type StorefrontPreviewViewerProps = {
  model: StorefrontPreviewModel | null;
  loading?: boolean;
  error?: string | null;
};

function PreviewSection({ section }: { section: PreviewPageSection }) {
  switch (section.sectionType) {
    case "HERO":
      return (
        <section className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 px-8 py-12 text-white">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-300">Hero</p>
          <h2 className="mt-3 font-display text-3xl font-semibold">{section.headline}</h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-200">{section.body}</p>
          {section.callToAction && (
            <span className="mt-6 inline-flex rounded-full bg-white px-5 py-2 text-sm font-medium text-slate-900">
              {section.callToAction}
            </span>
          )}
        </section>
      );
    case "PRODUCT_GRID":
      return (
        <section className="space-y-4">
          <h3 className="text-xl font-semibold text-slate-900">{section.headline}</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(section.bullets.length > 0 ? section.bullets : ["Featured product"]).map(
              (item) => (
                <div
                  key={item}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm"
                >
                  <div className="mb-3 h-28 rounded-lg bg-gradient-to-br from-slate-200 to-slate-100" />
                  <p className="font-medium text-slate-900">{item}</p>
                  <p className="mt-1 text-sm text-slate-500">Generated catalog item</p>
                </div>
              ),
            )}
          </div>
        </section>
      );
    case "FAQ":
      return (
        <section className="space-y-4">
          <h3 className="text-xl font-semibold text-slate-900">{section.headline}</h3>
          <div className="space-y-3">
            {(section.bullets.length > 0 ? section.bullets : [section.body]).map((item) => (
              <div key={item} className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="font-medium text-slate-900">{item}</p>
                {section.body && section.bullets.length > 0 && (
                  <p className="mt-2 text-sm text-slate-600">{section.body}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      );
    case "CTA":
      return (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 px-8 py-10 text-center">
          <h3 className="text-2xl font-semibold text-slate-900">{section.headline}</h3>
          <p className="mx-auto mt-3 max-w-xl text-sm text-slate-600">{section.body}</p>
          {section.callToAction && (
            <span className="mt-5 inline-flex rounded-full bg-slate-900 px-5 py-2 text-sm font-medium text-white">
              {section.callToAction}
            </span>
          )}
        </section>
      );
    case "CONTACT":
      return (
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="text-xl font-semibold text-slate-900">{section.headline}</h3>
          <p className="mt-3 text-sm text-slate-600">{section.body}</p>
          <ul className="mt-4 space-y-2 text-sm text-slate-700">
            {section.bullets.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      );
    case "BULLETS":
      return (
        <section className="space-y-3">
          <h3 className="text-xl font-semibold text-slate-900">{section.headline}</h3>
          <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">
            {section.bullets.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      );
    default:
      return (
        <section className="space-y-3">
          <h3 className="text-xl font-semibold text-slate-900">{section.headline}</h3>
          <p className="text-sm leading-relaxed text-slate-700">{section.body}</p>
          {section.bullets.length > 0 && (
            <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">
              {section.bullets.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
        </section>
      );
  }
}

function PreviewPageCanvas({ page }: { page: PreviewPage }) {
  return (
    <div className="space-y-8">
      <div className="border-b border-slate-200 pb-4">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{page.pageType}</p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-900">{page.title}</h2>
        {page.metadata?.description && (
          <p className="mt-2 text-sm text-slate-600">{page.metadata.description}</p>
        )}
      </div>
      {page.sections.map((section) => (
        <PreviewSection key={section.sectionId} section={section} />
      ))}
    </div>
  );
}

export function StorefrontPreviewViewer({
  model,
  loading = false,
  error = null,
}: StorefrontPreviewViewerProps) {
  const [activeRoute, setActiveRoute] = useState<string | null>(null);

  const resolvedRoute = useMemo(() => {
    if (!model) return null;
    const candidate = activeRoute ?? model.defaultRoute;
    return model.pages.some((page) => page.route === candidate)
      ? candidate
      : model.defaultRoute;
  }, [activeRoute, model]);
  const activePage = useMemo(
    () => (model && resolvedRoute ? findPreviewPage(model, resolvedRoute) : null),
    [model, resolvedRoute],
  );

  if (loading) {
    return (
      <Panel title="Storefront Preview" subtitle="Loading generated storefront…">
        <div className="rounded-lg border border-gold/10 bg-white/[0.02] px-5 py-8 text-sm text-[#8a847a]">
          Preparing preview from blueprint, pages, routes, and materialized project…
        </div>
      </Panel>
    );
  }

  if (error) {
    return (
      <Panel title="Storefront Preview" subtitle="Preview unavailable">
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-5 py-8 text-sm text-red-300">
          {error}
        </div>
      </Panel>
    );
  }

  if (!model) {
    return (
      <Panel title="Storefront Preview" subtitle="Run the manufacturing pipeline first">
        <div className="rounded-lg border border-dashed border-gold/15 px-5 py-8 text-sm text-[#8a847a]">
          Generated store pages are required to render an in-platform storefront preview.
        </div>
      </Panel>
    );
  }

  return (
    <Panel
      title="Storefront Preview"
      subtitle={`${model.pages.length} pages · ${model.framework ?? "generated storefront"}`}
    >
      <div className="overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-2xl shadow-black/20">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-950 px-4 py-3 text-white">
          <div>
            <Badge variant="gold">EmpireAI Preview Mode</Badge>
            <p className="mt-2 font-display text-lg text-white">{model.storeName}</p>
            {model.brandSlogan && (
              <p className="text-xs text-slate-300">{model.brandSlogan}</p>
            )}
          </div>
          <div className="text-right text-xs text-slate-400">
            {model.projectRoot && <p>{model.projectRoot}</p>}
            {model.projectId && <p>{model.projectId}</p>}
          </div>
        </div>

        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
          <nav className="flex flex-wrap gap-2">
            {model.routes.map((link) => {
              const selected = link.route === resolvedRoute;
              return (
                <button
                  key={link.pageId}
                  type="button"
                  onClick={() => setActiveRoute(link.route)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    selected
                      ? "bg-slate-900 text-white"
                      : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="px-6 py-8">
          {activePage ? (
            <PreviewPageCanvas page={activePage} />
          ) : (
            <div className="py-16 text-center text-sm text-slate-500">
              Select a route to preview the generated page.
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
          In-platform preview only · no deployment · no files written · no external hosting
        </div>
      </div>
    </Panel>
  );
}
