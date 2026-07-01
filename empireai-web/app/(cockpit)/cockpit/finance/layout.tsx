import { CockpitDepartmentLayout } from "@/components/cockpit/layout/CockpitDepartmentLayout";

export default function FinanceDepartmentLayout({
  children,
}: LayoutProps<"/">) {
  return (
    <CockpitDepartmentLayout
      departmentNavId="finance"
      description="Profit, P&L, billing, and operating cost visibility for the portfolio."
      dataMode="demo"
    >
      {children}
    </CockpitDepartmentLayout>
  );
}
