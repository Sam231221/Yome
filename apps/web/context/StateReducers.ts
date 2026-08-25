import { reducerCases } from "./constants";
import type {
  ActiveCall,
  ChatListItem,
  ChatMessage,
  ChatSocketRef,
  NumericId,
} from "@/types/chat";
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
  videoCall: ActiveCall | undefined;
  voiceCall: ActiveCall | undefined;
  incomingVoiceCall: ActiveCall | undefined;
  incomingVideoCall: ActiveCall | undefined;
  onlineUsers: NumericId[];
  contactSearch: string;
  filteredContacts: ChatListItem[];
}

export interface Action {
  type: string;
  userInfo?: AppUserInfo;
  newUser?: boolean;
  group?: ChatListItem;
  user?: ChatListItem;
  socket?: ChatSocketRef;
  messages?: ChatMessage[];
  newMessage?: ChatMessage & { groupId?: NumericId | null };
  userContacts?: ChatListItem[];
  groupContacts?: ChatListItem[];
  videoCall?: ActiveCall;
  voiceCall?: ActiveCall;
  incomingVoiceCall?: ActiveCall;
  incomingVideoCall?: ActiveCall;
  onlineUsers?: NumericId[];
  contactSearch?: string;
  id?: NumericId;
  recieverId?: NumericId;
  fromSelf?: boolean;
  groupId?: NumericId;
}

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
  videoCall: undefined,
  voiceCall: undefined,
  incomingVoiceCall: undefined,
  incomingVideoCall: undefined,
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
        newUser: action.newUser ?? state.newUser,
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
      if (action.group) {
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
    }
    case reducerCases.CHANGE_CURRENT_CHAT_USER: {
      const currentUser = action.user;
      if (currentUser) {
        if (state.contactsPage) {
          return {
            ...state,
            currentChatUser: currentUser,
            messages: [],
          };
        }
        if (currentUser.type === "user") {
          state.socket?.current?.emit("mark-read", {
            id: currentUser.id,
            recieverId: state.userInfo?.id,
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

        if (currentUser.type === "group") {
          return {
            ...state,
            currentChatUser: currentUser,
            messageSearch: false,
            messages: [],
          };
        }
      }
      // If action.user doesn't exist or type doesn't match, return state unchanged
      return state;
    }
    case reducerCases.SET_SOCKET:
      return {
        ...state,
        socket: action.socket,
      };
    case reducerCases.ADD_USER_MESSAGE: {
      const newMessage = action.newMessage;
      if (!newMessage) {
        return state;
      }
      if (
        state.currentChatUser?.id === newMessage.senderId ||
        action?.fromSelf
      ) {
        //if the incoming message is either for the person, the logged in user is
        // currently chatting with or if the logged in users themselves sent the message
        //trigger mark-read event
        state.socket?.current?.emit("mark-read", {
          id: newMessage.senderId,
          recieverId: newMessage.recieverId,
        });

        const clonedContacts = [...state.userContacts];
        // // Logic for handling new message that the loggedin user just recieves from a chat user/group
        if (newMessage.recieverId === state.userInfo?.id) {
          const index = clonedContacts.findIndex(
            (contact) => contact.id === newMessage.senderId
          );

          if (index !== -1) {
            const data = clonedContacts[index];
            data.message = newMessage.message;
            data.type = newMessage.type;
            data.createdAt = newMessage.createdAt;
            data.messageId = newMessage.id;
            data.messageStatus = newMessage.messageStatus;
            data.recieverId = newMessage.recieverId;
            data.senderId = newMessage.senderId;

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
            (contact) => contact.id === newMessage.recieverId
          );
          if (index !== -1) {
            //if the contact exist ,update the latest message.

            const newUpdatedContact = clonedContacts[index];
            newUpdatedContact.message = newMessage.message;
            newUpdatedContact.type = newMessage.type;
            newUpdatedContact.messageId = newMessage.id;
            newUpdatedContact.createdAt = newMessage.createdAt;
            newUpdatedContact.messageStatus = newMessage.messageStatus;
            newUpdatedContact.recieverId = newMessage.recieverId;
            newUpdatedContact.senderId = newMessage.senderId;

            clonedContacts.splice(index, 1);

            clonedContacts.unshift(newUpdatedContact);
          } else if (newMessage.reciever) {
            const {
              message,
              type,
              id,
              messageStatus,
              recieverId,
              senderId,
              createdAt,
            } = newMessage;
            const receiver = newMessage.reciever;
            const data = {
              message,
              type,
              messageId: id,
              messageStatus,
              recieverId,
              senderId,
              createdAt,
              id: receiver.id,
              name: receiver.name ?? "",
              profilePicture: receiver.profilePicture,
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
          const data = clonedContacts[index];
          data.message = newMessage.message;
          data.type = newMessage.type;
          data.messageId = newMessage.id;
          data.createdAt = newMessage.createdAt;
          data.messageStatus = newMessage.messageStatus;
          data.recieverId = newMessage.recieverId;
          data.senderId = newMessage.senderId;
          data.totalUnreadMessages = (data.totalUnreadMessages ?? 0) + 1;
          clonedContacts.splice(index, 1);
          clonedContacts.unshift(data);
        } else if (newMessage.sender) {
          // for the very first time If the sender is not in contacts,
          // add them to contacts for logged in users on left side bar.
          const {
            message,
            type,
            id,
            messageStatus,
            recieverId,
            senderId,
            createdAt,
          } = newMessage;
          const sender = newMessage.sender;
          const data = {
            message,
            type,
            messageId: id,
            messageStatus,
            recieverId,
            senderId,
            createdAt,
            id: sender.id,
            name: sender.name ?? "",
            profilePicture: sender.profilePicture,
            totalUnreadMessages: action.fromSelf ? 0 : 1,
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
      if (!action.newMessage) {
        return state;
      }
      const {
        groupId,
        message,
        type,
        id,
        messageStatus,
        recieverId,
        senderId,
        createdAt,
        group,
      } = action.newMessage;

      const updateGroupContacts = (clonedGroupContacts: ChatListItem[]) => {
        const index = clonedGroupContacts.findIndex(
          (groupContact) => groupContact.id === groupId
        );

        if (index !== -1) {
          const updatedGroup = clonedGroupContacts[index];
          updatedGroup.message = message;
          updatedGroup.type = type;
          updatedGroup.messageId = id;
          updatedGroup.createdAt = createdAt;
          updatedGroup.messageStatus = messageStatus;
          updatedGroup.recieverId = recieverId;
          updatedGroup.senderId = senderId;
          updatedGroup.totalUnreadMessages =
            (updatedGroup.totalUnreadMessages ?? 0) + 1;

          clonedGroupContacts.splice(index, 1);
          clonedGroupContacts.unshift(updatedGroup);
        } else if (group) {
          const newGroupData = {
            message,
            type,
            messageId: id,
            messageStatus,
            recieverId,
            senderId,
            createdAt,
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
        groupContacts: action.groupContacts ?? [],
      };
    case reducerCases.SET_VIDEO_CALL:
      return {
        ...state,
        videoCall: action.videoCall,
      };
    case reducerCases.SET_VOICE_CALL:
      return {
        ...state,
        voiceCall: action.voiceCall,
      };
    case reducerCases.END_CALL:
      return {
        ...state,
        videoCall: undefined,
        voiceCall: undefined,
        incomingVoiceCall: undefined,
        incomingVideoCall: undefined,
      };
    case reducerCases.SET_INCOMING_VOICE_CALL:
      return {
        ...state,
        incomingVoiceCall: action.incomingVoiceCall,
      };
    case reducerCases.SET_INCOMING_VIDEO_CALL:
      return {
        ...state,
        incomingVideoCall: action.incomingVideoCall,
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
          (contact) => contact.id === action.recieverId
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
        contactSearch: action.contactSearch ?? "",
        filteredContacts,
      };
    }
    default:
      return state;
  }
};

export default reducer;
