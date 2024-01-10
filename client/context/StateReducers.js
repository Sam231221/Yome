import { userInfo } from "os";
import { reducerCases } from "./constants";

export const initialState = {
  //object
  userInfo: undefined,
  newUser: false,
  contactsPage: false,
  messageSearch: false,
  //object
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

const reducer = (state, action) => {
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
      if (action.user) {
        if (state.contactsPage) {
          return {
            ...state,
            currentChatUser: action.user,
            messages: [],
          };
        }
        if (action.user.type === "user") {
          state.socket.current.emit("mark-read", {
            id: action.user.id,
            recieverId: state.userInfo.id,
          });
          const clonedContacts = [...state.userContacts];
          const index = clonedContacts.findIndex(
            (contact) => contact.id === action.user.id
          );
          clonedContacts[index].totalUnreadMessages = 0;
          return {
            ...state,
            currentChatUser: action.user,
            messageSearch: false,
            messages: [],
            userContacts: clonedContacts,
          };
        }

        if (action.user.type === "group") {
          return {
            ...state,
            currentChatUser: action.user,
            messageSearch: false,
            messages: [],
          };
        }
      }
    }
    case reducerCases.SET_SOCKET:
      return {
        ...state,
        socket: action.socket,
      };
    case reducerCases.ADD_USER_MESSAGE: {
      if (
        state.currentChatUser?.id === action.newMessage.senderId ||
        action?.fromSelf
      ) {
        //if the incoming message is either for the person, the logged in user is
        // currently chatting with or if the logged in users themselves sent the message
        //trigger mark-read event
        state.socket.current.emit("mark-read", {
          id: action.newMessage.senderId,
          recieverId: action.newMessage.recieverId,
        });

        const clonedContacts = [...state.userContacts];
        // // Logic for handling new message that the loggedin user just recieves from a chat user/group
        if (action.newMessage.recieverId === state.userInfo.id) {
          const index = clonedContacts.findIndex(
            (contact) => contact.id === action.newMessage.senderId
          );

          if (index !== -1) {
            const data = clonedContacts[index];
            data.message = action.newMessage.message;
            data.type = action.newMessage.type;
            data.createdAt = action.newMessage.createdAt;
            data.messageId = action.newMessage.id;
            data.messageStatus = action.newMessage.messageStatus;
            data.recieverId = action.newMessage.recieverId;
            data.senderId = action.newMessage.senderId;

            clonedContacts.splice(index, 1);

            clonedContacts.unshift(data);
          }
          return {
            ...state,
            messages: [...state.messages, action.newMessage],
            userContacts: clonedContacts,
          };
        } else {
          // Logic for handling new message that the loggedin user just sents to chat user/group

          const index = clonedContacts.findIndex(
            (contact) => contact.id === action.newMessage.recieverId
          );
          if (index !== -1) {
            //if the contact exist ,update the latest message.

            const newUpdatedContact = clonedContacts[index];
            newUpdatedContact.message = action.newMessage.message;
            newUpdatedContact.type = action.newMessage.type;
            newUpdatedContact.messageId = action.newMessage.id;
            newUpdatedContact.createdAt = action.newMessage.createdAt;
            newUpdatedContact.messageStatus = action.newMessage.messageStatus;
            newUpdatedContact.recieverId = action.newMessage.recieverId;
            newUpdatedContact.senderId = action.newMessage.senderId;

            clonedContacts.splice(index, 1);

            clonedContacts.unshift(newUpdatedContact);
          } else {
            const {
              message,
              type,
              id,
              messageStatus,
              recieverId,
              senderId,
              createdAt,
            } = action.newMessage;
            const data = {
              message,
              type,
              messageId: id,
              messageStatus,
              recieverId,
              senderId,
              createdAt,
              id: action.newMessage.reciever.id,
              name: action.newMessage.reciever.name,
              profilePicture: action.newMessage.reciever.profilePicture,
              totalUnreadMessages: action.fromSelf ? 0 : 1,
            };
            clonedContacts.unshift(data);
          }
          return {
            ...state,
            messages: [...state.messages, action.newMessage],
            userContacts: clonedContacts,
          };
        }
      } else {
        // If the logged in users(sender or receiver) have no active current chat user
        const clonedContacts = [...state.userContacts];
        //get the sender that has sent the message and append this as latest
        //message to the left sidebar items
        const index = clonedContacts.findIndex(
          (contact) => contact.id === action.newMessage.senderId
        );
        if (index !== -1) {
          const data = clonedContacts[index];
          data.message = action.newMessage.message;
          data.type = action.newMessage.type;
          data.messageId = action.newMessage.id;
          data.createdAt = action.newMessage.createdAt;
          data.messageStatus = action.newMessage.messageStatus;
          data.recieverId = action.newMessage.recieverId;
          data.senderId = action.newMessage.senderId;
          data.totalUnreadMessages += 1;
          clonedContacts.splice(index, 1);
          clonedContacts.unshift(data);
        } else {
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
          } = action.newMessage;
          const data = {
            message,
            type,
            messageId: id,
            messageStatus,
            recieverId,
            senderId,
            createdAt,
            id: action.newMessage.sender.id,
            name: action.newMessage.sender.name,
            profilePicture: action.newMessage.sender.profilePicture,
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
      // Check if the new group message belongs to the currently active group chat
      if (state.currentChatUser?.id === action.newMessage.groupId) {
        state.socket.current.emit("mark-group-read", {
          groupId: action.newMessage.groupId,
          userId: state.userInfo.id,
        });

        // Clone the group contacts array
        const clonedGroupContacts = [...state.groupContacts];
        const index = clonedGroupContacts.findIndex(
          (groupContact) => groupContact.id === action.newMessage.groupId
        );

        if (index !== -1) {
          //Append message to the group in the list that logged in user sent
          const updatedGroup = clonedGroupContacts[index];
          updatedGroup.message = action.newMessage.message;
          updatedGroup.type = action.newMessage.type;
          updatedGroup.messageId = action.newMessage.id;
          updatedGroup.createdAt = action.newMessage.createdAt;
          updatedGroup.messageStatus = action.newMessage.messageStatus;
          updatedGroup.recieverId = action.newMessage.recieverId;
          updatedGroup.senderId = action.newMessage.senderId;

          // Remove and place the updated group contact at the top of the list
          clonedGroupContacts.splice(index, 1);
          clonedGroupContacts.unshift(updatedGroup);
        } else {
          // If the group contact is not found, create a new group contact entry
          const {
            message,
            type,
            id,
            messageStatus,
            recieverId,
            senderId,
            createdAt,
          } = action.newMessage;

          const newGroupData = {
            message,
            type,
            messageId: id,
            messageStatus,
            recieverId,
            senderId,
            createdAt,
            identifier: "group",
            id: action.newMessage.group.id,
            name: action.newMessage.group.name,
            thumbnail: action.newMessage.group.thumbnail,
            totalUnreadMessages: 1,
          };

          // Add the new group contact at the top of the list
          clonedGroupContacts.unshift(newGroupData);
        }

        // Return the updated state with the new group message and updated group contacts
        return {
          ...state,
          messages: [...state.messages, action.newMessage],
          groupContacts: clonedGroupContacts,
        };
      } else {
        if (state.currentChatUser === undefined) {
          const clonedGroupContacts = [...state.groupContacts];
          const index = clonedGroupContacts.findIndex(
            (contact) => contact.id === action.newMessage.groupId
          );
          if (index !== -1) {
            const data = clonedGroupContacts[index];
            data.message = action.newMessage.message;
            data.type = action.newMessage.type;
            data.messageId = action.newMessage.id;
            data.messageStatus = action.newMessage.messageStatus;
            data.recieverId = action.newMessage.recieverId;
            data.senderId = action.newMessage.senderId;
            data.createdAt = action.newMessage.createdAt;
            data.totalUnreadMessages += 1;
            clonedGroupContacts.splice(index, 1);
            clonedGroupContacts.unshift(data);
          } else {
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
            } = action.newMessage;
            const data = {
              message,
              type,
              messageId: id,
              messageStatus,
              recieverId,
              senderId,
              createdAt,
              identifier: "group",
              id: action.newMessage.sender.id,
              name: action.newMessage.sender.name,
              profilePicture: action.newMessage.sender.profilePicture,
              totalUnreadMessages: action.fromSelf ? 0 : 1,
            };
            clonedContacts.unshift(data);
          }
          return {
            ...state,
            messages: [...state.messages, action.newMessage],
            groupContacts: clonedGroupContacts,
          };
        }
        if (state.currentChatUser?.id !== action.newMessage.groupId) {
          const clonedGroupContacts = [...state.groupContacts];
          const index = clonedGroupContacts.findIndex(
            (contact) => contact.id === action.newMessage.groupId
          );
          if (index !== -1) {
            const data = clonedGroupContacts[index];
            data.message = action.newMessage.message;
            data.type = action.newMessage.type;
            data.messageId = action.newMessage.id;
            data.messageStatus = action.newMessage.messageStatus;
            data.recieverId = action.newMessage.recieverId;
            data.senderId = action.newMessage.senderId;
            data.createdAt = action.newMessage.createdAt;
            data.totalUnreadMessages += 1;
            clonedGroupContacts.splice(index, 1);
            clonedGroupContacts.unshift(data);
          } else {
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
            } = action.newMessage;
            const data = {
              message,
              type,
              messageId: id,
              messageStatus,
              recieverId,
              senderId,
              createdAt,
              identifier: "group",
              id: action.newMessage.sender.id,
              name: action.newMessage.sender.name,
              profilePicture: action.newMessage.sender.profilePicture,
              totalUnreadMessages: action.fromSelf ? 0 : 1,
            };
            clonedContacts.unshift(data);
          }
          return {
            ...state,
            groupContacts: clonedGroupContacts,
          };
        }
      }

      // If the new group message doesn't belong to the current chat group, return the current state
      return state;
    }

    case reducerCases.SET_MESSAGES:
      return {
        ...state,
        messages: action.messages,
      };
    case reducerCases.SET_USER_CONTACTS:
      return {
        ...state,
        userContacts: action.userContacts,
      };
    case reducerCases.SET_GROUP_CONTACTS:
      return {
        ...state,
        groupContacts: action.groupContacts,
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
      if (state.userInfo.id === action.id) {
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
        onlineUsers: action.onlineUsers,
      };

    case reducerCases.SET_CONTACT_SEARCH: {
      const filteredUserContacts = state.userContacts.filter((contact) =>
        contact.name.toLowerCase().includes(action.contactSearch.toLowerCase())
      );
      const filteredGroupContacts = state.groupContacts.filter((contact) =>
        contact.name.toLowerCase().includes(action.contactSearch.toLowerCase())
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
    default:
      return state;
  }
};

export default reducer;
