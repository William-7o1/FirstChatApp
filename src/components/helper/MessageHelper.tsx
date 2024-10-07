import { CometChat } from '@cometchat/chat-sdk-react-native';

interface MessageHelperParams {
  userId: string;
  currentUserId: string;
  onMessagesUpdated: (messages: CometChat.BaseMessage[]) => void;
  onMessageAdded: (message: CometChat.BaseMessage) => void;
  onTypingStatusChanged: (isTyping: boolean) => void;
  onMessageEdited: (message: CometChat.BaseMessage) => void;
  onMessageDeleted: (deletedMessage: CometChat.BaseMessage) => void;
  onMessageUpdated: (updatedMessage: CometChat.BaseMessage) => void;
}

export const createMessageHelper = ({
  userId,
  currentUserId,
  onMessagesUpdated,
  onMessageAdded,
  onTypingStatusChanged,
  onMessageEdited,
  onMessageDeleted: onMessageDeletedCallback,
  onMessageUpdated,
}: MessageHelperParams) => {
  const listenerID = `message_listener_${userId}`;
  let messagesRequest: CometChat.MessagesRequest | null = null;
  let typingTimeoutRef: NodeJS.Timeout | null = null;

  // Maintain a local copy of messages
  let localMessages: CometChat.BaseMessage[] = [];

  const initialize = () => {
    // Build messages request
    messagesRequest = new CometChat.MessagesRequestBuilder()
      .setUID(userId)
      .setLimit(30)
      .build();

    // Add message listener
    CometChat.addMessageListener(
      listenerID,
      new CometChat.MessageListener({
        onTextMessageReceived: (message: CometChat.TextMessage) => {
         
          // console.log('onTextMessageReceivedonTextMessageReceived')
          const sender = message.getSender();
          const readAt = message.getReadAt();
          if (sender?.getUid() === userId && !readAt) {
            CometChat.markAsRead(message).then(
              () => {
                console.log('Message marked as read:', message.getId());
              },
              (error) => {
                console.error('Error marking message as read:', error);
              }
            );
          }
          onMessageAdded(message);
        },
        onTypingStarted: () => {
          onTypingStatusChanged(true);
        },
        onTypingEnded: () => {
          onTypingStatusChanged(false);
        },
        onMessageEdited: (message: CometChat.BaseMessage) => {
          onMessageEdited(message);
        },
        onMessageDeleted: (message: CometChat.BaseMessage) => {
          onMessageDeletedCallback(message);
        },
        // onMessagesRead: (receipt: CometChat.MessageReceipt) => {
        //   console.log('onMessagesRead:', receipt);
        //   updateMessagesReceipt(receipt);
        //   },
        // onMessageDelivered: (receipt: CometChat.MessageReceipt) => {
        //   console.log('onMessageDelivered:', receipt);
        //   updateMessageReceipt(receipt);
        // },
        onMessagesDelivered: (messageReceipt) => {
          console.log('onMessagesDelivered:', messageReceipt);
          updateMessageReceipt(messageReceipt, 'delivered');
        },
        onMessagesRead: (messageReceipt) => {
          console.log('onMessagesRead:', messageReceipt);
          updateMessageReceipt(messageReceipt, 'read');
        },
      })
    );
  };

  const removeListeners = () => {
    CometChat.removeMessageListener(listenerID);
  };


  const updateMessageReceipt = (receipt, status) => {
    const messageId = receipt.getMessageId();
  
    // Update localMessages
    localMessages = localMessages.map((msg) => {
      if (msg.getId() === messageId) {
        if (status === 'delivered') {
          msg.setDeliveredAt(receipt.getDeliveredAt());
        } else if (status === 'read') {
          msg.setReadAt(receipt.getReadAt());
        }
      }
      return msg;
    });
  
    // Update messages in ChatScreen
    onMessagesUpdated([...localMessages]);
  };
    // const updateMessagesReceipt = (receipt: CometChat.MessageReceipt) => {
    //   const timestamp = receipt.getTimestamp();
    //   const senderUID = receipt.getSender().getUid();

    //   if (senderUID !== userId) {
    //     return; // We only care about receipts from the recipient
    //   }

    //   // Update all messages sent by current user before the timestamp
    //   const updatedMessages = localMessages.map((msg) => {
    //     const msgTimestamp = msg.getSentAt();
    //     const msgSenderUID = msg.getSender().getUid();

    //     if (msgSenderUID === currentUserId && msgTimestamp <= timestamp) {
    //       // Update the readAt property
    //       msg.setReadAt(timestamp);
    //     }
    //     return msg;
    //   });

    //   localMessages = updatedMessages;

    //   // Update messages in ChatScreen
    //   onMessagesUpdated(updatedMessages);
    // };

    const updateMessagesReceipt = (receipt) => {
      const updatedMessages = localMessages.map(message => {
        // If the message id matches and the read receipt timestamp is greater
        // than the current read timestamp, update it.
        if (message.getId() === receipt.getMessageId() && (!message.getReadAt() || message.getReadAt() < receipt.getTimestamp())) {
          const updatedMessage = { ...message, readAt: receipt.getTimestamp() };
          return updatedMessage;
        }
        return message;
      });
    
      // Update local state
      localMessages = updatedMessages;
      onMessagesUpdated(updatedMessages);  // This function should trigger a state update in your component
    };
    
    
    const fetchPreviousMessages = async () => {
      if (messagesRequest) {
        try {
          const fetchedMessages = await messagesRequest.fetchPrevious();
          // Filter messages by type to include only text or image messages.
          const validMessages = fetchedMessages.filter(
            (msg) =>
              msg.getType() === CometChat.MESSAGE_TYPE.TEXT ||
              msg.getType() === CometChat.MESSAGE_TYPE.IMAGE
          );

          // Update local messages and refresh UI
          localMessages = validMessages;
          onMessagesUpdated(validMessages);

          // Find the last message from the other user that has not been read
          const lastUnreadMessage = validMessages
            .reverse()
            .find(
              (message) =>
                message.getSender()?.getUid() === userId && !message.getReadAt()
            );

          // If such a message is found, mark it as read
          if (lastUnreadMessage) {
            CometChat.markAsRead(lastUnreadMessage).then(
              () => {
                console.log('Last unread message marked as read:', lastUnreadMessage.getId());
              },
              (error) => {
                console.error('Error marking last unread message as read:', error);
              }
            );
          }
        } catch (error) {
          console.error('Message fetching failed with error:', error);
        }
      }
    };


    const sendMessage = async (text: string) => {
    const textMessage = new CometChat.TextMessage(userId, text, CometChat.RECEIVER_TYPE.USER);

    try {
      const sentMessage = await CometChat.sendMessage(textMessage);
      onMessageAdded(sentMessage);
    } catch (error) {
      console.error('Message sending failed with error:', error);
    }
    };

  const editMessage = async (messageId: string, newText: string) => {
    const textMessage = new CometChat.TextMessage(userId, newText, CometChat.RECEIVER_TYPE.USER);
    textMessage.setId(messageId);

    try {
      const editedMessage = await CometChat.editMessage(textMessage);
      onMessageEdited(editedMessage);
    } catch (error) {
      console.error('Message editing failed with error:', error);
    }
  };

  const deleteMessage = async (messageId: number) => {
    try {
      const deletedMessage = await CometChat.deleteMessage(messageId);
      onMessageDeletedCallback(deletedMessage);
    } catch (error) {
      console.error('Message deletion failed with error:', error);
    }
  };

  const sendTypingIndicator = (text: string) => {
    if (typingTimeoutRef) {
      clearTimeout(typingTimeoutRef);
    }

    const typingNotification = new CometChat.TypingIndicator(
      userId,
      CometChat.RECEIVER_TYPE.USER
    );

    if (text.trim() !== '') {
      CometChat.startTyping(typingNotification);

      // Stop typing indicator after 3 seconds of inactivity
      typingTimeoutRef = setTimeout(() => {
        CometChat.endTyping(typingNotification);
      }, 3000);
    } else {
      CometChat.endTyping(typingNotification);
    }
  };

  const endTypingIndicator = () => {
    if (typingTimeoutRef) {
      clearTimeout(typingTimeoutRef);
    }
    const typingNotification = new CometChat.TypingIndicator(
      userId,
      CometChat.RECEIVER_TYPE.USER
    );
    CometChat.endTyping(typingNotification);
  };

  return {
    initialize,
    removeListeners,
    fetchPreviousMessages,
    sendMessage,
    editMessage,
    deleteMessage,
    sendTypingIndicator,
    endTypingIndicator,
  };
};