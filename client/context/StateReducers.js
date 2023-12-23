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
      //if the currentchat user id is the one that the message
      //was intended to be sent to Or
      //action.fromSelf => Currnt user sent the msg
      if (
        state.currentChatUser?.id === action.newMessage.senderId ||
        action?.fromSelf
      ) {
        //trigger mark-read event
        state.socket.current.emit("mark-read", {
          id: action.newMessage.senderId,
          recieverId: action.newMessage.recieverId,
        });
        //clonedContacts holds the user along with latest message and no of unread messages.
        const clonedContacts = [...state.userContacts];
        //if the sender has sent the new message to the receiver
        if (action.newMessage.recieverId === state.userInfo.id) {
          //get the index of User where user.id is same as senderId of newMessage
          //Get the very first single contacts who's id ==== new message.senderId
          console.log("if statement");
          const index = clonedContacts.findIndex(
            (contact) => contact.id === action.newMessage.senderId
          );
          //I
          //if such contact exists in the array,execute this line
          if (index !== -1) {
            //get that user contact and update it
            const data = clonedContacts[index];
            data.message = action.newMessage.message;
            data.type = action.newMessage.type;
            data.messageId = action.newMessage.id;
            data.messageStatus = action.newMessage.messageStatus;
            data.recieverId = action.newMessage.recieverId;
            data.senderId = action.newMessage.senderId;

            //delete the object at the index only from the array and update the array
            clonedContacts.splice(index, 1);
            //while add new "data" to the very first
            //here length of the original array remains preserved.
            //putting the object that has latest message at very first index.
            clonedContacts.unshift(data);
          }
          return {
            ...state,
            messages: [...state.messages, action.newMessage],
            userContacts: clonedContacts,
          };
        } else {
          // Logic for handling new message that the sender just sents to reciever/group
          //Get the very first single sender contact who has sent that new message
          const index = clonedContacts.findIndex(
            (contact) => contact.id === action.newMessage.recieverId
          );
          console.log("index bitch:", index);
          //if such sender exists then
          if (index !== -1) {
            //just now append the latest message details that we just sent
            // for the object at that index(sender)
            //this is done to show latest message in lftsidebar
            const newUpdatedContact = clonedContacts[index];
            newUpdatedContact.message = action.newMessage.message;
            newUpdatedContact.type = action.newMessage.type;
            newUpdatedContact.messageId = action.newMessage.id;
            newUpdatedContact.createdAt = action.newMessage.createdAt;
            newUpdatedContact.messageStatus = action.newMessage.messageStatus;
            newUpdatedContact.recieverId = action.newMessage.recieverId;
            newUpdatedContact.senderId = action.newMessage.senderId;

            //remove that object at that index
            clonedContacts.splice(index, 1);
            //instead add new one to the very first.
            // in this way order is maintain of original array
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
        //At real time
        //When sender sent new message to receiver. It gets appear on reciver side.
        //WHen reciever sends new message to sender.It appears on sender side.
        const clonedContacts = [...state.userContacts];
        const index = clonedContacts.findIndex(
          (contact) => contact.id === action.newMessage.senderId
        );
        console.log("index:", index);
        if (index !== -1) {
          const data = clonedContacts[index];
          data.message = action.newMessage.message;
          data.type = action.newMessage.type;
          data.messageId = action.newMessage.id;
          data.messageStatus = action.newMessage.messageStatus;
          data.recieverId = action.newMessage.recieverId;
          data.senderId = action.newMessage.senderId;
          data.totalUnreadMessages += 1;
          clonedContacts.splice(index, 1);
          clonedContacts.unshift(data);
          console.log("cloneedContacts:", clonedContacts);
        } else {
          console.log("last else statement...");
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
          console.log("for the very very new message.");
          clonedContacts.unshift(data);
        }
        return {
          ...state,
          userContacts: clonedContacts,
        };
      }
    }

    case reducerCases.ADD_GROUP_MESSAGE: {
      const userBelongsToGroup = state.groupContacts.some(
        (group) =>
          group.id === action.newMessage.groupId &&
          group.members.some((member) => member.id === state.userInfo.id)
      );

      if (userBelongsToGroup || action?.fromSelf) {
        console.log("entering");
        //trigger mark-read event
        state.socket.current.emit("mark-read", {
          id: action.newMessage.senderId,
          recieverId: action.newMessage.recieverId,
        });

        //clonedContacts holds the user along with latest message and no of unread messages.
        const clonedGroupContacts = [...state.groupContacts];
        //if the sender has sent the new message to the receiver
        if (action.newMessage.recieverId === state.userInfo.id) {
          //get the index of User where user.id is same as senderId of newMessage
          //Get the very first single contacts who's id ==== new message.senderId
          console.log("if statement");
          const index = clonedGroupContacts.findIndex(
            (contact) => contact.id === action.newMessage.senderId
          );
          //I
          //if such contact exists in the array,execute this line
          if (index !== -1) {
            //get that user contact and update it
            const data = clonedGroupContacts[index];
            data.message = action.newMessage.message;
            data.type = action.newMessage.type;
            data.messageId = action.newMessage.id;
            data.messageStatus = action.newMessage.messageStatus;
            data.recieverId = action.newMessage.recieverId;
            data.senderId = action.newMessage.senderId;

            //delete the object at the index only from the array and update the array
            clonedGroupContacts.splice(index, 1);
            //while add new "data" to the very first
            //here length of the original array remains preserved.
            //putting the object that has latest message at very first index.
            clonedGroupContacts.unshift(data);
          }
          return {
            ...state,
            messages: [...state.messages, action.newMessage],
            groupContacts: clonedGroupContacts,
          };
        } else {
          // Logic for handling new message that the sender just sents to group
          //Get the very first single sender contacts who has sent that new message
          console.log("running else");
          const index = clonedGroupContacts.findIndex(
            (contact) => contact.id === action.groupId
          );
          console.log("index:", index);
          //if such sender exists then
          if (index !== -1) {
            //just now append the latest message details that we just sent
            // for the object at that index(sender)
            //this is done to show latest message in lftsidebar
            // const userContact = userContacts[indexOfUser];

            const newUpdatedContact = clonedGroupContacts[index];
            console.log(newUpdatedContact);
            newUpdatedContact.message = action.newMessage.message;
            newUpdatedContact.type = action.newMessage.type;
            newUpdatedContact.messageId = action.newMessage.id;
            newUpdatedContact.createdAt = action.newMessage.createdAt;
            newUpdatedContact.messageStatus = action.newMessage.messageStatus;
            newUpdatedContact.recieverId = action.newMessage.recieverId;
            newUpdatedContact.senderId = action.newMessage.senderId;

            //remove that object at that index
            clonedGroupContacts.splice(index, 1);
            //instead add new one to the very first.
            // in this way order is maintain of original array
            clonedGroupContacts.unshift(newUpdatedContact);
          } else {
            const clonedContacts = [...state.groupContacts];
            const index = clonedContacts.findIndex(
              (contact) => contact.id === action.newMessage.groupId
            );
            console.log("Second last else index:", index);
            if (index !== -1) {
              const data = clonedContacts[index];
              data.message = action.newMessage.message;
              data.type = action.newMessage.type;
              data.messageId = action.newMessage.id;
              data.messageStatus = action.newMessage.messageStatus;
              data.recieverId = action.newMessage.recieverId;
              data.senderId = action.newMessage.senderId;
              data.createdAt = action.newMessage.createdAt;
              data.totalUnreadMessages += 1;
              clonedContacts.splice(index, 1);
              clonedContacts.unshift(data);
              console.log("cloneedContacts:", clonedContacts);
            }
          }
          return {
            ...state,
            messages: [...state.messages, action.newMessage],
            groupContacts: clonedGroupContacts,
          };
        }
      }
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
      console.log("filters:", filteredContacts);
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
