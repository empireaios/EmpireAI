export const navLinks = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Categories", href: "#categories" },
  { label: "Pricing", href: "#pricing" },
  { label: "Stories", href: "#testimonials" },
  { label: "FAQ", href: "#faq" },
] as const;

export const features = [
  {
    title: "Company Manufacturing Engine",
    description:
      "Spin up fully structured ventures—brand, product, ops, and go-to-market—in hours, not quarters.",
    metric: "12× faster launch",
  },
  {
    title: "Autonomous AI Workforce",
    description:
      "Specialized agents for strategy, product, growth, finance, and support execute in parallel around the clock.",
    metric: "24/7 execution",
  },
  {
    title: "Intelligence Layer",
    description:
      "Real-time market signals, demand forecasting, and competitive intelligence feed every decision automatically.",
    metric: "Live market sync",
  },
  {
    title: "Capital Efficiency",
    description:
      "Deploy lean. Scale only what converts. EmpireAI optimizes burn while compounding revenue velocity.",
    metric: "40% lower CAC",
  },
  {
    title: "Global Infrastructure",
    description:
      "Payments, compliance, logistics, and localization built in—your empire expands across borders without friction.",
    metric: "180+ markets",
  },
  {
    title: "Founder Command Center",
    description:
      "One sovereign dashboard for portfolio performance, agent activity, and strategic overrides when you choose.",
    metric: "Single pane of glass",
  },
] as const;

export const steps = [
  {
    step: "01",
    title: "Define your vision",
    description:
      "Tell EmpireAI your thesis—category, audience, margin profile, and ambition. The OS translates intent into architecture.",
  },
  {
    step: "02",
    title: "AI architects the company",
    description:
      "Brand identity, product catalog, pricing, supply chain, and growth loops are generated, validated, and wired together.",
  },
  {
    step: "03",
    title: "Agents execute continuously",
    description:
      "Your AI team launches campaigns, fulfills orders, optimizes ads, and iterates product—without waiting on headcount.",
  },
  {
    step: "04",
    title: "Scale and compound",
    description:
      "Clone winners, kill underperformers, and reinvest profits. EmpireAI manufactures your next company while you lead.",
  },
] as const;

export const categories = [
  {
    name: "Commerce",
    description: "DTC, dropshipping, and marketplace brands with automated sourcing and fulfillment.",
    stats: "$2.4M avg. GMV",
  },
  {
    name: "SaaS",
    description: "Micro-SaaS and vertical software with AI-built onboarding, billing, and retention loops.",
    stats: "18-day MVP",
  },
  {
    name: "Media & Content",
    description: "Newsletters, channels, and digital products monetized through intelligent audience growth.",
    stats: "890K subs deployed",
  },
  {
    name: "Services",
    description: "Agencies and consultancies productized with AI delivery, proposals, and client success.",
    stats: "72% margin avg.",
  },
  {
    name: "Fintech",
    description: "Niche financial products with compliance-aware architecture and risk monitoring.",
    stats: "SOC-ready stack",
  },
  {
    name: "Health & Wellness",
    description: "Supplements, programs, and wellness brands with regulatory-aware go-to-market.",
    stats: "FDA-aware flows",
  },
] as const;

export const plans = [
  {
    name: "Founder",
    price: "$499",
    period: "/month",
    description: "Launch your first AI-manufactured company with core agents and one active venture.",
    features: [
      "1 active company",
      "6 core AI agents",
      "Brand & store generation",
      "Basic analytics",
      "Email support",
    ],
    cta: "Start Building",
    highlighted: false,
  },
  {
    name: "Empire",
    price: "$1,499",
    period: "/month",
    description: "For operators running multiple ventures with advanced intelligence and priority execution.",
    features: [
      "5 active companies",
      "Full agent suite (18+)",
      "Market intelligence layer",
      "Advanced ad automation",
      "Priority orchestration",
      "Dedicated success lead",
    ],
    cta: "Launch Empire",
    highlighted: true,
  },
  {
    name: "Sovereign",
    price: "Custom",
    period: "",
    description: "Portfolio-scale infrastructure for funds, holding companies, and enterprise innovation teams.",
    features: [
      "Unlimited companies",
      "Custom agent training",
      "Private model routing",
      "White-label command center",
      "SLA & compliance package",
      "On-premise options",
    ],
    cta: "Contact Sales",
    highlighted: false,
  },
] as const;

export const testimonials = [
  {
    quote:
      "EmpireAI didn't just automate my store—it manufactured an entire operating company. I went from idea to seven figures in ninety days.",
    name: "Alexandra Chen",
    role: "Founder, Meridian Commerce",
    metric: "$1.2M ARR",
  },
  {
    quote:
      "We replaced a twelve-person growth team with EmpireAI agents. Same output, fraction of the burn, and we launch a new vertical every month.",
    name: "Marcus Okonkwo",
    role: "CEO, Vertex Holdings",
    metric: "4 ventures live",
  },
  {
    quote:
      "The intelligence layer alone is worth it. EmpireAI sees demand shifts before our competitors and repositioned our catalog overnight.",
    name: "Sofia Alvarez",
    role: "Managing Partner, Lumen Capital",
    metric: "38% margin lift",
  },
] as const;

export const faqs = [
  {
    question: "What does EmpireAI actually manufacture?",
    answer:
      "EmpireAI manufactures complete companies—brand, digital presence, product strategy, operations, marketing, and ongoing optimization—powered by coordinated AI agents under a unified operating system.",
  },
  {
    question: "Do I need a technical team to use EmpireAI?",
    answer:
      "No. EmpireAI is built for founders and operators. You set strategy and approve key decisions; the OS and agents handle execution across product, growth, and operations.",
  },
  {
    question: "How is this different from ChatGPT or other AI tools?",
    answer:
      "ChatGPT assists. EmpireAI operates. It's an end-to-end company manufacturing system with persistent agents, integrated infrastructure, live market intelligence, and a command center—not a chat interface.",
  },
  {
    question: "Can I run multiple businesses at once?",
    answer:
      "Yes. Empire and Sovereign plans support multiple concurrent ventures, each with dedicated agent teams and portfolio-level analytics in your command center.",
  },
  {
    question: "Who owns the companies EmpireAI creates?",
    answer:
      "You do. EmpireAI is infrastructure—you retain full ownership of brands, assets, revenue, and intellectual property generated through the platform.",
  },
  {
    question: "Is my data secure?",
    answer:
      "Enterprise-grade encryption, isolated tenant environments, and compliance-ready architecture. Sovereign clients can access private model routing and on-premise deployment options.",
  },
] as const;

export const footerLinks = {
  product: [
    { label: "Features", href: "#features" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Pricing", href: "#pricing" },
    { label: "Categories", href: "#categories" },
  ],
  company: [
    { label: "About", href: "#" },
    { label: "Careers", href: "#" },
    { label: "Press", href: "#" },
    { label: "Contact", href: "#" },
  ],
  legal: [
    { label: "Privacy", href: "#" },
    { label: "Terms", href: "#" },
    { label: "Security", href: "#" },
  ],
} as const;
