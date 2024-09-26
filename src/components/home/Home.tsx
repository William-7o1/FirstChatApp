import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, Modal, FlatList, TextInput, Alert, ActivityIndicator } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { CometChat } from '@cometchat/chat-sdk-react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { styles } from '../styles/HomeStyle';

const Tab = createBottomTabNavigator();

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

const FriendsScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp<any>>();
    const [users, setUsers] = useState<UserItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const listenerID = 'USER_PRESENCE_LISTENER';

        const fetchUsers = async () => {
            setLoading(true);
            try {
                const userList = await new CometChat.UsersRequestBuilder().setLimit(30).build().fetchNext();
                setUsers(userList);
            } catch (error) {
                console.error('Fetching failed:', error);
                Alert.alert('Error', 'Failed to fetch data.');
            } finally {
                setLoading(false);
            }
        };

        CometChat.addUserListener(listenerID, {
            onUserOnline: (onlineUser) => {
                setUsers(prevUsers =>
                    prevUsers.map(user =>
                        user.uid === onlineUser.uid
                            ? { ...user, status: 'online' }
                            : user
                    )
                );
            },
            onUserOffline: (offlineUser: { uid: string; }) => {
                setUsers(prevUsers =>
                    prevUsers.map(user =>
                        user.uid === offlineUser.uid
                            ? { ...user, status: 'offline' }
                            : user
                    )
                );
            },
        });

        fetchUsers();

        return () => {
            CometChat.removeUserListener(listenerID);
        };
    }, []);

    const navigateToChat = (user: UserItem) => navigation.navigate('Chat', { user });

    const handleLogout = async () => {
        try {
            await CometChat.logout();
            console.log("Logout successful");
            navigation.navigate('Login');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Image source={require('../../asset/logo.png')} style={styles.logo} />
                <Text style={{fontSize: 20, fontWeight: '600'}}>First Friends</Text>
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </View>
            {loading ? (
                <ActivityIndicator size="large" color="#6200ee" />
            ) : (
                <FlatList
                    data={users}
                    keyExtractor={(item) => item.uid}
                    renderItem={({ item }) => (
                        <TouchableOpacity style={styles.userItem} onPress={() => navigateToChat(item)}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center'}}>
                                    <Image source={{ uri: item.avatar }} style={styles.avatar} />
                                    <Text style={styles.userName}>{item.name}</Text>
                                </View>
                                <Icon name="circle" size={12} color={item.status === 'online' ? 'green' : 'grey'} style={{ paddingLeft: 30 }}/>
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
    const navigation = useNavigation<NavigationProp<any>>();
    const [groups, setGroups] = useState<GroupItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [isGroupModalVisible, setGroupModalVisible] = useState<boolean>(false);
    const [groupName, setGroupName] = useState<string>('');
    const [selectedFriends, setSelectedFriends] = useState<UserItem[]>([]);
    const [users, setUsers] = useState<UserItem[]>([]);

    useEffect(() => {
        const fetchGroups = async () => {
            setLoading(true);
            try {
                const groupsList = await new CometChat.GroupsRequestBuilder().setLimit(30).build().fetchNext();
                setGroups(groupsList);
            } catch (error) {
                console.error('Fetching failed:', error);
                Alert.alert('Error', 'Failed to fetch data.');
            } finally {
                setLoading(false);
            }
        };

        const fetchUsers = async () => {
            try {
                const userList = await new CometChat.UsersRequestBuilder().setLimit(30).build().fetchNext();
                setUsers(userList);
            } catch (error) {
                console.error('Fetching users failed:', error);
            }
        };

        fetchGroups();
        fetchUsers();
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

            const groupMembers = selectedFriends.map(friend => new CometChat.GroupMember(friend.uid, CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT));
            await CometChat.addMembersToGroup(createdGroup.guid, groupMembers, []);

            setGroups([...groups, { name: groupName, guid: createdGroup.guid, icon: '' }]);
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
            console.log("Logout successful");
            navigation.navigate('Login');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Image source={require('../../asset/logo.png')} style={styles.logo} />
                <Text style={{fontSize: 20, fontWeight: '600'}}>First Group</Text>
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
                        keyExtractor={(item) => item.guid}
                        renderItem={({ item }) => (
                            <TouchableOpacity style={styles.groupItem} onPress={() => navigateToGroupChat(item)}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Image source={{ uri: item.icon }} style={styles.avatar} />
                                    <Text style={styles.groupName}>{item.name}</Text>
                                </View>
                            </TouchableOpacity>
                        )}
                    />
                    <TouchableOpacity style={styles.createGroupButton} onPress={() => setGroupModalVisible(true)}>
                        <Text style={styles.createGroupButtonText}>Create Group</Text>
                    </TouchableOpacity>
                </>
            )}

            {/* Create Group Modal */}
            <Modal animationType="fade" transparent visible={isGroupModalVisible} onRequestClose={resetGroupModal}>
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
                                    setSelectedFriends(prevState =>
                                        prevState.includes(item)
                                            ? prevState.filter(friend => friend.uid !== item.uid)
                                            : [...prevState, item]
                                    );
                                }}
                            >
                                <View style={styles.friendContainer}>
                                    <Image source={{ uri: item.avatar }} style={styles.avatar} />
                                    <Text style={[
                                        styles.friendName,
                                        { fontWeight: selectedFriends.includes(item) ? 'bold' : 'normal' }
                                    ]}>
                                        {item.name}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                            )}
                        />
                        <View style={{flexDirection:'row'}}>
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
