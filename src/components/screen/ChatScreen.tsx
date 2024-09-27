import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, TextInput, TouchableOpacity, FlatList, Text, KeyboardAvoidingView, Platform, Image, SafeAreaView, Alert } from 'react-native';
import { CometChat } from '@cometchat/chat-sdk-react-native';
import { AppConstants } from '../../../AppConstants';
import Icon from 'react-native-vector-icons/FontAwesome';
import { styles } from '../styles/ChatScreenStyle';
import { useFocusEffect } from '@react-navigation/native';

interface ChatScreenProps {
    navigation: any;
    route: {
      params: {
        user: {
          uid: string;
          name: string;
        };
      };
    };
  }

  const ChatScreen: React.FC<ChatScreenProps> = ({ navigation, route }) => {
    const { user } = route.params;
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState('');
    const [editingMessageId, setEditingMessageId] = useState(null);
    const [otherUserTyping, setOtherUserTyping] = useState(false);
    const currentUserID = AppConstants.UID;
    const inputRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const [sessionID, setSessionID] = useState<string | null>(null);
    const [incomingCallVisible, setIncomingCallVisible] = useState(false);


    useFocusEffect(
        useCallback(() => {
            return () => {
                let typingNotification = new CometChat.TypingIndicator(user.uid, CometChat.RECEIVER_TYPE.USER);
                CometChat.endTyping(typingNotification);
            };
        }, [])
    );

    const createlogedInUserAuthToken = async () => {
        try {
            let loggedInUser = await CometChat.getLoggedinUser();
            let authToken = loggedInUser?.getAuthToken();
            return authToken;
        } catch (error) {
            console.error("Error fetching auth token: ", error);
            return null;
        }
    };

    // console.log(createlogedInUserAuthToken(),"authTokenauthTokenauthTokenauthToken");
    // const token = createlogedInUserAuthToken();

    useEffect(() => {
        inputRef.current?.focus();
        const listenerID = `listener_${user.uid}`;
        
        CometChat.addMessageListener(listenerID, {
            onTextMessageReceived: (message) => {
                setMessages((prevMessages) => [...prevMessages, message]);
                fetchPreviousMessages();
            },
            onTypingStarted: () => {
                setOtherUserTyping(true);
            },
            onTypingEnded: () => {
                    setOtherUserTyping(false);
            },
            onMessageEdited: () => {
                fetchPreviousMessages();
            },
            onMessageDeleted: () => {
                fetchPreviousMessages();
            },
            onMessagesDelivered: (receipt:any) => {
                updateMessageStatus(receipt.messageId, 'delivered');
            },
            onMessagesRead: (receipt:any) => {
                updateAllDeliveredMessagesToRead(receipt.messageId);
            },                   
        });

        CometChat.addCallListener(
            listenerID,
            new CometChat.CallListener({
            onIncomingCallReceived: (call) => {
                console.log("Incoming call:", call);
                setSessionID(call.sessionId);
                setIncomingCallVisible(true); 
                Alert.alert(
                    "Incoming Call",
                    `${call.sender.name} is calling`,
                    [
                        { text: "Reject", onPress: () => rejectIncomingCall(call.sessionId) },
                        { text: "Accept", onPress: () => acceptIncomingCall(call.sessionId) }
                    ]
                );
            },
            onOutgoingCallAccepted: (call) => {
                setIncomingCallVisible(false);
                console.log("Outgoing call accepted:", call);
                startCallSession(call);
                // navigation.navigate('CallingScreen', { sessionID: call.sessionId, user });
            },
            onOutgoingCallRejected: (call) => {
                console.log("Outgoing call rejected:", call);
                // End the calling screen if the call is rejected
                Alert.alert("Call Rejected", `${call.sender.name} rejected the call.`);
                navigation.goBack();  // Navigate back to the chat screen
            },
            onIncomingCallCancelled: (call) => {
                console.log("Incoming call cancelled:", call);
                setIncomingCallVisible(false);
                // Dismiss the alert when the call is cancelled
                Alert.alert("Call Cancelled", "The caller has cancelled the call.");
            },
            onCallEndedMessageReceived: (call) => {
                console.log("CallEnded Message:", call);
                // End the calling screen if the call has ended
                navigation.goBack();  // Navigate back to the chat screen
            },
            })
          );

        fetchPreviousMessages();

        return () => {
            CometChat.removeMessageListener(listenerID);
            CometChat.removeCallListener(listenerID);
        };
    }, [user]);

    const updateAllDeliveredMessagesToRead = (lastReadMessageId:any) => {
        setMessages((prevMessages) =>
            prevMessages.map((msg) =>
                msg.status === 'delivered' || msg.id === lastReadMessageId ? { ...msg, status: 'read' } : msg
            )
        );
    };

    const fetchPreviousMessages = async () => {
        let messagesRequest = new CometChat.MessagesRequestBuilder()
            .setUID(user.uid)
            .setLimit(30)
            .build();
    
        try {
            const fetchedMessages = await messagesRequest.fetchPrevious();
            const messagesMap = new Map();
    
            fetchedMessages.forEach((msg: CometChat.BaseMessage) => {
                if (msg.actionOn) {
                    messagesMap.set(msg.actionOn.id, { ...msg.actionOn, edited: true });
                } else if (msg.type === 'audio') {
                    // Log audio message and don't push it
                    console.log("Audio message:", msg);
                } else if (msg.type === 'text' && msg.type !== 'deleted') {
                    // Set delivery status based on the message status
                    msg.status = msg.delivered ? 'delivered' : msg.status;
                    msg.status = msg.readAt ? 'read' : msg.status; // Ensure read status
                    messagesMap.set(msg.id, { ...msg, edited: msg.edited || false });
                }
            });
    
            const validMessages = Array.from(messagesMap.values()).reverse();
            setMessages((prevMessages) => [...validMessages, ...prevMessages]);
    
            // Mark the last message as read
            const lastMessage = fetchedMessages[fetchedMessages.length - 1];
            if (lastMessage) {
                CometChat.markAsRead(lastMessage).then(
                    () => {
                        console.log("Mark as read success for message:", lastMessage.id);
                    },
                    (error) => {
                        console.log("An error occurred when marking the message as unread:", error);
                    }
                );
            }
        } catch (error) {
            console.error("Message fetching failed with error:", error);
        }
    };
    
   
    const updateMessageStatus = (messageId, status) => {
        setMessages((prevMessages) =>
            prevMessages.map((msg) =>
                msg.id === messageId ? { ...msg, status } : msg
            )
        );
    };

    const handleTextChange = (text) => {
        setText(text);

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current); // Clear previous timeout
        }

        if (text.trim() !== '') {
            let typingNotification = new CometChat.TypingIndicator(user.uid, CometChat.RECEIVER_TYPE.USER);
            CometChat.startTyping(typingNotification);

            // Stop typing indicator after 3 seconds of inactivity
            typingTimeoutRef.current = setTimeout(() => {
                let typingNotification = new CometChat.TypingIndicator(user.uid, CometChat.RECEIVER_TYPE.USER);
                CometChat.endTyping(typingNotification);
            }, 3000); // 3 seconds delay
        } else {
            let typingNotification = new CometChat.TypingIndicator(user.uid, CometChat.RECEIVER_TYPE.USER);
            CometChat.endTyping(typingNotification);
        }
    };
    
    const handleBlur = () => {
        CometChat.endTyping(user.uid, CometChat.RECEIVER_TYPE.USER);
    };

    const sendMessage = () => {
        if (text.trim() === '') return;
        let typingNotification = new CometChat.TypingIndicator(user.uid, CometChat.RECEIVER_TYPE.USER);
        CometChat.endTyping(typingNotification);    
        if (editingMessageId) {
            let textMessage = new CometChat.TextMessage(user.uid, text, CometChat.RECEIVER_TYPE.USER);
            textMessage.setId(editingMessageId);

            CometChat.editMessage(textMessage).then(
                (editedMessage) => {
                    setMessages((prevMessages) =>
                        prevMessages.map(msg =>
                            msg.id === editingMessageId ? { ...editedMessage, edited: true } : msg
                        )
                    );
                    setText('');
                    setEditingMessageId(null);
                },
                (error) => {
                    console.error('Message editing failed with error:', error);
                }
            );
        } else {
            let textMessage = new CometChat.TextMessage(user.uid, text, CometChat.RECEIVER_TYPE.USER);

            CometChat.sendMessage(textMessage).then(
                (sentMessage) => {
                    setMessages((prevMessages) => [sentMessage, ...prevMessages]);
                    setText('');
                    CometChat.markAsDelivered(sentMessage).then(
                        () => {
                            updateMessageStatus(sentMessage.id, 'delivered');
                          console.log("mark as delivered success.");
                        },
                        (error: any) => {
                          console.log(
                            "An error occurred when marking the message as delivered.",
                            error
                          );
                        }
                      );
                },
                (error) => {
                    console.error('Message sending failed with error:', error);
                }
            );
        }
    };

    const startEditingMessage = (message) => {
        setText(message.text);
        setEditingMessageId(message.id);
    };

    const showMessageOptions = (message) => {
        const options = [
            { text: 'Edit', onPress: () => startEditingMessage(message) },
            { text: 'Delete', onPress: () => {deleteMessage(message.id)
                fetchPreviousMessages();
            } },
            { text: 'Cancel', style: 'cancel' }
        ];

        Alert.alert("Message Options", "Choose an action:", options);
    };

    const deleteMessage = (messageId) => {
        CometChat.deleteMessage(messageId).then(() => {
            fetchPreviousMessages();
            setMessages((prevMessages) => prevMessages.filter(msg => msg.id !== messageId));
        }).catch(error => {
            console.error("Message deletion failed with error:", error);
        });
    };

    const renderMessage = ({ item } ) => {
        const isSentByCurrentUser = item.sender.uid === currentUserID;
        const isDeleted = item.type === 'deleted' || item.text === undefined;
        
        const getMessageStatusIcon = () => {
            if (isSentByCurrentUser && item.status === 'delivered') {
                return "✓"; // Single tick for delivered
            } else if (isSentByCurrentUser && item.status === 'read') {
                return "✓✓"; // Double tick for read
            } else {
                return "✓"; // No tick for other messages
            }
        };
    
        return (
            item.type === 'text' ?
            <TouchableOpacity onLongPress={() => isSentByCurrentUser && !isDeleted && !item.edited  && showMessageOptions(item)}>
                <View style={[
                    styles.messageBubble,
                    isSentByCurrentUser ? styles.sentMessage : styles.receivedMessage,
                    isDeleted ? styles.deletedMessage : null
                ]}>
                    {isDeleted ? (
                        <Text style={styles.deletedText}>This message was deleted</Text>
                    ) : (
                        <>
                            <Text style={styles.messageText}>{item.text || 'No message'}</Text>
                            {item.edited && <Text style={styles.editedText}>(edited)</Text>}
                            <View style={{flexDirection:'row'}}>
                                <Text style={styles.senderName}>{item.sender.name}</Text>
                                {isSentByCurrentUser && 
                                <Text style={styles.messageStatus}>{getMessageStatusIcon()}</Text> 
                                }
                            </View>
                        </>
                    )}
                </View>
            </TouchableOpacity> : ""
        );
    };

    const initiateCallUser = async (callType) => {
        const receiverID = user.uid;
        const call = new CometChat.Call(receiverID, callType, CometChat.RECEIVER_TYPE.USER);
    
        CometChat.initiateCall(call).then(
            (outGoingCall) => {
                console.log("Call initiated successfully:", outGoingCall);
                navigation.navigate('CallingScreen', { sessionID: outGoingCall.sessionId, user, });
            },
            (error) => {
                console.log("Call initiation failed with exception:", error);
            }
        );
    };

    const acceptIncomingCall = (sessionID) => {
        setIncomingCallVisible(false);
        // startCallSession(call);
        CometChat.acceptCall(sessionID).then(
          (call) => {
            console.log("Call accepted successfully:", call);
            navigation.navigate('CallingScreen', { sessionID, user });
          },
          (error) => {
            console.log("Call acceptance failed with error", error);
          }
        );
      };

      const rejectIncomingCall = (sessionID) => {
        setIncomingCallVisible(false);
        const rejectStatus = CometChat.CALL_STATUS.REJECTED;
        CometChat.rejectCall(sessionID, rejectStatus).then(
          (call) => {
            console.log("Call rejected successfully", call);
          },
          (error) => {
            console.log("Call rejection failed with error:", error);
          }
        );
      };

      const startCallSession = (call) => {
        // Navigate to the calling screen and start the call session
        navigation.navigate('CallingScreen', { sessionID: call.sessionId, user });
    };
    
    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                style={styles.container}
                keyboardVerticalOffset={Platform.OS === 'android' ? 40 : 0}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        {Platform.OS === 'android' ? <Icon name="arrow-left" size={17} color="white" />  :  <Text style={styles.backButtonText}>←</Text>}
                    </TouchableOpacity>
                    <View style={styles.headerContent}>
                        <Image source={{ uri: user.avatar }} style={styles.avatar} />
                        <Text style={styles.headerText}>{user.name}</Text>
                        {
                            otherUserTyping 
                            // true
                            && 
                            <Text style={{ marginLeft: 10, fontSize: 14, marginTop: 3, color: 'white' }}>
                                Typing...
                            </Text>
                        }
                    </View>
                    <TouchableOpacity onPress={() => initiateCallUser(CometChat.CALL_TYPE.AUDIO)} style={styles.callButton}>
                        <Icon name="phone" size={20} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => initiateCallUser(CometChat.CALL_TYPE.VIDEO)} style={styles.callButton}>
                        <Icon name="video-camera" size={20} color="white" />
                    </TouchableOpacity>                   
                </View>

                <FlatList
                    data={messages}
                    // keyExtractor={(item) => item.id}
                    keyExtractor={(item, index) => `${item.id}-${index}`}
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
