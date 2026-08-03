import type {
  CitationRecommendation,
  GoogleBusinessRecommendation,
  InternalLinkRecommendation,
  LandingPageAsset,
  LocalKeyword,
  NapConsistencyRecommendation,
  SeoCompletenessEvaluation,
  SeoContext,
  SeoMetadata,
  StructuredDataRecommendation,
} from "./types.js";

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

function refs(ctx: SeoContext): string[] {
  return [ctx.sourceOfferReportId];
}

export function provideGoogleBusinessRecommendations(
  ctx: SeoContext,
): GoogleBusinessRecommendation[] {
  const category = ctx.serviceCategory || "local_service";
  return [
    {
      recommendationId: `lseo-gbp-001`,
      category: "primary_profile",
      primaryCategorySuggestion: `${category} service`,
      secondaryCategorySuggestions: [
        `${category} contractor`,
        `home ${category}`,
        `commercial ${category}`,
      ],
      businessDescription: [
        `${ctx.businessName} provides ${category} services in ${ctx.targetLocation}.`,
        ctx.customerFacingLanguage[0] ??
          `Trusted local ${category} for homes and small offices.`,
        "Asset preparation only — does not modify live Google Business Profiles.",
      ].join(" "),
      serviceItems: ctx.services.length
        ? ctx.services.slice(0, 8)
        : [`${category} visit`, `${category} deep service`],
      photoSuggestions: [
        `${category} team at work in ${ctx.targetServiceArea}`,
        `before-and-after ${category} results (owned photos only)`,
        `${ctx.businessName} branded vehicle or kit`,
      ],
      postIdeas: [
        `Seasonal ${category} tips for ${ctx.targetCity}`,
        `Package spotlight: ${ctx.packages[0] ?? "basic package"}`,
        `How to prepare for a ${category} visit`,
      ],
      hoursSuggestion: "Mon–Sat 09:00–18:00 (confirm with operations; structural suggestion only)",
      napChecklist: [
        `Name: ${ctx.napHints.name ?? ctx.businessName}`,
        `Address: ${ctx.napHints.address ?? `${ctx.targetServiceArea}, ${ctx.targetCity}`}`,
        `Phone: ${ctx.napHints.phone ?? "confirm via CRM / approved contact channel"}`,
        `Website: ${ctx.napHints.website ?? "prepare landing URL recommendation only — never publish"}`,
      ],
      neverModifyLiveGbpAutomatically: true,
      sourceOfferRefs: refs(ctx),
    },
  ];
}

export function provideLandingPages(ctx: SeoContext): LandingPageAsset[] {
  const category = ctx.serviceCategory;
  const area = ctx.targetServiceArea;
  const city = ctx.targetCity;
  const biz = ctx.businessName;
  const pageId = "lseo-page-001";
  return [
    {
      pageId,
      pageType: "landing",
      title: `${biz} — ${category} in ${area}`,
      metaDescription: `${biz} offers ${category} services in ${area}, ${city}. Structural SEO asset only — not published.`,
      headings: [
        `Professional ${category} in ${area}`,
        `Why choose ${biz}`,
        `Service packages`,
        `Serving ${area} and nearby ${city}`,
        `Frequently asked questions`,
      ],
      bodyOutline: [
        `Hero: local ${category} for ${area} residents and offices`,
        `Trust: NAP-consistent contact language from offer/CRM hints`,
        `Packages: ${ctx.packages.slice(0, 3).join("; ") || "basic / premium / recurring"}`,
        `Coverage: ${area}, ${city}`,
        `CTA: enquire via approved channels (WhatsApp/CRM) — never auto-publish`,
      ],
      urlRecommendation: `/${slug(city)}/${slug(area)}/${slug(category)}`,
      imageAltText: [
        `${biz} ${category} team in ${area}`,
        `${category} service equipment for ${city} homes`,
      ],
      faq: [
        {
          question: `Do you offer ${category} in ${area}?`,
          answer: `Yes — ${biz} prepares local SEO assets for ${category} coverage in ${area}, ${city}.`,
        },
        {
          question: "Can I book online from this page?",
          answer:
            "This worker prepares page assets only; booking remains with Booking/CRM/WhatsApp workers after approval.",
        },
      ],
      serviceName: category,
      locationLabel: `${area}, ${city}`,
      sourceOfferRefs: refs(ctx),
    },
  ];
}

export function provideServicePages(ctx: SeoContext): LandingPageAsset[] {
  const services = ctx.services.length
    ? ctx.services.slice(0, 4)
    : [`${ctx.serviceCategory} standard`, `${ctx.serviceCategory} deep`];
  return services.map((service, index) => {
    const n = String(index + 2).padStart(3, "0");
    return {
      pageId: `lseo-page-${n}`,
      pageType: "service" as const,
      title: `${service} in ${ctx.targetServiceArea} | ${ctx.businessName}`,
      metaDescription: `${service} by ${ctx.businessName} in ${ctx.targetLocation}. Prepared SEO outline — not a live ranking claim.`,
      headings: [
        `${service} in ${ctx.targetServiceArea}`,
        "What's included",
        "Who it's for",
        "Related services",
      ],
      bodyOutline: [
        `Introduce ${service} for local customers`,
        `Map inclusions from service offer packages`,
        `Link to city/area pages`,
        `FAQ specific to ${service}`,
      ],
      urlRecommendation: `/${slug(ctx.targetCity)}/${slug(ctx.serviceCategory)}/${slug(service)}`,
      imageAltText: [`${service} in ${ctx.targetServiceArea}`],
      faq: [
        {
          question: `How long does ${service} take?`,
          answer:
            "Duration follows the service offer package estimates; this page does not invent operational SLAs.",
        },
      ],
      serviceName: service,
      locationLabel: ctx.targetLocation,
      sourceOfferRefs: refs(ctx),
    };
  });
}

export function provideCityAreaPages(ctx: SeoContext): LandingPageAsset[] {
  const cityPage: LandingPageAsset = {
    pageId: "lseo-page-city-001",
    pageType: "city",
    title: `${ctx.serviceCategory} in ${ctx.targetCity} | ${ctx.businessName}`,
    metaDescription: `Local ${ctx.serviceCategory} coverage across ${ctx.targetCity}. Structural city page asset for SEO preparation.`,
    headings: [
      `${ctx.serviceCategory} across ${ctx.targetCity}`,
      `Neighbourhoods we serve`,
      `Packages for ${ctx.targetCity}`,
    ],
    bodyOutline: [
      `City overview for ${ctx.serviceCategory}`,
      `Link to ${ctx.targetServiceArea} area page`,
      `Package summary from offer`,
    ],
    urlRecommendation: `/${slug(ctx.targetCity)}/${slug(ctx.serviceCategory)}`,
    imageAltText: [`${ctx.serviceCategory} in ${ctx.targetCity}`],
    faq: [
      {
        question: `Which areas of ${ctx.targetCity} do you cover?`,
        answer: `Primary focus includes ${ctx.targetServiceArea}; expand only from approved offer coverage.`,
      },
    ],
    serviceName: ctx.serviceCategory,
    locationLabel: ctx.targetCity,
    sourceOfferRefs: refs(ctx),
  };
  const areaPage: LandingPageAsset = {
    pageId: "lseo-page-area-001",
    pageType: "area",
    title: `${ctx.serviceCategory} in ${ctx.targetServiceArea} | ${ctx.businessName}`,
    metaDescription: `${ctx.serviceCategory} for ${ctx.targetServiceArea}, ${ctx.targetCity}. Area page asset — never published by this worker.`,
    headings: [
      `${ctx.serviceCategory} near ${ctx.targetServiceArea}`,
      "Local trust signals",
      "How to enquire",
    ],
    bodyOutline: [
      `Area-focused value proposition`,
      `NAP consistency notes`,
      `CTA via approved messaging channels`,
    ],
    urlRecommendation: `/${slug(ctx.targetCity)}/${slug(ctx.targetServiceArea)}/${slug(ctx.serviceCategory)}`,
    imageAltText: [`${ctx.serviceCategory} near ${ctx.targetServiceArea}`],
    faq: [
      {
        question: `Is ${ctx.targetServiceArea} covered?`,
        answer: `Yes — offer coverage lists ${ctx.targetServiceArea} within ${ctx.targetCity}.`,
      },
    ],
    serviceName: ctx.serviceCategory,
    locationLabel: ctx.targetServiceArea,
    sourceOfferRefs: refs(ctx),
  };
  return [cityPage, areaPage];
}

export function provideLocalKeywords(ctx: SeoContext): LocalKeyword[] {
  const category = ctx.serviceCategory;
  const area = ctx.targetServiceArea;
  const city = ctx.targetCity;
  const phrases = [
    { phrase: `${category} near me`, intent: "local" as const, priority: "high" as const },
    {
      phrase: `${category} ${area}`,
      intent: "transactional" as const,
      priority: "high" as const,
    },
    {
      phrase: `${category} ${city}`,
      intent: "transactional" as const,
      priority: "high" as const,
    },
    {
      phrase: `best ${category} in ${area}`,
      intent: "informational" as const,
      priority: "medium" as const,
    },
    {
      phrase: `${category} packages ${city}`,
      intent: "transactional" as const,
      priority: "medium" as const,
    },
    {
      phrase: `${ctx.businessName} ${category}`,
      intent: "navigational" as const,
      priority: "low" as const,
    },
  ];
  return phrases.map((p, i) => ({
    keywordId: `lseo-kw-${String(i + 1).padStart(3, "0")}`,
    phrase: p.phrase,
    intent: p.intent,
    locationModifier: area,
    serviceModifier: category,
    priority: p.priority,
    sourceOfferRefs: refs(ctx),
  }));
}

export function provideSeoMetadata(
  ctx: SeoContext,
  pages: LandingPageAsset[],
): SeoMetadata[] {
  return pages.map((page, i) => ({
    metadataId: `lseo-meta-${String(i + 1).padStart(3, "0")}`,
    pageId: page.pageId,
    titleTag: page.title.slice(0, 60),
    metaDescription: page.metaDescription.slice(0, 155),
    ogTitle: page.title,
    ogDescription: page.metaDescription,
    canonicalUrlRecommendation: page.urlRecommendation,
    sourceOfferRefs: refs(ctx),
  }));
}

export function provideStructuredDataRecommendations(
  ctx: SeoContext,
  pages: LandingPageAsset[],
): StructuredDataRecommendation[] {
  const landing = pages.find((p) => p.pageType === "landing") ?? pages[0];
  const faqPage = pages.find((p) => p.faq.length > 0) ?? landing;
  const items: StructuredDataRecommendation[] = [
    {
      schemaId: "lseo-schema-001",
      schemaType: "LocalBusiness",
      jsonLdOutline: {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        name: ctx.napHints.name ?? ctx.businessName,
        description: `${ctx.serviceCategory} in ${ctx.targetLocation}`,
        address: {
          "@type": "PostalAddress",
          addressLocality: ctx.targetCity,
          addressRegion: ctx.targetServiceArea,
          addressCountry: ctx.targetCountry,
          streetAddress: ctx.napHints.address ?? undefined,
        },
        telephone: ctx.napHints.phone ?? undefined,
        url: ctx.napHints.website ?? undefined,
        areaServed: ctx.targetLocation,
      },
      notes: [
        "Structural LocalBusiness outline derived from offer/NAP hints only",
        "Never claims live rich-result performance",
      ],
      sourceOfferRefs: refs(ctx),
    },
    {
      schemaId: "lseo-schema-002",
      schemaType: "Service",
      jsonLdOutline: {
        "@context": "https://schema.org",
        "@type": "Service",
        name: ctx.serviceCategory,
        provider: ctx.businessName,
        areaServed: ctx.targetLocation,
        serviceType: ctx.serviceCategory,
      },
      notes: ["Service schema from service offer category/packages"],
      sourceOfferRefs: refs(ctx),
    },
  ];
  if (faqPage) {
    items.push({
      schemaId: "lseo-schema-003",
      schemaType: "FAQPage",
      jsonLdOutline: {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqPage.faq.map((f) => ({
          "@type": "Question",
          name: f.question,
          acceptedAnswer: { "@type": "Answer", text: f.answer },
        })),
      },
      notes: [`FAQ schema from page ${faqPage.pageId}`],
      sourceOfferRefs: refs(ctx),
    });
  }
  items.push({
    schemaId: "lseo-schema-004",
    schemaType: "BreadcrumbList",
    jsonLdOutline: {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { position: 1, name: ctx.targetCity, item: `/${slug(ctx.targetCity)}` },
        {
          position: 2,
          name: ctx.targetServiceArea,
          item: `/${slug(ctx.targetCity)}/${slug(ctx.targetServiceArea)}`,
        },
        {
          position: 3,
          name: ctx.serviceCategory,
          item: landing?.urlRecommendation ?? `/${slug(ctx.serviceCategory)}`,
        },
      ],
    },
    notes: ["Breadcrumb structure for local URL recommendations"],
    sourceOfferRefs: refs(ctx),
  });
  return items;
}

export function provideCitationRecommendations(
  ctx: SeoContext,
): CitationRecommendation[] {
  const directories = [
    "Google Business Profile (manual owner action)",
    "Apple Business Connect",
    "Bing Places",
    "Yelp / local directory (region-appropriate)",
    "Industry association listing",
  ];
  return directories.map((directoryName, i) => ({
    citationId: `lseo-cit-${String(i + 1).padStart(3, "0")}`,
    directoryName,
    napFields: ["name", "address", "phone", "website", "category"],
    submissionNotes: `Recommend consistent NAP for ${ctx.businessName} in ${ctx.targetLocation}. Manual submission only — never purchase backlinks or auto-publish.`,
    neverPurchaseBacklinks: true,
    sourceOfferRefs: refs(ctx),
  }));
}

export function provideInternalLinkingRecommendations(
  pages: LandingPageAsset[],
): InternalLinkRecommendation[] {
  const links: InternalLinkRecommendation[] = [];
  const landing = pages.find((p) => p.pageType === "landing");
  const services = pages.filter((p) => p.pageType === "service");
  const city = pages.find((p) => p.pageType === "city");
  const area = pages.find((p) => p.pageType === "area");
  let i = 0;
  if (landing && city) {
    i += 1;
    links.push({
      linkId: `lseo-link-${String(i).padStart(3, "0")}`,
      fromPageId: landing.pageId,
      toPageId: city.pageId,
      anchorText: `See all ${city.locationLabel ?? "city"} coverage`,
      rationale: "Landing → city hub",
    });
  }
  if (landing && area) {
    i += 1;
    links.push({
      linkId: `lseo-link-${String(i).padStart(3, "0")}`,
      fromPageId: landing.pageId,
      toPageId: area.pageId,
      anchorText: `${area.locationLabel ?? "area"} services`,
      rationale: "Landing → area page",
    });
  }
  for (const service of services.slice(0, 4)) {
    if (!landing) break;
    i += 1;
    links.push({
      linkId: `lseo-link-${String(i).padStart(3, "0")}`,
      fromPageId: landing.pageId,
      toPageId: service.pageId,
      anchorText: service.serviceName ?? service.title,
      rationale: "Landing → service page",
    });
  }
  if (city && area) {
    i += 1;
    links.push({
      linkId: `lseo-link-${String(i).padStart(3, "0")}`,
      fromPageId: city.pageId,
      toPageId: area.pageId,
      anchorText: area.locationLabel ?? "Neighbourhood page",
      rationale: "City → area",
    });
  }
  return links;
}

export function provideNapConsistencyRecommendations(
  ctx: SeoContext,
): NapConsistencyRecommendation[] {
  return [
    {
      napId: "lseo-nap-001",
      recommendedName: ctx.napHints.name ?? ctx.businessName,
      recommendedAddress:
        ctx.napHints.address ?? `${ctx.targetServiceArea}, ${ctx.targetCity}, ${ctx.targetCountry}`,
      recommendedPhone: ctx.napHints.phone ?? "confirm-via-crm-approved-channel",
      recommendedWebsite:
        ctx.napHints.website ?? `https://example.local${provideLandingPages(ctx)[0]?.urlRecommendation ?? ""}`,
      consistencyNotes: [
        "Use identical NAP across GBP recommendations, citations, and page footers",
        "Optional CRM/WhatsApp language may inform phone/CTA wording — never invent rankings",
        "Website URL is a recommendation only; neverPublishWebsites remains locked",
      ],
      sourceChannels: ["service_offer", "crm_optional", "whatsapp_optional"],
    },
  ];
}

export function provideCompletenessEvaluation(session: {
  landingPages: LandingPageAsset[];
  googleBusinessRecommendations: GoogleBusinessRecommendation[];
  localKeywords: LocalKeyword[];
  metadata: SeoMetadata[];
  structuredDataRecommendations: StructuredDataRecommendation[];
  citationRecommendations: CitationRecommendation[];
  internalLinkingRecommendations: InternalLinkRecommendation[];
  napConsistencyRecommendations: NapConsistencyRecommendation[];
}): SeoCompletenessEvaluation {
  const checklist = [
    {
      item: "landing_pages",
      present: session.landingPages.some((p) => p.pageType === "landing"),
      weight: 0.15,
      notes: "Primary landing page asset",
    },
    {
      item: "service_pages",
      present: session.landingPages.some((p) => p.pageType === "service"),
      weight: 0.12,
      notes: "Service page assets from offer catalogue",
    },
    {
      item: "city_area_pages",
      present:
        session.landingPages.some((p) => p.pageType === "city") &&
        session.landingPages.some((p) => p.pageType === "area"),
      weight: 0.12,
      notes: "City and area page assets",
    },
    {
      item: "google_business_recommendations",
      present: session.googleBusinessRecommendations.length > 0,
      weight: 0.15,
      notes: "GBP recommendations (not live modifications)",
    },
    {
      item: "local_keywords",
      present: session.localKeywords.length > 0,
      weight: 0.12,
      notes: "Keyword phrases derived from offer/location",
    },
    {
      item: "metadata",
      present: session.metadata.length > 0,
      weight: 0.12,
      notes: "Title/meta recommendations",
    },
    {
      item: "structured_data",
      present: session.structuredDataRecommendations.length > 0,
      weight: 0.1,
      notes: "Schema outlines",
    },
    {
      item: "citations",
      present: session.citationRecommendations.length > 0,
      weight: 0.07,
      notes: "Citation directory recommendations",
    },
    {
      item: "internal_linking",
      present: session.internalLinkingRecommendations.length > 0,
      weight: 0.03,
      notes: "Internal link map",
    },
    {
      item: "nap_consistency",
      present: session.napConsistencyRecommendations.length > 0,
      weight: 0.02,
      notes: "NAP consistency recommendations",
    },
  ];
  const score = Number(
    checklist
      .reduce((sum, row) => sum + (row.present ? row.weight : 0), 0)
      .toFixed(2),
  );
  const outstandingGaps = checklist.filter((c) => !c.present).map((c) => c.item);
  const status =
    score >= 0.9 ? "complete" : score >= 0.5 ? "partial" : ("incomplete" as const);
  return {
    evaluationId: `lseo-eval-${Date.now()}`,
    checklist,
    score,
    status,
    neverClaimsLiveRankingOrTraffic: true,
    outstandingGaps,
  };
}
