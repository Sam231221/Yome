import StreamVideoProvider from "@/providers/StreamClientProvider";
import { DirectCallRouteClient } from "@/features/chat/direct-call/DirectCallRouteClient";

export default async function DirectConversationCallPage({
  params,
}: {
  params: Promise<{ id: string; callId: string }>;
}) {
  const { id, callId } = await params;

  return (
    <StreamVideoProvider blocking>
      <DirectCallRouteClient conversationId={id} callId={callId} />
    </StreamVideoProvider>
  );
}
