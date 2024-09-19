import React, { useEffect, useState } from 'react';
import { View, TextInput, TouchableOpacity, FlatList, Text, StyleSheet, KeyboardAvoidingView, Platform, Image, SafeAreaView } from 'react-native';
import { CometChat } from '@cometchat/chat-sdk-react-native';
import { AppConstants } from '../../../AppConstants';

const ChatScreen = ({ navigation, route }) => {
    const { user } = route.params;
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState('');

    const currentUserID = AppConstants.UID;

    // CometChat.getUnreadMessageCountForUser(AppConstants.UID).then(
    //     array => {
    //       console.log("Message count fetched", array);
    //     }, error => {
    //       console.log("Error in getting message count", error);
    //     }
    //     );

    useEffect(() => {
        const listenerID = `listener_${user.uid}`;
        CometChat.addMessageListener(listenerID, {
            onTextMessageReceived: (message) => {
                setMessages((prevMessages) => [...prevMessages, message]);
            },
        });

        const fetchPreviousMessages = async () => {
            let messagesRequest = new CometChat.MessagesRequestBuilder()
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

        let receiverID = user.uid;
        let messageText = text;
        let receiverType = CometChat.RECEIVER_TYPE.USER;

        let textMessage = new CometChat.TextMessage(receiverID, messageText, receiverType);

        CometChat.sendMessage(textMessage).then(
            (sentMessage) => {
                setMessages((prevMessages) => [sentMessage, ...prevMessages]);
                setText('');
                console.log('Message sent successfully:', sentMessage);
            },
            (error) => {
                console.error('Message sending failed with error:', error);
            }
        );
    };

    const renderMessage = ({ item }) => {
        const isSentByCurrentUser = item.sender.uid === currentUserID;
        const isDeleted = item.type === 'deleted' || item.text === undefined;
        

        return (
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
                        <Text style={styles.senderName}>{item.sender.name}</Text>
                    </>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView 
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={-14}
            >
                <View style={styles.header}>
                    <Text onPress={() => { navigation.navigate('Home') }} style={styles.backText}> Back </Text>
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
                        <Text style={styles.sendButtonText}>Send</Text>
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
        // paddingVertical: 10,
        paddingHorizontal: 10,
        position: 'relative',
        marginBottom:30
        // paddingBottom:36,
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
        borderRadius: 10,
        marginVertical: 5,
        maxWidth: '80%',
    },
    sentMessage: {
        backgroundColor: '#dcf8c6',
        alignSelf: 'flex-end',
        borderBottomRightRadius: 0,
    },
    receivedMessage: {
        backgroundColor: '#e4e6eb',
        alignSelf: 'flex-start',
        borderBottomLeftRadius: 0,
    },
    deletedMessage: {
        backgroundColor: 'white',
        borderColor: '#f5c6cb',
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
    senderName: {
        fontSize: 12,
        color: '#555',
        marginTop: 5,
        alignSelf: 'flex-end',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderTopWidth: 1,
        borderTopColor: '#e4e4e4',
        paddingBottom: 30,
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#e4e4e4',
        borderRadius: 20,
        padding: 10,
        marginRight: 10,
    },
    sendButton: {
        backgroundColor: '#6200ee',
        borderRadius: 20,
        paddingVertical: 10,
        paddingHorizontal: 15,
    },
    sendButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
});

export default ChatScreen;
