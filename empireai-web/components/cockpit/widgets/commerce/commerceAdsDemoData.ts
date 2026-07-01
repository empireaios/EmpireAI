export const COMMERCE_ADS_METRICS = [
  { label: "Total spend", value: "$4.2k", change: "Demo MTD", trend: "neutral" as const },
  { label: "Blended ROAS", value: "2.4x", change: "Target 3.0x", trend: "down" as const },
  { label: "Live channels", value: "2", change: "Meta + Google", trend: "up" as const },
  { label: "CPA", value: "$18.40", change: "Nova Home", trend: "neutral" as const },
];

export const COMMERCE_ADS_CHANNELS = [
  { channel: "Meta", spend: "$2.1k", roas: "2.6x", status: "Live" },
  { channel: "Google", spend: "$1.6k", roas: "2.2x", status: "Live" },
  { channel: "TikTok", spend: "$0", roas: "—", status: "Paused" },
];

export const COMMERCE_ADS_CAMPAIGNS = [
  { id: "a1", name: "Nova Essentials", platform: "Meta", budget: "$800/wk", roas: "2.8x", status: "active" },
  { id: "a2", name: "Lamp Retarget", platform: "Google", budget: "$400/wk", roas: "2.1x", status: "active" },
  { id: "a3", name: "Bundle Test", platform: "Meta", budget: "$200/wk", roas: "—", status: "draft" },
];
