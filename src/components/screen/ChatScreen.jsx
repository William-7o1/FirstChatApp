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
                // markMessageAsRead(message);
            },
            onTypingStarted: (typing) => {
                if (typing.sender.uid === user.uid) {
                    setOtherUserTyping(true);
                }
            },
            onTypingEnded: (typing) => {
                if (typing.sender.uid === user.uid) {
                    setOtherUserTyping(false);
                }
            },
            onMessagesDelivered: (receipt) => {
                console.log("Message delivered:", receipt.receiptType); // Check if this log appears
                updateMessageStatus(receipt.messageId, 'delivered');
            },
            onMessagesRead: (receipt) => {
                console.log("Message read:", receipt.receiptType); // Check if this log appears
                updateMessageStatus(receipt.messageId, 'read');
            }

            // onMessagesDelivered: (messageReceipt) => {
            //     console.log("Message is delivered to a user: ", { messageReceipt });
            //   },
            // onMessagesRead: (messageReceipt) => {
            //     console.log("Message is read by a user: ", { messageReceipt });
            //   }

        });

        fetchPreviousMessages();

        return () => {
            CometChat.removeMessageListener(listenerID);
        };
    }, [user]);

    const fetchPreviousMessages = async () => {
        let messagesRequest = new CometChat.MessagesRequestBuilder()
            .setUID(user.uid)
            .setLimit(30)
            .build();
    
        try {
            const fetchedMessages = await messagesRequest.fetchPrevious();
            const messagesMap = new Map();
            fetchedMessages.forEach(msg => {
                CometChat.markAsRead(msg).then(
                    () => {
                        // console.log("mark as read success." , msg.id);
                        updateMessageStatus(msg.id, 'read');
                    },
                    (error) => {
                        console.log("An error occurred when marking the message as read.", error);
                    }
                );
                if (msg.actionOn) {
                    messagesMap.set(msg.actionOn.id, { ...msg.actionOn, edited: true });
                } else if (msg.type !== 'deleted') {
                    // Set delivery status based on the message status
                    msg.status = msg.delivered ? 'delivered' : msg.status; // Add delivery status
                    messagesMap.set(msg.id, { ...msg, edited: msg.edited || false });
                }
            });
    
            const validMessages = Array.from(messagesMap.values()).reverse();
            setMessages((prevMessages) => [...validMessages, ...prevMessages]);
    
        } catch (error) {
            console.error("Message fetching failed with error:", error);
        }
    };


    const updateMessageStatus = (messageId, status) => {
        // console.log(`Updating message with ID: ${messageId} to status: ${status}`);
        setMessages((prevMessages) =>
            prevMessages.map((msg) =>
                msg.id === messageId ? { ...msg, status } : msg
            )
        );
    };

    const handleTextChange = (text) => {
        setText(text);
        if (text.trim() !== '') {
            CometChat.startTyping(user.uid, CometChat.RECEIVER_TYPE.USER);
        } else {
            CometChat.endTyping(user.uid, CometChat.RECEIVER_TYPE.USER);
        }
    };
    
    const handleBlur = () => {
        CometChat.endTyping(user.uid, CometChat.RECEIVER_TYPE.USER);
    };

    const sendMessage = () => {
        if (text.trim() === '') return;

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
            { text: 'Delete', onPress: () => deleteMessage(message.id) },
            { text: 'Cancel', style: 'cancel' }
        ];

        Alert.alert("Message Options", "Choose an action:", options);
    };

    const deleteMessage = (messageId) => {
        CometChat.deleteMessage(messageId).then(() => {
            setMessages((prevMessages) => prevMessages.filter(msg => msg.id !== messageId));
        }).catch(error => {
            console.error("Message deletion failed with error:", error);
        });
    };

    const renderMessage = ({ item }) => {
        const isSentByCurrentUser = item.sender.uid === currentUserID;
        const isDeleted = item.type === 'deleted' || item.text === undefined;
        
        const getMessageStatusIcon = () => {
            // Show tick only for delivered messages sent by the current user
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

    const rejectIncomingCall = () => {
        var rejectStatus = CometChat.CALL_STATUS.REJECTED;
        CometChat.rejectCall(sessionID, rejectStatus).then(
            (call) => {
                console.log("Call rejected successfully", call);
            },
            (error) => {
                console.log("Call rejection failed with error:", error);
            }
        );
    };

        
     
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
                            <Text style={{ marginLeft: 10, fontSize: 12, marginTop: 3, color: 'white' }}>
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


