import { reducerCases } from "./constants";
import type {
  ChatListItem,
  ChatKind,
  ChatMessage,
  ChatSocketRef,
  GroupId,
  UserId,
} from "@/types/chat";
import { resolveChatKind } from "@/types/chat";
import type { AppUserInfo } from "@/lib/auth/userInfo";

export interface State {
  userInfo: AppUserInfo | undefined;
  newUser: boolean;
  contactsPage: boolean;
  messageSearch: boolean;
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
}

type IncomingChatMessage = ChatMessage & { groupId?: GroupId | null };

type SetUserInfoAction = {
  type: typeof reducerCases.SET_USER_INFO;
  userInfo: AppUserInfo | undefined;
};

type SetNewUserAction = {
  type: typeof reducerCases.SET_NEW_USER;
  newUser: boolean;
};

type ToggleAllContactsPageAction = {
  type: typeof reducerCases.SET_ALL_CONTACTS_PAGE;
};

type ChangeCurrentChatUserAction = {
  type: typeof reducerCases.CHANGE_CURRENT_CHAT_USER;
  user: ChatListItem;
};

type ChangeCurrentGroupAction = {
  type: typeof reducerCases.CHANGE_CURRENT_GROUP;
  group: ChatListItem;
};

type SetSocketAction = {
  type: typeof reducerCases.SET_SOCKET;
  socket: ChatSocketRef | undefined;
};

type SetUserContactsAction = {
  type: typeof reducerCases.SET_USER_CONTACTS;
  userContacts: ChatListItem[];
};

type SetGroupContactsAction = {
  type: typeof reducerCases.SET_GROUP_CONTACTS;
  groupContacts: ChatListItem[];
};

type SetOnlineUsersAction = {
  type: typeof reducerCases.SET_ONLINE_USERS;
  onlineUsers: UserId[];
};

type SetMessagesAction = {
  type: typeof reducerCases.SET_MESSAGES;
  messages: ChatMessage[];
};

type AddUserMessageAction = {
  type: typeof reducerCases.ADD_USER_MESSAGE;
  newMessage: IncomingChatMessage;
  fromSelf?: boolean;
};

type AddGroupMessageAction = {
  type: typeof reducerCases.ADD_GROUP_MESSAGE;
  newMessage: IncomingChatMessage;
  groupId?: GroupId;
  fromSelf?: boolean;
};

type SetMessagesReadAction = {
  type: typeof reducerCases.SET_MESSAGES_READ;
  id: UserId;
  receiverId?: UserId;
};

type ToggleMessagesSearchAction = {
  type: typeof reducerCases.SET_MESSAGES_SEARCH;
};

type SetContactSearchAction = {
  type: typeof reducerCases.SET_CONTACT_SEARCH;
  contactSearch: string;
};

type ExitChatAction = {
  type: typeof reducerCases.SET_EXIT_CHAT;
};

export type Action =
  | SetUserInfoAction
  | SetNewUserAction
  | ToggleAllContactsPageAction
  | ChangeCurrentChatUserAction
  | ChangeCurrentGroupAction
  | SetSocketAction
  | SetUserContactsAction
  | SetGroupContactsAction
  | SetOnlineUsersAction
  | SetMessagesAction
  | AddUserMessageAction
  | AddGroupMessageAction
  | SetMessagesReadAction
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

export const initialState: State = {
  userInfo: undefined,
  newUser: false,
  contactsPage: false,
  messageSearch: false,
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
};

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case reducerCases.SET_USER_INFO:
      return {
        ...state,
        userInfo: action.userInfo,
      };
    case reducerCases.SET_NEW_USER:
      return {
        ...state,
        newUser: action.newUser,
      };
    case reducerCases.SET_ALL_CONTACTS_PAGE:
      return {
        ...state,
        contactsPage: !state.contactsPage,
      };
    case reducerCases.SET_MESSAGES_SEARCH:
      return {
        ...state,
        messageSearch: !state.messageSearch,
      };
    case reducerCases.CHANGE_CURRENT_GROUP: {
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
    case reducerCases.CHANGE_CURRENT_CHAT_USER: {
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
        state.socket?.current?.emit("mark-read", {
          id: currentUser.id,
          receiverId: state.userInfo?.id,
        });
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
    case reducerCases.SET_SOCKET:
      return {
        ...state,
        socket: action.socket,
      };
    case reducerCases.ADD_USER_MESSAGE: {
      const newMessage = action.newMessage;
      if (
        state.currentChatUser?.id === newMessage.senderId ||
        action.fromSelf
      ) {
        //if the incoming message is either for the person, the logged in user is
        // currently chatting with or if the logged in users themselves sent the message
        //trigger mark-read event
        state.socket?.current?.emit("mark-read", {
          id: newMessage.senderId,
          receiverId: newMessage.receiverId,
        });

        const clonedContacts = [...state.userContacts];
        // Logic for handling a new message the logged-in user just receives from a chat user/group
        if (newMessage.receiverId === state.userInfo?.id) {
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
          // Logic for handling new message that the loggedin user just sents to chat user/group

          const index = clonedContacts.findIndex(
            (contact) => contact.id === newMessage.receiverId
          );
          if (index !== -1) {
            //if the contact exist ,update the latest message.

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
        // If the logged in users(sender or receiver) have no active current chat user
        const clonedContacts = [...state.userContacts];
        //get the sender that has sent the message and append this as latest
        //message to the left sidebar items
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
          // for the very first time If the sender is not in contacts,
          // add them to contacts for logged in users on left side bar.
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
        return {
          ...state,
          userContacts: clonedContacts,
        };
      }
    }

    case reducerCases.ADD_GROUP_MESSAGE: {
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

    case reducerCases.SET_MESSAGES:
      return {
        ...state,
        messages: action.messages ?? [],
      };
    case reducerCases.SET_USER_CONTACTS:
      return {
        ...state,
        userContacts: action.userContacts ?? [],
      };
    case reducerCases.SET_GROUP_CONTACTS:
      return {
        ...state,
        groupContacts: action.groupContacts,
      };
    case reducerCases.SET_EXIT_CHAT:
      return {
        ...state,
        currentChatUser: undefined,
        messages: [],
      };
    case reducerCases.SET_MESSAGES_READ: {
      if (state.userInfo?.id === action.id) {
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
      } else {
        return {
          ...state,
        };
      }
    }
    case reducerCases.SET_ONLINE_USERS:
      return {
        ...state,
        onlineUsers: action.onlineUsers ?? [],
      };

    case reducerCases.SET_CONTACT_SEARCH: {
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

export default reducer;
