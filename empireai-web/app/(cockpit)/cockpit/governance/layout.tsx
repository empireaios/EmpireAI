import { CockpitDepartmentLayout } from "@/components/cockpit/layout/CockpitDepartmentLayout";

export default function GovernanceDepartmentLayout({
  children,
}: LayoutProps<"/">) {
  return (
    <CockpitDepartmentLayout
      departmentNavId="governance"
      description="Settings, soul chamber, decision history, council, and V1 certification."
      dataMode="demo"
    >
      {children}
    </CockpitDepartmentLayout>
  );
}
