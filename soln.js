let groups = [
  {
    id: "ec059f51-c272-4086-97b5-33a55469b475",
    name: "Js Programmers",
    about: "",
    profilePicture: "",
    identifier: "group",
    created_at: "2023-12-21T03:15:25.008Z",
    updated_at: "2023-13-21T03:15:25.008Z",
    messages: [
      {
        id: 30,
        senderId: 3,
        recieverId: null,
        type: "text",
        message: "fkit",
        msgType: "group",
        messageStatus: "sent",
        groupId: "ec059f51-c272-4086-97b5-33a55469b475",
        createdAt: "2023-12-21T13:45:26.539Z",
      },
    ],
  },
  {
    id: "641f7661-9b10-4276-9bba-6a3e7b997574",
    name: "Python Developers",
    about: "",
    profilePicture: "",
    identifier: "group",
    created_at: "2023-15-21T03:15:25.008Z",
    updated_at: "2023-17-21T03:15:25.008Z",
    messages: [
      {
        id: 21,
        senderId: 3,
        recieverId: null,
        type: "text",
        message: "la makadoks",
        msgType: "group",
        messageStatus: "delivered",
        groupId: "641f7661-9b10-4276-9bba-6a3e7b997574",
        createdAt: "2023-12-21T12:47:16.154Z",
      },
    ],
  },
];

// Loop through each object in the groups array
groups.forEach((group) => {
  group.created_At;
  // Loop through the messages array in each group
  group.messages.forEach((message) => {
    // Copy all fields except groupId from message to messageId
    const { groupId, ...messageId } = message;
    messageId.messageId = messageId.id; // Assuming you wanted to keep this unchanged
    delete messageId.id;
    // Replace the message object with the modified messageId object
    group.messages[group.messages.indexOf(message)] = messageId;
    Object.assign(group, messageId);
  });
  delete group.messages;
});

console.log(groups);
