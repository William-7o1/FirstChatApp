import React, { useEffect, useState } from 'react';
import { View, TextInput, TouchableOpacity, FlatList, Text, StyleSheet, KeyboardAvoidingView, Platform, Image, SafeAreaView, Alert, Modal } from 'react-native';
import { CometChat } from '@cometchat/chat-sdk-react-native';
import { AppConstants } from '../../../AppConstants';

const GroupChatScreen = ({ navigation, route }) => {
    const { group } = route.params;
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState('');
    const [editingMessageId, setEditingMessageId] = useState(null);
    const [isModalVisible, setModalVisible] = useState(false);
    const [members, setMembers] = useState([]);
    const currentUserID = AppConstants.UID;

    useEffect(() => {
        const listenerID = `listener_${group.guid}`;
        CometChat.addMessageListener(listenerID, {
            onTextMessageReceived: (message) => {
                setMessages((prevMessages) => [...prevMessages, message]);
            },
        });

        const fetchPreviousMessages = async () => {
            let messagesRequest = new CometChat.MessagesRequestBuilder()
                .setGUID(group.guid)
                .setLimit(30)
                .build();

            try {
                const fetchedMessages = await messagesRequest.fetchPrevious();
                const validMessages = fetchedMessages.filter(msg => msg.type !== 'deleted');
                setMessages((prevMessages) => [...validMessages.reverse(), ...prevMessages]);
            } catch (error) {
                console.error("Message fetching failed with error:", error);
            }
        };

        fetchPreviousMessages();

        return () => {
            CometChat.removeMessageListener(listenerID);
        };
    }, [group]);

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

    const sendMessage = () => {
        if (text.trim() === '') return;

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

        return (
            <TouchableOpacity onLongPress={() => isSentByCurrentUser && showMessageOptions(item)}>
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
                        </>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    const renderMember = ({ item }) => (
        <View style={styles.memberItem}>
            <Image source={{ uri: item.avatar }} style={styles.memberAvatar} />
            <Text style={styles.memberName}>{item.name}</Text>
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
                        <Text style={styles.backButtonText}>←</Text>
                    </TouchableOpacity>
                    <View style={styles.headerContent}>
                        <Image source={{ uri: group.icon }} style={styles.avatar} />
                        <Text style={styles.headerText}>{group.name}</Text>
                    </View>
                    <TouchableOpacity onPress={toggleModal} style={styles.infoButton}>
                        <Text style={styles.infoButtonText}>i</Text>
                    </TouchableOpacity>
                </View>

                <FlatList
                    data={messages}
                    keyExtractor={(item) => item.id}
                    renderItem={renderMessage}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.messageList}
                    inverted
                />
                <View style={styles.inputContainer}>
                    <TextInput
                        value={text}
                        onChangeText={setText}
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
                    visible={isModalVisible}
                    transparent={true}
                    animationType="slide"
                >
                    <View style={styles.modalContainer}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalGroupName}>{group.name}</Text>
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

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F0F0F0', // Light background for the entire screen
    },
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF', // White background for the chat
        padding: 15,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 10,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#58b6a6', // Header color
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius:10
    },
    backButton: {
        marginRight: 10,
    },
    backButtonText: {
        fontSize: 24,
        color: '#fff',
    },
    infoButton: {
        // backgroundColor: '#34C759', // Info button color
        borderRadius: 20,
        // borderWidth:2,
        padding: 8,
    },
    infoButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    headerContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
    },
    headerText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    messageList: {
        paddingBottom: 15,
    },
    messageBubble: {
        maxWidth: '80%',
        padding: 10,
        borderRadius: 15,
        marginVertical: 5,
    },
    sentMessage: {
        backgroundColor: '#E1FFC7', // Sent message color
        alignSelf: 'flex-end',
    },
    receivedMessage: {
        backgroundColor: '#F0F0F0', // Received message color
        alignSelf: 'flex-start',
    },
    deletedMessage: {
        backgroundColor: '#FFCCCB', // Color for deleted messages
    },
    deletedText: {
        color: '#A9A9A9',
        fontStyle: 'italic',
    },
    messageText: {
        fontSize: 16,
        color: '#333',
    },
    editedText: {
        fontSize: 12,
        color: '#A9A9A9',
    },
    senderName: {
        fontSize: 12,
        color: '#777',
        textAlign: 'right',
    },
    inputContainer: {
        marginTop:6,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: '#DDDDDD',
    },
    input: {
        flex: 1,
        padding: 10,
        borderRadius: 20,
        backgroundColor: '#F0F0F0',
        marginRight: 10,
        borderColor: '#DDDDDD',
        borderWidth: 1,
    },
    sendButton: {
        backgroundColor: '#007AFF',
        borderRadius: 20,
        paddingVertical: 10,
        paddingHorizontal: 20,
    },
    sendButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
    },
    modalContent: {
        width: '90%',
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        padding: 20,
    },
    modalGroupName: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    membersList: {
        maxHeight: 200,
        marginBottom: 10,
    },
    memberItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 5,
    },
    memberAvatar: {
        width: 30,
        height: 30,
        borderRadius: 15,
        marginRight: 10,
    },
    memberName: {
        fontSize: 16,
    },
    closeButton: {
        backgroundColor: '#FF3B30',
        borderRadius: 20,
        paddingVertical: 5,
        paddingHorizontal: 10,
        flex: 1, // Use flex to ensure buttons take equal space
        marginRight: 5, // Add space between buttons
    },
    closeButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        textAlign: 'center', // Center text within the button
    },
    leaveButton: {
        backgroundColor: '#FFCC00',
        borderRadius: 20,
        paddingVertical: 5,
        paddingHorizontal: 10,
        flex: 1, // Use flex to ensure buttons take equal space
        marginLeft: 5, // Add space between buttons
    },
    leaveButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        textAlign: 'center', // Center text within the button
    },
});

export default GroupChatScreen;
