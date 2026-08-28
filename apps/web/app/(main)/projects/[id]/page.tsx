import { ProjectDetailContent } from "@/components/yome/YomeCollectionPages";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ProjectDetailContent id={id} />;
}
