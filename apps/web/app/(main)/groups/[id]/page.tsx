import { GroupDetailContent } from "@/features/learning";

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <GroupDetailContent id={id} />;
}
