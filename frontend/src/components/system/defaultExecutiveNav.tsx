import {
  Crown,
  DollarSign,
  FileBarChart,
  Home,
  MessagesSquare,
  Plug,
  Search,
  Settings,
  Store,
  Target,
  Truck,
} from "lucide-react";
import { paths } from "@/routes/paths";
import type { ExecutiveNavItem } from "./ExecutiveSidebar";

/**
 * Convenience default navigation for the executive shell (UX-001A).
 * Consumers may extend/override freely — the sidebar is data-driven, so adding
 * countries, brands, or future surfaces never requires a redesign.
 *
 * Surfaces without a dedicated V1 route point at the closest existing screen
 * (per UX_IMPLEMENTATION_CONTRACT.md) until their own screens ship.
 */
export const defaultExecutiveNav: ExecutiveNavItem[] = [
  { id: "home", label: "Mission Home", to: paths.dashboard.home, end: true, section: "Command", icon: <Home size={18} /> },
  { id: "success001", label: "SUCCESS-001", to: paths.dashboard.success001, section: "Command", icon: <Target size={18} /> },
  { id: "debate", label: "Executive Debate", to: paths.dashboard.debate, section: "Command", icon: <MessagesSquare size={18} /> },
  { id: "discovery", label: "Product Discovery", to: paths.dashboard.intelligence, section: "Workspaces", icon: <Search size={18} /> },
  { id: "suppliers", label: "Supplier Intelligence", to: paths.dashboard.infrastructureSuppliers, section: "Workspaces", icon: <Truck size={18} /> },
  { id: "marketplaces", label: "Marketplace Intelligence", to: paths.dashboard.infrastructureMarketplaces, section: "Workspaces", icon: <Store size={18} /> },
  { id: "reports", label: "Reports", to: paths.dashboard.reports, section: "System", icon: <FileBarChart size={18} /> },
  { id: "operating-cost", label: "Profit & Operating Cost", to: paths.dashboard.operatingCost, section: "System", icon: <DollarSign size={18} /> },
  { id: "integrations", label: "Integrations Hub", to: paths.dashboard.integrations, section: "System", icon: <Plug size={18} /> },
  { id: "settings", label: "Settings", to: paths.dashboard.settings, section: "System", icon: <Settings size={18} /> },
];

/** Brand lockup icon for reuse in the sidebar/header. */
export const EMPIRE_BRAND_ICON = <Crown size={18} strokeWidth={2.5} />;
