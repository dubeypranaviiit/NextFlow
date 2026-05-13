import { WorkflowDetailPage } from "@/features/workflow/workflow-detail-page";

export default async function WorkflowRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <WorkflowDetailPage workflowId={id} />;
}
