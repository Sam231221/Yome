import { GroupDetailContent } from "@/components/yome/YomeCollectionPages";

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <GroupDetailContent id={id} />;
}
