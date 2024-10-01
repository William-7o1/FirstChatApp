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
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { CometChat } from '@cometchat/chat-sdk-react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { styles } from '../styles/HomeStyle';
import { useFocusEffect } from '@react-navigation/native';

const Tab = createBottomTabNavigator();

type RootStackParamList = {
  Home: undefined;
  Friends: undefined;
  Groups: undefined;
  Chat: { user: UserItem };
  GroupChatScreen: { group: GroupItem };
  Login: undefined;
};

const Home: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#6200ee',
        tabBarInactiveTintColor: '#888',
        tabBarStyle: { backgroundColor: '#fff', borderTopWidth: 0 },
      }}
    >
      <Tab.Screen
        name="Friends"
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

interface UserItem {
  uid: string;
  name: string;
  avatar: string;
  status: 'online' | 'offline' | string;
}

interface UserItem {
  uid: string;
  name: string;
  avatar: string;
  status: 'online' | 'offline' | string;
}

interface ConversationItem {
  conversationId: string;
  conversationType: 'user';
  conversationWith: UserItem;
  lastMessage: CometChat.BaseMessage;
  unreadMessageCount: number;
}

const FriendsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<any>>();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

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

    // Message listener
    CometChat.addMessageListener(
      messageListenerID,
      new CometChat.MessageListener({
        onTextMessageReceived: (message: CometChat.TextMessage) => {
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
      })
    );

    CometChat.addMessageListener(
      messageListenerID,
      new CometChat.MessageListener({
        onTextMessageReceived: (message: CometChat.TextMessage) => {
          handleIncomingMessage(message);
        },
        onMessagesRead: (messageReceipt: CometChat.MessageReceipt) => {
          handleReadReceipt(messageReceipt);
        },
        onMessageReadReceipt: (messageReceipt: CometChat.MessageReceipt) => {
          handleReadReceipt(messageReceipt);
        },
      })
    );

    // Cleanup listeners on unmount
    return () => {
      CometChat.removeUserListener(listenerID);
      CometChat.removeMessageListener(messageListenerID);
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

  const navigateToChat = (user: UserItem) => navigation.navigate('Chat', { user });

  const handleLogout = async () => {
    try {
      await CometChat.logout();
      console.log('Logout successful');
      navigation.navigate('Login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleIncomingMessage = (message: CometChat.BaseMessage) => {
    setConversations(prevConversations => {
      const index = prevConversations.findIndex(
        conversation => conversation.conversationWith.uid === message.getSender().getUid()
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
  };

  const handleReadReceipt = (messageReceipt: CometChat.MessageReceipt) => {
    const { sender, receiverId } = messageReceipt;
    const currentUserID = CometChat.getLoggedinUser().getUid();

    // We need to check if the current user is the receiver of the read receipt
    if (messageReceipt.getReceiverType() === 'user' && receiverId === currentUserID) {
      setConversations(prevConversations =>
        prevConversations.map(conversation =>
          conversation.conversationWith.uid === sender.uid
            ? { ...conversation, unreadMessageCount: 0 }
            : conversation
        )
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image source={require('../../asset/logo.png')} style={styles.logo} />
        <Text style={{ fontSize: 20, fontWeight: '600' }}>First Friends</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#6200ee" />
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={item => item.conversationId}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.userItem}
              onPress={() => navigateToChat(item.conversationWith)}
            >
              <View style={styles.conversationContainer}>
              <View style={styles.userInfo}>
                <View style={styles.avatarContainer}>
                  <Image
                    source={{ uri: item.conversationWith.avatar }}
                    style={styles.avatar}
                  />
                  <View
                    style={[
                      styles.statusIndicator,
                      {
                        backgroundColor:
                          item.conversationWith.status === 'online' ? '#34C759' : '#8E8E93',
                      },
                    ]}
                  />
                </View>
                <View style={styles.textContainer}>
                  <Text style={styles.userName}>{item.conversationWith.name}</Text>
                  <Text style={styles.lastMessage} numberOfLines={1}>
                    {item.lastMessage ? item.lastMessage.getText() : ''}
                  </Text>
                </View>
                <View style={styles.statusContainer}>
                {item.unreadMessageCount > 0 && (
                  <View style={styles.unreadCountContainer}>
                    <Text style={styles.unreadCountText}>
                      {item.unreadMessageCount > 99 ? '99+' : item.unreadMessageCount}
                    </Text>
                  </View>
                )}
              </View>
              </View>
              
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};

interface GroupItem {
  guid: string;
  name: string;
  icon: string;
}

const GroupsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList, 'Groups'>>();
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isGroupModalVisible, setGroupModalVisible] = useState<boolean>(false);
  const [groupName, setGroupName] = useState<string>('');
  const [selectedFriends, setSelectedFriends] = useState<UserItem[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const groupsRequest = new CometChat.GroupsRequestBuilder()
        .setLimit(30)
        .joinedOnly(true)
        .build();
      const groupsList = await groupsRequest.fetchNext();
      const groupsData: GroupItem[] = groupsList.map(group => ({
        guid: group.getGuid(),
        name: group.getName(),
        icon: group.getIcon() || '',
      }));
      setGroups(groupsData);
    } catch (error) {
      console.error('Fetching failed:', error);
      Alert.alert('Error', 'Failed to fetch data.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const usersRequest = new CometChat.UsersRequestBuilder().setLimit(30).build();
      const userList = await usersRequest.fetchNext();
      const usersData: UserItem[] = userList.map(user => ({
        uid: user.getUid(),
        name: user.getName(),
        avatar: user.getAvatar() || '',
        status: user.getStatus(),
      }));
      setUsers(usersData);
    } catch (error) {
      console.error('Fetching users failed:', error);
    }
  };

  useEffect(() => {
    fetchGroups();
    fetchUsers();

    const listenerID = 'GROUP_LISTENER';

    CometChat.addGroupListener(
      listenerID,
      new CometChat.GroupListener({
        onMemberAddedToGroup: (
          action: CometChat.Action,
          addedBy: CometChat.User,
          addedUser: CometChat.User,
          addedToGroup: CometChat.Group,
        ) => {
          console.log('User added to group:', {
            action,
            addedBy,
            addedUser,
            addedToGroup,
          });
          fetchGroups();
        },
      }),
    );

    return () => {
      CometChat.removeGroupListener(listenerID);
    };
  }, []);

  const navigateToGroupChat = (group: GroupItem) => navigation.navigate('GroupChatScreen', { group });

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
        friend =>
          new CometChat.GroupMember(friend.uid, CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT),
      );
      await CometChat.addMembersToGroup(createdGroup.getGuid(), groupMembers, []);

      setGroups([
        ...groups,
        {
          guid: createdGroup.getGuid(),
          name: createdGroup.getName(),
          icon: createdGroup.getIcon() || '',
        },
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
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image source={require('../../asset/logo.png')} style={styles.logo} />
        <Text style={{ fontSize: 20, fontWeight: '600' }}>First Group</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#6200ee" />
      ) : (
        <>
          <FlatList
            data={groups}
            keyExtractor={item => item.guid}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.groupItem} onPress={() => navigateToGroupChat(item)}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {item.icon ? <Image source={{ uri: item.icon }} style={styles.avatar} /> : null}
                  <Text style={styles.groupName}>{item.name}</Text>
                </View>
              </TouchableOpacity>
            )}
          />
          <TouchableOpacity
            style={styles.createGroupButton}
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
              keyExtractor={item => item.uid}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.friendItem}
                  onPress={() => {
                    setSelectedFriends(prevState =>
                      prevState.some(friend => friend.uid === item.uid)
                        ? prevState.filter(friend => friend.uid !== item.uid)
                        : [...prevState, item],
                    );
                  }}
                >
                  <View style={styles.friendContainer}>
                    <Image source={{ uri: item.avatar }} style={styles.avatar} />
                    <Text
                      style={[
                        styles.friendName,
                        {
                          fontWeight: selectedFriends.some(friend => friend.uid === item.uid)
                            ? 'bold'
                            : 'normal',
                        },
                      ]}
                    >
                      {item.name}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            />
            <View style={{ flexDirection: 'row' }}>
              <TouchableOpacity style={styles.createGroupButton} onPress={createGroup}>
                <Text style={styles.createGroupButtonText}>Create Group</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.closeButton} onPress={resetGroupModal}>
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
