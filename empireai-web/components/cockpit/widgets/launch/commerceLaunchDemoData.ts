export type LaunchWorkflowStatus = "complete" | "in_progress" | "pending" | "blocked";

export type LaunchWorkflowStep = {
  id: string;
  label: string;
  description: string;
  status: LaunchWorkflowStatus;
  progress: number;
};

export type PublicationStageStatus =
  | "draft"
  | "review"
  | "ready"
  | "published"
  | "blocked";

export type PublicationPipelineRow = {
  productId: string;
  productName: string;
  company: string;
  stage: string;
  status: PublicationStageStatus;
  confidence: number;
  updatedAt: string;
};

export type DeploymentChecklistStatus = "ready" | "pending" | "blocked";

export type DeploymentChecklistItem = {
  itemId: string;
  label: string;
  category: string;
  status: DeploymentChecklistStatus;
  note: string;
};

export const COMMERCE_LAUNCH_FOCUS = {
  company: "Nova Home",
  product: "Ambient Lamp Pro",
  readinessScore: 68,
  agent: "Jordan · Launch Commander · demo presentation mode",
} as const;

export const COMMERCE_LAUNCH_WORKFLOW: LaunchWorkflowStep[] = [
  {
    id: "discovery",
    label: "Discovery",
    description: "Catalog scan and opportunity shortlist validated.",
    status: "complete",
    progress: 100,
  },
  {
    id: "preview",
    label: "Preview",
    description: "Storefront preview and listing draft reviewed.",
    status: "complete",
    progress: 100,
  },
  {
    id: "build",
    label: "Build",
    description: "Brand, offer, and store package manufactured.",
    status: "in_progress",
    progress: 72,
  },
  {
    id: "readiness",
    label: "Readiness",
    description: "Governance gates and launch simulation pending.",
    status: "in_progress",
    progress: 45,
  },
  {
    id: "publication",
    label: "Publication",
    description: "Listing packages prepared — live publish blocked in demo.",
    status: "pending",
    progress: 20,
  },
  {
    id: "deploy",
    label: "Deploy",
    description: "Preview deployment target queued after readiness clear.",
    status: "pending",
    progress: 0,
  },
];

export const COMMERCE_LAUNCH_PUBLICATION_PIPELINE: PublicationPipelineRow[] = [
  {
    productId: "pub-001",
    productName: "Ambient Lamp Pro",
    company: "Nova Home",
    stage: "Readiness review",
    status: "review",
    confidence: 78,
    updatedAt: "2026-06-21",
  },
  {
    productId: "pub-002",
    productName: "Modular Shelf System",
    company: "Nova Home",
    stage: "Listing draft",
    status: "draft",
    confidence: 65,
    updatedAt: "2026-06-20",
  },
  {
    productId: "pub-003",
    productName: "Linen Throw Set",
    company: "Nova Home",
    stage: "Publication package",
    status: "ready",
    confidence: 82,
    updatedAt: "2026-06-19",
  },
  {
    productId: "pub-004",
    productName: "Starter Home Bundle",
    company: "Nova Home",
    stage: "Preview deploy",
    status: "published",
    confidence: 91,
    updatedAt: "2026-06-18",
  },
];

export const COMMERCE_LAUNCH_DEPLOYMENT_CHECKLIST: DeploymentChecklistItem[] = [
  {
    itemId: "chk-brand",
    label: "Brand package complete",
    category: "Build",
    status: "ready",
    note: "Nova Home brand system manufactured at 82% confidence.",
  },
  {
    itemId: "chk-store",
    label: "Storefront preview verified",
    category: "Preview",
    status: "ready",
    note: "HOME, COLLECTION, and PRODUCT routes render in demo viewer.",
  },
  {
    itemId: "chk-listings",
    label: "Listing drafts approved",
    category: "Publication",
    status: "pending",
    note: "2 of 4 SKUs awaiting executive review.",
  },
  {
    itemId: "chk-governance",
    label: "Launch governance gate",
    category: "Readiness",
    status: "pending",
    note: "Grand King go-live checklist not wired in demo mode.",
  },
  {
    itemId: "chk-payments",
    label: "Payment connector configured",
    category: "Infrastructure",
    status: "blocked",
    note: "Stripe live path disabled — presentation only.",
  },
  {
    itemId: "chk-deploy",
    label: "Preview deployment slot",
    category: "Deploy",
    status: "pending",
    note: "Vercel preview target reserved after readiness clears.",
  },
];
