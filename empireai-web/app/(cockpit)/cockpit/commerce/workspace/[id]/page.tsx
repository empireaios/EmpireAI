import { CommerceWorkspaceDetailPanel } from "@/components/cockpit/widgets/CommerceWorkspaceDetailPanel";

type CommerceWorkspaceDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function CommerceWorkspaceDetailPage({
  params,
}: CommerceWorkspaceDetailPageProps) {
  const { id } = await params;
  return <CommerceWorkspaceDetailPanel companyId={id} />;
}
