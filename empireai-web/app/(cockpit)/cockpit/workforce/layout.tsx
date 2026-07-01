import { CockpitDepartmentLayout } from "@/components/cockpit/layout/CockpitDepartmentLayout";

export default function WorkforceDepartmentLayout({
  children,
}: LayoutProps<"/">) {
  return (
    <CockpitDepartmentLayout
      departmentNavId="workforce"
      description="AI agent roster, mission queue, activity feed, and audit log."
      dataMode="demo"
    >
      {children}
    </CockpitDepartmentLayout>
  );
}
