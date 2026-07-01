import { CockpitDepartmentLayout } from "@/components/cockpit/layout/CockpitDepartmentLayout";

export default function DevelopmentDepartmentLayout({
  children,
}: LayoutProps<"/">) {
  return (
    <CockpitDepartmentLayout
      departmentNavId="development"
      description="Pillow companion, approvals, ESIS inspection, and executive learning."
      dataMode="demo"
    >
      {children}
    </CockpitDepartmentLayout>
  );
}
