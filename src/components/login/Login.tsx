// import React, { useState } from 'react';
// import { CometChat } from "@cometchat/chat-sdk-react-native";
// import { AppConstants } from "../../../AppConstants"; // Ensure this points to your constants file
// import {
//     Text,
//     View,
//     Image,
//     ActivityIndicator,
//     Modal,
//     TextInput,
//     TouchableOpacity,
//     Alert,
// } from "react-native";
// import { useNavigation, useFocusEffect, NavigationProp } from "@react-navigation/native";
// import { styles } from '../styles/LoginStyle';

// type RootStackParamList = {
//     Home: undefined;
//     Login: undefined;
//     // Add other routes and their params here if needed
// };

// export const Login: React.FC = () => {
//     const navigation = useNavigation<NavigationProp<RootStackParamList, 'Login'>>();
//     const [loading, setLoading] = useState<boolean>(false);
//     const [uid, setUid] = useState<string>(''); // Start with an empty UID
//     const [newUser, setNewUser] = useState<string>('');
//     const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
//     const [showAddUserModal, setShowAddUserModal] = useState<boolean>(false);

//     // Check if user is logged in every time the screen is focused
//     useFocusEffect(
//         React.useCallback(() => {
//             setLoading(true);
//             CometChat.getLoggedinUser()
//                 .then((user: CometChat.User | null) => {
//                     if (user) {
//                         setIsLoggedIn(true);
//                         setUid(user.getUid()); // Set UID from logged-in user
//                         AppConstants.UID = user.getUid(); // Update AppConstants with logged-in UID
//                     } else {
//                         setIsLoggedIn(false);
//                     }
//                     setLoading(false);
//                 })
//                 .catch((error: any) => {
//                     console.error("Error checking logged-in user:", error);
//                     setLoading(false);
//                 });
//         }, [])
//     );

//     const loginFunc = () => {
//         if (!uid.trim()) {
//             Alert.alert("Please enter a UID to login.");
//             return;
//         }

//         setLoading(true);
//         CometChat.login(uid, AppConstants.AUTH_KEY)
//             .then((user: CometChat.User) => {
//                 setIsLoggedIn(true);
//                 AppConstants.UID = uid; // Update AppConstants with the new UID
//                 navigation.navigate('Home');
//             })
//             .catch((error: any) => {
//                 console.error("Something went wrong", error);
//                 Alert.alert("Login failed. Please check your UID and try again.");
//             })
//             .finally(() => setLoading(false));
//     };

//     const handleLogout = async () => {
//         try {
//             await CometChat.logout();
//             console.log("Logout successful");
//             setIsLoggedIn(false);
//             AppConstants.UID = ''; // Clear the UID on logout
//         } catch (error) {
//             console.error('Logout failed:', error);
//         }
//     };

//     const handleAddUser = () => {
//         if (newUser.trim() === '') {
//             Alert.alert("Please enter a UID for the new user.");
//             return;
//         }

//         const user = new CometChat.User(newUser);
//         user.setName(newUser);

//         CometChat.createUser(user, AppConstants.AUTH_KEY)
//             .then((createdUser: CometChat.User) => {
//                 console.log("User created successfully", createdUser);
//                 setNewUser('');
//                 setShowAddUserModal(false);
//                 return CometChat.login(createdUser.getUid(), AppConstants.AUTH_KEY);
//             })
//             .then((user: CometChat.User) => {
//                 console.log("Login Successful after user creation:", user);
//                 setIsLoggedIn(true);
//                 AppConstants.UID = user.getUid(); // Update AppConstants with the new UID
//                 navigation.navigate('Home');
//             })
//             .catch((error: any) => {
//                 console.error("Error creating user or logging in", error);
//                 Alert.alert("Error creating user or logging in. Please try again.");
//             });
//     };

//     return (
//         <View style={styles.container}>
//             <Image
//                 source={require('../../asset/logo.png')}
//                 style={styles.logo}
//             />
//             <Text style={styles.title}>Welcome Back!</Text>

//             {loading ? (
//                 <ActivityIndicator size="large" color="#6200ee" style={styles.loader} />
//             ) : (
//                 <>
//                     {!isLoggedIn ? (
//                         <>
//                             <TextInput
//                                 style={styles.input}
//                                 placeholder="Enter User ID"
//                                 value={uid}
//                                 onChangeText={setUid} // Update UID state
//                             />
//                             <TouchableOpacity style={styles.loginButton} onPress={loginFunc}>
//                                 <Text style={styles.loginButtonText}>Login</Text>
//                             </TouchableOpacity>
//                             <Text style={styles.newUserText}>New here? Create a new user!</Text>
//                             <TouchableOpacity style={styles.newUserButton} onPress={() => setShowAddUserModal(true)}>
//                                 <Text style={styles.newUserButtonText}>Create New User</Text>
//                             </TouchableOpacity>
//                         </>
//                     ) : (
//                         <>
//                             <Text style={{marginTop:30, fontSize:18, fontWeight:400, alignSelf: 'center'}}> Please Logout to continue .... </Text>
//                             <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
//                                 <Text style={styles.logoutButtonText}>Logout</Text>
//                             </TouchableOpacity>
//                         </>
//                     )}
//                 </>
//             )}

//             {/* Modal for Adding New User */}
//             <Modal
//                 animationType="slide"
//                 transparent={true}
//                 visible={showAddUserModal}
//                 onRequestClose={() => setShowAddUserModal(false)}>
//                 <View style={styles.modalContainer}>
//                     <View style={styles.modalContent}>
//                         <Text style={styles.modalTitle}>Add New User</Text>
//                         <TextInput
//                             style={styles.input}
//                             placeholder="Enter User ID"
//                             value={newUser}
//                             onChangeText={setNewUser}
//                         />
//                         <View style={styles.modalButtons}>
//                             <TouchableOpacity style={styles.modalButton} onPress={handleAddUser}>
//                                 <Text style={styles.modalButtonText}>Add User</Text>
//                             </TouchableOpacity>
//                             <TouchableOpacity style={styles.modalButton} onPress={() => setShowAddUserModal(false)}>
//                                 <Text style={styles.modalButtonText}>Cancel</Text>
//                             </TouchableOpacity>
//                         </View>
//                     </View>
//                 </View>
//             </Modal>
//         </View>
//     );
// };

import React, { useState } from 'react';
import { CometChat } from "@cometchat/chat-sdk-react-native";
import { AppConstants } from "../../../AppConstants"; // Ensure this points to your constants file
import {
    Text,
    View,
    Image,
    ActivityIndicator,
    Modal,
    TextInput,
    TouchableOpacity,
    Alert,
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
    Keyboard,
} from "react-native";
import { useNavigation, useFocusEffect, NavigationProp } from "@react-navigation/native";
import { styles } from '../styles/LoginStyle'; // Ensure correct import based on theme

type RootStackParamList = {
    Home: undefined;
    Login: undefined;
    // Add other routes and their params here if needed
};

export const Login: React.FC = () => {
    const navigation = useNavigation<NavigationProp<RootStackParamList, 'Login'>>();
    const [loading, setLoading] = useState<boolean>(false);
    const [uid, setUid] = useState<string>(''); // Start with an empty UID
    const [newUser, setNewUser] = useState<string>('');
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
    const [showAddUserModal, setShowAddUserModal] = useState<boolean>(false);

    // Check if user is logged in every time the screen is focused
    useFocusEffect(
        React.useCallback(() => {
            setLoading(true);
            CometChat.getLoggedinUser()
                .then((user: CometChat.User | null) => {
                    if (user) {
                        setIsLoggedIn(true);
                        setUid(user.getUid()); // Set UID from logged-in user
                        AppConstants.UID = user.getUid(); // Update AppConstants with logged-in UID
                    } else {
                        setIsLoggedIn(false);
                    }
                    setLoading(false);
                })
                .catch((error: any) => {
                    console.error("Error checking logged-in user:", error);
                    setLoading(false);
                });
        }, [])
    );

    const loginFunc = () => {
        if (!uid.trim()) {
            Alert.alert("Validation Error", "Please enter a UID to login.");
            return;
        }

        setLoading(true);
        CometChat.login(uid, AppConstants.AUTH_KEY)
            .then((user: CometChat.User) => {
                setIsLoggedIn(true);
                AppConstants.UID = uid; // Update AppConstants with the new UID
                navigation.navigate('Home');
            })
            .catch((error: any) => {
                console.error("Login Error:", error);
                Alert.alert("Login Failed", "Please check your UID and try again.");
            })
            .finally(() => setLoading(false));
    };

    const handleLogout = async () => {
        try {
            await CometChat.logout();
            console.log("Logout successful");
            setIsLoggedIn(false);
            AppConstants.UID = ''; // Clear the UID on logout
            // Alert.alert("Logged Out", "You have been successfully logged out.");
        } catch (error) {
            console.error('Logout failed:', error);
            Alert.alert("Logout Failed", "Unable to logout. Please try again.");
        }
    };

    const handleAddUser = () => {
        if (newUser.trim() === '') {
            Alert.alert("Validation Error", "Please enter a UID for the new user.");
            return;
        }

        const user = new CometChat.User(newUser);
        user.setName(newUser);

        setLoading(true);
        CometChat.createUser(user, AppConstants.AUTH_KEY)
            .then((createdUser: CometChat.User) => {
                console.log("User created successfully", createdUser);
                setNewUser('');
                setShowAddUserModal(false);
                return CometChat.login(createdUser.getUid(), AppConstants.AUTH_KEY);
            })
            .then((user: CometChat.User) => {
                console.log("Login Successful after user creation:", user);
                setIsLoggedIn(true);
                AppConstants.UID = user.getUid(); // Update AppConstants with the new UID
                navigation.navigate('Home');
            })
            .catch((error: any) => {
                console.error("Error creating user or logging in", error);
                Alert.alert("Error", "Unable to create user or login. Please try again.");
            })
            .finally(() => setLoading(false));
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1 }}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={styles.container}>
                    <Image
                        source={require('../../asset/logo.png')}
                        style={styles.logo}
                    />
                    <Text style={styles.title}>Welcome Back!</Text>
                    <Text style={styles.subtitle}>Login to continue</Text>

                    {loading ? (
                        <ActivityIndicator size="large" color={styles.loginButton.backgroundColor} style={styles.loader} />
                    ) : (
                        <>
                            {!isLoggedIn ? (
                                <>
                                    <View style={styles.inputContainer}>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="User ID"
                                            placeholderTextColor="#999999"
                                            value={uid}
                                            onChangeText={setUid} // Update UID state
                                            autoCapitalize="none"
                                            keyboardType="default"
                                        />
                                    </View>
                                    <TouchableOpacity style={styles.loginButton} onPress={loginFunc}>
                                        <Text style={styles.loginButtonText}>Login</Text>
                                    </TouchableOpacity>
                                    <Text style={styles.newUserText}>New here? Create a new account!</Text>
                                    <TouchableOpacity style={styles.newUserButton} onPress={() => setShowAddUserModal(true)}>
                                        <Text style={styles.newUserButtonText}>Sign Up</Text>
                                    </TouchableOpacity>
                                </>
                            ) : (
                                <View style={{ alignItems: 'center' , marginTop:50}}>
                                    <Text style={{ marginTop: 20, fontSize: 16, color: '#333333', textAlign: 'center' }}>
                                        You are logged in as <Text style={{ fontWeight: '700' }}>{uid}</Text>.
                                    </Text>
                                    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                                        <Text style={styles.logoutButtonText}>Logout</Text>
                                    </TouchableOpacity>
                                </View>
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
                                <Text style={styles.modalTitle}>Create New Account</Text>
                                <TextInput
                                    style={styles.modalInput}
                                    placeholder="Enter User ID"
                                    placeholderTextColor="#999999"
                                    value={newUser}
                                    onChangeText={setNewUser}
                                    autoCapitalize="none"
                                    keyboardType="default"
                                />
                                <View style={styles.modalButtons}>
                                    <TouchableOpacity style={styles.modalButton} onPress={handleAddUser}>
                                        <Text style={styles.modalButtonText}>Sign Up</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.modalButton, styles.cancelButton]}
                                        onPress={() => setShowAddUserModal(false)}>
                                        <Text style={[styles.modalButtonText, styles.cancelButtonText]}>Cancel</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </Modal>
                </View>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
};
