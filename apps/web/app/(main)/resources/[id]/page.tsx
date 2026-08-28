import { ResourceDetailContent } from "@/components/yome/YomeCollectionPages";

export default async function ResourceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ResourceDetailContent id={id} />;
}
