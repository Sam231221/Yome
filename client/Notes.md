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
