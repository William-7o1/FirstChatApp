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
import { createMessageHelper } from '../helper/MessageHelper';
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
  const [messages, setMessages] = useState<CometChat.BaseMessage[]>([]);
  const [text, setText] = useState('');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const currentUserID = AppConstants.UID;
  const inputRef = useRef<TextInput>(null);
  const messageHelperRef = useRef<any>(null);
  // const [sessionID, setSessionID] = useState<string | null>(null);
  // const [incomingCallVisible, setIncomingCallVisible] = useState(false);
  const [messageStatuses, setMessageStatuses] = useState([]);
  // const [caller, setCaller] = useState<{ name: string; avatar?: string } | null>(null);
  const { setIncomingCallVisible, setCaller, setSessionID, incomingCallVisible, caller, sessionID } = useCall();

  useFocusEffect(
    useCallback(() => {
      return () => {
        messageHelperRef.current?.endTypingIndicator();
      };
    }, [])
  );

  useEffect(() => {
    inputRef.current?.focus();
    
    const messageHelper = createMessageHelper({
      userId: user.uid,
      currentUserId: currentUserID,
      onMessagesUpdated: (updatedMessages) => {
        setMessages(updatedMessages);
      },
      onMessageAdded: (message) => {
        const senderUID = message.getSender()?.getUid();
        if (senderUID !== currentUserID) {
          if (!message.getReadAt()) {
            CometChat.markAsRead(message);
          }
        }
        setMessages((prevMessages) => [message, ...prevMessages]);
      },
      onTypingStatusChanged: (isTyping) => {
        setOtherUserTyping(isTyping);
      },
      onMessageEdited: (editedMessage) => {
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.getId() === editedMessage.getId() ? editedMessage : msg
          )
        );
      },
      onMessageDeleted: (deletedMessage) => {
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.getId() === deletedMessage.getId() ? deletedMessage : msg
          )
        );
      },
      onMessageUpdated: (updatedMessage) => {
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.getId() === updatedMessage.getId() ? updatedMessage : msg
          )
        );
      },    
    });

    messageHelper.initialize();
    messageHelperRef.current = messageHelper;

    // Fetch previous messages
    messageHelper.fetchPreviousMessages();

    const listenerID = `listener_${user.uid}`;

    // Add call listeners
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
          // Alert.alert('Call Rejected', `${call.getSender().getName()} rejected the call.`);
          navigation.goBack();
        },
        onIncomingCallCancelled: (call) => {
          console.log('Incoming call cancelled:', call);
          setIncomingCallVisible(false);
          // Alert.alert('Call Cancelled', 'The caller has cancelled the call.');
        },
        onCallEndedMessageReceived: (call) => {
          console.log('CallEnded Message:', call);
          navigation.goBack();
        },
      })
    );

    return () => {
      messageHelper.removeListeners();
      CometChat.removeCallListener(listenerID);
    };
  }, [user]);

  const sendMessage = () => {
    if (text.trim() === '') return;
    messageHelperRef.current?.endTypingIndicator();
    if (editingMessageId) {
      messageHelperRef.current?.editMessage(editingMessageId, text);
      setText('');
      setEditingMessageId(null);
    } else {
      messageHelperRef.current?.sendMessage(text);
      setText('');
    }
  };

  const handleTextChange = (text: string) => {
    setText(text);
    messageHelperRef.current?.sendTypingIndicator(text);
  };

  const handleBlur = () => {
    messageHelperRef.current?.endTypingIndicator();
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

  const deleteMessage = (messageId: string) => {
    messageHelperRef.current?.deleteMessage(messageId);
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
      // Render text message
      return isDeleted ? (
        <Text style={styles.deletedText}>This message was deleted</Text>
      ) : (
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
            ]}
          >
            <Text style={styles.messageText}>{text || 'No message'}</Text>
            {edited && <Text style={styles.editedText}>(edited)</Text>}
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.senderName}>
                {item.getSender()?.getName()}
              </Text>
              {isSentByCurrentUser && (
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
      const callItem = item as CometChat.Call;
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
      } 
      // else if (
      //   callStatus === CometChat.CALL_STATUS.REJECTED &&
      //   isInitiatedByCurrentUser
      // ) 
      // {
      //   // Other user rejected the call
      //   return (
      //     <View style={[styles.callBubble, styles.sentCallBubble]}>
      //       <Icon name="phone" size={20} color="#fff" style={styles.callIcon} />
      //       <Text style={styles.callText}>
      //         {callItem.getSender().getName()} rejected your call
      //       </Text>
      //     </View>
      //   );
      // }
       else if (
        callStatus === CometChat.CALL_STATUS.UNANSWERED &&
        isInitiatedByCurrentUser
      ) {
        // Call was not answered by the other user
        return (
          <View style={[styles.callBubble, styles.sentCallBubble]}>
            <Icon name="phone" size={20} color="#fff" style={styles.callIcon} />
            <Text style={styles.callText}>
              {callItem.getSender().getName()} did not answer your call
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
        console.log('Call initiated successfully:');
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
        navigation.navigate('CallingScreen', { sessionID, user, callType});
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
            // onPress={()=> {}}
            style={styles.callButton}
          >
            <Icon name="phone" size={20} color="white" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => initiateCallUser(CometChat.CALL_TYPE.VIDEO)}
            // onPress={()=> {}}
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



// import React, { useCallback, useEffect, useRef, useState } from 'react';
// import {
//   View,
//   TextInput,
//   TouchableOpacity,
//   FlatList,
//   Text,
//   KeyboardAvoidingView,
//   Platform,
//   Image,
//   SafeAreaView,
//   Alert,
// } from 'react-native';
// import { CometChat } from '@cometchat/chat-sdk-react-native';
// import { AppConstants } from '../../../AppConstants';
// import Icon from 'react-native-vector-icons/FontAwesome';
// import { styles } from '../styles/ChatScreenStyle';
// import { useFocusEffect } from '@react-navigation/native';
// import { createMessageHelper } from '../helper/MessageHelper';
// import { Modal } from 'react-native';
// import { useCall } from '../../../CallContext';

// interface ChatScreenProps {
//   navigation: any;
//   route: {
//     params: {
//       user: {
//         uid: string;
//         name: string;
//         avatar?: string;
//       };
//     };
//   };
// }

// const ChatScreen: React.FC<ChatScreenProps> = ({ navigation, route }) => {
//   const { user } = route.params;
//   const [messages, setMessages] = useState<CometChat.BaseMessage[]>([]);
//   const [text, setText] = useState('');
//   const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
//   const [otherUserTyping, setOtherUserTyping] = useState(false);
//   const currentUserID = AppConstants.UID;
//   const inputRef = useRef<TextInput>(null);
//   const messageHelperRef = useRef<any>(null);
//   // const [sessionID, setSessionID] = useState<string | null>(null);
//   // const [incomingCallVisible, setIncomingCallVisible] = useState(false);
  
//   // const [caller, setCaller] = useState<{ name: string; avatar?: string } | null>(null);
//   const { setIncomingCallVisible, setCaller, setSessionID, incomingCallVisible, caller, sessionID } = useCall();
//   // const [messages, setMessages] = useState<CometChat.BaseMessage[]>([]);
//   const [messageStatuses, setMessageStatuses] = useState<{ [key: number]: string }>({});


//   useFocusEffect(
//     useCallback(() => {
//       return () => {
//         messageHelperRef.current?.endTypingIndicator();
//       };
//     }, [])
//   );

//   useEffect(() => {
//     inputRef.current?.focus();
    
//     const messageHelper = createMessageHelper({
//       userId: user.uid,
//       currentUserId: currentUserID,
//       onMessagesUpdated: (updatedMessages) => {
//         updateMessagesWithStatus(updatedMessages);
//       },
//       onMessageAdded: (message) => {
//         const senderUID = message.getSender()?.getUid();
//         if (senderUID !== currentUserID) {
//           if (!message.getReadAt()) {
//             CometChat.markAsRead(message);
//           }
//         }
//         setMessages((prevMessages) => [message, ...prevMessages]);
//       },
//       onTypingStatusChanged: (isTyping) => {
//         setOtherUserTyping(isTyping);
//       },
//       onMessageEdited: (editedMessage) => {
//         setMessages((prevMessages) =>
//           prevMessages.map((msg) =>
//             msg.getId() === editedMessage.getId() ? editedMessage : msg
//           )
//         );
//       },
//       onMessageDeleted: (deletedMessage) => {
//         setMessages((prevMessages) =>
//           prevMessages.map((msg) =>
//             msg.getId() === deletedMessage.getId() ? deletedMessage : msg
//           )
//         );
//       },
//       onMessageUpdated: (updatedMessage) => {
//         updateMessagesWithStatus([updatedMessage, ...messages]);
//       },
//     });
  
//     messageHelper.initialize();
//     messageHelperRef.current = messageHelper;
  
//     // Fetch previous messages
//     messageHelper.fetchPreviousMessages();
  
//     const listenerID = `listener_${user.uid}`;
  
//     // Add call listeners
//     CometChat.addCallListener(
//       listenerID,
//       new CometChat.CallListener({
//         onIncomingCallReceived: (call) => {
//           console.log('Incoming call:', call);
//           setSessionID(call.getSessionId());
//           setCaller({
//             name: call.getSender().getName(),
//             avatar: call.getSender().getAvatar(),
//           });
//           setIncomingCallVisible(true);
//         },
//         onOutgoingCallAccepted: (call) => {
//           setIncomingCallVisible(false);
//           console.log('Outgoing call accepted:', call);
//           startCallSession(call);
//         },
//         onOutgoingCallRejected: (call) => {
//           console.log('Outgoing call rejected:', call);
//           navigation.goBack();
//         },
//         onIncomingCallCancelled: (call) => {
//           console.log('Incoming call cancelled:', call);
//           setIncomingCallVisible(false);
//         },
//         onCallEndedMessageReceived: (call) => {
//           console.log('CallEnded Message:', call);
//           navigation.goBack();
//         },
//       })
//     );
  
//     return () => {
//       messageHelper.removeListeners();
//       CometChat.removeCallListener(listenerID);
//     };
//   }, [user]);
  
//   // Update messages and statuses
//   const updateMessagesWithStatus = (updatedMessages: CometChat.BaseMessage[]) => {
//     setMessages(updatedMessages);
    
//     const updatedStatuses = {};
//     updatedMessages.forEach((msg) => {
//       if (msg.getReadAt()) {
//         updatedStatuses[msg.getId()] = 'read';
//       } else if (msg.getDeliveredAt()) {
//         updatedStatuses[msg.getId()] = 'delivered';
//       } else {
//         updatedStatuses[msg.getId()] = 'sent';
//       }
//     });
  
//     setMessageStatuses(updatedStatuses);
//   };

//   const sendMessage = () => {
//     if (text.trim() === '') return;
//     messageHelperRef.current?.endTypingIndicator();
//     if (editingMessageId) {
//       messageHelperRef.current?.editMessage(editingMessageId, text);
//       setText('');
//       setEditingMessageId(null);
//     } else {
//       messageHelperRef.current?.sendMessage(text);
//       setText('');
//     }
//   };

//   // const onMessagesUpdatedT = (updatedMessages: CometChat.BaseMessage[]) => {
//   //   setMessages(updatedMessages);
    
//   //   const updatedStatuses = {};
//   //   updatedMessages.forEach((msg) => {
//   //     if (msg.getReadAt()) {
//   //       updatedStatuses[msg.getId()] = 'read';
//   //     } else if (msg.getDeliveredAt()) {
//   //       updatedStatuses[msg.getId()] = 'delivered';
//   //     } else {
//   //       updatedStatuses[msg.getId()] = 'sent';
//   //     }
//   //   });
    
//   //   setMessageStatuses(updatedStatuses);
//   // };

//   const handleTextChange = (text: string) => {
//     setText(text);
//     messageHelperRef.current?.sendTypingIndicator(text);
//   };

//   const handleBlur = () => {
//     messageHelperRef.current?.endTypingIndicator();
//   };

//   const startEditingMessage = (message: CometChat.TextMessage) => {
//     setText(message.getText());
//     setEditingMessageId(message.getId().toString());
//   };

//   const showMessageOptions = (message: CometChat.TextMessage) => {
//     const options = [
//       { text: 'Edit', onPress: () => startEditingMessage(message) },
//       {
//         text: 'Delete',
//         onPress: () => {
//           deleteMessage(message.getId().toString());
//         },
//       },
//       { text: 'Cancel', style: 'cancel' },
//     ];

//     Alert.alert('Message Options', 'Choose an action:', options);
//   };

//   const deleteMessage = (messageId: string) => {
//     messageHelperRef.current?.deleteMessage(messageId);
//   };

//   const getMessageStatusIcon = (item: CometChat.BaseMessage) => {
//     const status = messageStatuses[item.getId()];
    
//     if (status === 'read') {
//       return '✓✓'; // Double tick for read
//     } else if (status === 'delivered') {
//       return '✓'; // Single tick for delivered
//     } else {
//       return '✓'; // Single tick for sent
//     }
//   };
  
  
//   const renderMessage = ({ item }: { item: CometChat.BaseMessage }) => {
//     const senderUID = item.getSender()?.getUid();
//     const isSentByCurrentUser = senderUID === currentUserID;
//     const isDeleted = item.getDeletedAt() ? true : false;
//     const text =
//       item.getType() === CometChat.MESSAGE_TYPE.TEXT && item.getText();
//     const edited = item.getEditedAt() ? true : false;
//     const messageCategory = item.getCategory();
//     const messageType = item.getType();
//     const callStatus = item.getStatus();
  
//     if (messageType === CometChat.MESSAGE_TYPE.TEXT) {
//       // Render text message
//       return isDeleted ? (
//         <Text style={styles.deletedText}>This message was deleted</Text>
//       ) : (
//         <TouchableOpacity
//           onLongPress={() =>
//             isSentByCurrentUser &&
//             !isDeleted &&
//             showMessageOptions(item as CometChat.TextMessage)
//           }
//         >
//           <View
//             style={[
//               styles.messageBubble,
//               isSentByCurrentUser ? styles.sentMessage : styles.receivedMessage,
//             ]}
//           >
//             <Text style={styles.messageText}>{text || 'No message'}</Text>
//             {edited && <Text style={styles.editedText}>(edited)</Text>}
//             <View style={{ flexDirection: 'row', alignItems: 'center' }}>
//               <Text style={styles.senderName}>
//                 {item.getSender()?.getName()}
//               </Text>
//               {isSentByCurrentUser && (
//                 <Text style={styles.messageStatus}>
//                   {getMessageStatusIcon(item)}
//                 </Text>
//               )}
//             </View>
//           </View>
//         </TouchableOpacity>
//       );
//     } else if (messageCategory === CometChat.CATEGORY_CALL) {
//       // Cast item to CometChat.Call
//       const callItem = item as CometChat.Call;
//       const callType = callItem.getType();
//       const isInitiatedByCurrentUser =
//         callItem.getCallInitiator().getUid() === currentUserID;
  
//       // Handle call messages
//       if (
//         callStatus === CometChat.CALL_STATUS.INITIATED &&
//         isInitiatedByCurrentUser
//       ) {
//         // Current user initiated the call
//         return (
//           <View style={[styles.callBubble, styles.sentCallBubble]}>
//             <Icon
//               name={callType === CometChat.CALL_TYPE.AUDIO ? 'phone' : 'video-camera'}
//               size={20}
//               color="#fff"
//               style={styles.callIcon}
//             />
//             <Text style={styles.callText}>
//               You called via{' '}
//               {callType === CometChat.CALL_TYPE.AUDIO ? 'audio' : 'video'}
//             </Text>
//           </View>
//         );
//       } else if (
//         callStatus === CometChat.CALL_STATUS.INITIATED &&
//         !isInitiatedByCurrentUser
//       ) {
//         // Other user initiated the call
//         return (
//           <View style={[styles.callBubble, styles.receivedCallBubble]}>
//             <Icon
//               name={callType === CometChat.CALL_TYPE.AUDIO ? 'phone' : 'video-camera'}
//               size={20}
//               color="#fff"
//               style={styles.callIcon}
//             />
//             <Text style={styles.callText}>
//               {callItem.getSender().getName()} called you via{' '}
//               {callType === CometChat.CALL_TYPE.AUDIO ? 'audio' : 'video'}
//             </Text>
//           </View>
//         );
//       } 
//       // else if (
//       //   callStatus === CometChat.CALL_STATUS.REJECTED &&
//       //   isInitiatedByCurrentUser
//       // ) 
//       // {
//       //   // Other user rejected the call
//       //   return (
//       //     <View style={[styles.callBubble, styles.sentCallBubble]}>
//       //       <Icon name="phone" size={20} color="#fff" style={styles.callIcon} />
//       //       <Text style={styles.callText}>
//       //         {callItem.getSender().getName()} rejected your call
//       //       </Text>
//       //     </View>
//       //   );
//       // }
//        else if (
//         callStatus === CometChat.CALL_STATUS.UNANSWERED &&
//         isInitiatedByCurrentUser
//       ) {
//         // Call was not answered by the other user
//         return (
//           <View style={[styles.callBubble, styles.sentCallBubble]}>
//             <Icon name="phone" size={20} color="#fff" style={styles.callIcon} />
//             <Text style={styles.callText}>
//               {callItem.getSender().getName()} did not answer your call
//             </Text>
//           </View>
//         );
//       } else if (
//         callStatus === CometChat.CALL_STATUS.UNANSWERED &&
//         !isInitiatedByCurrentUser
//       ) {
//         // Current user missed a call
//         return (
//           <View style={[styles.callBubble, styles.receivedCallBubble]}>
//             <Icon name="phone" size={20} color="#fff" style={styles.callIcon} />
//             <Text style={styles.callText}>
//               Missed call from {callItem.getSender().getName()}
//             </Text>
//           </View>
//         );
//       } else {
//         // Skip rendering other call statuses to avoid duplicates
//         return null;
//       }
//     } else {
//       // Handle other message types if necessary
//       return null;
//     }
//   };
  
//   const initiateCallUser = async (callType: string) => {
//     const receiverID = user.uid;
//     const call = new CometChat.Call(receiverID, callType, CometChat.RECEIVER_TYPE.USER);

//     CometChat.initiateCall(call).then(
//       (outGoingCall) => {
//         console.log('Call initiated successfully:');
//         navigation.navigate('CallingScreen', { sessionID: outGoingCall.getSessionId(), user, callType });
//       },
//       (error) => {
//         console.log('Call initiation failed with exception:', error);
//       }
//     );
//   };


//   const acceptIncomingCall = (sessionID: string) => {
//     setIncomingCallVisible(false);
//     setCaller(null);
//     CometChat.acceptCall(sessionID).then(
//       (call) => {
//         console.log('Call accepted successfully:', call);
//         const callType = call.getType();
//         navigation.navigate('CallingScreen', { sessionID, user, callType});
//       },
//       (error) => {
//         console.log('Call acceptance failed with error', error);
//       }
//     );
//   };
  
//   const rejectIncomingCall = (sessionID: string) => {
//     setIncomingCallVisible(false);
//     setCaller(null);
//     const rejectStatus = CometChat.CALL_STATUS.REJECTED;
//     CometChat.rejectCall(sessionID, rejectStatus).then(
//       (call) => {
//         console.log('Call rejected successfully');
//       },
//       (error) => {
//         console.log('Call rejection failed with error:', error);
//       }
//     );
//   };

//   const startCallSession = (call: CometChat.Call) => {
//     const callType = call.getType();
//     navigation.navigate('CallingScreen', { sessionID: call.getSessionId(), user, callType });
//   };

//   return (
//     <SafeAreaView style={styles.safeArea}>
//       <Modal
//         animationType="slide"
//         transparent={true}
//         visible={incomingCallVisible}
//         onRequestClose={() => {
//           // Handle the back button press if needed
//         }}
//       >
//         <View style={styles.modalOverlay}>
//           <View style={styles.modalContainer}>
//             {caller?.avatar ? (
//               <Image source={{ uri: caller.avatar }} style={styles.callerAvatar} />
//             ) : (
//               <View style={styles.callerAvatarPlaceholder}>
//                 <Text style={styles.callerInitial}>{caller?.name.charAt(0)}</Text>
//               </View>
//             )}
//             <Text style={styles.callerName}>{caller?.name}</Text>
//             <View style={styles.modalButtons}>
//               <TouchableOpacity
//                 style={[styles.modalButton, styles.rejectButton]}
//                 onPress={() => rejectIncomingCall(sessionID!)}
//               >
//                 <Text style={styles.buttonText}>Reject</Text>
//               </TouchableOpacity>
//               <TouchableOpacity
//                 style={[styles.modalButton, styles.acceptButton]}
//                 onPress={() => acceptIncomingCall(sessionID!)}
//               >
//                 <Text style={styles.buttonText}>Accept</Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//         </View>
//       </Modal>
//       <KeyboardAvoidingView
//         style={styles.container}
//         keyboardVerticalOffset={Platform.OS === 'android' ? 40 : 0}
//         behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//       >
//         <View style={styles.header}>
//           <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
//             {Platform.OS === 'android' ? (
//               <Icon name="arrow-left" size={17} color="white" />
//             ) : (
//               <Text style={styles.backButtonText}>←</Text>
//             )}
//           </TouchableOpacity>
//           <View style={styles.headerContent}>
//             {user.avatar && <Image source={{ uri: user.avatar }} style={styles.avatar} />}
//             <View style={styles.nameContainer}>
//               <Text style={styles.headerText}>{user.name}</Text>
//               {otherUserTyping && (
//                 <Text style={styles.typingText}>Typing...</Text>
//               )}
//             </View>
//           </View>
//           <TouchableOpacity
//             onPress={() => initiateCallUser(CometChat.CALL_TYPE.AUDIO)}
//             // onPress={()=> {}}
//             style={styles.callButton}
//           >
//             <Icon name="phone" size={20} color="white" />
//           </TouchableOpacity>
//           <TouchableOpacity
//             onPress={() => initiateCallUser(CometChat.CALL_TYPE.VIDEO)}
//             // onPress={()=> {}}
//             style={styles.callButton}
//           >
//             <Icon name="video-camera" size={20} color="white" />
//           </TouchableOpacity>
//         </View>

//         <FlatList
//           data={messages}
//           keyExtractor={(item, index) => `${item.getId()}-${index}`}
//           renderItem={renderMessage}
//           showsVerticalScrollIndicator={false}
//           contentContainerStyle={styles.messageList}
//           inverted
//         />

//         <View style={styles.inputContainer}>
//           <TextInput
//             ref={inputRef}
//             value={text}
//             onChangeText={handleTextChange}
//             placeholder="Type a message"
//             style={styles.input}
//             onSubmitEditing={sendMessage}
//             returnKeyType="send"
//             onBlur={handleBlur}
//           />
//           <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
//             <Text style={styles.sendButtonText}>{editingMessageId ? 'Edit' : 'Send'}</Text>
//           </TouchableOpacity>
//         </View>
//       </KeyboardAvoidingView>
//     </SafeAreaView>
//   );
// };

// export default ChatScreen;

