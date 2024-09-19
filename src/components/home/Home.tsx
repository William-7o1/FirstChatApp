import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Modal, FlatList, TextInput, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { CometChat } from '@cometchat/chat-sdk-react-native';

const Home = () => {
    const navigation = useNavigation();
    const [modalVisible, setModalVisible] = useState(true);
    const [isGroupModalVisible, setGroupModalVisible] = useState(false);
    const [isEditGroupModalVisible, setEditGroupModalVisible] = useState(false);
    const [users, setUsers] = useState([]);
    const [groups, setGroups] = useState([]);
    const [groupName, setGroupName] = useState('');
    const [selectedFriends, setSelectedFriends] = useState([]);
    const [editingGroup, setEditingGroup] = useState(null); // Track which group is being edited

    useEffect(() => {
        const fetchUsers = async () => {
            const usersRequest = new CometChat.UsersRequestBuilder().setLimit(30).build();
            try {
                const userList = await usersRequest.fetchNext();
                setUsers(userList);
            } catch (error) {
                console.error('User list fetching failed with error:', error);
            }
        };

        fetchUsers();
    }, []);

    const navigateToChat = (user) => {
        navigation.navigate('Chat', { user });
    };

    const navigateToGroupChat = (group) => {
        // navigation.navigate('Chat', { group });
    };

    const handleLogout = () => {
        CometChat.logout().then(
            () => {
                console.log("Logout completed successfully");
                navigation.navigate('Login');
            },
            (error) => {
                console.log("Logout failed with exception:", { error });
            }
        );
    };

    const createGroup = () => {
        if (groupName.trim() === '' || selectedFriends.length === 0) {
            alert('Please enter a group name and select at least one friend.');
            return;
        }

        const newGroup = {
            name: groupName,
            members: selectedFriends,
        };

        setGroups([...groups, newGroup]);
        resetGroupModal();
    };

    const resetGroupModal = () => {
        setGroupName('');
        setSelectedFriends([]);
        setGroupModalVisible(false);
    };

    const editGroup = () => {
        if (editingGroup) {
            const updatedGroups = groups.map(group => {
                if (group.name === editingGroup.name) {
                    return {
                        ...group,
                        name: groupName,
                        members: selectedFriends,
                    };
                }
                return group;
            });
            setGroups(updatedGroups);
        }
        resetEditGroupModal();
    };

    const resetEditGroupModal = () => {
        setGroupName('');
        setSelectedFriends([]);
        setEditGroupModalVisible(false);
        setEditingGroup(null);
    };

    const deleteGroup = (group) => {
        Alert.alert(
            "Delete Group",
            `Are you sure you want to delete the group "${group.name}"?`,
            [
                { text: "Cancel", style: "cancel" },
                { text: "OK", onPress: () => setGroups(groups.filter(g => g !== group)) }
            ]
        );
    };

    const openEditGroupModal = (group) => {
        setEditingGroup(group);
        setGroupName(group.name);
        setSelectedFriends(group.members);
        setEditGroupModalVisible(true);
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Image
                    source={require('../../asset/logo.png')}
                    style={styles.logo}
                />
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </View>
            <View style={{ paddingTop: 20 }}>
                <View style={{flexDirection: 'row', justifyContent:'space-between'}}>
                <Text style={styles.ListHeadText}>Friend List</Text>
                <TouchableOpacity onPress={() => setGroupModalVisible(true)}>
                    <Text style={styles.createGroupText}>Create Group</Text>
                </TouchableOpacity>
                </View>
                
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
                    keyExtractor={(item) => item.name}
                    renderItem={({ item }) => (
                        <TouchableOpacity  activeOpacity={1} onPress={() => navigateToGroupChat(item)}>
                        <View style={styles.groupItem}>
                            <Text style={styles.groupName}>{item.name}</Text>
                            <Text>{item.members.join(', ')}</Text>
                            <View style={styles.groupActions}>
                                <TouchableOpacity onPress={() => openEditGroupModal(item)}>
                                    <Text style={styles.editGroupText}>Edit</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => deleteGroup(item)}>
                                    <Text style={styles.deleteGroupText}>Delete</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                        </TouchableOpacity>
                    )}
                    contentContainerStyle={styles.groupList}
                />
            </View>
            {/* Group Creation Modal */}
            <Modal
                animationType="slide"
                visible={isGroupModalVisible}
                onRequestClose={resetGroupModal}
            >
                <View style={styles.modalContainer}>
                    <TextInput
                        placeholder="Group Name"
                        value={groupName}
                        onChangeText={setGroupName}
                        style={styles.input}
                    />
                    <FlatList
                        data={users}
                        keyExtractor={(item) => item.uid}
                        renderItem={({ item }) => (
                            <TouchableOpacity onPress={() => {
                                setSelectedFriends((prev) => {
                                    if (prev.includes(item.name)) {
                                        return prev.filter((name) => name !== item.name);
                                    }
                                    return [...prev, item.name];
                                });
                            }}>
                                <Text style={{
                                    ...styles.userName,
                                    backgroundColor: selectedFriends.includes(item.name) ? '#e0e0e0' : 'transparent',
                                }}>
                                    {item.name}
                                </Text>
                            </TouchableOpacity>
                        )}
                    />
                    <TouchableOpacity onPress={createGroup}>
                        <Text style={styles.createGroupButton}>Create Group</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={resetGroupModal}>
                        <Text style={styles.closeButtonText}>Close</Text>
                    </TouchableOpacity>
                </View>
            </Modal>

            {/* Group Edit Modal */}
            <Modal
                animationType="slide"
                visible={isEditGroupModalVisible}
                onRequestClose={resetEditGroupModal}
            >
                <View style={styles.modalContainer}>
                    <TextInput
                        placeholder="Group Name"
                        value={groupName}
                        onChangeText={setGroupName}
                        style={styles.input}
                    />
                    <FlatList
                        data={users}
                        keyExtractor={(item) => item.uid}
                        renderItem={({ item }) => (
                            <TouchableOpacity onPress={() => {
                                setSelectedFriends((prev) => {
                                    if (prev.includes(item.name)) {
                                        return prev.filter((name) => name !== item.name);
                                    }
                                    return [...prev, item.name];
                                });
                            }}>
                                <Text style={{
                                    ...styles.userName,
                                    backgroundColor: selectedFriends.includes(item.name) ? '#e0e0e0' : 'transparent',
                                }}>
                                    {item.name}
                                </Text>
                            </TouchableOpacity>
                        )}
                    />
                    <TouchableOpacity onPress={editGroup}>
                        <Text style={styles.createGroupButton}>Save Changes</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={resetEditGroupModal}>
                        <Text style={styles.closeButtonText}>Close</Text>
                    </TouchableOpacity>
                </View>
            </Modal>

            {/* Welcome Modal */}
            <Modal
                animationType="slide"
                presentationStyle={'fullScreen'}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.title}>Welcome to the Chat App!</Text>
                        <Text style={styles.subtitle}>Enjoy connecting with your friends.</Text>
                        <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
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
        backgroundColor: '#f0f0f0',
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
        backgroundColor: '#6200ee',
        borderRadius: 25,
        paddingVertical: 10,
        paddingHorizontal: 20,
    },
    logoutText: {
        color: 'white',
        fontWeight: 'bold',
    },
    ListHeadText: {
        color: '#6200ee',
        fontSize: 20,
        fontWeight: 'bold',
        paddingVertical: 10,
    },
    createGroupText: {
        color: '#6200ee',
        fontSize: 16,
        marginTop: 10,
    },
    userList: {
        paddingBottom: 20,
    },
    userItem: {
        padding: 15,
        borderRadius: 8,
        backgroundColor: 'white',
        marginVertical: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
    },
    userName: {
        fontSize: 16,
        color: '#333',
    },
    groupList: {
        paddingBottom: 20,
    },
    groupItem: {
        padding: 15,
        borderRadius: 8,
        backgroundColor: 'white',
        marginVertical: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
    },
    groupName: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    groupActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    editGroupText: {
        color: '#6200ee',
        marginRight: 20,
    },
    deleteGroupText: {
        color: 'red',
    },
    modalContainer: {
        padding:40,
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        width: '90%',
        padding: 20,
        backgroundColor: 'white',
        borderRadius: 10,
        alignItems: 'center',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 10,
        borderRadius: 8,
        marginBottom: 10,
        width: '100%',
    },
    createGroupButton: {
        backgroundColor: '#6200ee',
        padding: 10,
        borderRadius: 5,
        textAlign: 'center',
        color: 'white',
        marginTop: 10,
    },
    closeButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        backgroundColor: '#6200ee',
        borderRadius: 25,
    },
    closeButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333',
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 20,
    },
});

export default Home;
