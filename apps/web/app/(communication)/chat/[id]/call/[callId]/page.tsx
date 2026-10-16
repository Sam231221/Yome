import { DirectCallRouteClient } from "@/features/chat/direct-call/DirectCallRouteClient";

export default async function DirectConversationCallPage({
  params,
}: {
  params: Promise<{ id: string; callId: string }>;
}) {
  const { id, callId } = await params;

  return <DirectCallRouteClient conversationId={id} callId={callId} />;
}
