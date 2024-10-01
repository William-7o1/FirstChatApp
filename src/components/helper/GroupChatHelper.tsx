import { useState, useEffect, useRef } from 'react';
import { CometChat } from '@cometchat/chat-sdk-react-native';
import { AppConstants } from '../../../AppConstants';

export const useGroupChat = (group) => {
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const typingTimeoutRef = useRef(null);
  const currentUserID = AppConstants.UID;

  useEffect(() => {
    const listenerID = `listener_${group.guid}`;

    // Add message listener
    CometChat.addMessageListener(
      listenerID,
      new CometChat.MessageListener({
        onTextMessageReceived: (message) => {
          // Mark the message as delivered and read
          CometChat.markAsDelivered(message);
          CometChat.markAsRead(message);

          setMessages((prevMessages) => {
            const currentMessageIds = new Set(prevMessages.map((msg) => msg.id));
            if (!currentMessageIds.has(message.id)) {
              return [message, ...prevMessages];
            }
            return prevMessages;
          });
        },
        onTypingStarted: (typingIndicator) => {
          setTypingUsers((prev) => {
            const updated = new Set(prev);
            updated.add(typingIndicator.sender.uid);
            return updated;
          });
        },
        onTypingEnded: (typingIndicator) => {
          setTypingUsers((prev) => {
            const updated = new Set(prev);
            updated.delete(typingIndicator.sender.uid);
            return updated;
          });
        },
        onMessageEdited: (message) => {
          setMessages((prevMessages) =>
            prevMessages.map((msg) =>
              msg.id === message.id ? { ...message, edited: true } : msg
            )
          );
        },
        onMessageDeleted: (deletedMessage) => {
          // Update the message type to 'deleted' instead of removing it
          setMessages((prevMessages) =>
            prevMessages.map((msg) =>
              msg.id === deletedMessage.id ? { ...msg, type: 'deleted' } : msg
            )
          );
        },
        onMessagesDeliveredToAll: (receipt) => {
          updateMessageStatus(receipt.messageId, 'delivered');
        },
        onMessagesReadByAll: (receipt) => {
          updateMessageStatus(receipt.messageId, 'read');
        },
      })
    );

    // Fetch previous messages
    fetchPreviousMessages();

    return () => {
      CometChat.removeMessageListener(listenerID);
    };
  }, [group]);

  const fetchPreviousMessages = async () => {
    const messagesRequest = new CometChat.MessagesRequestBuilder()
      .setGUID(group.guid)
      .setLimit(30)
      .build();

    try {
      const fetchedMessages = await messagesRequest.fetchPrevious();
      const messagesMap = new Map();

      if (fetchedMessages.length === 0) {
        setMessages([]);
        return;
      }

      fetchedMessages.forEach((msg) => {
        if (msg.actionOn) {
          messagesMap.set(msg.actionOn.id, { ...msg.actionOn, edited: true });
        } else {
          // Include all messages, even if they are deleted
          messagesMap.set(msg.id, { ...msg });
        }
      });

      const validMessages = Array.from(messagesMap.values()).reverse();
      setMessages((prevMessages) => {
        const currentMessageIds = new Set(prevMessages.map((msg) => msg.id));
        const newMessages = validMessages.filter((msg) => !currentMessageIds.has(msg.id));
        return [...prevMessages, ...newMessages];
      });

      // Mark all fetched messages as read
      fetchedMessages.forEach((message) => {
        CometChat.markAsRead(message);
      });
    } catch (error) {
      console.error('Message fetching failed with error:', error);
    }
  };

  const sendMessage = (text, editingMessageId, setEditingMessageId) => {
    if (text.trim() === '') return;

    const typingNotification = new CometChat.TypingIndicator(
      group.guid,
      CometChat.RECEIVER_TYPE.GROUP
    );
    CometChat.endTyping(typingNotification);

    if (editingMessageId) {
      const textMessage = new CometChat.TextMessage(
        group.guid,
        text,
        CometChat.RECEIVER_TYPE.GROUP
      );
      textMessage.setId(editingMessageId);

      CometChat.editMessage(textMessage).then(
        (editedMessage) => {
          setMessages((prevMessages) =>
            prevMessages.map((msg) =>
              msg.id === editingMessageId ? { ...editedMessage, edited: true } : msg
            )
          );
          setEditingMessageId(null);
        },
        (error) => {
          console.error('Message editing failed with error:', error);
        }
      );
    } else {
      const textMessage = new CometChat.TextMessage(
        group.guid,
        text,
        CometChat.RECEIVER_TYPE.GROUP
      );

      CometChat.sendMessage(textMessage).then(
        (sentMessage) => {
          sentMessage.status = 'sent';
          setMessages((prevMessages) => [sentMessage, ...prevMessages]);

          // Mark the message as delivered and read
          CometChat.markAsDelivered(sentMessage);
          CometChat.markAsRead(sentMessage);
        },
        (error) => {
          console.error('Message sending failed with error:', error);
        }
      );
    }
  };

  const deleteMessage = (messageId) => {
    CometChat.deleteMessage(messageId).then(
      () => {
        // Update the message type to 'deleted'
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.id === messageId ? { ...msg, type: 'deleted' } : msg
          )
        );
      },
      (error) => {
        console.error('Message deletion failed with error:', error);
      }
    );
  };

  const updateMessageStatus = (messageId, status) => {
    setMessages((prevMessages) =>
      prevMessages.map((msg) =>
        msg.id === messageId ? { ...msg, status } : msg
      )
    );
  };

  const handleTextChange = (text) => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (!group || !CometChat) return;

    const typingNotification = new CometChat.TypingIndicator(
      group.guid,
      CometChat.RECEIVER_TYPE.GROUP
    );

    if (text.trim()) {
      CometChat.startTyping(typingNotification);
      typingTimeoutRef.current = setTimeout(() => {
        CometChat.endTyping(typingNotification);
      }, 3000);
    } else {
      CometChat.endTyping(typingNotification);
    }
  };

  return {
    messages,
    typingUsers,
    fetchPreviousMessages,
    sendMessage,
    deleteMessage,
    updateMessageStatus,
    handleTextChange,
  };
};
