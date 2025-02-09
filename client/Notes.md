ADD_GROUP_MESSAGE
The provided code is a case within a reducer function in a TypeScript file, specifically handling the ADD_GROUP_MESSAGE action. This reducer is part of a state management system, likely using a library such as Redux, to manage the state of a chat application.

When a new group message is added, the reducer first checks if the current chat user is viewing the group where the new message was sent. If so, it emits a "mark-group-read" event via a socket connection to mark the group as read for the current user. It then clones the existing group contacts array to avoid direct state mutation.

The code searches for the group in the cloned contacts array using the groupId from the new message. If the group is found, it updates the group's message details with the new message's information and moves the updated group to the top of the contacts list. If the group is not found, it creates a new group object with the new message details and adds it to the top of the contacts list.

If the current chat user is not defined, the code handles the new message differently. It again clones the group contacts array and searches for the group. If found, it updates the group's message details and increments the unread messages count. If not found, it creates a new group object with the new message details and adds it to the top of the contacts list.

If the current chat user is defined but is not viewing the group where the new message was sent, the code follows a similar process: it clones the group contacts array, searches for the group, updates the message details and unread messages count if found, or creates a new group object if not found.

Finally, the reducer returns the updated state, including the new message added to the messages array and the updated group contacts array. If none of the conditions are met, it simply returns the current state unchanged. This ensures that the state is only modified when necessary, maintaining the integrity of the application's state management.

ADDUSER MESSAGE
The ADD_USER_MESSAGE case in the reducer handles the addition of a new message from a user. Here's a step-by-step explanation of the logic:

Check if the message is from the current chat user or from the logged-in user:

This condition checks if the new message is from the user the logged-in user is currently chatting with or if the message is sent by the logged-in user themselves.

Emit a "mark-read" event:

If the condition is true, it emits a "mark-read" event via the socket to mark the message as read.

Clone the user contacts array:

A clone of the userContacts array is created to avoid direct mutation of the state.

Handle the case where the new message is received by the logged-in user:

If the new message is received by the logged-in user, it finds the sender in the clonedContacts array, updates the contact's message details, and moves the updated contact to the top of the list. The state is then updated with the new message and the updated contacts list.

Handle the case where the new message is sent by the logged-in user:

If the new message is sent by the logged-in user, it finds the receiver in the clonedContacts array, updates the contact's message details, and moves the updated contact to the top of the list. If the receiver is not found, it creates a new contact object with the message details and adds it to the top of the list. The state is then updated with the new message and the updated contacts list.

Handle the case where the logged-in user has no active current chat user:

If the logged-in user has no active current chat user, it finds the sender in the clonedContacts array, updates the contact's message details, and moves the updated contact to the top of the list. If the sender is not found, it creates a new contact object with the message details and adds it to the top of the list. The state is then updated with the updated contacts list.

## Imrpovements

Yes, you'll need to add a field to your `Message` model in your Prisma schema to track which users have seen the message. Here's how you can do it, along with explanations and best practices:

```prisma
model Message {
  id        String   @id @default(cuid()) // Or UUID, depending on your preference
  sender    User     @relation(fields: [senderId], references: [id])
  senderId  String
  text      String
  timestamp DateTime @default(now())
  seenBy    User[]   @relation("MessageSeenBy") // The crucial addition
  deliveredTo User[] @relation("MessageDeliveredTo")
  group     Group    @relation(fields: [groupId], references: [id])
  groupId   String
}

model User {
  id        String   @id @default(cuid()) // Or UUID
  // ... other user fields ...
  messagesSent   Message[] @relation(name: "MessageSent")
  messagesSeen   Message[] @relation(name: "MessageSeenBy") // Relation for seen messages
  messagesDeliveredTo Message[] @relation(name: "MessageDeliveredTo")
  groups       Group[]   @relation(through: "GroupMembership")

}

model Group {
  id        String   @id @default(cuid()) // Or UUID
  name      String
  members   User[]    @relation(through: "GroupMembership")
  messages  Message[]
}

model GroupMembership {
  user      User      @relation(fields: [userId], references: [id])
  userId    String
  group     Group     @relation(fields: [groupId], references: [id])
  groupId   String
  @@id([userId, groupId])
}

```

**Explanation and Key Improvements:**

1. **`seenBy User[] @relation("MessageSeenBy")`:** This is the core change. It creates a many-to-many relationship between `Message` and `User`. The `@relation("MessageSeenBy")` part is crucial. It gives the relation a name, which is _highly_ recommended for clarity and to avoid potential conflicts if you have multiple relations between the same models.

2. **`messagesSeen Message[] @relation(name: "MessageSeenBy")` in `User`:** This adds the corresponding relation on the `User` side. It allows you to easily query which messages a specific user has seen. Again, the `name` should match the relation name in the `Message` model.

3. **`deliveredTo User[] @relation("MessageDeliveredTo")` and `messagesDeliveredTo Message[] @relation(name: "MessageDeliveredTo")`:** This implements the delivered to functionality.

4. **`Group` and `GroupMembership`:** This is the correct way to model group chat. It allows for efficient querying and management of group members. The `GroupMembership` model is a join table that handles the many-to-many relationship between users and groups.

5. **`group` and `groupId` in `Message`:** This links the message to the specific group it belongs to.

6. **`@id @default(cuid())`:** Using `cuid()` or `uuid()` for your IDs is a best practice. It generates unique IDs, which is essential for database integrity and distributed systems.

**How to Use in Prisma Client:**

```typescript
// Example: Marking a message as seen
const updatedMessage = await prisma.message.update({
  where: { id: messageId },
  data: {
    seenBy: {
      connect: { id: userId }, // Connect the user who saw the message
    },
  },
  include: { seenBy: true }, // Include the seenBy users in the returned data
});

// Example: Getting all messages seen by a user
const user = await prisma.user.findUnique({
  where: { id: userId },
  include: { messagesSeen: true },
});

// Example: Displaying the count of users who have seen a message
const message = await prisma.message.findUnique({
  where: { id: messageId },
  include: { seenBy: true },
});
const seenCount = message.seenBy.length;

// Example: Creating a new message
const newMessage = await prisma.message.create({
  data: {
    text: "Hello everyone!",
    sender: { connect: { id: senderId } },
    group: { connect: { id: groupId } },
    deliveredTo: {
      connect: groupMembers.map((memberId) => ({ id: memberId })),
    },
  },
});
```

**Key Advantages of this Approach:**

- **Database Integrity:** Prisma handles the many-to-many relationship management for you, ensuring data consistency.
- **Efficient Queries:** You can easily query messages and their "seen by" users using Prisma Client's powerful query API.
- **Type Safety:** Prisma generates TypeScript types, improving the developer experience and reducing errors.

This improved schema and the usage examples will give you a solid foundation for implementing the "seen by" functionality in your group chat app. Remember to run `npx prisma generate` after modifying your schema.

const user: User = {
id: "sara",
};
const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY as string;
const client = new StreamVideoClient({ apiKey, tokenProvider, user });
console.log(client);
const callType = "default";
const callId = "test-call";
const call = client.call(callType, callId);
console.log("call:", call);
