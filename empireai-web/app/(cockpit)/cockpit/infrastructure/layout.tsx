import { CockpitDepartmentLayout } from "@/components/cockpit/layout/CockpitDepartmentLayout";

export default function InfrastructureDepartmentLayout({
  children,
}: LayoutProps<"/">) {
  return (
    <CockpitDepartmentLayout
      departmentNavId="infrastructure"
      description="Integrations, deployments, platform health, and admin console."
      dataMode="demo"
    >
      {children}
    </CockpitDepartmentLayout>
  );
}
