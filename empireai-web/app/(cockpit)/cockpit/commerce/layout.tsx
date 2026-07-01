import { CockpitDepartmentLayout } from "@/components/cockpit/layout/CockpitDepartmentLayout";

export default function CommerceDepartmentLayout({
  children,
}: LayoutProps<"/">) {
  return (
    <CockpitDepartmentLayout
      departmentNavId="commerce"
      description="Manufacture, launch, market, and operate portfolio companies."
      dataMode="demo"
    >
      {children}
    </CockpitDepartmentLayout>
  );
}
