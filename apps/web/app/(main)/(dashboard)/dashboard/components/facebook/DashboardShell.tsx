import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import TopNav from "./TopNav";
import LeftSidebar from "./LeftSidebar";
import RightSidebar from "./RightSidebar";
import {
  DashboardChatMessage,
  DashboardChatSession,
  DashboardContact,
  DashboardMessageRecord,
  DashboardUserRecord,
  UserLite,
} from "./types";
import NotificationsPanel from "./NotificationsPanel";
import ChatWindow from "./ChatWindow";
import ChatDrawer from "./ChatDrawer";
import { useStateProvider } from "@/context/StateContext";
import { reducerCases } from "@/context/constants";
import IncomingCall from "@/components/common/IncomingCall";
import IncomingVideoCall from "@/components/common/IncomingVideoCall";
import VoiceCall from "@/app/(communication)/chat/components/Call/VoiceCall";
import VideoCall from "@/app/(communication)/chat/components/Call/VideoCall";
import {
  getChatErrorMessage,
  getConnectedUsers,
  getInitialUserMeta,
  getUserById,
  getUserConversation,
  logChatConversationError,
  sendAudioMessage,
  sendImageMessage,
  sendTextMessage,
} from "@/lib/chat/chatApi";
import { useChatSocket } from "@/hooks/useChatSocket";
import { playNotificationSound } from "@/lib/chat/notificationSound";
import type { NumericId } from "@/types/chat";

const DEFAULT_AVATAR = "/avatars/userprofile.png";
const MAX_OPEN_CHATS = 3;

const normalizeName = (user: DashboardUserRecord) => {
  const fullName = [user?.firstname, user?.lastname].filter(Boolean).join(" ").trim();
  if (fullName.length) return fullName;
  if (user?.name) return user.name;
  if (user?.username) return user.username;
  return "Unknown user";
};

const normalizeMessage = (
  message: DashboardMessageRecord
): DashboardChatMessage => ({
  id: Number(message?.id),
  senderId: Number(message?.senderId),
  receiverId:
    message?.receiverId === null || typeof message?.receiverId === "undefined"
      ? null
      : Number(message.receiverId),
  message: String(message?.message ?? ""),
  type: String(message?.type ?? "text"),
  messageStatus: String(message?.messageStatus ?? "sent"),
  createdAt: message?.createdAt
    ? new Date(message.createdAt).toISOString()
    : new Date().toISOString(),
  sender: message?.sender
    ? {
        id: Number(message.sender.id),
        name: message.sender.name,
        profilePicture: message.sender.profilePicture,
      }
    : undefined,
  receiver: message?.receiver
    ? {
        id: Number(message.receiver.id),
        name: message.receiver.name,
        profilePicture: message.receiver.profilePicture,
      }
    : undefined,
});

const mergeMessages = (
  existing: DashboardChatMessage[],
  incoming: DashboardChatMessage[]
) => {
  const messageById = new Map<number, DashboardChatMessage>();
  [...existing, ...incoming].forEach((message) => {
    messageById.set(Number(message.id), message);
  });
  return Array.from(messageById.values()).sort((a, b) => {
    const aTime = new Date(a.createdAt).getTime();
    const bTime = new Date(b.createdAt).getTime();
    return aTime - bTime;
  });
};

const toDashboardContact = (
  raw: DashboardUserRecord,
  onlineUserIds: number[] = []
): DashboardContact => ({
  id: Number(raw.id),
  name: normalizeName(raw),
  firstname: raw.firstname,
  lastname: raw.lastname,
  username: raw.username,
  profilePicture: raw.profilePicture || DEFAULT_AVATAR,
  identifier: "user",
  online: onlineUserIds.includes(Number(raw.id)),
});

const ensureSession = (
  session?: DashboardChatSession
): DashboardChatSession => ({
  messages: session?.messages ?? [],
  isLoading: session?.isLoading ?? false,
  hasLoaded: session?.hasLoaded ?? false,
});

export default function DashboardShell({
  user,
  children,
}: {
  user: UserLite;
  children: React.ReactNode;
}) {
  const [
    {
      userInfo,
      onlineUsers,
      incomingVoiceCall,
      incomingVideoCall,
      videoCall,
      voiceCall,
    },
    dispatch,
  ] = useStateProvider();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [contacts, setContacts] = useState<DashboardContact[]>([]);
  const [isContactsLoading, setIsContactsLoading] = useState(false);
  const [openChatIds, setOpenChatIds] = useState<number[]>([]);
  const [activeMobileChatId, setActiveMobileChatId] = useState<number | null>(
    null
  );
  const [chatSessionsByContactId, setChatSessionsByContactId] = useState<
    Record<number, DashboardChatSession>
  >({});
  const notificationButtonRef = useRef<HTMLButtonElement>(null);
  const normalizedOnlineUsers = useMemo(
    () => (onlineUsers ?? []).map((id) => Number(id)),
    [onlineUsers]
  );

  const contactsRef = useRef<DashboardContact[]>([]);
  const chatSessionsRef = useRef<Record<number, DashboardChatSession>>({});
  const openChatIdsRef = useRef<number[]>([]);

  useEffect(() => {
    contactsRef.current = contacts;
  }, [contacts]);

  useEffect(() => {
    openChatIdsRef.current = openChatIds;
  }, [openChatIds]);

  useEffect(() => {
    chatSessionsRef.current = chatSessionsByContactId;
  }, [chatSessionsByContactId]);

  const upsertContact = useCallback((incomingContact: DashboardContact) => {
    setContacts((previousContacts) => {
      const index = previousContacts.findIndex(
        (contact) => contact.id === incomingContact.id
      );
      if (index === -1) {
        return [...previousContacts, incomingContact];
      }
      const updatedContacts = [...previousContacts];
      updatedContacts[index] = {
        ...updatedContacts[index],
        ...incomingContact,
      };
      return updatedContacts;
    });
  }, []);

  const ensureConversationLoaded = useCallback(
    async (contactId: number) => {
      if (!userInfo?.id || !contactId) return;

      const currentSession = ensureSession(chatSessionsRef.current[contactId]);
      if (currentSession.hasLoaded || currentSession.isLoading) {
        return;
      }

      const loadingSession: DashboardChatSession = {
        ...currentSession,
        isLoading: true,
      };
      chatSessionsRef.current = {
        ...chatSessionsRef.current,
        [contactId]: loadingSession,
      };
      setChatSessionsByContactId((previousSessions) => ({
        ...previousSessions,
        [contactId]: loadingSession,
      }));

      try {
        const messages = await getUserConversation({
          fromUserId: userInfo.id,
          toUserId: contactId,
        });
        const normalizedMessages = messages.map(normalizeMessage);
        setChatSessionsByContactId((previousSessions) => {
          const currentSession = ensureSession(previousSessions[contactId]);
          const nextSession = {
            messages: mergeMessages(currentSession.messages, normalizedMessages),
            isLoading: false,
            hasLoaded: true,
          };
          chatSessionsRef.current = {
            ...chatSessionsRef.current,
            [contactId]: nextSession,
          };
          return {
            ...previousSessions,
            [contactId]: nextSession,
          };
        });
      } catch (error) {
        logChatConversationError("dashboard load conversation", error);
        setChatSessionsByContactId((previousSessions) => {
          const currentSession = ensureSession(previousSessions[contactId]);
          const nextSession = {
            ...currentSession,
            isLoading: false,
            hasLoaded: true,
          };
          chatSessionsRef.current = {
            ...chatSessionsRef.current,
            [contactId]: nextSession,
          };
          return {
            ...previousSessions,
            [contactId]: nextSession,
          };
        });
        toast.error(getChatErrorMessage(error, "Failed to load conversation."));
      }
    },
    [userInfo?.id]
  );

  const openChat = useCallback(
    async (
      contact: DashboardContact,
      options: {
        ensureConversation?: boolean;
      } = { ensureConversation: true }
    ) => {
      upsertContact(contact);
      setActiveMobileChatId(contact.id);
      setOpenChatIds((previousOpenIds) => {
        const withoutCurrent = previousOpenIds.filter((id) => id !== contact.id);
        const ordered = [...withoutCurrent, contact.id];
        return ordered.length > MAX_OPEN_CHATS
          ? ordered.slice(ordered.length - MAX_OPEN_CHATS)
          : ordered;
      });

      if (options.ensureConversation !== false) {
        await ensureConversationLoaded(contact.id);
      }
    },
    [ensureConversationLoaded, upsertContact]
  );

  const appendMessage = useCallback(
    (contactId: number, incomingMessage: DashboardChatMessage) => {
      setChatSessionsByContactId((previousSessions) => {
        const currentSession = ensureSession(previousSessions[contactId]);
        return {
          ...previousSessions,
          [contactId]: {
            messages: mergeMessages(currentSession.messages, [incomingMessage]),
            isLoading: false,
            hasLoaded: currentSession.hasLoaded,
          },
        };
      });
    },
    []
  );

  const handleToggleNotifications = () => {
    setNotificationsOpen((prev) => !prev);
  };

  const handleCloseNotifications = () => {
    setNotificationsOpen(false);
  };

  const handleCloseChat = (contactId: number) => {
    setOpenChatIds((prev) => prev.filter((id) => id !== contactId));
    setActiveMobileChatId((prev) => (prev === contactId ? null : prev));
  };

  const resolveIncomingContact = useCallback(
    async (message: DashboardChatMessage) => {
      const senderId = Number(message.senderId);
      if (!senderId || senderId === Number(userInfo?.id)) return null;

      const existingContact = contactsRef.current.find(
        (contact) => contact.id === senderId
      );
      if (existingContact) return existingContact;

      if (message.sender) {
        const contactFromPayload = toDashboardContact(
          {
            id: message.sender.id,
            name: message.sender.name,
            profilePicture: message.sender.profilePicture,
          },
          normalizedOnlineUsers
        );
        upsertContact(contactFromPayload);
        return contactFromPayload;
      }

      try {
        const fallbackUser = await getUserById(senderId);
        if (!fallbackUser) return null;
        const fallbackContact = toDashboardContact(
          fallbackUser,
          normalizedOnlineUsers
        );
        upsertContact(fallbackContact);
        return fallbackContact;
      } catch {
        return null;
      }
    },
    [normalizedOnlineUsers, upsertContact, userInfo?.id]
  );

  const socket = useChatSocket({
    userId: userInfo?.id,
    onSocketReady: (socketRef) => {
      dispatch({
        type: reducerCases.SET_SOCKET,
        socket: socketRef,
      });
    },
    onOnlineUsers: ({ onlineUsers: socketOnlineUsers }) => {
      dispatch({
        type: reducerCases.SET_ONLINE_USERS,
        onlineUsers: (socketOnlineUsers ?? []).map((id) => Number(id)),
      });
    },
    onPrivateMessageReceived: async ({ message }) => {
      if (!message) return;
      dispatch({
        type: reducerCases.ADD_USER_MESSAGE,
        newMessage: {
          ...message,
        },
      });
      const normalizedMessage = normalizeMessage(message);
      const incomingContact = await resolveIncomingContact(normalizedMessage);
      if (!incomingContact) return;

      if (!openChatIdsRef.current.includes(incomingContact.id)) {
        playNotificationSound();
      }

      appendMessage(incomingContact.id, normalizedMessage);
      await openChat(incomingContact, { ensureConversation: true });
    },
    onMarkReadReceived: ({ id, receiverId }) => {
      if (typeof receiverId === "undefined") return;
      dispatch({
        type: reducerCases.SET_MESSAGES_READ,
        id,
        receiverId,
      });
    },
    onIncomingVoiceCall: ({ from, roomId, callType }) => {
      dispatch({
        type: reducerCases.SET_INCOMING_VOICE_CALL,
        incomingVoiceCall: {
          id: from.id,
          name: from.name,
          profilePicture: from.profilePicture,
          roomId,
          callType,
          type: "in-coming",
        },
      });
    },
    onVoiceCallRejected: () => {
      dispatch({
        type: reducerCases.SET_INCOMING_VOICE_CALL,
        incomingVoiceCall: undefined,
      });
      dispatch({
        type: reducerCases.SET_VOICE_CALL,
        voiceCall: undefined,
      });
    },
    onIncomingVideoCall: ({ from, roomId, callType }) => {
      dispatch({
        type: reducerCases.SET_INCOMING_VIDEO_CALL,
        incomingVideoCall: {
          id: from.id,
          name: from.name,
          profilePicture: from.profilePicture,
          roomId,
          callType,
          type: "in-coming",
        },
      });
    },
    onVideoCallRejected: () => {
      dispatch({
        type: reducerCases.SET_INCOMING_VIDEO_CALL,
        incomingVideoCall: undefined,
      });
      dispatch({
        type: reducerCases.SET_VIDEO_CALL,
        videoCall: undefined,
      });
    },
  });

  const handleSendText = useCallback(
    async (contactId: number, text: string) => {
      if (!userInfo?.id) return;
      const message = await sendTextMessage({
        chatType: "user",
        from: userInfo.id,
        to: contactId,
        message: text,
      });

      if (!message) return;
      const normalizedMessage = normalizeMessage(message);
      appendMessage(contactId, normalizedMessage);
      dispatch({
        type: reducerCases.ADD_USER_MESSAGE,
        newMessage: {
          ...message,
        },
        fromSelf: true,
      });
      socket.current?.emit("send-msg", {
        chatType: "user",
        room: `room-${contactId}`,
        to: contactId,
        from: userInfo.id,
        message,
      });
    },
    [appendMessage, dispatch, socket, userInfo?.id]
  );

  const handleSendImage = useCallback(
    async (contactId: number, file: File) => {
      if (!userInfo?.id) return;
      const message = await sendImageMessage({
        chatType: "user",
        from: userInfo.id,
        to: contactId,
        file,
      });

      if (!message) return;
      const normalizedMessage = normalizeMessage(message);
      appendMessage(contactId, normalizedMessage);
      dispatch({
        type: reducerCases.ADD_USER_MESSAGE,
        newMessage: {
          ...message,
        },
        fromSelf: true,
      });
      socket.current?.emit("send-msg", {
        chatType: "user",
        room: `room-${contactId}`,
        to: contactId,
        from: userInfo.id,
        message,
      });
    },
    [appendMessage, dispatch, socket, userInfo?.id]
  );

  const handleSendAudio = useCallback(
    async (contactId: number, file: File) => {
      if (!userInfo?.id) return;
      const message = await sendAudioMessage({
        chatType: "user",
        from: userInfo.id,
        to: contactId,
        file,
      });

      if (!message) return;
      const normalizedMessage = normalizeMessage(message);
      appendMessage(contactId, normalizedMessage);
      dispatch({
        type: reducerCases.ADD_USER_MESSAGE,
        newMessage: {
          ...message,
        },
        fromSelf: true,
      });
      socket.current?.emit("send-msg", {
        chatType: "user",
        room: `room-${contactId}`,
        to: contactId,
        from: userInfo.id,
        message,
      });
    },
    [appendMessage, dispatch, socket, userInfo?.id]
  );

  const handleStartVoiceCall = useCallback(
    (contact: DashboardContact) => {
      dispatch({
        type: reducerCases.SET_VOICE_CALL,
        voiceCall: {
          id: contact.id,
          name: contact.name,
          profilePicture: contact.profilePicture,
          type: "out-going",
          callType: "audio",
          roomId: Date.now(),
        },
      });
    },
    [dispatch]
  );

  const handleStartVideoCall = useCallback(
    (contact: DashboardContact) => {
      dispatch({
        type: reducerCases.SET_VIDEO_CALL,
        videoCall: {
          id: contact.id,
          name: contact.name,
          profilePicture: contact.profilePicture,
          type: "out-going",
          callType: "video",
          roomId: Date.now(),
        },
      });
    },
    [dispatch]
  );

  useEffect(() => {
    const loadContacts = async () => {
      if (!userInfo?.id) return;
      try {
        setIsContactsLoading(true);
        const [followedUsers, initialUserMeta] = await Promise.all([
          getConnectedUsers(userInfo.id),
          getInitialUserMeta(userInfo.id),
        ]);

        const parsedOnlineUsers = (initialUserMeta.onlineUsers ?? []).map(
          (id) => Number(id)
        );

        dispatch({
          type: reducerCases.SET_ONLINE_USERS,
          onlineUsers: parsedOnlineUsers,
        });

        const normalizedContacts = followedUsers
          .filter(
            (contact): contact is DashboardUserRecord =>
              (contact?.identifier || "user") === "user"
          )
          .map((contact) => toDashboardContact(contact, parsedOnlineUsers));

        setContacts(normalizedContacts);
      } catch (error) {
        toast.error(getChatErrorMessage(error, "Failed to load contacts."));
      } finally {
        setIsContactsLoading(false);
      }
    };

    loadContacts();
  }, [dispatch, userInfo?.id]);

  const notificationsPanel = notificationsOpen ? (
    <NotificationsPanel
      onClose={handleCloseNotifications}
      triggerRef={notificationButtonRef}
    />
  ) : null;

  const contactsById = useMemo(() => {
    return contacts.reduce<Record<number, DashboardContact>>((acc, contact) => {
      acc[contact.id] = {
        ...contact,
        online: normalizedOnlineUsers.includes(contact.id),
      };
      return acc;
    }, {});
  }, [contacts, normalizedOnlineUsers]);

  const rightSidebarContacts = useMemo(
    () =>
      contacts.map((contact) => ({
        ...contact,
        online: normalizedOnlineUsers.includes(contact.id),
      })),
    [contacts, normalizedOnlineUsers]
  );

  const mobileContact = activeMobileChatId
    ? contactsById[activeMobileChatId]
    : null;
  const mobileSession = mobileContact
    ? ensureSession(chatSessionsByContactId[mobileContact.id])
    : null;

  return (
    <>
      {incomingVoiceCall ? <IncomingCall /> : null}
      {incomingVideoCall ? <IncomingVideoCall /> : null}
      {videoCall ? (
        <div className="h-screen w-screen max-h-full max-w-full overflow-hidden">
          <VideoCall />
        </div>
      ) : null}
      {voiceCall ? (
        <div className="h-screen w-screen max-h-full max-w-full overflow-hidden">
          <VoiceCall />
        </div>
      ) : null}

      {!videoCall && !voiceCall ? (
        <div className="min-h-screen bg-[var(--fb-bg)] text-[var(--fb-text)]">
          <TopNav
            user={user}
            onToggleNotifications={handleToggleNotifications}
            notificationsOpen={notificationsOpen}
            notificationButtonRef={notificationButtonRef}
            notificationsPanel={notificationsPanel}
          />
          <div className="mx-auto max-w-[1280px] px-3 sm:px-4 lg:px-6">
            <div className="grid grid-cols-1 gap-6 py-6 lg:grid-cols-[280px_minmax(0,1fr)_280px]">
              <aside className="custom-scrollbar sticky top-[76px] hidden h-[calc(100vh-96px)] overflow-y-auto lg:block">
                <LeftSidebar user={user} />
              </aside>
              <main className="min-w-0">{children}</main>
              <aside className="custom-scrollbar sticky top-[76px] hidden h-[calc(100vh-96px)] overflow-y-auto lg:block">
                <RightSidebar
                  contacts={rightSidebarContacts}
                  isLoading={isContactsLoading}
                  onContactClick={(contact) =>
                    openChat(contact, { ensureConversation: true })
                  }
                />
              </aside>
            </div>
          </div>

          {openChatIds.map((contactId, index) => {
            const contact = contactsById[contactId];
            if (!contact) return null;
            const session = ensureSession(chatSessionsByContactId[contact.id]);
            return (
              <ChatWindow
                key={contact.id}
                contact={contact}
                messages={session.messages}
                isLoading={session.isLoading}
                onClose={handleCloseChat}
                offsetIndex={index}
                onSendText={handleSendText}
                onSendImage={handleSendImage}
                onSendAudio={handleSendAudio}
                onStartVoiceCall={handleStartVoiceCall}
                onStartVideoCall={handleStartVideoCall}
              />
            );
          })}

          {mobileContact && mobileSession ? (
            <ChatDrawer
              contact={mobileContact}
              messages={mobileSession.messages}
              isLoading={mobileSession.isLoading}
              onClose={handleCloseChat}
              onSendText={handleSendText}
              onSendImage={handleSendImage}
              onSendAudio={handleSendAudio}
              onStartVoiceCall={handleStartVoiceCall}
              onStartVideoCall={handleStartVideoCall}
            />
          ) : null}
        </div>
      ) : null}
    </>
  );
}
