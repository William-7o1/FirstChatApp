import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, Modal, FlatList, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { CometChat } from '@cometchat/chat-sdk-react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { styles } from '../styles/HomeStyle'

const Home = () => {
    const navigation = useNavigation();
    const [isGroupModalVisible, setGroupModalVisible] = useState(false);
    const [users, setUsers] = useState([]);
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [groupName, setGroupName] = useState('');
    const [selectedFriends, setSelectedFriends] = useState([]);
    const [isUserOnline, setIsUserOnline] = useState(null);

    useEffect(() => {
        const listenerID = `listener_${users.uid}`;
        const fetchUsersAndGroups = async () => {
            setLoading(true);
            try {
                const userList = await new CometChat.UsersRequestBuilder().setLimit(30).build().fetchNext();
                const groupsList = await new CometChat.GroupsRequestBuilder().setLimit(30).build().fetchNext();
                setUsers(userList);
                setGroups(groupsList);
            } catch (error) {
                console.error('Fetching failed:', error);
                Alert.alert('Error', 'Failed to fetch data.');
            } finally {
                setLoading(false);
            }
        };
        fetchUsersAndGroups();


        CometChat.addUserListener(listenerID, {
            onUserOnline: (onlineUser) => {
                if (onlineUser.uid === user.uid) {
                    setIsUserOnline(true);
                }
            },
            onUserOffline: (offlineUser) => {
                if (offlineUser.uid === user.uid) {
                    setIsUserOnline(false);
                }
            },
        });

        // Fetch initial user status
        // const fetchUserStatus = async () => {
        //     try {
        //         const userStatus = await CometChat.getUser(user.uid);
        //         setIsUserOnline(userStatus.status === 'online');
        //     } catch (error) {
        //         console.error("Failed to fetch user status:", error);
        //     }
        // };

        // return () =>{
        //     CometChat.removeUserListener(listenerID);
        // }
    }, []);

    const navigateToChat = (user) => navigation.navigate('Chat', { user });
    const navigateToGroupChat = (group) => navigation.navigate('GroupChatScreen', { group });

    const handleLogout = async () => {
        try {
            await CometChat.logout();
            navigation.navigate('Login');
        } catch (error) {
            console.error('Logout failed:', error);
        }
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

            const groupMembers = selectedFriends.map(friend => new CometChat.GroupMember(friend.uid, CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT));
            await CometChat.addMembersToGroup(createdGroup.guid, groupMembers, []);

            setGroups([...groups, { name: groupName, guid: createdGroup.guid, members: selectedFriends.map(friend => friend.name) }]);
            resetGroupModal();
            Alert.alert('Success', 'Group created successfully!');
        } catch (error) {
            console.error('Group creation failed:', error);
            Alert.alert('Error', 'Group creation failed. Please try again.');
        }
    };

    const deleteGroup = async (group) => {
        Alert.alert(
            "Delete Group",
            `Are you sure you want to delete the group "${group.name}"?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "OK",
                    onPress: async () => {
                        try {
                            await CometChat.deleteGroup(group.guid);
                            setGroups(groups.filter(g => g.guid !== group.guid));
                            Alert.alert('Success', `Group "${group.name}" deleted successfully.`);
                        } catch (error) {
                            console.error('Group deletion failed:', error);
                            Alert.alert('Error', 'Failed to delete the group. Please try again.');
                        }
                    },
                },
            ]
        );
    };

    const resetGroupModal = () => {
        setGroupName('');
        setSelectedFriends([]);
        setGroupModalVisible(false);
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Image source={require('../../asset/logo.png')} style={styles.logo} />
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Icon name="sign-out" size={20} color="#000" />
                </TouchableOpacity>
            </View>
            <View style={styles.listContainer}>
                <View style={styles.listHeader}>
                    <Text style={styles.listHeadText}>Friends</Text>
                    <TouchableOpacity onPress={() => {}}>
                        <Text style={styles.addGroupText}>Add Friends</Text>
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color="#6200ee" />
                ) : (
                    <>
                        <FlatList
                            data={users}
                            keyExtractor={(item) => item.uid}
                            renderItem={({ item }) => (
                                <View>
                                    <TouchableOpacity style={styles.userItem} onPress={() => navigateToChat(item)}>
                                        <View style={{flexDirection:'row'}}>
                                            <Image source={{ uri: item.avatar }} style={styles.avatar} />
                                            <Text style={styles.userName}>{item.name}</Text>  
                                        </View>
                                        <View style={styles.statusContainer}>
                                            <View style={[
                                                styles.statusDot,
                                                { backgroundColor: isUserOnline ? 'green' : 'grey' } // Green for online, grey for offline
                                            ]} />
                                                <Text style={styles.statusText}>{isUserOnline ? 'Online' : 'Offline'}</Text>
                                             </View>
                                    </TouchableOpacity>
                                       
                                </View>
                            
                            )}
                            contentContainerStyle={styles.userList}
                        />
                        <View style={styles.listHeader}>
                            <Text style={styles.listHeadText}>Groups</Text>
                            <TouchableOpacity onPress={() => setGroupModalVisible(true)}>
                                <Text style={styles.addGroupText}>Add Group</Text>
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={groups}
                            keyExtractor={(item) => item.guid}
                            renderItem={({ item }) => (
                                <TouchableOpacity style={styles.groupItem} onPress={() => navigateToGroupChat(item)}>
                                    <View style ={{flexDirection:'row'}}>
                                        <Image source={{ uri: item.icon }} style={styles.avatar} />
                                        <Text style={styles.groupName}>{item.name}</Text>
                                    </View>
                                    <TouchableOpacity onPress={() => deleteGroup(item)}>
                                        <Text style={styles.deleteGroupText}>Delete</Text>
                                    </TouchableOpacity>
                                </TouchableOpacity>
                            )}
                            contentContainerStyle={styles.groupList}
                        />
                    </>
                )}
            </View>

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
                                <TouchableOpacity onPress={() => {
                                    setSelectedFriends(prev => {
                                        const isSelected = prev.some(friend => friend.uid === item.uid);
                                        return isSelected ? prev.filter(friend => friend.uid !== item.uid) : [...prev, item];
                                    });
                                }}>
                                    <Text style={[
                                        styles.userName,
                                        selectedFriends.some(friend => friend.uid === item.uid) && styles.selectedUser
                                    ]}>
                                        {item.name}
                                    </Text>
                                </TouchableOpacity>
                            )}
                            style={styles.modalUserList}
                        />

                        <TouchableOpacity style={styles.createGroupButton} onPress={createGroup}>
                            <Text style={styles.createGroupButtonText}>Create Group</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.closeButton} onPress={resetGroupModal}>
                            <Text style={styles.closeButtonText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

export default Home;

