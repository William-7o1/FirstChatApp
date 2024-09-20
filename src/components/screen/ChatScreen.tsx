import React, { useEffect, useState } from 'react';
import { View, TextInput, TouchableOpacity, FlatList, Text, StyleSheet, KeyboardAvoidingView, Platform, Image, SafeAreaView, Alert } from 'react-native';
import { CometChat } from '@cometchat/chat-sdk-react-native';
import { AppConstants } from '../../../AppConstants';

const ChatScreen = ({ navigation, route }) => {
    const { user } = route.params;
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState('');
    const [editingMessageId, setEditingMessageId] = useState(null);
    const currentUserID = AppConstants.UID;

    useEffect(() => {
        const listenerID = `listener_${user.uid}`;
        
        CometChat.addMessageListener(listenerID, {
            onTextMessageReceived: (message) => {
                setMessages((prevMessages) => [...prevMessages, message]);
            },
        });

        const fetchPreviousMessages = async () => {
            const messagesRequest = new CometChat.MessagesRequestBuilder()
                .setUID(user.uid)
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
    }, [user]);

    const sendMessage = () => {
        if (text.trim() === '') return;

        let textMessage = new CometChat.TextMessage(user.uid, text, CometChat.RECEIVER_TYPE.USER);
        
        if (editingMessageId) {
            textMessage.setId(editingMessageId);
            CometChat.editMessage(textMessage).then(editedMessage => {
                setMessages(prevMessages =>
                    prevMessages.map(msg =>
                        msg.id === editingMessageId ? { ...editedMessage, edited: true } : msg
                    )
                );
                resetInput();
            }).catch(error => console.error('Message editing failed with error:', error));
        } else {
            CometChat.sendMessage(textMessage).then(sentMessage => {
                setMessages(prevMessages => [sentMessage, ...prevMessages]);
                resetInput();
            }).catch(error => console.error('Message sending failed with error:', error));
        }
    };

    const resetInput = () => {
        setText('');
        setEditingMessageId(null);
    };

    const startEditingMessage = (message) => {
        setText(message.text);
        setEditingMessageId(message.id);
    };

    const showMessageOptions = (message) => {
        Alert.alert("Message Options", "Choose an action:", [
            { text: 'Edit', onPress: () => startEditingMessage(message) },
            { text: 'Delete', onPress: () => deleteMessage(message.id) },
            { text: 'Cancel', style: 'cancel' }
        ]);
    };

    const deleteMessage = (messageId) => {
        CometChat.deleteMessage(messageId).then(() => {
            setMessages((prevMessages) => prevMessages.filter(msg => msg.id !== messageId));
        }).catch(error => console.error("Message deletion failed with error:", error));
    };

    const renderMessage = ({ item }) => {
        const isSentByCurrentUser = item.sender.uid === currentUserID;
        const isDeleted = item.type === 'deleted' || !item.text;

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
                            <Text style={styles.messageText}>{item.text}</Text>
                            {item.edited && <Text style={styles.editedText}>(edited)</Text>}
                            <Text style={styles.senderName}>{item.sender.name}</Text>
                        </>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView 
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <View style={styles.header}>
                    <Text onPress={() => navigation.navigate('Home')} style={styles.backText}> Back </Text>
                    <View style={styles.headerContent}>
                        <Image source={{ uri: user.avatar }} style={styles.avatar} />
                        <Text style={styles.headerText}>{user.name}</Text>
                    </View>
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
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 25,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        position: 'relative',
        marginBottom: 30,
    },
    backText: {
        fontSize: 16,
        color: '#6200ee',
        position: 'absolute',
        left: -10,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        position: 'absolute',
        left: '45%',
        transform: [{ translateX: -50 }],
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
    },
    messageList: {
        paddingBottom: 20,
    },
    messageBubble: {
        padding: 10,
        borderRadius: 15,
        marginVertical: 5,
        maxWidth: '80%',
    },
    sentMessage: {
        backgroundColor: '#E1FFC7',
        alignSelf: 'flex-end',
        borderBottomRightRadius: 0,
    },
    receivedMessage: {
        backgroundColor: '#F0F0F0',
        alignSelf: 'flex-start',
        borderBottomLeftRadius: 0,
    },
    deletedMessage: {
        backgroundColor: 'white',
        borderColor: '#FFCCCB',
        borderWidth: 1,
    },
    deletedText: {
        fontSize: 14,
        color: '#721c24',
        textAlign: 'center',
    },
    messageText: {
        fontSize: 16,
        color: '#000',
    },
    editedText: {
        fontSize: 12,
        color: '#888',
        marginTop: 2,
    },
    senderName: {
        fontSize: 12,
        color: '#555',
        marginTop: 5,
        alignSelf: 'flex-end',
    },
    inputContainer: {
        marginTop:8,
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
});

export default ChatScreen;
