import { CockpitDepartmentLayout } from "@/components/cockpit/layout/CockpitDepartmentLayout";

export default function OperationsDepartmentLayout({
  children,
}: LayoutProps<"/">) {
  return (
    <CockpitDepartmentLayout
      departmentNavId="operations"
      description="Order queue, fulfillment readiness, and customer support operations."
      dataMode="sandbox"
    >
      {children}
    </CockpitDepartmentLayout>
  );
}
