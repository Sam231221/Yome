In MessageController.js
Users Map: Map(2) {
  1 => {
    messageId: 18,
    type: 'text',
    message: 'xya',
    messageStatus: 'delivered',
    createdAt: 2023-12-21T12:23:29.986Z,
    senderId: 3,
    recieverId: 1,
    id: 1,
    email: 'samirshahi9882@gmail.com',
    name: 'Sam',
    password: '$2a$10$IV1QuS.5rDr1FoFZujDRB.9ggpxjUj.H4nSAqEUh9FxumGgyvLswS',
    identifier: 'user',
    profilePicture: '',
    about: '',
    created_at: 2023-12-19T14:59:11.836Z,
    updated_at: 2023-12-19T14:59:11.836Z,
    forgotPasswordToken: null,
    forgotPasswordTokenExpiry: null,
    verifyToken: null,
    verifyTokenExpiry: null,
    totalUnreadMessages: 0
  },
  2 => {
    messageId: 5,
    type: 'text',
    message: 'hello',
    messageStatus: 'delivered',
    createdAt: 2023-12-20T10:13:57.489Z,
    senderId: 3,
    recieverId: 2,
    id: 2,
    email: 'anjan123@gmail.com',
    name: 'Anjan',
    password: '$2a$10$uc00nWi82IuwOKYEOiaQEubAXHmhJkpgwPKG4sfjxQSuGj5ZN9LTW',
    identifier: 'user',
    profilePicture: '',
    about: '',
    created_at: 2023-12-19T15:00:01.581Z,
    updated_at: 2023-12-19T15:00:01.581Z,
    forgotPasswordToken: null,
    forgotPasswordTokenExpiry: null,
    verifyToken: null,
    verifyTokenExpiry: null,
    totalUnreadMessages: 0
  }
}



 if (!users.get(calculatedId)) {
        const {
          id,
          type,
          message,
          messageStatus,
          createdAt,
          senderId,
          recieverId,
        } = msg;

        //defining user according to the "msg" obj
        //each user hold the latest msg.
        //that is to be showed on the left side as initial msg.
        /*
              Here user: {
                messageId: 18,
                type: 'text',
                message: 'xya',
                messageStatus: 'sent',
                createdAt: 2023-12-21T12:23:29.986Z,
                senderId: 3,
                recieverId: 1
              }
              Here user: {
                messageId: 5,
                type: 'text',
                message: 'hello',
                messageStatus: 'delivered',
                createdAt: 2023-12-20T10:13:57.489Z,
                senderId: 3,
                recieverId: 2
              }        
        */
        let user = {
          messageId: id,
          type,
          message,
          messageStatus,
          createdAt,
          senderId,
          recieverId,
        };
        // console.log("Here user:", user);
        //if it is sender then create a user with the receiver messages
        // setting unread messages to 0


    const userGroups = await prisma.user.findUnique({
      where: {
        id: userId, // Replace with the actual user ID
      },
      include: {
        group: true, // Include the groups associated with the user
      },
    });

    // Extract group IDs from the user's groups
    const groupIds = userGroups.group.map((group) => group.id);

    // Fetch messages for the user's groups
    const groupMessages = await prisma.messages.findMany({
      where: {
        groupId: {
          in: groupIds, // Filter by the user's group IDs
        },
      },
    });

