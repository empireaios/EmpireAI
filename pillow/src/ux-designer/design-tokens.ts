/** EmpireAI Cockpit design tokens — canonical UX system. */
export const EMPIRE_DESIGN_TOKENS = {
  background: "#030303",
  foreground: "#f5f0e6",
  gold: "#d4af37",
  goldLight: "#f0d78c",
  goldDark: "#9a7b1a",
  muted: "#8a847a",
  mutedDark: "#6f6a60",
  panelBg: "#0a0a0a",
  borderGold: "border-gold/15",
  borderGoldStrong: "border-gold/25",
  fontSans: "var(--font-inter)",
  fontDisplay: "var(--font-cormorant)",
  spacingUnit: "0.25rem",
  maxContentWidth: "max-w-7xl",
  panelRadius: "rounded-xl",
  cardRadius: "rounded-lg",
} as const;

export const STYLE_PRESETS: Record<
  string,
  { palette: Record<string, string>; tailwind: string[]; description: string }
> = {
  empire_gold: {
    description: "Default Grand King gold-on-black executive aesthetic",
    palette: {
      primary: EMPIRE_DESIGN_TOKENS.gold,
      accent: EMPIRE_DESIGN_TOKENS.goldLight,
      background: EMPIRE_DESIGN_TOKENS.background,
    },
    tailwind: ["text-[#f0d78c]", "border-gold/15", "bg-[#0a0a0a]"],
  },
  premium_minimal: {
    description: "Refined minimal — more whitespace, softer borders, muted gold accents",
    palette: {
      primary: "#c9b896",
      accent: "#e8dcc8",
      background: "#050505",
    },
    tailwind: ["gap-8", "px-8", "border-white/5", "text-[#e8e0d0]"],
  },
  apple_clean: {
    description: "Apple-style clean — SF-like spacing, subtle blur, rounded-2xl cards",
    palette: {
      primary: "#0071e3",
      accent: "#f5f5f7",
      background: "#000000",
    },
    tailwind: ["rounded-2xl", "backdrop-blur-xl", "shadow-lg", "gap-6", "tracking-tight"],
  },
  futuristic_neon: {
    description: "Futuristic neon — cyan/magenta accents, glow borders, dark panels",
    palette: {
      primary: "#00f0ff",
      accent: "#ff00aa",
      background: "#010108",
    },
    tailwind: [
      "border-cyan-500/30",
      "shadow-[0_0_20px_rgba(0,240,255,0.15)]",
      "text-cyan-100",
      "bg-[#010108]",
    ],
  },
  high_contrast: {
    description: "High contrast readability — brighter text, stronger borders",
    palette: {
      primary: "#ffffff",
      accent: EMPIRE_DESIGN_TOKENS.goldLight,
      background: "#000000",
    },
    tailwind: ["text-white", "border-white/20", "text-base", "leading-relaxed"],
  },
};

export const PINK_OVERRIDE = {
  palette: { primary: "#ec4899", accent: "#f9a8d4", background: "#1a0510" },
  tailwind: ["bg-pink-950/30", "border-pink-500/25", "text-pink-100"],
};
