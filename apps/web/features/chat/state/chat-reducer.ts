import type {
  ChatListItem,
  ChatKind,
  ChatMessage,
  ChatSocketRef,
  GroupId,
  UserId,
} from "@/types/chat-contracts";
import { resolveChatKind } from "@/types/chat-contracts";

export const chatReducerCases = {
  SET_SOCKET: "SET_SOCKET",
  SET_USER_CONTACTS: "SET_USER_CONTACTS",
  SET_GROUP_CONTACTS: "SET_GROUP_CONTACTS",
  SET_ONLINE_USERS: "SET_ONLINE_USERS",
  CHANGE_CURRENT_CHAT_USER: "CHANGE_CURRENT_CHAT_USER",
  CHANGE_CURRENT_GROUP: "CHANGE_CURRENT_GROUP",
  SET_MESSAGES: "SET_MESSAGES",
  ADD_USER_MESSAGE: "ADD_USER_MESSAGE",
  ADD_GROUP_MESSAGE: "ADD_GROUP_MESSAGE",
  SET_MESSAGES_READ: "SET_MESSAGES_READ",
  SET_ALL_CONTACTS_PAGE: "SET_ALL_CONTACTS_PAGE",
  SET_MESSAGES_SEARCH: "SET_MESSAGES_SEARCH",
  SET_CONTACT_SEARCH: "SET_CONTACT_SEARCH",
  SET_EXIT_CHAT: "SET_EXIT_CHAT",
} as const;

export interface ChatState {
  currentChatUser: ChatListItem | undefined;
  currentChatGroup: ChatListItem | undefined;
  socket: ChatSocketRef | undefined;
  messages: ChatMessage[];
  groupMessages: ChatMessage[];
  userContacts: ChatListItem[];
  groupContacts: ChatListItem[];
  onlineUsers: UserId[];
  contactSearch: string;
  filteredContacts: ChatListItem[];
  messageSearch: boolean;
  contactsPage: boolean;
}

type IncomingChatMessage = ChatMessage & { groupId?: GroupId | null };

type SetSocketAction = {
  type: typeof chatReducerCases.SET_SOCKET;
  socket: ChatSocketRef | undefined;
};

type SetUserContactsAction = {
  type: typeof chatReducerCases.SET_USER_CONTACTS;
  userContacts: ChatListItem[];
};

type SetGroupContactsAction = {
  type: typeof chatReducerCases.SET_GROUP_CONTACTS;
  groupContacts: ChatListItem[];
};

type SetOnlineUsersAction = {
  type: typeof chatReducerCases.SET_ONLINE_USERS;
  onlineUsers: UserId[];
};

type ChangeCurrentChatUserAction = {
  type: typeof chatReducerCases.CHANGE_CURRENT_CHAT_USER;
  user: ChatListItem;
  currentUserId?: number;
};

type ChangeCurrentGroupAction = {
  type: typeof chatReducerCases.CHANGE_CURRENT_GROUP;
  group: ChatListItem;
};

type SetMessagesAction = {
  type: typeof chatReducerCases.SET_MESSAGES;
  messages: ChatMessage[];
};

type AddUserMessageAction = {
  type: typeof chatReducerCases.ADD_USER_MESSAGE;
  newMessage: IncomingChatMessage;
  fromSelf?: boolean;
  currentUserId?: number;
};

type AddGroupMessageAction = {
  type: typeof chatReducerCases.ADD_GROUP_MESSAGE;
  newMessage: IncomingChatMessage;
  groupId?: GroupId;
  fromSelf?: boolean;
};

type SetMessagesReadAction = {
  type: typeof chatReducerCases.SET_MESSAGES_READ;
  id: UserId;
  receiverId?: UserId;
};

type ToggleAllContactsPageAction = {
  type: typeof chatReducerCases.SET_ALL_CONTACTS_PAGE;
};

type ToggleMessagesSearchAction = {
  type: typeof chatReducerCases.SET_MESSAGES_SEARCH;
};

type SetContactSearchAction = {
  type: typeof chatReducerCases.SET_CONTACT_SEARCH;
  contactSearch: string;
};

type ExitChatAction = {
  type: typeof chatReducerCases.SET_EXIT_CHAT;
};

export type ChatAction =
  | SetSocketAction
  | SetUserContactsAction
  | SetGroupContactsAction
  | SetOnlineUsersAction
  | ChangeCurrentChatUserAction
  | ChangeCurrentGroupAction
  | SetMessagesAction
  | AddUserMessageAction
  | AddGroupMessageAction
  | SetMessagesReadAction
  | ToggleAllContactsPageAction
  | ToggleMessagesSearchAction
  | SetContactSearchAction
  | ExitChatAction;

type ContactMessageSnapshot = Pick<
  ChatListItem,
  | "message"
  | "type"
  | "messageId"
  | "messageStatus"
  | "receiverId"
  | "senderId"
  | "createdAt"
  | "totalUnreadMessages"
>;

const buildCurrentChatSelection = (
  current: ChatListItem,
  chatKind: ChatKind
): ChatListItem => ({
  ...current,
  chatType: chatKind,
  identifier: current.identifier || chatKind,
});

const applyMessageSnapshotToContact = (
  contact: ChatListItem,
  snapshot: ContactMessageSnapshot
): ChatListItem => ({
  ...contact,
  ...snapshot,
});

const buildContactSnapshotFromMessage = (
  message: ChatMessage,
  totalUnreadMessages = 0
): ContactMessageSnapshot => ({
  message: message.message,
  type: message.type,
  messageId: message.id,
  messageStatus: message.messageStatus,
  receiverId: message.receiverId,
  senderId: message.senderId,
  createdAt: message.createdAt,
  totalUnreadMessages,
});

export const initialChatState: ChatState = {
  currentChatUser: undefined,
  currentChatGroup: undefined,
  socket: undefined,
  messages: [],
  groupMessages: [],
  userContacts: [],
  groupContacts: [],
  onlineUsers: [],
  contactSearch: "",
  filteredContacts: [],
  messageSearch: false,
  contactsPage: false,
};

const chatReducer = (state: ChatState, action: ChatAction): ChatState => {
  switch (action.type) {
    case chatReducerCases.SET_SOCKET:
      return {
        ...state,
        socket: action.socket,
      };

    case chatReducerCases.SET_USER_CONTACTS:
      return {
        ...state,
        userContacts: action.userContacts ?? [],
      };

    case chatReducerCases.SET_GROUP_CONTACTS:
      return {
        ...state,
        groupContacts: action.groupContacts,
      };

    case chatReducerCases.SET_ONLINE_USERS:
      return {
        ...state,
        onlineUsers: action.onlineUsers ?? [],
      };

    case chatReducerCases.SET_ALL_CONTACTS_PAGE:
      return {
        ...state,
        contactsPage: !state.contactsPage,
      };

    case chatReducerCases.SET_MESSAGES_SEARCH:
      return {
        ...state,
        messageSearch: !state.messageSearch,
      };

    case chatReducerCases.CHANGE_CURRENT_GROUP: {
      if (state.contactsPage) {
        return {
          ...state,
          currentChatGroup: action.group,
          messages: [],
        };
      }
      return {
        ...state,
        currentChatGroup: action.group,
        messageSearch: false,
        messages: [],
      };
    }

    case chatReducerCases.CHANGE_CURRENT_CHAT_USER: {
      const currentUser = buildCurrentChatSelection(
        action.user,
        resolveChatKind(action.user)
      );
      if (state.contactsPage) {
        return {
          ...state,
          currentChatUser: currentUser,
          messages: [],
        };
      }
      if (resolveChatKind(currentUser) === "user") {
        if (typeof currentUser.id !== "number") {
          return state;
        }
        if (typeof action.currentUserId === "number") {
          state.socket?.current?.emit("mark-read", {
            id: currentUser.id,
            receiverId: action.currentUserId,
          });
        }
        const clonedContacts = [...state.userContacts];
        const index = clonedContacts.findIndex(
          (contact) => contact.id === currentUser.id
        );
        if (index !== -1) {
          clonedContacts[index].totalUnreadMessages = 0;
        }
        return {
          ...state,
          currentChatUser: currentUser,
          messageSearch: false,
          messages: [],
          userContacts: clonedContacts,
        };
      }

      if (resolveChatKind(currentUser) === "group") {
        return {
          ...state,
          currentChatUser: currentUser,
          messageSearch: false,
          messages: [],
        };
      }
      return state;
    }

    case chatReducerCases.ADD_USER_MESSAGE: {
      const newMessage = action.newMessage;
      const isReceived =
        !action.fromSelf ||
        (Boolean(action.currentUserId) &&
          newMessage.receiverId === action.currentUserId);

      if (
        state.currentChatUser?.id === newMessage.senderId ||
        action.fromSelf
      ) {
        state.socket?.current?.emit("mark-read", {
          id: newMessage.senderId,
          receiverId: newMessage.receiverId,
        });

        const clonedContacts = [...state.userContacts];
        if (isReceived) {
          const index = clonedContacts.findIndex(
            (contact) => contact.id === newMessage.senderId
          );

          if (index !== -1) {
            const data = applyMessageSnapshotToContact(
              clonedContacts[index],
              buildContactSnapshotFromMessage(newMessage)
            );
            clonedContacts.splice(index, 1);
            clonedContacts.unshift(data);
          }
          return {
            ...state,
            messages: [...state.messages, newMessage],
            userContacts: clonedContacts,
          };
        } else {
          const index = clonedContacts.findIndex(
            (contact) => contact.id === newMessage.receiverId
          );
          if (index !== -1) {
            const newUpdatedContact = applyMessageSnapshotToContact(
              clonedContacts[index],
              buildContactSnapshotFromMessage(newMessage)
            );
            clonedContacts.splice(index, 1);
            clonedContacts.unshift(newUpdatedContact);
          } else if (newMessage.receiver) {
            const receiver = newMessage.receiver;
            const data = {
              ...buildContactSnapshotFromMessage(newMessage),
              id: receiver.id,
              name: receiver.name ?? "",
              profilePicture: receiver.profilePicture,
              chatType: "user" as const,
              identifier: "user" as const,
              totalUnreadMessages: action.fromSelf ? 0 : 1,
            };
            clonedContacts.unshift(data);
          }
          return {
            ...state,
            messages: [...state.messages, newMessage],
            userContacts: clonedContacts,
          };
        }
      } else {
        const clonedContacts = [...state.userContacts];
        if (isReceived) {
          const index = clonedContacts.findIndex(
            (contact) => contact.id === newMessage.senderId
          );
          if (index !== -1) {
            const data = applyMessageSnapshotToContact(
              clonedContacts[index],
              buildContactSnapshotFromMessage(
                newMessage,
                (clonedContacts[index].totalUnreadMessages ?? 0) + 1
              )
            );
            clonedContacts.splice(index, 1);
            clonedContacts.unshift(data);
          } else if (newMessage.sender) {
            const sender = newMessage.sender;
            const data = {
              ...buildContactSnapshotFromMessage(
                newMessage,
                action.fromSelf ? 0 : 1
              ),
              id: sender.id,
              name: sender.name ?? "",
              profilePicture: sender.profilePicture,
              chatType: "user" as const,
              identifier: "user" as const,
            };
            clonedContacts.unshift(data);
          }
        } else {
          const index = clonedContacts.findIndex(
            (contact) => contact.id === newMessage.receiverId
          );
          if (index !== -1) {
            const data = applyMessageSnapshotToContact(
              clonedContacts[index],
              buildContactSnapshotFromMessage(newMessage, 0)
            );
            clonedContacts.splice(index, 1);
            clonedContacts.unshift(data);
          } else if (newMessage.receiver) {
            const receiver = newMessage.receiver;
            const data = {
              ...buildContactSnapshotFromMessage(newMessage, 0),
              id: receiver.id,
              name: receiver.name ?? "",
              profilePicture: receiver.profilePicture,
              chatType: "user" as const,
              identifier: "user" as const,
            };
            clonedContacts.unshift(data);
          }
        }
        return {
          ...state,
          userContacts: clonedContacts,
        };
      }
    }

    case chatReducerCases.ADD_GROUP_MESSAGE: {
      const {
        groupId,
        message,
        type,
        id,
        messageStatus,
        receiverId,
        senderId,
        createdAt,
        group,
      } = action.newMessage;

      const updateGroupContacts = (clonedGroupContacts: ChatListItem[]) => {
        const index = clonedGroupContacts.findIndex(
          (groupContact) => groupContact.id === groupId
        );

        if (index !== -1) {
          const updatedGroup = applyMessageSnapshotToContact(
            clonedGroupContacts[index],
            {
              message,
              type,
              messageId: id,
              messageStatus,
              receiverId,
              senderId,
              createdAt,
              totalUnreadMessages:
                (clonedGroupContacts[index].totalUnreadMessages ?? 0) + 1,
            }
          );
          clonedGroupContacts.splice(index, 1);
          clonedGroupContacts.unshift(updatedGroup);
        } else if (group) {
          const newGroupData: ChatListItem = {
            message,
            type,
            messageId: id,
            messageStatus,
            receiverId,
            senderId,
            createdAt,
            chatType: "group",
            identifier: "group",
            id: group.id,
            name: group.name,
            thumbnail: group.thumbnail,
            totalUnreadMessages: 1,
          };
          clonedGroupContacts.unshift(newGroupData);
        }

        return clonedGroupContacts;
      };

      if (state.currentChatUser?.id === groupId) {
        const clonedGroupContacts = updateGroupContacts([
          ...state.groupContacts,
        ]);

        return {
          ...state,
          messages: [...state.messages, action.newMessage],
          groupContacts: clonedGroupContacts,
        };
      } else {
        const clonedGroupContacts = updateGroupContacts([
          ...state.groupContacts,
        ]);

        return {
          ...state,
          messages: [...state.messages, action.newMessage],
          groupContacts: clonedGroupContacts,
        };
      }
    }

    case chatReducerCases.SET_MESSAGES:
      return {
        ...state,
        messages: action.messages ?? [],
      };

    case chatReducerCases.SET_EXIT_CHAT:
      return {
        ...state,
        currentChatUser: undefined,
        messages: [],
      };

    case chatReducerCases.SET_MESSAGES_READ: {
      const clonedMessages = [...state.messages];
      const clonedContacts = [...state.userContacts];
      clonedMessages.forEach(
        (msg, index) => (clonedMessages[index].messageStatus = "read")
      );
      const index = clonedContacts.findIndex(
        (contact) => contact.id === action.receiverId
      );
      if (index !== -1) {
        clonedContacts[index].messageStatus = "read";
      }
      return {
        ...state,
        messages: clonedMessages,
        userContacts: clonedContacts,
      };
    }

    case chatReducerCases.SET_CONTACT_SEARCH: {
      const filteredUserContacts = state.userContacts.filter((contact) =>
        (contact.name ?? "")
          .toLowerCase()
          .includes((action.contactSearch ?? "").toLowerCase())
      );
      const filteredGroupContacts = state.groupContacts.filter((contact) =>
        (contact.name ?? "")
          .toLowerCase()
          .includes((action.contactSearch ?? "").toLowerCase())
      );
      const filteredContacts = [
        ...filteredUserContacts,
        ...filteredGroupContacts,
      ];
      return {
        ...state,
        contactSearch: action.contactSearch,
        filteredContacts,
      };
    }

    default: {
      const exhaustiveAction: never = action;
      void exhaustiveAction;
      return state;
    }
  }
};

export default chatReducer;
