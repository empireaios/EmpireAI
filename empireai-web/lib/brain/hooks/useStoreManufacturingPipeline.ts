"use client";

import { useCallback, useState } from "react";
import { brainDispatch } from "@/lib/brain/client";
import type {
  ArtifactListView,
  GeneratedCodeView,
  ManufacturingPipelineView,
  MaterializedProjectView,
  StoreBlueprintView,
  StoreBrandView,
  StoreLandingPageView,
  StoreManufacturingData,
  StoreOfferView,
  StorePagesView,
  StorePipelinePhase,
  StorePortfolioView,
  StorefrontView,
} from "@/lib/brain/store-execution/types";

const EMPTY_DATA: StoreManufacturingData = {
  pipeline: null,
  brand: null,
  portfolio: null,
  offer: null,
  landingPage: null,
  storeBlueprint: null,
  storePages: null,
  storefront: null,
  generatedCode: null,
  artifacts: null,
  materializedProject: null,
};

const STORE_GETTER_ACTIONS = [
  "get_brand",
  "get_portfolio",
  "get_offer",
  "get_landing_page",
  "get_store_blueprint",
  "get_store_pages",
  "get_storefront",
  "get_generated_code",
  "list_artifacts",
  "get_materialized_project",
] as const;

async function dispatchStore<T>(
  action: string,
  companyId?: string,
): Promise<T | null> {
  const response = await brainDispatch<T>({
    module: "store",
    action,
    companyId,
  });
  return response.result ?? null;
}

export function useStoreManufacturingPipeline() {
  const [data, setData] = useState<StoreManufacturingData>(EMPTY_DATA);
  const [phase, setPhase] = useState<StorePipelinePhase>("idle");
  const [error, setError] = useState<string | null>(null);

  const loadGeneratedData = useCallback(async (companyId?: string) => {
    const [
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
    ] = await Promise.all([
      dispatchStore<StoreBrandView>("get_brand", companyId),
      dispatchStore<StorePortfolioView>("get_portfolio", companyId),
      dispatchStore<StoreOfferView>("get_offer", companyId),
      dispatchStore<StoreLandingPageView>("get_landing_page", companyId),
      dispatchStore<StoreBlueprintView>("get_store_blueprint", companyId),
      dispatchStore<StorePagesView>("get_store_pages", companyId),
      dispatchStore<StorefrontView>("get_storefront", companyId),
      dispatchStore<GeneratedCodeView>("get_generated_code", companyId),
      dispatchStore<ArtifactListView>("list_artifacts", companyId),
      dispatchStore<MaterializedProjectView>("get_materialized_project", companyId),
    ]);

    setData((current) => ({
      ...current,
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
    }));
  }, []);

  const runPipeline = useCallback(
    async (companyId?: string) => {
      setError(null);
      setPhase("running_pipeline");

      try {
        const pipeline = await dispatchStore<ManufacturingPipelineView>(
          "run_pipeline",
          companyId,
        );

        if (!pipeline) {
          throw new Error("Manufacturing pipeline returned no result");
        }

        setData((current) => ({ ...current, pipeline }));
        setPhase("loading_data");
        await loadGeneratedData(companyId ?? pipeline.companyId);
        setPhase("success");
      } catch (err) {
        setPhase("error");
        setError(err instanceof Error ? err.message : "Pipeline failed");
        throw err;
      }
    },
    [loadGeneratedData],
  );

  const refreshGeneratedData = useCallback(
    async (companyId?: string) => {
      setError(null);
      setPhase("loading_data");
      try {
        await loadGeneratedData(companyId ?? data.pipeline?.companyId);
        setPhase(data.pipeline ? "success" : "idle");
      } catch (err) {
        setPhase("error");
        setError(err instanceof Error ? err.message : "Failed to load store data");
        throw err;
      }
    },
    [data.pipeline, loadGeneratedData],
  );

  const clearError = useCallback(() => setError(null), []);

  const busy = phase === "running_pipeline" || phase === "loading_data";

  return {
    ...data,
    phase,
    busy,
    error,
    runPipeline,
    refreshGeneratedData,
    clearError,
    hasGeneratedData: Boolean(data.brand && data.pipeline),
    getterActions: STORE_GETTER_ACTIONS,
  };
}
