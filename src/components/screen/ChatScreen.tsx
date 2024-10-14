import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  Text,
  KeyboardAvoidingView,
  Platform,
  Image,
  SafeAreaView,
  Alert,
} from 'react-native';
import { CometChat } from '@cometchat/chat-sdk-react-native';
import { AppConstants } from '../../../AppConstants';
import Icon from 'react-native-vector-icons/FontAwesome';
import { styles } from '../styles/ChatScreenStyle';
import { useFocusEffect } from '@react-navigation/native';
import { Modal } from 'react-native';
import { useCall } from '../../../CallContext';

interface ChatScreenProps {
  navigation: any;
  route: {
    params: {
      user: {
        uid: string;
        name: string;
        avatar?: string;
      };
    };
  };
}

const ChatScreen: React.FC<ChatScreenProps> = ({ navigation, route }) => {
  const { user } = route.params;
  console.log("USER: ", user)
  const [messages, setMessages] = useState<CometChat.BaseMessage[]>([]);
  const [text, setText] = useState('');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const currentUserID = AppConstants.UID;
  const inputRef = useRef<TextInput>(null);
  
  // Call-related state and functions
  const { setIncomingCallVisible, setCaller, setSessionID, incomingCallVisible, caller, sessionID } = useCall();

  // Message listener ID
  const messageListenerID = useRef(`message_listener_`+Date.now());

  // Typing indicator timeout
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Local copy of messages for receipt updates
  const localMessagesRef = useRef<CometChat.BaseMessage[]>([]);

  // Loading and pagination state
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  useFocusEffect(
    useCallback(() => {
      return () => {
        endTypingIndicator();
      };
    }, [])
  );

  useEffect(() => {
    console.log("CHECK CHECK 123");
    inputRef.current?.focus();

    // Initialize message listener
    // initializeMessageListener();
    CometChat.addMessageListener(
      messageListenerID.current,
      new CometChat.MessageListener({
        onTextMessageReceived: (message: CometChat.TextMessage) => {
          console.log("Text message received:");
          const sender = message.getSender();
          const readAt = message.getReadAt();
          // if (sender?.getUid() === user.uid && !readAt) {
            console.log('sender?.getUid() === user.uid && !readAtsender?.getUid() === user.uid && !readAt')
            CometChat.markAsRead(message).then(
              (res: any) => {
                console.log('Message marked as read:', message.getId()) ;
                CometChat.getLoggedinUser()
                .then((user: any) => {
                  console.log("USER LIST: ", user)
                  CometChat.markAsDelivered(message).then(
                    (res: any) => {
                      console.log('Message marked as read:', message.getId(), res);
                    },
                    (error) => {
                      console.error('Error marking message as read:', error);
                    }
                  );
                })

              },
              (error) => {
                console.error('Error marking message as read:', error);
              }
            );
          // }
          setMessages((prevMessages) => [message, ...prevMessages]);
          localMessagesRef.current = [message, ...localMessagesRef.current];
        },
        onTypingStarted: () => {
          setOtherUserTyping(true);
        },
        onTypingEnded: () => {
          setOtherUserTyping(false);
        },
        onMessageEdited: (message: CometChat.BaseMessage) => {
          console.log("Text message onMessageEdited:");
          setMessages((prevMessages) =>
            prevMessages.map((msg) =>
              msg.getId() === message.getId() ? message : msg
            )
          );
          localMessagesRef.current = localMessagesRef.current.map((msg) =>
            msg.getId() === message.getId() ? message : msg
          );
        },
        onMessageDeleted: (deletedMessage: CometChat.BaseMessage) => {
          console.log("Text message onMessageDeleted:");
          setMessages((prevMessages) =>
            prevMessages.map((msg) =>
              msg.getId() === deletedMessage.getId() ? deletedMessage : msg
            )
          );
          localMessagesRef.current = localMessagesRef.current.map((msg) =>
            msg.getId() === deletedMessage.getId() ? deletedMessage : msg
          );
        },
        onMessagesDelivered: (messageReceipt: CometChat.MessageReceipt) => {
          console.log("onMessagesDeliveredonMessagesDeliveredonMessagesDelivered")
          updateMessageReceipt(messageReceipt, 'delivered');
        },
      //       onMessagesRead: () => {
      //   console.log("Read listener XXXXXX");
      // },
        onMessagesRead: (messageReceipt: CometChat.MessageReceipt) => {
          console.log("onMessagesReadonMessagesReadonMessagesRead")
          updateMessageReceipt(messageReceipt, 'read');
        }
      })
    );

    // Fetch previous messages
    fetchPreviousMessages();

    // Add call listeners
    addCallListeners();

    return () => {
      removeMessageListener();
      removeCallListeners();
      CometChat.removeConnectionListener('local');
    };
  }, []);

  // const initializeMessageListener = () => {
  //   console.log('CometChat initialized successfully');
  //   CometChat.addConnectionListener(
  //     'local',
  //     new CometChat.ConnectionListener({
  //       onConnected: () => {
  //         console.log("CONNECTED...");
  //       },
  //       inConnecting: () => {},
  //       onDisconnected: () => {
  //         console.log("DISCONNECTED...");
      
  //       },
  //     })
  //   );
    // CometChat.addMessageListener(
    //   messageListenerID,
    //   new CometChat.MessageListener({
    //     onTextMessageReceived: (message: CometChat.TextMessage) => {
    //       console.log("Text message received:");
    //       const sender = message.getSender();
    //       const readAt = message.getReadAt();
    //       // if (sender?.getUid() === user.uid && !readAt) {
    //         console.log('sender?.getUid() === user.uid && !readAtsender?.getUid() === user.uid && !readAt')
    //         CometChat.markAsRead(message).then(
    //           (res: any) => {
    //             console.log('Message marked as read:', message.getId(), res);
    //             CometChat.markAsDelivered(message).then(
    //               (res: any) => {
    //                 console.log('Message marked as read:', message.getId(), res);
    //               },
    //               (error) => {
    //                 console.error('Error marking message as read:', error);
    //               }
    //             );
    //           },
    //           (error) => {
    //             console.error('Error marking message as read:', error);
    //           }
    //         );
    //       // }
    //       setMessages((prevMessages) => [message, ...prevMessages]);
    //       localMessagesRef.current = [message, ...localMessagesRef.current];
    //     },
    //     onTypingStarted: () => {
    //       setOtherUserTyping(true);
    //     },
    //     onTypingEnded: () => {
    //       setOtherUserTyping(false);
    //     },
    //     onMessageEdited: (message: CometChat.BaseMessage) => {
    //       console.log("Text message onMessageEdited:");
    //       setMessages((prevMessages) =>
    //         prevMessages.map((msg) =>
    //           msg.getId() === message.getId() ? message : msg
    //         )
    //       );
    //       localMessagesRef.current = localMessagesRef.current.map((msg) =>
    //         msg.getId() === message.getId() ? message : msg
    //       );
    //     },
    //     onMessageDeleted: (deletedMessage: CometChat.BaseMessage) => {
    //       console.log("Text message onMessageDeleted:");
    //       setMessages((prevMessages) =>
    //         prevMessages.map((msg) =>
    //           msg.getId() === deletedMessage.getId() ? deletedMessage : msg
    //         )
    //       );
    //       localMessagesRef.current = localMessagesRef.current.map((msg) =>
    //         msg.getId() === deletedMessage.getId() ? deletedMessage : msg
    //       );
    //     },
    //     onMessagesDelivered: (messageReceipt: CometChat.MessageReceipt) => {
    //       console.log("onMessagesDeliveredonMessagesDeliveredonMessagesDelivered")
    //       updateMessageReceipt(messageReceipt, 'delivered');
    //     },
    //     // onMessagesRead: (messageReceipt: CometChat.MessageReceipt) => {
    //     //   console.log("onMessagesReadonMessagesReadonMessagesRead")
    //     //   updateMessageReceipt(messageReceipt, 'read');
    //     // },
    //     onMessagesRead: () => {
    //       console.log("Read listener2");
    //     },
    //   })
    // );
  // };

  const removeMessageListener = () => {
    console.log('removeMessageListener')
    CometChat.removeMessageListener(messageListenerID.current);
  };

  const updateMessageReceipt = (receipt: CometChat.MessageReceipt, status: 'delivered' | 'read') => {
    const messageId = receipt.getMessageId();

    // Update localMessagesRef
    const updatedMessages = localMessagesRef.current.map((msg) => {
      if (msg.getId() === messageId) {
        if (status === 'delivered') {
          msg.setDeliveredAt(receipt.getDeliveredAt());
        } else if (status === 'read') {
          msg.setReadAt(receipt.getReadAt());
        }
      }
      return msg;
    });

    localMessagesRef.current = updatedMessages;
    setMessages([...updatedMessages]);
  };

  const fetchPreviousMessages = async () => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);

    const messagesRequest = new CometChat.MessagesRequestBuilder()
      .setUID(user.uid)
      .setLimit(30)
      .build();

    try {
      const fetchedMessages = await messagesRequest.fetchPrevious();
      if (fetchedMessages.length === 0) {
        setHasMore(false); // No more messages to fetch
        return;
      }

      // Filter messages by type to include only relevant types
      const validMessages = fetchedMessages.filter(
        (msg) =>
          msg.getType() === CometChat.MESSAGE_TYPE.TEXT ||
          msg.getType() === CometChat.MESSAGE_TYPE.IMAGE ||
          msg.getType() === CometChat.MESSAGE_TYPE.AUDIO ||
          msg.getType() === CometChat.MESSAGE_TYPE.VIDEO ||
          msg.getType() === CometChat.MESSAGE_TYPE.FILE ||
          msg.getType() === CometChat.MESSAGE_TYPE.CUSTOM 
      );

      // Reverse fetchedMessages to have newest first
      const reversedValidMessages = validMessages.reverse();

      // Prevent duplicates
      const uniqueValidMessages = reversedValidMessages.filter(
        (msg) => !localMessagesRef.current.some(existingMsg => existingMsg.getId() === msg.getId())
      );

      // Append older messages to the end of the messages array
      setMessages((prevMessages) => [...prevMessages, ...uniqueValidMessages]);
      localMessagesRef.current = [...localMessagesRef.current, ...uniqueValidMessages];

      // Find the last message from the other user that has not been read
      // const lastUnreadMessage = [...uniqueValidMessages].reverse().find(
      //   (message) =>
      //     message.getSender()?.getUid() === user.uid && !message.getReadAt()
      // );

      // // If such a message is found, mark it as read
      // if (lastUnreadMessage) {
      //   CometChat.markAsRead(lastUnreadMessage).then(
      //     () => {
      //       console.log('Last unread message marked as read:', lastUnreadMessage.getId());
      //     },
      //     (error: any) => {
      //       console.error('Error marking last unread message as read:', error);
      //     }
      //   );
      // }
      // Get the last unread message
      const lastUnreadMessageIndex = [...uniqueValidMessages].reverse().findIndex(
        (message) =>
          message.getSender()?.getUid() === user.uid && !message.getReadAt()
      );

      // If an unread message is found, mark all messages up to it as read
      if (lastUnreadMessageIndex !== -1) {
        const unreadMessages = [...uniqueValidMessages]
          .slice(0, uniqueValidMessages.length - lastUnreadMessageIndex)
          .reverse(); // Reverse again to go in the correct chronological order

        // Loop through all unread messages and mark them as read
        unreadMessages.forEach((message) => {
          if (!message.getReadAt()) {
            CometChat.markAsRead(message).then(
              () => {
                console.log('Message marked as read:', message.getId());
              },
              (error: any) => {
                console.error('Error marking message as read:', error);
              }
            );
          }
        });
      }

    } catch (error) {
      console.error('Message fetching failed with error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addCallListeners = () => {
    const listenerID = `listener_${user.uid}`;

    CometChat.addCallListener(
      listenerID,
      new CometChat.CallListener({
        onIncomingCallReceived: (call) => {
          console.log('Incoming call:', call);
          setSessionID(call.getSessionId());
          setCaller({
            name: call.getSender().getName(),
            avatar: call.getSender().getAvatar(),
          });
          setIncomingCallVisible(true);
        },
        onOutgoingCallAccepted: (call) => {
          setIncomingCallVisible(false);
          console.log('Outgoing call accepted:', call);
          startCallSession(call);
        },
        onOutgoingCallRejected: (call) => {
          console.log('Outgoing call rejected:', call);
          navigation.goBack();
          // fetchPreviousMessages();
        },
        onIncomingCallCancelled: (call) => {
          console.log('Incoming call cancelled:', call);
          setIncomingCallVisible(false);
          // fetchPreviousMessages();
        },
        onCallEndedMessageReceived: (call) => {
          console.log('CallEnded Message:', call);
          navigation.goBack();
          // fetchPreviousMessages();
        },
      })
    );
  };

  const removeCallListeners = () => {
    const listenerID = `listener_${user.uid}`;
    CometChat.removeCallListener(listenerID);
  };

  const sendMessage = async () => {
    if (text.trim() === '') return;
    endTypingIndicator();

    if (editingMessageId) {
      await editMessage(editingMessageId, text);
      setText('');
      setEditingMessageId(null);
    } else {
      await sendTextMessage(text);
      setText('');
    }
  };

  const sendTextMessage = async (messageText: string) => {
    const textMessage = new CometChat.TextMessage(user.uid, messageText, CometChat.RECEIVER_TYPE.USER);

    try {
      const sentMessage = await CometChat.sendMessage(textMessage);
      setMessages((prevMessages) => [sentMessage, ...prevMessages]);
      localMessagesRef.current = [sentMessage, ...localMessagesRef.current];
    } catch (error) {
      console.error('Message sending failed with error:', error);
    }
  };

  const editMessage = async (messageId: string, newText: string) => {
    const textMessage = new CometChat.TextMessage(user.uid, newText, CometChat.RECEIVER_TYPE.USER);
    textMessage.setId(Number(messageId));

    try {
      const editedMessage = await CometChat.editMessage(textMessage);
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.getId() === editedMessage.getId() ? editedMessage : msg
        )
      );
      localMessagesRef.current = localMessagesRef.current.map((msg) =>
        msg.getId() === editedMessage.getId() ? editedMessage : msg
      );
    } catch (error) {
      console.error('Message editing failed with error:', error);
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      const deletedMessage = await CometChat.deleteMessage(Number(messageId));
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.getId() === deletedMessage.getId() ? deletedMessage : msg
        )
      );
      localMessagesRef.current = localMessagesRef.current.map((msg) =>
        msg.getId() === deletedMessage.getId() ? deletedMessage : msg
      );
    } catch (error) {
      console.error('Message deletion failed with error:', error);
    }
  };

  const handleTextChange = (inputText: string) => {
    setText(inputText);
    sendTypingIndicator(inputText);
  };

  const handleBlur = () => {
    endTypingIndicator();
  };

  const sendTypingIndicator = (inputText: string) => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    const typingNotification = new CometChat.TypingIndicator(
      user.uid,
      CometChat.RECEIVER_TYPE.USER
    );

    if (inputText.trim() !== '') {
      CometChat.startTyping(typingNotification);

      // Stop typing indicator after 3 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        CometChat.endTyping(typingNotification);
      }, 3000);
    } else {
      CometChat.endTyping(typingNotification);
    }
  };

  const endTypingIndicator = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    const typingNotification = new CometChat.TypingIndicator(
      user.uid,
      CometChat.RECEIVER_TYPE.USER
    );
    CometChat.endTyping(typingNotification);
  };

  const startEditingMessage = (message: CometChat.TextMessage) => {
    setText(message.getText());
    setEditingMessageId(message.getId().toString());
  };

  const showMessageOptions = (message: CometChat.TextMessage) => {
    const options = [
      { text: 'Edit', onPress: () => startEditingMessage(message) },
      {
        text: 'Delete',
        onPress: () => {
          deleteMessage(message.getId().toString());
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ];

    Alert.alert('Message Options', 'Choose an action:', options);
  };

  const getMessageStatusIcon = (item: CometChat.BaseMessage) => {
    const senderUID = item.getSender()?.getUid();

    if (senderUID !== currentUserID) {
      return ''; // No tick for received messages
    }

    if (item.getReadAt()) {
      return '✓✓'; // Double tick for read
    } else if (item.getDeliveredAt()) {
      return '✓'; // Single tick for delivered
    } else {
      return '✓'; // Single tick for sent
    }
  };

  const renderMessage = ({ item }: { item: CometChat.BaseMessage }) => {
    const senderUID = item.getSender()?.getUid();
    const isSentByCurrentUser = senderUID === currentUserID;
    const isDeleted = item.getDeletedAt() ? true : false;
    const text =
      item.getType() === CometChat.MESSAGE_TYPE.TEXT && item.getText();
    const edited = item.getEditedAt() ? true : false;
    const messageCategory = item.getCategory();
    const messageType = item.getType();
    const callStatus = item.getStatus();

    if (messageType === CometChat.MESSAGE_TYPE.TEXT) {
      // Render text message or deleted message
      return (
        <TouchableOpacity
          onLongPress={() =>
            isSentByCurrentUser &&
            !isDeleted &&
            showMessageOptions(item as CometChat.TextMessage)
          }
        >
          <View
            style={[
              styles.messageBubble,
              isSentByCurrentUser ? styles.sentMessage : styles.receivedMessage,
              isDeleted ? styles.deletedMessage : null,
            ]}
          >
            {isDeleted ? (
              <Text style={styles.deletedText}>This message was deleted</Text>
            ) : (
              <>
                <Text style={styles.messageText}>{text || 'No message'}</Text>
                {edited && <Text style={styles.editedText}>(edited)</Text>}
              </>
            )}
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.senderName}>
                {item.getSender()?.getName()}
              </Text>
              {isSentByCurrentUser && !isDeleted && (
                <Text style={styles.messageStatus}>
                  {getMessageStatusIcon(item)}
                </Text>
              )}
            </View>
          </View>
        </TouchableOpacity>
      );
    } else if (messageCategory === CometChat.CATEGORY_CALL) {
      // Cast item to CometChat.Call
      const callItem = item as unknown as CometChat.Call;
      const callType = callItem.getType();
      const isInitiatedByCurrentUser =
        callItem.getCallInitiator().getUid() === currentUserID;

      // Handle call messages
      if (
        callStatus === CometChat.CALL_STATUS.INITIATED &&
        isInitiatedByCurrentUser
      ) {
        // Current user initiated the call
        return (
          <View style={[styles.callBubble, styles.sentCallBubble]}>
            <Icon
              name={callType === CometChat.CALL_TYPE.AUDIO ? 'phone' : 'video-camera'}
              size={20}
              color="#fff"
              style={styles.callIcon}
            />
            <Text style={styles.callText}>
              You called via{' '}
              {callType === CometChat.CALL_TYPE.AUDIO ? 'audio' : 'video'}
            </Text>
          </View>
        );
      } else if (
        callStatus === CometChat.CALL_STATUS.INITIATED &&
        !isInitiatedByCurrentUser
      ) {
        // Other user initiated the call
        return (
          <View style={[styles.callBubble, styles.receivedCallBubble]}>
            <Icon
              name={callType === CometChat.CALL_TYPE.AUDIO ? 'phone' : 'video-camera'}
              size={20}
              color="#fff"
              style={styles.callIcon}
            />
            <Text style={styles.callText}>
              {callItem.getSender().getName()} called you via{' '}
              {callType === CometChat.CALL_TYPE.AUDIO ? 'audio' : 'video'}
            </Text>
          </View>
        );
      } else if (
        callStatus === CometChat.CALL_STATUS.UNANSWERED &&
        isInitiatedByCurrentUser
      ) {
        // Call was not answered by the other user
        return (
          <View style={[styles.callBubble, styles.sentCallBubble]}>
            <Icon name="phone" size={20} color="#fff" style={styles.callIcon} />
            <Text style={styles.callText}>
              You did not answer your call
            </Text>
          </View>
        );
      } else if (
        callStatus === CometChat.CALL_STATUS.UNANSWERED &&
        !isInitiatedByCurrentUser
      ) {
        // Current user missed a call
        return (
          <View style={[styles.callBubble, styles.receivedCallBubble]}>
            <Icon name="phone" size={20} color="#fff" style={styles.callIcon} />
            <Text style={styles.callText}>
              Missed call from {callItem.getSender().getName()}
            </Text>
          </View>
        );
      } else {
        // Skip rendering other call statuses to avoid duplicates
        return null;
      }
    } else {
      // Handle other message types if necessary
      return null;
    }
  };

  const initiateCallUser = async (callType: string) => {
    const receiverID = user.uid;
    const call = new CometChat.Call(receiverID, callType, CometChat.RECEIVER_TYPE.USER);

    CometChat.initiateCall(call).then(
      (outGoingCall) => {
        console.log('Call initiated successfully:', outGoingCall);
        navigation.navigate('CallingScreen', { sessionID: outGoingCall.getSessionId(), user, callType });
      },
      (error) => {
        console.log('Call initiation failed with exception:', error);
      }
    );
  };

  const acceptIncomingCall = (sessionID: string) => {
    setIncomingCallVisible(false);
    setCaller(null);
    CometChat.acceptCall(sessionID).then(
      (call) => {
        console.log('Call accepted successfully:', call);
        const callType = call.getType();
        navigation.navigate('CallingScreen', { sessionID, user, callType });
      },
      (error) => {
        console.log('Call acceptance failed with error', error);
      }
    );
  };

  const rejectIncomingCall = (sessionID: string) => {
    setIncomingCallVisible(false);
    setCaller(null);
    const rejectStatus = CometChat.CALL_STATUS.REJECTED;
    CometChat.rejectCall(sessionID, rejectStatus).then(
      (call) => {
        console.log('Call rejected successfully');
      },
      (error) => {
        console.log('Call rejection failed with error:', error);
      }
    );
  };

  const startCallSession = (call: CometChat.Call) => {
    const callType = call.getType();
    navigation.navigate('CallingScreen', { sessionID: call.getSessionId(), user, callType });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Modal
        animationType="slide"
        transparent={true}
        visible={incomingCallVisible}
        onRequestClose={() => {
          // Handle the back button press if needed
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {caller?.avatar ? (
              <Image source={{ uri: caller.avatar }} style={styles.callerAvatar} />
            ) : (
              <View style={styles.callerAvatarPlaceholder}>
                <Text style={styles.callerInitial}>{caller?.name.charAt(0)}</Text>
              </View>
            )}
            <Text style={styles.callerName}>{caller?.name}</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.rejectButton]}
                onPress={() => rejectIncomingCall(sessionID!)}
              >
                <Text style={styles.buttonText}>Reject</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.acceptButton]}
                onPress={() => acceptIncomingCall(sessionID!)}
              >
                <Text style={styles.buttonText}>Accept</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <KeyboardAvoidingView
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'android' ? 40 : 0}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            {Platform.OS === 'android' ? (
              <Icon name="arrow-left" size={17} color="white" />
            ) : (
              <Text style={styles.backButtonText}>←</Text>
            )}
          </TouchableOpacity>
          <View style={styles.headerContent}>
            {user.avatar && <Image source={{ uri: user.avatar }} style={styles.avatar} />}
            <View style={styles.nameContainer}>
              <Text style={styles.headerText}>{user.name}</Text>
              {otherUserTyping && (
                <Text style={styles.typingText}>Typing...</Text>
              )}
            </View>
          </View>
          <TouchableOpacity
            onPress={() => initiateCallUser(CometChat.CALL_TYPE.AUDIO)}
            style={styles.callButton}
          >
            <Icon name="phone" size={20} color="white" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => initiateCallUser(CometChat.CALL_TYPE.VIDEO)}
            style={styles.callButton}
          >
            <Icon name="video-camera" size={20} color="white" />
          </TouchableOpacity>
        </View>

        <FlatList
          data={messages}
          keyExtractor={(item, index) => `${item.getId()}-${index}`}
          renderItem={renderMessage}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.messageList}
          inverted
          onEndReached={fetchPreviousMessages}
          onEndReachedThreshold={0.1}
          initialNumToRender={20}
          maxToRenderPerBatch={20}
          windowSize={21}
          removeClippedSubviews={true}
        />

        <View style={styles.inputContainer}>
          <TextInput
            ref={inputRef}
            value={text}
            onChangeText={handleTextChange}
            placeholder="Type a message"
            style={styles.input}
            onSubmitEditing={sendMessage}
            returnKeyType="send"
            onBlur={handleBlur}
          />
          <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
            <Text style={styles.sendButtonText}>{editingMessageId ? 'Edit' : 'Send'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChatScreen;

