import React, { useEffect, useRef, useState } from 'react';
import { View, TextInput, TouchableOpacity, FlatList, Text, StyleSheet, KeyboardAvoidingView, Platform, Image, SafeAreaView, Alert, Modal } from 'react-native';
import { CometChat } from '@cometchat/chat-sdk-react-native';
import { AppConstants } from '../../../AppConstants';
import Icon from 'react-native-vector-icons/FontAwesome';
import { styles } from '../styles/GroupChatScreenStyle';

const GroupChatScreen = ({ navigation, route }) => {
    const { group } = route.params;
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState('');
    const [editingMessageId, setEditingMessageId] = useState(null);
    const [isModalVisible, setModalVisible] = useState(false);
    const [members, setMembers] = useState([]);
    const currentUserID = AppConstants.UID;
    const inputRef = useRef(null);

    useEffect(() => {
        inputRef.current?.focus();
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
                        {/* <Text style={styles.infoButtonText}>i</Text> */}
                        <Icon name="exclamation" size={20} color="white" />
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
                        ref={inputRef}
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
