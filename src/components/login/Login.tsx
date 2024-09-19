import React, { useEffect, useState } from 'react';
import { CometChat } from "@cometchat/chat-sdk-react-native";
import { AppConstants } from "../../../AppConstants";
import { Button, Text, View, StyleSheet, Image, ActivityIndicator, Modal } from "react-native";
import { useNavigation } from "@react-navigation/native";

export const Login = () => {
    const UID = AppConstants.UID;
    const navigation = useNavigation();
    const [loading, setLoading] = useState(false);

    const loginFunc = () => {
        setLoading(true);

        CometChat.getLoggedinUser().then(
          (user) => {
            if (!user) {
              CometChat.login(UID, AppConstants.AUTH_KEY).then(
                (user) => {
                  console.log("Login Successful:", { user });
                  setLoading(false);
                navigation.navigate('Home');
                },
                (error) => {
                  console.log("Login failed with exception:", { error });
                  setLoading(false);
                }
              );
            }
          },
          (error) => {
            console.log("Something went wrong", error);
          }
        );
    }
    

    return (
        <View style={styles.container}>
            <Image
                source={{ uri: 'https://your-logo-url.com/logo.png' }} // Replace with your logo URL
                style={styles.logo}
            /> 
            <Text style={styles.title}>Welcome Back!</Text>
            <Text style={styles.subtitle}>User</Text>
            {loading ? (
                <ActivityIndicator size="large" color="#6200ee" style={styles.loader} />
            ) : (
                <Button title="Login" onPress={loginFunc} color="#6200ee" />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'flex-start',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#f0f0f0', // Light background color
    },
    logo: {
        width: 100,
        height: 100,
        marginBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333',
    },
    subtitle: {
        fontSize: 18,
        marginBottom: 30,
        color: '#666',
    },
    loader: {
        marginVertical: 20,
    },
});

export default Login;
