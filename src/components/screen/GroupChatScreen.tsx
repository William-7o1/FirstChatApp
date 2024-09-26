import React, { useEffect, useRef, useState } from 'react';
import { View, TextInput, TouchableOpacity, FlatList, Text, StyleSheet, KeyboardAvoidingView, Platform, Image, SafeAreaView, Alert, Modal } from 'react-native';
import { CometChat } from '@cometchat/chat-sdk-react-native';
import { AppConstants } from '../../../AppConstants';
import Icon from 'react-native-vector-icons/FontAwesome';
import { styles } from '../styles/GroupChatScreenStyle';

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
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState('');
    const [editingMessageId, setEditingMessageId] = useState(null);
    const [isModalVisible, setModalVisible] = useState(false);
    const [members, setMembers] = useState([]);
    const currentUserID = AppConstants.UID;
    const inputRef = useRef(null);
    const [typingUsers, setTypingUsers] = useState(new Set());

    useEffect(() => {
        inputRef.current?.focus();
        const listenerID = `listener_${group.guid}`;
        CometChat.addMessageListener(listenerID, {
            onTextMessageReceived: (message) => {
                setMessages((prevMessages) => [...prevMessages, message]);
                fetchPreviousMessages();
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
            onMessageEdited: () => {
                fetchPreviousMessages();
            },
            onMessageDeleted: () => {
                fetchPreviousMessages();
            },
            onMessagesDeliveredToAll: (receipt) => {
                console.log("Message delivered to all:", receipt.receiptType);
                updateMessageStatus(receipt.messageId, 'delivered');
            },
            onMessagesReadByAll: (receipt) => {
                console.log("Message read by all:", receipt.receiptType);
                updateMessageStatus(receipt.messageId, 'read');
            },
        });

        CometChat.addUserListener(listenerID, {
            onUserOnline: (onlineUser) => {
                console.log("User is online:", onlineUser);
                setUsers(prevUsers => 
                    prevUsers.map(user => 
                        user.uid === onlineUser.uid 
                            ? { ...user, status: 'online' } 
                            : user
                    )
                );
            },
            onUserOffline: (offlineUser) => {
                console.log("User is offline:", offlineUser);
                setUsers(prevUsers => 
                    prevUsers.map(user => 
                        user.uid === offlineUser.uid 
                            ? { ...user, status: 'offline' } 
                            : user
                    )
                );
            },
        });
        
        fetchPreviousMessages();

        return () => {
            CometChat.removeMessageListener(listenerID);
            CometChat.removeUserListener(listenerID);
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
    
            fetchedMessages.forEach((msg) => {
                // Handle edited messages
                if (msg.actionOn) {
                    messagesMap.set(msg.actionOn.id, { ...msg.actionOn, edited: true });
                } else if (msg.type !== 'deleted') {
                    // Set appropriate status (delivered/read) for the message
                    msg.status = msg.delivered ? 'delivered' : msg.status;
                    msg.status = msg.readAt ? 'read' : msg.status;
                    messagesMap.set(msg.id, { ...msg, edited: msg.edited || false });
                }
            });
    
            // Reverse the messages for display order and update the state
            const validMessages = Array.from(messagesMap.values()).reverse();
            setMessages((prevMessages) => [...validMessages, ...prevMessages]);
    
            // Mark the last fetched message as read
            const lastMessage = fetchedMessages[fetchedMessages.length - 1];
            if (lastMessage) {
                CometChat.markAsRead(lastMessage).then(
                    () => {
                        console.log("Mark as read success for message:", lastMessage.id);
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
    
    const updateMessageStatus = (messageId, status) => {
        // console.log(`Updating message with ID: ${messageId} to status: ${status}`);
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


    const handleTextChange = (text) => {
        setText(text);
    
        if (!group || !CometChat) return; // Ensure that group and CometChat are available
    
        const typingNotification = new CometChat.TypingIndicator(group.guid, CometChat.RECEIVER_TYPE.GROUP);
    
        if (text.trim()) {
            CometChat.startTyping(typingNotification);
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
            let textMessage = new CometChat.TextMessage(group.guid, text, CometChat.RECEIVER_TYPE.GROUP);

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
            { text: 'Delete', onPress: () => {
                deleteMessage(message.id)
                fetchPreviousMessages();
            } },
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
            <TouchableOpacity onLongPress={() => isSentByCurrentUser && !item.edited && !isDeleted && showMessageOptions(item)}>
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
                            <Text style={styles.senderName}>{item.sender.name}</Text>
                            {isSentByCurrentUser && 
                                <Text style={styles.messageStatus}>{getMessageStatusIcon()}</Text> 
                                }
                        </>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    const renderMember = ({ item }) => (
        <View style={styles.memberItem}>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <Image source={{ uri: item.avatar }} style={styles.memberAvatar} />
                <Text style={styles.memberName}>{item.name}</Text>
            </View>
            <View>
                {/* {console.log(user.status)} */}
             <Icon name="circle" size={12} color = {item.status === 'online' ? 'green' : 'grey'} style={{ paddingLeft: 30}}/>
            </View>
         </View>
            
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                style={styles.container}
                // keyboardVerticalOffset={-10}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        {/* <Text style={styles.backButtonText}>←</Text> */}
                        {Platform.OS === 'android' ? <Icon name="arrow-left" size={17} color="white" />  :  <Text style={styles.backButtonText}>←</Text>}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={toggleModal} style={styles.headerContent}>
                        <Image source={{ uri: group.icon }} style={styles.avatar} />
                        <Text style={styles.headerText}>{group.name}</Text>
                        {
                        typingUsers.size > 0
                         &&
                        <Text style={{fontSize:12, marginLeft:8, color:'white', marginTop:2}}>typing...</Text>
                        }
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
                    // keyExtractor={(item) => item.id}
                    keyExtractor={(item, index) => `${item.id}-${index}`}
                    renderItem={renderMessage}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.messageList}
                    inverted
                    ListEmptyComponent={() => (
                        <View style={styles.emptyMessageContainer}>
                            <Text style={styles.emptyMessageText}>No messages yet. Start the conversation!</Text>
                        </View>
                    )}
                />
                
                <View style={styles.inputContainer}>
                    <TextInput
                        ref={inputRef}
                        value={text}
                        onChangeText={handleTextChange}
                        // onChangeText={setText}
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
                    // transparent={true}
                    animationType="slide"
                >
                    <View style={styles.modalContainer}>
                        <View style={styles.modalContent}>
                            <View style={{flexDirection:'row'}}>
                                <Image source={{ uri: group.icon }} style={styles.avatar} />
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
                                <TouchableOpacity style={styles.leaveButton}>
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
