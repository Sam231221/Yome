"use client";

import ChatLeftBar from "@/features/chat/components/ChatLeftBar";
import ChatRightBar from "@/features/chat/components/ChatRightBar";
import { YomeAppShellContainer } from "@/components/layout";
import { useChatPageController } from "@/features/chat/hooks/useChatPageController";

export function ChatScreen() {
  const { currentChatUser, isUserLoading } = useChatPageController();

  return (
    <YomeAppShellContainer>
      <section className="messages-board">
        <div className="messages-page flex-1 min-h-0 min-w-0">
          <div
            className={`chat-inbox-pane h-full overflow-hidden ${
              currentChatUser ? "has-active-chat" : ""
            }`}
          >
            <ChatLeftBar isUserLoading={isUserLoading} />
          </div>
          <div
            className={`chat-conversation-pane h-full overflow-hidden ${
              currentChatUser ? "has-active-chat" : ""
            }`}
          >
            <ChatRightBar />
          </div>
        </div>
      </section>
    </YomeAppShellContainer>
  );
}
