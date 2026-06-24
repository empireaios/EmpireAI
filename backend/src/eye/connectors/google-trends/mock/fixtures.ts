import type { SearchInterest } from "../models/search-interest.js";
import type {
  BreakoutTrend,
  GeoPopularity,
  SeasonalityProfile,
  TrendMomentum,
} from "../models/trend-momentum.js";

export const SAMPLE_KEYWORDS = {
  USB_BLENDER: "portable usb blender",
  WIRELESS_EARBUDS: "wireless earbuds anc",
  YOGA_MAT: "extra thick yoga mat",
} as const;

export const MOCK_TRENDING_KEYWORDS: Record<string, readonly string[]> = {
  kitchen: [SAMPLE_KEYWORDS.USB_BLENDER, SAMPLE_KEYWORDS.WIRELESS_EARBUDS, SAMPLE_KEYWORDS.YOGA_MAT],
  "kitchen-blenders": [SAMPLE_KEYWORDS.USB_BLENDER, "usb rechargeable blender"],
  electronics: [SAMPLE_KEYWORDS.WIRELESS_EARBUDS],
  sports: [SAMPLE_KEYWORDS.YOGA_MAT],
};

const NOW = "2026-06-23T12:00:00.000Z";

export const MOCK_SEARCH_INTEREST: Record<string, SearchInterest> = {
  [SAMPLE_KEYWORDS.USB_BLENDER]: {
    keyword: SAMPLE_KEYWORDS.USB_BLENDER,
    region: "US",
    interestScore: 78,
    timeline: [
      { date: "2026-05-01", value: 62 },
      { date: "2026-06-01", value: 71 },
      { date: "2026-06-23", value: 78 },
    ],
    observedAt: NOW,
  },
  [SAMPLE_KEYWORDS.WIRELESS_EARBUDS]: {
    keyword: SAMPLE_KEYWORDS.WIRELESS_EARBUDS,
    region: "US",
    interestScore: 92,
    timeline: [
      { date: "2026-05-01", value: 88 },
      { date: "2026-06-01", value: 90 },
      { date: "2026-06-23", value: 92 },
    ],
    observedAt: NOW,
  },
  [SAMPLE_KEYWORDS.YOGA_MAT]: {
    keyword: SAMPLE_KEYWORDS.YOGA_MAT,
    region: "US",
    interestScore: 55,
    timeline: [
      { date: "2026-05-01", value: 68 },
      { date: "2026-06-01", value: 60 },
      { date: "2026-06-23", value: 55 },
    ],
    observedAt: NOW,
  },
};

export const MOCK_TREND_MOMENTUM: Record<string, TrendMomentum> = {
  [SAMPLE_KEYWORDS.USB_BLENDER]: {
    keyword: SAMPLE_KEYWORDS.USB_BLENDER,
    direction: "rising",
    momentumScore: 72,
    changePct: 25.8,
    observedAt: NOW,
  },
  [SAMPLE_KEYWORDS.WIRELESS_EARBUDS]: {
    keyword: SAMPLE_KEYWORDS.WIRELESS_EARBUDS,
    direction: "stable",
    momentumScore: 55,
    changePct: 4.5,
    observedAt: NOW,
  },
  [SAMPLE_KEYWORDS.YOGA_MAT]: {
    keyword: SAMPLE_KEYWORDS.YOGA_MAT,
    direction: "falling",
    momentumScore: 38,
    changePct: -19.1,
    observedAt: NOW,
  },
};

export const MOCK_SEASONALITY: Record<string, SeasonalityProfile> = {
  [SAMPLE_KEYWORDS.USB_BLENDER]: {
    keyword: SAMPLE_KEYWORDS.USB_BLENDER,
    isSeasonal: true,
    peakMonths: ["June", "July", "August"],
    seasonalityIndex: 68,
    observedAt: NOW,
  },
  [SAMPLE_KEYWORDS.WIRELESS_EARBUDS]: {
    keyword: SAMPLE_KEYWORDS.WIRELESS_EARBUDS,
    isSeasonal: false,
    peakMonths: [],
    seasonalityIndex: 15,
    observedAt: NOW,
  },
  [SAMPLE_KEYWORDS.YOGA_MAT]: {
    keyword: SAMPLE_KEYWORDS.YOGA_MAT,
    isSeasonal: true,
    peakMonths: ["January", "September"],
    seasonalityIndex: 55,
    observedAt: NOW,
  },
};

export const MOCK_GEO_POPULARITY: Record<string, GeoPopularity> = {
  [SAMPLE_KEYWORDS.USB_BLENDER]: {
    keyword: SAMPLE_KEYWORDS.USB_BLENDER,
    regions: [
      { region: "US-CA", interestScore: 100 },
      { region: "US-TX", interestScore: 82 },
      { region: "US-NY", interestScore: 76 },
    ],
    topRegion: "US-CA",
    observedAt: NOW,
  },
  [SAMPLE_KEYWORDS.WIRELESS_EARBUDS]: {
    keyword: SAMPLE_KEYWORDS.WIRELESS_EARBUDS,
    regions: [
      { region: "US-NY", interestScore: 100 },
      { region: "US-CA", interestScore: 95 },
      { region: "US-FL", interestScore: 88 },
    ],
    topRegion: "US-NY",
    observedAt: NOW,
  },
  [SAMPLE_KEYWORDS.YOGA_MAT]: {
    keyword: SAMPLE_KEYWORDS.YOGA_MAT,
    regions: [
      { region: "US-CO", interestScore: 100 },
      { region: "US-CA", interestScore: 72 },
      { region: "US-OR", interestScore: 68 },
    ],
    topRegion: "US-CO",
    observedAt: NOW,
  },
};

export const MOCK_BREAKOUT_TRENDS: Record<string, BreakoutTrend> = {
  [SAMPLE_KEYWORDS.USB_BLENDER]: {
    keyword: SAMPLE_KEYWORDS.USB_BLENDER,
    isBreakout: true,
    breakoutScore: 78,
    relatedQueries: ["usb rechargeable blender", "portable smoothie maker"],
    observedAt: NOW,
  },
  [SAMPLE_KEYWORDS.WIRELESS_EARBUDS]: {
    keyword: SAMPLE_KEYWORDS.WIRELESS_EARBUDS,
    isBreakout: false,
    breakoutScore: 22,
    relatedQueries: ["noise cancelling earbuds", "bluetooth earbuds"],
    observedAt: NOW,
  },
  [SAMPLE_KEYWORDS.YOGA_MAT]: {
    keyword: SAMPLE_KEYWORDS.YOGA_MAT,
    isBreakout: false,
    breakoutScore: 30,
    relatedQueries: ["yoga mat non slip", "thick exercise mat"],
    observedAt: NOW,
  },
};
