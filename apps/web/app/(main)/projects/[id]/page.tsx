import { ProjectDetailContent } from "@/features/learning";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ProjectDetailContent id={id} />;
}
