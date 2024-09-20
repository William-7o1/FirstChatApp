import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Modal, FlatList, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { CometChat } from '@cometchat/chat-sdk-react-native';

const Home = () => {
    const navigation = useNavigation();
    const [modalVisible, setModalVisible] = useState(true);
    const [isGroupModalVisible, setGroupModalVisible] = useState(false);
    const [users, setUsers] = useState([]);
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [groupName, setGroupName] = useState('');
    const [selectedFriends, setSelectedFriends] = useState([]);

    useEffect(() => {
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
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.listContainer}>
                <View style={styles.listHeader}>
                    <Text style={styles.listHeadText}>Friends</Text>
                    <TouchableOpacity onPress={() => setGroupModalVisible(true)}>
                        <Text style={styles.addGroupText}>Add Group</Text>
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
                                <TouchableOpacity style={styles.userItem} onPress={() => navigateToChat(item)}>
                                    <Text style={styles.userName}>{item.name}</Text>
                                </TouchableOpacity>
                            )}
                            contentContainerStyle={styles.userList}
                        />

                        <FlatList
                            data={groups}
                            keyExtractor={(item) => item.guid}
                            renderItem={({ item }) => (
                                <TouchableOpacity style={styles.groupItem} onPress={() => navigateToGroupChat(item)}>
                                    <Text style={styles.groupName}>{item.name}</Text>
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#e5ddd5',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 40,
    },
    logo: {
        width: 40,
        height: 40,
    },
    logoutButton: {
        padding: 10,
    },
    logoutText: {
        fontSize: 16,
        color: '#6200ee',
    },
    listContainer: {
        flex: 1,
        marginTop: 20,
    },
    listHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    listHeadText: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    addGroupText: {
        fontSize: 16,
        color: '#6200ee',
    },
    userItem: {
        padding: 15,
        backgroundColor: '#fff',
        borderRadius: 8,
        marginBottom: 10,
        elevation: 1,
    },
    userName: {
        fontSize: 18,
        color: '#333',
    },
    groupItem: {
        padding: 15,
        backgroundColor: '#fff',
        borderRadius: 8,
        marginBottom: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        elevation: 1,
    },
    groupName: {
        fontSize: 18,
        color: '#333',
    },
    deleteGroupText: {
        fontSize: 16,
        color: '#ff0000',
    },
    modalBackground: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContainer: {
        width: '80%',
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 20,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 10,
        marginBottom: 15,
    },
    modalUserList: {
        maxHeight: 150,
    },
    selectedUser: {
        backgroundColor: '#cfe9c6',
    },
    createGroupButton: {
        backgroundColor: '#6200ee',
        borderRadius: 5,
        padding: 10,
        alignItems: 'center',
        marginVertical: 10,
    },
    createGroupButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    closeButton: {
        alignItems: 'center',
        padding: 10,
    },
    closeButtonText: {
        color: '#6200ee',
    },
});

export default Home;
