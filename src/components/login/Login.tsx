import React, { useEffect, useState } from 'react';
import { CometChat } from "@cometchat/chat-sdk-react-native";
import { AppConstants } from "../../../AppConstants";
import {
    Text,
    View,
    Image,
    ActivityIndicator,
    Modal,
    TextInput,
    TouchableOpacity
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { styles } from '../styles/LoginStyle';

export const Login = () => {
    const UID = AppConstants.UID;
    const navigation = useNavigation();
    const [loading, setLoading] = useState(false);
    const [newUser, setNewUser] = useState('');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [showAddUserModal, setShowAddUserModal] = useState(false);

    // Check if user is logged in every time the screen is focused
    useFocusEffect(
        React.useCallback(() => {
            setLoading(true);
            CometChat.getLoggedinUser()
                .then(user => {
                    setIsLoggedIn(!!user); // Set login state based on user existence
                    setLoading(false);
                })
                .catch(error => {
                    console.error("Error checking logged-in user:", error);
                    setLoading(false);
                });
        }, [])
    );

    const loginFunc = () => {
        setLoading(true);
        CometChat.getLoggedinUser()
            .then(user => {
                if (!user) {
                    return CometChat.login(UID, AppConstants.AUTH_KEY)
                        .then(user => {
                            console.log("Login Successful:", { user });
                            setIsLoggedIn(true);
                            navigation.navigate('Home');
                        });
                }
                navigation.navigate('Home');
            })
            .catch(error => {
                console.error("Something went wrong", error);
            })
            .finally(() => setLoading(false));
    };

    const handleLogout = async () => {
        try {
            await CometChat.logout();
            console.log("Logout successful");
            setIsLoggedIn(false);
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    const handleAddUser = () => {
        if (newUser.trim() === '') return;

        const user = new CometChat.User(newUser);
        user.setName(newUser);

        CometChat.createUser(user, AppConstants.AUTH_KEY)
            .then(createdUser => {
                console.log("User created successfully", createdUser);
                setNewUser('');
                setShowAddUserModal(false);
                return CometChat.login(createdUser.getUid(), AppConstants.AUTH_KEY);
            })
            .then(user => {
                console.log("Login Successful after user creation:", user);
                setIsLoggedIn(true);
                navigation.navigate('Home');
            })
            .catch(error => {
                console.error("Error creating user or logging in", error);
            });
    };

    return (
        <View style={styles.container}>
            <Image
                source={require('../../asset/logo.png')}
                style={styles.logo}
            />
            <Text style={styles.title}>Welcome Back!</Text>

            {loading ? (
                <ActivityIndicator size="large" color="#6200ee" style={styles.loader} />
            ) : (
                <>
                    {!isLoggedIn ? (
                        <>
                            <TouchableOpacity style={styles.loginButton} onPress={loginFunc}>
                                <Text style={styles.loginButtonText}>Login</Text>
                            </TouchableOpacity>
                            <Text style={styles.newUserText}>New here? Create a new user!</Text>
                            <TouchableOpacity style={styles.newUserButton} onPress={() => setShowAddUserModal(true)}>
                                <Text style={styles.newUserButtonText}>Create New User</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                            <Text style={styles.logoutButtonText}>Logout</Text>
                        </TouchableOpacity>
                    )}
                </>
            )}

            {/* Modal for Adding New User */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={showAddUserModal}
                onRequestClose={() => setShowAddUserModal(false)}>
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Add New User</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter User ID"
                            value={newUser}
                            onChangeText={setNewUser}
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={styles.modalButton} onPress={handleAddUser}>
                                <Text style={styles.modalButtonText}>Add User</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.modalButton} onPress={() => setShowAddUserModal(false)}>
                                <Text style={styles.modalButtonText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};
