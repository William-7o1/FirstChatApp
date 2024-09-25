import React, { useEffect, useRef, useState } from 'react';
import { View, TextInput, TouchableOpacity, FlatList, Text, KeyboardAvoidingView, Platform, Image, SafeAreaView, Alert } from 'react-native';
import { CometChat } from '@cometchat/chat-sdk-react-native';
import { AppConstants } from '../../../AppConstants';
import Icon from 'react-native-vector-icons/FontAwesome';
import { styles } from '../styles/ChatScreenStyle';

const ChatScreen = ({ navigation, route }) => {
    const { user } = route.params;
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState('');
    const [editingMessageId, setEditingMessageId] = useState(null);
    const [otherUserTyping, setOtherUserTyping] = useState(false);
    const currentUserID = AppConstants.UID;
    const inputRef = useRef(null);

    useEffect(() => {
        inputRef.current?.focus();
        const listenerID = `listener_${user.uid}`;
        
        CometChat.addMessageListener(listenerID, {
            onTextMessageReceived: (message) => {
                setMessages((prevMessages) => [...prevMessages, message]);
                fetchPreviousMessages();
            },
            onTypingStarted: (typingIndicator) => {
                setOtherUserTyping(true);
            },
            onTypingEnded: (typingIndicator) => {
                    setOtherUserTyping(false);
            },
            onMessageEdited: message => {
                fetchPreviousMessages();
            },
            onMessageDeleted: (messageId) => {
                fetchPreviousMessages();
            },
            onMessagesDelivered: (receipt) => {
                updateMessageStatus(receipt.messageId, 'delivered');
            },
            onMessagesRead: (receipt) => {
                updateAllDeliveredMessagesToRead(receipt.messageId);
            },                   
        });

        CometChat.addCallListener(
            listenerID,
            new CometChat.CallListener({
              onIncomingCallReceived: (call) => {
                console.log("Incoming call:", call);
                // Store the session ID for use when accepting or rejecting the call
                setSessionID(call.sessionId);
                // Navigate to a separate screen or show an alert
                Alert.alert("Incoming Call", `${call.sender.name} is calling`, [
                    { text: "Reject", onPress: () => rejectIncomingCall(call.sessionId) },
                    { text: "Accept", onPress: () => acceptIncomingCall(call.sessionId) }
                ]);
            },
              onOutgoingCallAccepted: (call) => {
                console.log("Outgoing call accepted:", call);
                // Outgoing Call Accepted
              },
              onOutgoingCallRejected: (call) => {
                console.log("Outgoing call rejected:", call);
                // Outgoing Call Rejected
              },
              onIncomingCallCancelled: (call) => {
                console.log("Incoming call calcelled:", call);
              },
              onCallEndedMessageReceived: (call) => {
                console.log("CallEnded Message:", call);
              },
            })
          );

        fetchPreviousMessages();

        return () => {
            CometChat.removeMessageListener(listenerID);
            CometChat.removeCallListener(listenerID);
        };
    }, [user]);

    const updateAllDeliveredMessagesToRead = (lastReadMessageId) => {
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
    
            fetchedMessages.forEach((msg) => {
                if (msg.actionOn) {
                    messagesMap.set(msg.actionOn.id, { ...msg.actionOn, edited: true });
                } else if (msg.type !== 'deleted') {
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
        if (text.trim() !== '') {
            let typingNotification = new CometChat.TypingIndicator(user.uid, CometChat.RECEIVER_TYPE.USER);
            CometChat.startTyping(typingNotification);
        }
         else {
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
                        (error) => {
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
                navigation.navigate('CallingScreen', { sessionID: call.getSessionId , user});
            },
            (error) => {
                console.log("Call initialization failed with exception:", error);
            }
            );
    }        

    const acceptIncomingCall = (sessionID) => {
        CometChat.acceptCall(sessionID).then(
            (call) => {
                console.log("Call accepted successfully:", call);
                navigation.navigate('CallingScreen', { sessionID, user });
            },
            (error) => {
                console.log("Call acceptance failed with error", error);
                // Handle the error appropriately
            }
        );
    };

    const rejectIncomingCall = (sessionID) => {
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

    // const cancelOutgoingCall = () => {
    //     var rejectStatus = CometChat.CALL_STATUS.CANCELLED;
    //     CometChat.rejectCall(sessionID, rejectStatus).then(
    //         (call) => {
    //             console.log("Call rejected successfully", call);
    //         },
    //         (error) => {
    //             console.log("Call rejection failed with error:", error);
    //         }
    //     );
    // };  
     
    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                style={styles.container}
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
