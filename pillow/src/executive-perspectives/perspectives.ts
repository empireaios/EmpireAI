import type { ExecutivePerspective, PerspectiveId } from "./types.js";



/** Seven permanent Executive Perspectives — reasoning disciplines used internally by Pillow. */

export const EXECUTIVE_PERSPECTIVES: ExecutivePerspective[] = [

  {

    id: "FINANCIAL",

    title: "Financial Perspective",

    focus: ["ROI", "Profit", "Cost", "Capital efficiency", "Engineering investment"],

  },

  {

    id: "TECHNOLOGY",

    title: "Technology Perspective",

    focus: ["Architecture", "Maintainability", "Scalability", "Technical debt"],

  },

  {

    id: "OPERATIONS",

    title: "Operations Perspective",

    focus: ["Execution", "Workflow", "Delivery", "Operational efficiency"],

  },

  {

    id: "RISK",

    title: "Risk Perspective",

    focus: ["Business risk", "Repository risk", "Security", "Recovery", "Compliance"],

  },

  {

    id: "COMMERCIAL",

    title: "Commercial Perspective",

    focus: ["Customers", "Suppliers", "Marketplace", "Revenue", "Conversion", "Retention"],

  },

  {

    id: "REPOSITORY",

    title: "Repository Perspective",

    focus: [

      "Repository integrity",

      "Journey",

      "Architecture consistency",

      "Documentation consistency",

    ],

  },

  {

    id: "STRATEGY",

    title: "Strategy Perspective",

    focus: ["Long-term direction", "Objective sequencing", "Trade-offs", "Future impact"],

  },

];



export const DEBATE_PERSPECTIVES = [...EXECUTIVE_PERSPECTIVES];



export const SUBJECT_RELEVANCE: Record<string, Partial<Record<PerspectiveId, number>>> = {

  general: {

    FINANCIAL: 0.8,

    OPERATIONS: 0.7,

    STRATEGY: 0.85,

    RISK: 0.75,

    REPOSITORY: 0.6,

    TECHNOLOGY: 0.65,

    COMMERCIAL: 0.7,

  },

  engineering: {

    TECHNOLOGY: 1,

    REPOSITORY: 0.95,

    OPERATIONS: 0.85,

    FINANCIAL: 0.7,

    RISK: 0.8,

    STRATEGY: 0.6,

    COMMERCIAL: 0.4,

  },

  commercial: {

    COMMERCIAL: 1,

    FINANCIAL: 0.9,

    STRATEGY: 0.85,

    OPERATIONS: 0.7,

    RISK: 0.75,

    TECHNOLOGY: 0.5,

    REPOSITORY: 0.5,

  },

  repository: {

    REPOSITORY: 1,

    TECHNOLOGY: 0.85,

    OPERATIONS: 0.7,

    STRATEGY: 0.75,

    RISK: 0.8,

    FINANCIAL: 0.55,

    COMMERCIAL: 0.4,

  },

  strategy: {

    STRATEGY: 1,

    FINANCIAL: 0.85,

    COMMERCIAL: 0.8,

    OPERATIONS: 0.75,

    RISK: 0.7,

    TECHNOLOGY: 0.65,

    REPOSITORY: 0.7,

  },

};


