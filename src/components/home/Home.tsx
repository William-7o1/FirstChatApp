// Home.tsx or Home.jsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation, NavigationProp, useFocusEffect } from '@react-navigation/native';
import { CometChat } from '@cometchat/chat-sdk-react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { styles } from '../styles/HomeStyle'; // Updated styles with groupItem
import { useCall } from '../../../CallContext'; // Adjust path

const Tab = createBottomTabNavigator();

type RootStackParamList = {
  Home: undefined;
  Friends: undefined;
  Groups: undefined;
  Chat: { user: UserItem };
  GroupChatScreen: { group: GroupItem };
  Login: undefined;
  CallingScreen: { sessionID: string };
};

interface UserItem {
  uid: string;
  name: string;
  avatar: string;
  status: 'online' | 'offline' | string;
}

interface ConversationItem {
  conversationId: string;
  conversationType: 'user' | 'group';
  conversationWith: UserItem | GroupItem;
  lastMessage: CometChat.BaseMessage | null;
  unreadMessageCount: number;
}

interface GroupItem {
  guid: string;
  name: string;
  icon: string;
}

const Home: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: styles.logoutButton.backgroundColor,
        tabBarInactiveTintColor: '#888',
        tabBarStyle: { backgroundColor: '#fff', borderTopWidth: 0 },
      }}
    >
      <Tab.Screen
        name="Chats"
        component={FriendsScreen}
        options={{
          tabBarIcon: ({ color }) => <Icon name="rocket" size={24} color={color} />,
        }}
      />
      <Tab.Screen
        name="Groups"
        component={GroupsScreen}
        options={{
          tabBarIcon: ({ color }) => <Icon name="group" size={24} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
};

const FriendsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList, 'Friends'>>();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [isUserModalVisible, setIsUserModalVisible] = useState<boolean>(false);
  const { setIncomingCallVisible, setCaller, setSessionID, incomingCallVisible, caller, sessionID } = useCall();
  const [incomingCallType, setIncomingCallType] = useState<string | null>(null);

  // State to track typing statuses
  const [typingStatuses, setTypingStatuses] = useState<{ [key: string]: boolean }>({});

  useFocusEffect(
    React.useCallback(() => {
      fetchConversations();
    }, [])
  );

  useEffect(() => {
    const listenerID = 'USER_PRESENCE_LISTENER';
    const messageListenerID = 'MESSAGE_LISTENER';

    fetchConversations();

    // User listener for online/offline status
    CometChat.addUserListener(
      listenerID,
      new CometChat.UserListener({
        onUserOnline: (onlineUser: CometChat.User) => {
          setConversations(prevConversations =>
            prevConversations.map(conversation =>
              conversation.conversationWith.uid === onlineUser.getUid()
                ? {
                    ...conversation,
                    conversationWith: { ...conversation.conversationWith, status: 'online' },
                  }
                : conversation
            )
          );
        },
        onUserOffline: (offlineUser: CometChat.User) => {
          setConversations(prevConversations =>
            prevConversations.map(conversation =>
              conversation.conversationWith.uid === offlineUser.getUid()
                ? {
                    ...conversation,
                    conversationWith: { ...conversation.conversationWith, status: 'offline' },
                  }
                : conversation
            )
          );
        },
      })
    );

    // Message listener with typing indicators
    CometChat.addMessageListener(
      messageListenerID,
      new CometChat.MessageListener({
        onTextMessageReceived: (message: CometChat.TextMessage) => {
          if (message.getReceiverType() !== 'user') {
            return;
          }
          setConversations(prevConversations => {
            const index = prevConversations.findIndex(
              conversation =>
                conversation.conversationWith.uid === message.getSender().getUid()
            );
            if (index > -1) {
              // Conversation exists, update last message and unread count
              const updatedConversations = [...prevConversations];
              const updatedConversation = { ...updatedConversations[index] };
              updatedConversation.lastMessage = message;
              updatedConversation.unreadMessageCount += 1;
              // Move conversation to top
              updatedConversations.splice(index, 1);
              return [updatedConversation, ...updatedConversations];
            } else {
              // New conversation, add to list
              const newConversation: ConversationItem = {
                conversationId: message.getSender().getUid(),
                conversationType: 'user',
                conversationWith: {
                  uid: message.getSender().getUid(),
                  name: message.getSender().getName(),
                  avatar: message.getSender().getAvatar() || '',
                  status: message.getSender().getStatus(),
                },
                lastMessage: message,
                unreadMessageCount: 1,
              };
              return [newConversation, ...prevConversations];
            }
          });
        },
        onMessagesRead: (messageReceipt: CometChat.MessageReceipt) => {
          handleReadReceipt(messageReceipt);
        },
        onMessageReadReceipt: (messageReceipt: CometChat.MessageReceipt) => {
          handleReadReceipt(messageReceipt);
        },
        onTypingStarted: (typingIndicator: CometChat.TypingIndicator) => {
          const { sender, receiverId, receiverType } = typingIndicator;
          if (receiverType === 'user') {
            setTypingStatuses(prev => ({ ...prev, [sender.getUid()]: true }));
          }
        },
        onTypingEnded: (typingIndicator: CometChat.TypingIndicator) => {
          const { sender, receiverId, receiverType } = typingIndicator;
          if (receiverType === 'user') {
            setTypingStatuses(prev => ({ ...prev, [sender.getUid()]: false }));
          }
        },
      })
    );

    // Call listener
    CometChat.addCallListener(
      listenerID,
      new CometChat.CallListener({
        onIncomingCallReceived: (call) => {
          console.log('Incoming call:', call);
          setIncomingCallType(call.getType());
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
          Alert.alert('Call Rejected', `${call.getSender().getName()} rejected the call.`);
        },
        onIncomingCallCancelled: (call) => {
          setIncomingCallType(null);
          console.log('Incoming call cancelled:', call);
          setIncomingCallVisible(false);
          Alert.alert('Call Cancelled', 'The caller has cancelled the call.');
        },
        onCallEndedMessageReceived: (call) => {
          console.log('CallEnded Message:', call);
          navigation.goBack();
        },
      })
    );

    // Cleanup listeners on unmount
    return () => {
      CometChat.removeUserListener(listenerID);
      CometChat.removeMessageListener(messageListenerID);
      CometChat.removeCallListener(listenerID);
    };
  }, []);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const conversationsRequest = new CometChat.ConversationsRequestBuilder()
        .setLimit(30)
        .build();
      const conversationList = await conversationsRequest.fetchNext();

      // Filter user conversations
      const userConversations = conversationList.filter(
        (conversation: any) => conversation.getConversationType() === 'user'
      );

      const conversationsData: ConversationItem[] = userConversations.map((conversation: any) => {
        const user = conversation.getConversationWith();
        const lastMessage = conversation.getLastMessage();
        return {
          conversationId: conversation.getConversationId(),
          conversationType: 'user',
          conversationWith: {
            uid: user.getUid(),
            name: user.getName(),
            avatar: user.getAvatar() || '',
            status: user.getStatus(),
          },
          lastMessage,
          unreadMessageCount: conversation.getUnreadMessageCount(),
        };
      });

      setConversations(conversationsData);
    } catch (error) {
      console.error('Fetching conversations failed:', error);
      Alert.alert('Error', 'Failed to fetch conversations.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const limit = 50;
      const usersRequest = new CometChat.UsersRequestBuilder()
        .setLimit(limit)
        .build();
      const userList = await usersRequest.fetchNext();

      const usersData: UserItem[] = userList.map((user: CometChat.User) => ({
        uid: user.getUid(),
        name: user.getName(),
        avatar: user.getAvatar() || '',
        status: user.getStatus(),
      }));

      setUsers(usersData);
    } catch (error) {
      console.error('Fetching users failed:', error);
      Alert.alert('Error', 'Failed to fetch users.');
    }
  };

  const navigateToChat = (user: UserItem) => navigation.navigate('Chat', { user });

  const handleLogout = async () => {
    try {
      await CometChat.logout();
      console.log('Logout successful');
      navigation.navigate('Login');
    } catch (error) {
      console.error('Logout failed:', error);
      Alert.alert('Logout Failed', 'Unable to logout. Please try again.');
    }
  };

  const handleReadReceipt = (messageReceipt: CometChat.MessageReceipt) => {
    const { sender, receiverId } = messageReceipt;
    const currentUser = CometChat.getLoggedinUser();

    if (currentUser) {
      const currentUserID = currentUser.getUid();

      // Check if the current user is the receiver of the read receipt
      if (messageReceipt.getReceiverType() === 'user' && receiverId === currentUserID) {
        setConversations(prevConversations =>
          prevConversations.map(conversation =>
            conversation.conversationWith.uid === sender.uid
              ? { ...conversation, unreadMessageCount: 0 }
              : conversation
          )
        );
      }
    }
  };

  const acceptIncomingCall = (sessionID: string) => {
    setIncomingCallVisible(false);
    setCaller(null);
    CometChat.acceptCall(sessionID).then(
      (call) => {
        console.log('Call accepted successfully:', call);
        const callType = incomingCallType
        navigation.navigate('CallingScreen', { sessionID , callType});
      },
      (error) => {
        console.log('Call acceptance failed with error', error);
      }
    );
  };

  const rejectIncomingCall = (sessionID: string) => {
    setIncomingCallVisible(false);
    setIncomingCallType(null);
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
    navigation.navigate('CallingScreen', { sessionID: call.getSessionId(), callType});
  };

  const navigateToSelectContact = async () => {
    await fetchUsers();
    setIsUserModalVisible(true);
  };

  const handleUserSelect = (user: UserItem) => {
    setIsUserModalVisible(false);
    navigation.navigate('Chat', { user });
  };

  const renderConversationItem = ({ item }: { item: ConversationItem }) => {
    const isTyping = typingStatuses[item.conversationWith.uid];

    return (
      <TouchableOpacity
        style={styles.userItem}
        onPress={() => navigateToChat(item.conversationWith as UserItem)}
      >
        <View style={styles.avatarContainer}>
          {item.conversationWith.avatar ? (
            <Image
              source={{ uri: item.conversationWith.avatar }}
              style={styles.avatar}
            />
          ) : (
            <Image
              source={require('../../asset/logo.png')}
              style={styles.avatar}
            />
          )}
          <View
            style={[
              styles.statusIndicator,
              {
                backgroundColor:
                  (item.conversationWith as UserItem).status === 'online' ? '#34C759' : '#8E8E93',
              },
            ]}
          />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.userName}>{(item.conversationWith as UserItem).name}</Text>
          {isTyping && (
            <Text style={styles.lastMessage}>Typing...</Text>
          )}
          {!isTyping && (
            <Text style={styles.lastMessage} numberOfLines={1}>
              {item.lastMessage ? item.lastMessage.getText() : ''}
            </Text>
          )}
        </View>
        {item.unreadMessageCount > 0 && (
          <View style={styles.unreadCountContainer}>
            <Text style={styles.unreadCountText}>
              {item.unreadMessageCount > 99 ? '99+' : item.unreadMessageCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Image source={require('../../asset/logo.png')} style={styles.logo} />
        <Text style={styles.headerTitle}>Chats</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Conversations List or Empty State */}
      {loading ? (
        <ActivityIndicator size="large" color={styles.logoutButton.backgroundColor} style={styles.loader} />
      ) : conversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No conversations yet. Start chatting!</Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={item => item.conversationId}
          renderItem={renderConversationItem}
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={navigateToSelectContact}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      {/* Incoming Call Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={incomingCallVisible}
        onRequestClose={() => {}}
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

      {/* User Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isUserModalVisible}
        onRequestClose={() => setIsUserModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Select a User</Text>
            {users.length === 0 ? (
              <ActivityIndicator size="large" color={styles.logoutButton.backgroundColor} style={styles.loader} />
            ) : (
              <FlatList
                data={users}
                keyExtractor={item => item.uid}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.friendItem}
                    onPress={() => handleUserSelect(item)}
                  >
                    <View style={styles.friendContainer}>
                      {item.avatar ? (
                        <Image source={{ uri: item.avatar }} style={styles.avatar} />
                      ) : (
                        <View style={styles.avatarPlaceholder}>
                          <Text style={styles.avatarInitial}>{item.name.charAt(0)}</Text>
                        </View>
                      )}
                      <Text style={styles.friendName}>{item.name}</Text>
                    </View>
                  </TouchableOpacity>
                )}
              />
            )}
            <TouchableOpacity
              style={styles.closeButton1}
              onPress={() => setIsUserModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const GroupsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList, 'Groups'>>();
  const [groups, setGroups] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isGroupModalVisible, setGroupModalVisible] = useState<boolean>(false);
  const [groupName, setGroupName] = useState<string>('');
  const [selectedFriends, setSelectedFriends] = useState<UserItem[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [incomingCallType, setIncomingCallType] = useState<string | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      fetchGroups();
    }, [])
  );

  useEffect(() => {
    fetchUsers();

    const listenerID = 'GROUP_LISTENER';

    // Add group listener
    CometChat.addGroupListener(
      listenerID,
      new CometChat.GroupListener({
        onMemberAddedToGroup: (
          action: CometChat.Action,
          addedBy: CometChat.User,
          addedUser: CometChat.User,
          addedToGroup: CometChat.Group
        ) => {
          console.log('User added to group:', {
            action,
            addedBy,
            addedUser,
            addedToGroup,
          });
          fetchGroups();
        },
      })
    );

    // Add message listener
    CometChat.addMessageListener(
      listenerID,
      new CometChat.MessageListener({
        onTextMessageReceived: (message: CometChat.TextMessage) => {
          handleIncomingMessage(message);
        },
        onMediaMessageReceived: (message: CometChat.MediaMessage) => {
          handleIncomingMessage(message);
        },
        onCustomMessageReceived: (message: CometChat.CustomMessage) => {
          handleIncomingMessage(message);
        },
        onMessagesRead: (messageReceipt: CometChat.MessageReceipt) => {
          handleReadReceipt(messageReceipt);
        },
      })
    );

    return () => {
      CometChat.removeGroupListener(listenerID);
      CometChat.removeMessageListener(listenerID);
    };
  }, []);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const conversationsRequest = new CometChat.ConversationsRequestBuilder()
        .setLimit(30)
        .setConversationType(CometChat.RECEIVER_TYPE.GROUP)
        .build();

      const conversationList = await conversationsRequest.fetchNext();

      const groupsData: ConversationItem[] = conversationList.map((conversation: any) => {
        const group = conversation.getConversationWith();
        const lastMessage = conversation.getLastMessage();
        return {
          conversationId: conversation.getConversationId(),
          conversationType: 'group',
          conversationWith: {
            guid: group.getGuid(),
            name: group.getName(),
            icon: group.getIcon() || '',
          },
          lastMessage,
          unreadMessageCount: conversation.getUnreadMessageCount(),
        };
      });

      setGroups(groupsData);
    } catch (error) {
      console.error('Fetching group conversations failed:', error);
      Alert.alert('Error', 'Failed to fetch group conversations.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const usersRequest = new CometChat.UsersRequestBuilder().setLimit(30).build();
      const userList = await usersRequest.fetchNext();
      const usersData: UserItem[] = userList.map((user) => ({
        uid: user.getUid(),
        name: user.getName(),
        avatar: user.getAvatar() || '',
        status: user.getStatus(),
      }));
      setUsers(usersData);
    } catch (error) {
      console.error('Fetching users failed:', error);
      Alert.alert('Error', 'Failed to fetch users.');
    }
  };

  const handleIncomingMessage = (message: CometChat.BaseMessage) => {
    if (message.getReceiverType() === CometChat.RECEIVER_TYPE.GROUP) {
      const groupID = message.getReceiverId();

      setGroups((prevGroups) => {
        const index = prevGroups.findIndex(
          (conversation) => conversation.conversationWith.guid === groupID
        );

        if (index > -1) {
          // Update existing conversation
          const updatedGroups = [...prevGroups];
          const updatedConversation = { ...updatedGroups[index] };

          updatedConversation.lastMessage = message;
          updatedConversation.unreadMessageCount += 1;

          // Move to top
          updatedGroups.splice(index, 1);
          return [updatedConversation, ...updatedGroups];
        } else {
          // New conversation
          const newConversation: ConversationItem = {
            conversationId: groupID,
            conversationType: 'group',
            conversationWith: {
              guid: groupID,
              name: message.getReceiverId(), // Optionally fetch group details
              icon: '',
            },
            lastMessage: message,
            unreadMessageCount: 1,
          };
          return [newConversation, ...prevGroups];
        }
      });
    }
  };

  const handleReadReceipt = (messageReceipt: CometChat.MessageReceipt) => {
    if (messageReceipt.getReceiverType() === CometChat.RECEIVER_TYPE.GROUP) {
      const groupID = messageReceipt.getReceiverId();

      setGroups((prevGroups) =>
        prevGroups.map((conversation) =>
          conversation.conversationWith.guid === groupID
            ? { ...conversation, unreadMessageCount: 0 }
            : conversation
        )
      );
    }
  };

  const navigateToGroupChat = (group: GroupItem) => {
    // Mark messages as read
    // CometChat.markAsRead(group.guid, CometChat.RECEIVER_TYPE.GROUP);

    // Reset unread count in state
    setGroups((prevGroups) =>
      prevGroups.map((conversation) =>
        conversation.conversationWith.guid === group.guid
          ? { ...conversation, unreadMessageCount: 0 }
          : conversation
      )
    );

    navigation.navigate('GroupChatScreen', { group });
  };

  const createGroup = async () => {
    if (!groupName.trim() || !selectedFriends.length) {
      Alert.alert('Error', 'Please enter a group name and select at least one friend.');
      return;
    }

    try {
      const GUID = groupName.toLowerCase().replace(/\s/g, '') + Math.floor(Math.random() * 10000);
      const group = new CometChat.Group(GUID, groupName, CometChat.GROUP_TYPE.PUBLIC, '');
      const createdGroup = await CometChat.createGroup(group);

      const groupMembers = selectedFriends.map(
        (friend) => new CometChat.GroupMember(friend.uid, CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT)
      );
      await CometChat.addMembersToGroup(createdGroup.getGuid(), groupMembers, []);

      // Manually add the new group to the conversations list
      setGroups((prevGroups) => [
        {
          conversationId: createdGroup.getGuid(),
          conversationType: 'group',
          conversationWith: {
            guid: createdGroup.getGuid(),
            name: createdGroup.getName(),
            icon: createdGroup.getIcon() || '',
          },
          lastMessage: null, // No last message yet
          unreadMessageCount: 0,
        },
        ...prevGroups,
      ]);

      resetGroupModal();
      Alert.alert('Success', 'Group created successfully!');
    } catch (error) {
      console.error('Group creation failed:', error);
      Alert.alert('Error', 'Group creation failed. Please try again.');
    }
  };

  const resetGroupModal = () => {
    setGroupName('');
    setSelectedFriends([]);
    setGroupModalVisible(false);
  };

  const handleLogout = async () => {
    try {
      await CometChat.logout();
      console.log('Logout successful');
      navigation.navigate('Login');
    } catch (error) {
      console.error('Logout failed:', error);
      // Alert.alert('Logout Failed', 'Unable to logout. Please try again.');
    }
  };

  // Helper function to get the message text
  const getMessageText = (message: CometChat.BaseMessage): string => {
    if (!message) {
      return '';
    }

    switch (message.getType()) {
      case CometChat.MESSAGE_TYPE.TEXT:
        return (message as CometChat.TextMessage).getText();
      case CometChat.MESSAGE_TYPE.IMAGE:
        return '[Image]';
      case CometChat.MESSAGE_TYPE.VIDEO:
        return '[Video]';
      case CometChat.MESSAGE_TYPE.AUDIO:
        return '[Audio]';
      case CometChat.MESSAGE_TYPE.FILE:
        return '[File]';
      default:
        if (message instanceof CometChat.Action) {
          return message.message; // For action messages
        } else if (message instanceof CometChat.Call) {
          return '[Call]';
        } else {
          return '[Unsupported message]';
        }
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Image source={require('../../asset/logo.png')} style={styles.logo} />
        <Text style={styles.headerTitle}>Group Conversations</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Loading Indicator */}
      {loading ? (
        <ActivityIndicator size="large" color="#6200ee" style={styles.loader} />
      ) : (
        <>
          {/* Group Conversations List */}
          {groups.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No group conversations yet. Start by creating a group!</Text>
            </View>
          ) : (
            <FlatList
              data={groups}
              keyExtractor={(item) => item.conversationId}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.groupItem}
                  onPress={() => navigateToGroupChat(item.conversationWith as GroupItem)}
                >
                  <View style={styles.avatarContainer}>
                    {item.conversationWith.icon ? (
                      <Image
                        source={{ uri: item.conversationWith.icon }}
                        style={styles.avatar}
                      />
                    ) : (
                      <View style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarInitial}>
                          {(item.conversationWith as GroupItem).name.charAt(0)}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.textContainer}>
                    <Text style={styles.groupName}>{(item.conversationWith as GroupItem).name}</Text>
                    <Text style={styles.lastMessage} numberOfLines={1}>
                      {item.lastMessage ? getMessageText(item.lastMessage) : 'No messages yet'}
                    </Text>
                  </View>
                  {item.unreadMessageCount > 0 && (
                    <View style={styles.unreadCountContainer}>
                      <Text style={styles.unreadCountText}>
                        {item.unreadMessageCount > 99 ? '99+' : item.unreadMessageCount}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}
            />
          )}
          {/* Create Group Button */}
          <TouchableOpacity
            style={styles.createGroupButtonOut}
            onPress={() => setGroupModalVisible(true)}
          >
            <Text style={styles.createGroupButtonText}>Create Group</Text>
          </TouchableOpacity>
        </>
      )}

      {/* Create Group Modal */}
      <Modal
        animationType="fade"
        transparent
        visible={isGroupModalVisible}
        onRequestClose={resetGroupModal}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Create a Group</Text>
            <TextInput
              placeholder="Enter Group Name"
              value={groupName}
              onChangeText={setGroupName}
              style={styles.input}
            />
            <FlatList
              data={users}
              keyExtractor={(item) => item.uid}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.friendItem}
                  onPress={() => {
                    setSelectedFriends((prevState) =>
                      prevState.some((friend) => friend.uid === item.uid)
                        ? prevState.filter((friend) => friend.uid !== item.uid)
                        : [...prevState, item]
                    );
                  }}
                >
                  <View style={styles.friendContainer}>
                    {item.avatar ? (
                      <Image source={{ uri: item.avatar }} style={styles.avatar} />
                    ) : (
                      <View style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarInitial}>{item.name.charAt(0)}</Text>
                      </View>
                    )}
                    <Text
                      style={[
                        styles.friendName,
                        {
                          fontWeight: selectedFriends.some((friend) => friend.uid === item.uid)
                            ? '700'
                            : 'normal',
                          color: selectedFriends.some((friend) => friend.uid === item.uid)
                            ? '#128C7E' // Highlight selected friends with a different color
                            : '#333333',
                        },
                      ]}
                    >
                      {item.name}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 15 }}>
              <TouchableOpacity
                style={[
                  styles.createGroupButton,
                  { flex: 1, marginRight: 5 } // Ensures the button takes up half the space
                ]}
                onPress={createGroup}
              >
                <Text style={styles.createGroupButtonText}>Create Group</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.closeButton,
                  { flex: 1, marginLeft: 5 } // Ensures the button takes up half the space
                ]}
                onPress={resetGroupModal}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default Home;