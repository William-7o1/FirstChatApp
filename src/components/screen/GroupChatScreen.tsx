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
    Modal 
} from 'react-native';
import { CometChat } from '@cometchat/chat-sdk-react-native';
import { AppConstants } from '../../../AppConstants';
import Icon from 'react-native-vector-icons/FontAwesome';
import { styles } from '../styles/GroupChatScreenStyle';
import { useFocusEffect } from '@react-navigation/native';

interface ChatScreenProps {
    navigation: any;
    route: {
        params: {
            group: any
        };
    };
}

const GroupChatScreen: React.FC<ChatScreenProps> = ({ navigation, route }) => {
    const { group } = route.params;
    const [messages, setMessages] = useState<any[]>([]);
    const [text, setText] = useState('');
    const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
    const [isModalVisible, setModalVisible] = useState(false);
    const [members, setMembers] = useState<any[]>([]);
    const currentUserID = AppConstants.UID;
    const inputRef = useRef<TextInput>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());

    // Unique listener IDs for message/user and group listeners
    const MESSAGE_USER_LISTENER_ID = `listener_${group.guid}`;
    const GROUP_LISTENER_ID = `group_listener_${group.guid}`;

    useFocusEffect(
        useCallback(() => {
            return () => {
                const typingNotification = new CometChat.TypingIndicator(group.guid, CometChat.RECEIVER_TYPE.GROUP);
                CometChat.endTyping(typingNotification);
            };
        }, [group.guid])
    );

    useEffect(() => {
        inputRef.current?.focus();
        
        // Add Message and User Listeners
        CometChat.addMessageListener(MESSAGE_USER_LISTENER_ID, {
            onTextMessageReceived: (message) => {
                // Fetch previous messages to ensure state consistency
                fetchPreviousMessages();
                console.log("New real-time message received", message);

                // Add the new real-time message to the top of the list if it's not a duplicate
                setMessages((prevMessages) => {
                    const currentMessageIds = new Set(prevMessages.map((msg) => msg.id));

                    if (!currentMessageIds.has(message.id)) {
                        return [message, ...prevMessages];
                    }
                    return prevMessages;
                });
            },
            onTypingStarted: (typing) => {
                setTypingUsers((prev) => {
                    const updated = new Set(prev);
                    updated.add(typing.sender.uid); 
                    return updated;
                });
            },
            onTypingEnded: (typing) => {
                setTypingUsers((prev) => {
                    const updated = new Set(prev);
                    updated.delete(typing.sender.uid); 
                    return updated;
                });
            },
            onMessageEdited: (editedMessage) => {
                setMessages((prevMessages) =>
                    prevMessages.map(msg => {
                        if (msg.id === editedMessage.id) {
                            return { 
                                ...msg, 
                                text: editedMessage.text, 
                                edited: true 
                                // Do not modify readAt or deliveredAt to preserve accurate read receipts
                            };
                        }
                        return msg;
                    })
                );
                // Removed automatic marking as read to ensure accurate read receipts
            },
            onMessageDeleted: (deletedMessage) => {
                setMessages((prevMessages) =>
                    prevMessages.map(msg =>
                        msg.id === deletedMessage.id ? { ...msg, type: 'deleted' } : msg
                    )
                );
            },
            onMessagesDeliveredToAll: (receipt) => {
                console.log("Message delivered to all:", receipt.receiptType, receipt.messageId);
                updateMessageStatus(receipt.messageId, 'delivered');
            },
            onMessagesReadByAll: (receipt) => {
                console.log("Message read by all:", receipt.receiptType, receipt.messageId);
                updateAllDeliveredMessagesToRead(receipt.messageId);
            },
        });

        CometChat.addUserListener(MESSAGE_USER_LISTENER_ID, {
            onUserOnline: (onlineUser) => {
                console.log("User is online:", onlineUser);
                setMembers(prevMembers => 
                    prevMembers.map(user => 
                        user.uid === onlineUser.uid 
                            ? { ...user, status: 'online' } 
                            : user
                    )
                );
            },
            onUserOffline: (offlineUser) => {
                console.log("User is offline:", offlineUser);
                setMembers(prevMembers => 
                    prevMembers.map(user => 
                        user.uid === offlineUser.uid 
                            ? { ...user, status: 'offline' } 
                            : user
                    )
                );
            },
        });
        
        // Add Group Listener for member left events
        CometChat.addGroupListener(GROUP_LISTENER_ID, new CometChat.GroupListener({
            onGroupMemberLeft: (message, leavingUser, group) => {
                console.log("User left", { message, leavingUser, group });
                if (!leavingUser) {
                    console.error("Leaving user is undefined.");
                    return;
                }
                // Create an action message indicating the user has left
                const actionMessage = {
                    id: `action_${Date.now()}`, // Unique ID for the action message
                    sender: leavingUser,
                    text: `${leavingUser.name || 'A user'} has left the group.`,
                    type: 'action',
                    createdAt: new Date(),
                };
                setMessages((prevMessages) => [actionMessage, ...prevMessages]);
            },
        }));

        fetchPreviousMessages();

        // Clean up listeners on unmount
        return () => {
            CometChat.removeMessageListener(MESSAGE_USER_LISTENER_ID);
            CometChat.removeUserListener(MESSAGE_USER_LISTENER_ID);
            CometChat.removeGroupListener(GROUP_LISTENER_ID);
        };
    }, [group.guid]);

    const fetchPreviousMessages = async () => {
        const messagesRequest = new CometChat.MessagesRequestBuilder()
            .setGUID(group.guid)
            .setLimit(30) // Fetch 30 messages at a time
            .build();
    
        try {
            const fetchedMessages = await messagesRequest.fetchPrevious();
            console.log("Fetched Messages:", fetchedMessages); // For debugging
    
            const messagesMap = new Map<string, any>();

            if (fetchedMessages.length === 0) {
                console.log("No previous messages, starting a new conversation.");
                setMessages([]);
                return;
            }

            fetchedMessages.forEach((msg) => {
                // Handle action messages
                if (msg.category === 'action') {
                    // Log the entire action message for debugging
                    console.log("Processing action message:", msg);

                    // Assuming action messages have 'action', 'actionBy', and 'actionFor'
                    const action = msg.action;
                    if (action === 'left') {
                        if (action.actionBy && action.actionBy.name) {
                            const actionMessage = {
                                id: `action_${msg.id}`, // Unique ID
                                sender: action.actionBy,
                                text: `${action.actionBy.name} has left the group.`,
                                type: 'action',
                                createdAt: msg.sentAt, // Use sentAt for ordering
                            };
                            messagesMap.set(actionMessage.id, actionMessage);
                        } else {
                            // Handle cases where actionBy is undefined
                            const actionMessage = {
                                id: `action_${msg.id}`, // Unique ID
                                sender: null,
                                text: `A user has left the group.`,
                                type: 'action',
                                createdAt: msg.sentAt, // Use sentAt for ordering
                            };
                            messagesMap.set(actionMessage.id, actionMessage);
                            console.warn("actionBy is undefined for action message:", msg);
                        }
                    }
                    return;
                }

                // Detect deleted messages
                if (msg.deletedAt || !msg.text) {
                    messagesMap.set(msg.id, { ...msg, type: 'deleted' });
                }
                // Detect edited messages using both `actionOn` and `editedAt`
                else if (msg.actionOn || msg.editedAt) {
                    let edited;
                    if (msg.actionOn) {
                        edited = { ...msg.actionOn, edited: true };
                    } else {
                        edited = { ...msg, edited: true };
                    }

                    // Preserve 'readAt' and 'deliveredAt' from the original message
                    edited.readAt = msg.readAt;
                    edited.deliveredAt = msg.deliveredAt;

                    // Set status based on readAt and deliveredAt
                    if (edited.readAt) {
                        edited.status = 'read';
                    } else if (edited.deliveredAt) {
                        edited.status = 'delivered';
                    } else {
                        edited.status = 'sent';
                    }

                    messagesMap.set(edited.id, edited);
                }
                else {
                    // Handle normal messages
                    msg.status = msg.readAt ? 'read' : (msg.deliveredAt ? 'delivered' : 'sent');
                    messagesMap.set(msg.id, { ...msg, edited: msg.edited || false });
                }

                // Debugging: Log processed messages
                console.log(`Processed Message ID: ${msg.id}, Edited: ${msg.edited || false}, Status: ${msg.status}`);
            });

            const validMessages = Array.from(messagesMap.values()).reverse();

            setMessages((prevMessages) => {
                const currentMessageIds = new Set(prevMessages.map((msg) => msg.id));
                const newMessages = validMessages.filter((msg) => !currentMessageIds.has(msg.id));
                return [...prevMessages, ...newMessages];
            });

            const lastMessage = fetchedMessages[fetchedMessages.length - 1];
            if (lastMessage) {
                CometChat.markAsRead(lastMessage).then(
                    () => {
                        console.log("Mark as read success for GROUP message:", lastMessage.id);
                    },
                    (error) => {
                        console.error("An error occurred when marking the message as read:", error);
                    }
                );
            }

        } catch (error) {
            console.error("Message fetching failed with error:", error);
        }
    };

    const updateAllDeliveredMessagesToRead = (lastReadMessageId: any) => {
        setMessages((prevMessages) =>
            prevMessages.map((msg) =>
                msg.id === lastReadMessageId || (msg.status === 'delivered' && !msg.readAt)
                    ? { ...msg, status: 'read' }
                    : msg
            )
        );
    };
    
    const updateMessageStatus = (messageId: any, status: string) => {
        setMessages((prevMessages) =>
            prevMessages.map((msg) =>
                msg.id === messageId ? { ...msg, status } : msg
            )
        );
    };

    const fetchGroupMembers = async () => {
        const membersRequest = new CometChat.GroupMembersRequestBuilder(group.guid)
            .setLimit(30)
            .build();

        try {
            const fetchedMembers = await membersRequest.fetchNext();
            setMembers(fetchedMembers);
        } catch (error) {
            console.error("Group members fetching failed with error:", error);
        }
    };

    const toggleModal = () => {
        if (!isModalVisible) {
            fetchGroupMembers();
        }
        setModalVisible(!isModalVisible);
    };

    const handleTextChange = (inputText: string) => {
        setText(inputText);
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current); // Clear previous timeout
        }
        if (!group || !CometChat) return; // Ensure that group and CometChat are available

        const typingNotification = new CometChat.TypingIndicator(group.guid, CometChat.RECEIVER_TYPE.GROUP);

        if (inputText.trim()) {
            CometChat.startTyping(typingNotification);
            typingTimeoutRef.current = setTimeout(() => {
                CometChat.endTyping(typingNotification);
            }, 3000);
        } else {
            CometChat.endTyping(typingNotification);
        }
    };

    const sendMessage = () => {
        if (text.trim() === '') return;
        let typingNotification = new CometChat.TypingIndicator(group.guid, CometChat.RECEIVER_TYPE.GROUP);
        CometChat.endTyping(typingNotification);

        if (editingMessageId) {
            let textMessage = new CometChat.TextMessage(group.guid, text, CometChat.RECEIVER_TYPE.GROUP);
            textMessage.setId(editingMessageId);

            CometChat.editMessage(textMessage).then(
                (editedMessage) => {
                    // Update the message in the state without altering readAt or deliveredAt
                    setMessages((prevMessages) =>
                        prevMessages.map(msg =>
                            msg.id === editedMessage.id
                                ? { 
                                    ...msg, 
                                    text: editedMessage.text, 
                                    edited: true 
                                    // Do not modify readAt or deliveredAt
                                  }
                                : msg
                        )
                    );
                    setText('');
                    setEditingMessageId(null);
                },
                (error) => {
                    console.error('Message editing failed with error:', error);
                }
            );
        } 
        else {
            let textMessage = new CometChat.TextMessage(group.guid, text, CometChat.RECEIVER_TYPE.GROUP);

            CometChat.sendMessage(textMessage).then(
                (sentMessage) => {
                    setMessages((prevMessages) => [sentMessage, ...prevMessages]);
                    setText('');
                    CometChat.markAsDelivered(sentMessage).then(
                        () => {
                            updateMessageStatus(sentMessage.id, 'delivered');
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

    const startEditingMessage = (message: any) => {
        setText(message.text);
        setEditingMessageId(message.id);
    };

    const showMessageOptions = (message: any) => {
        const options = [
            { text: 'Edit', onPress: () => { startEditingMessage(message) } },
            { text: 'Delete', onPress: () => { deleteMessage(message.id) } },
            { text: 'Cancel', style: 'cancel' }
        ];

        Alert.alert("Message Options", "Choose an action:", options);
    };

    const deleteMessage = (messageId: any) => {
        CometChat.deleteMessage(messageId).then(() => {
            setMessages((prevMessages) =>
                prevMessages.map(msg =>
                    msg.id === messageId ? { ...msg, type: 'deleted' } : msg
                )
            );
        }).catch(error => {
            console.error("Message deletion failed with error:", error);
        });
    };

    const renderMessage = ({ item }: { item: any }) => {
        if (!item) {
            return null;
        }

        // Handle action messages
        if (item.type === 'action') {
            return (
                <View style={styles.actionMessageContainer}>
                    <Text style={styles.actionMessageText}>{item.text}</Text>
                </View>
            );
        }

        // Skip rendering if category is 'action' but type is not handled
        if (item.category === 'action') {
            return null;
        }
    
        const isSentByCurrentUser = item.sender && item.sender.uid === currentUserID;
        const isDeleted = item.type === 'deleted'; // Correctly set in fetchPreviousMessages

        // Debugging Logs
        console.log(`Rendering Message ID: ${item.id}, Status: ${item.status}, Edited: ${item.edited}`);
        console.log(` - Read At: ${item.readAt}`);
        console.log(` - Delivered At: ${item.deliveredAt}`);
    
        const getMessageStatusIcon = () => {
            if (isSentByCurrentUser && item.status === 'delivered') {
                return "✓"; // Single tick for delivered
            } else if (isSentByCurrentUser && item.status === 'read') {
                return "✓✓"; // Double tick for read
            } else {
                return '✓'; // No tick for other messages
            }
        };
    
        return (
            <TouchableOpacity
                onLongPress={() => isSentByCurrentUser && !item.edited && !isDeleted && showMessageOptions(item)}>
                <View
                    style={[
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
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                                <Text style={styles.senderName}>{item.sender?.name || 'Unknown'}</Text>
                                {isSentByCurrentUser && (
                                    <Text style={styles.messageStatus}>{getMessageStatusIcon()}</Text>
                                )}
                            </View>
                        </>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    const renderMember = ({ item }: { item: any }) => (
        <View style={styles.memberItem}>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <Image source={{ uri: item.avatar }} style={styles.memberAvatar} />
                <Text style={styles.memberName}>{item.name}</Text>
            </View>
            <View>
                <Icon name="circle" size={12} color={item.status === 'online' ? 'green' : 'grey'} style={{ paddingLeft: 30 }}/>
            </View>
        </View>
    );

    // Handler for leaving the group
    const handleLeaveGroup = () => {
        Alert.alert(
            "Leave Group",
            "Are you sure you want to leave this group?",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Leave", style: "destructive", onPress: () => leaveGroup() }
            ]
        );
    };

    const leaveGroup = () => {
        const GUID: string = group.guid;
        
        CometChat.leaveGroup(GUID).then(
            (hasLeft: boolean) => {
                console.log("Group left successfully:", hasLeft);
                Alert.alert("Left Group", "You have left the group successfully.");
                navigation.goBack(); // Navigate back after leaving
            }, (error: CometChat.CometChatException) => {
                console.log("Group leaving failed with exception:", error);
                Alert.alert("Error", "Failed to leave the group. Please try again.");
            }
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                keyboardVerticalOffset={Platform.OS === 'android' ? 40 : 0}
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        {Platform.OS === 'android' ? <Icon name="arrow-left" size={17} color="white" />  :  <Text style={styles.backButtonText}>←</Text>}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={toggleModal} style={styles.headerContent}>
                        {group.icon ? <Image source={{ uri: group.icon }} style={styles.avatar} /> : <Image style={styles.avatar} source={ require('../../asset/logo.png')}/>}
                        <Text style={styles.headerText}>{group.name}</Text>
                        {typingUsers.size > 0 && (
                            <Text style={{fontSize:14, marginLeft:8, color:'white', marginTop:2}}>typing...</Text>
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.callButton}>
                        <Icon name="phone" size={20} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.callButton}>
                        <Icon name="video-camera" size={20} color="white" />
                    </TouchableOpacity>
                </View>
                <FlatList
                    data={messages}
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
                    />
                    <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
                        <Text style={styles.sendButtonText}>{editingMessageId ? 'Edit' : 'Send'}</Text>
                    </TouchableOpacity>
                </View>

                {/* Modal for Group Info */}
                <Modal
                    presentationStyle='pageSheet'
                    visible={isModalVisible}
                    animationType="slide"
                >
                    <View style={styles.modalContainer}>
                        <View style={styles.modalContent}>
                            <View style={{flexDirection:'row', alignItems: 'center', marginBottom: 10}}>
                                {group.icon ? (
                                    <Image source={{ uri: group.icon }} style={styles.avatar} />
                                ) : (
                                    <Image style={styles.avatar} source={ require('../../asset/logo.png')}/>
                                )}
                                <Text style={styles.modalGroupName}>{group.name}</Text>
                            </View>
                            <Text style={styles.modalSubName}>Member List</Text>
                            <FlatList
                                data={members}
                                keyExtractor={(item) => item.uid}
                                renderItem={renderMember}
                                style={styles.membersList}
                            />
                            <View style={styles.buttonContainer}>
                                <TouchableOpacity onPress={toggleModal} style={styles.closeButton}>
                                    <Text style={styles.closeButtonText}>Close</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={handleLeaveGroup} style={styles.leaveButton}>
                                    <Text style={styles.leaveButtonText}>Leave Group</Text>
                                </TouchableOpacity>
                            </View>
                            
                        </View>
                    </View>
                </Modal>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );

};

export default GroupChatScreen;
