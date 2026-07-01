import { CockpitDepartmentLayout } from "@/components/cockpit/layout/CockpitDepartmentLayout";

export default function IntelligenceDepartmentLayout({
  children,
}: LayoutProps<"/">) {
  return (
    <CockpitDepartmentLayout
      departmentNavId="intelligence"
      description="Product intelligence, supplier evaluation, discovery, and marketplace signals."
      dataMode="demo"
    >
      {children}
    </CockpitDepartmentLayout>
  );
}
