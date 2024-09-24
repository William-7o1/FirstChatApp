import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, ActivityIndicator, SafeAreaView } from 'react-native';
import { CometChat } from '@cometchat/chat-sdk-react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
// import { styles } from '../styles/CallingScreenStyle';
import { CometChatCalls } from '@cometchat/calls-sdk-react-native';
import { styles } from '../styles/CallingScreenStyle';

const CallingScreen = ({ navigation, route }) => {
    const { sessionID, user = {} } = route.params || {};
    const [callStatus, setCallStatus] = useState('Connecting...');
    // const [call, setCall] = useState(null);
    // const [isMuted, setMuted] = useState(false);
    // const [isSpeakerOn, setSpeakerOn] = useState(false);
    // const [loading, setLoading] = useState(true);
    const [isInCall, setInCall] = useState(false); // Track if in call

    useEffect(() => {
        CometChatCalls.addCallEventListener("UNIQUE_ID", {
            onUserJoined: (user) => {
                console.log("user joined:", user);
                setInCall(true); // Set call as active when user joins
                // setCallStatus('In Call...');
            },
            onUserLeft: (user) => {
                console.log("user left:", user);
            },
            onUserListUpdated: (userList) => {
                console.log("user list:", userList);
            },
            onCallEnded: () => {
                console.log("Call ended");
                setInCall(false); // Reset the call state when call ends
                // setCallStatus('Call Ended');
            },
            onCallEndButtonPressed: () => {
                console.log("End Call button pressed");
            },
            onError: (error) => {
                console.log("Call Error: ", error);
            },
            onAudioModesUpdated: (audioModes) => {
                console.log("audio modes:", audioModes);
            },
            onCallSwitchedToVideo: (event) => {
                console.log("call switched to video:", event);
            },
            onUserMuted: (event) => {
                console.log("user muted:", event);
            },
        });
        return () => CometChatCalls.removeCallEventListener("UNIQUE_ID");
    }, []);


    const endCall = () => {
        CometChat.endCall(sessionID);
        console.log('Call ended');
        setInCall(false);
        setCallStatus('Call Ended');
    };

    const cancelCall = () => {
        var cancelStatus = CometChat.CALL_STATUS.CANCELLED;
        CometChat.rejectCall(sessionID, cancelStatus).then(
            (call) => {
                console.log("Call cancelled successfully", call);
            },
            (error) => {
                console.log("Call cancellation failed with error:", error);
            }
        );
        setCallStatus('Call Cancelled');
    };

    // Conditionally handle end or cancel call
    const handleEndOrCancelCall = () => {
        if (isInCall) {
            endCall(); // End the call if in call
            navigation.navigate('Chat', { user });
        } else {
            cancelCall(); // Cancel the call if not yet connected
            navigation.navigate('Chat', { user });
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <Image source={{ uri: user.avatar || 'https://www.example.com/default-avatar.png' }} style={styles.avatar} />
                <Text style={styles.userName}>{user.name || 'Unknown User'}</Text>
                <Text style={styles.callStatus}>{callStatus}</Text>

                <View style={styles.controlsContainer}>
                    <TouchableOpacity style={styles.endCallButton} onPress={handleEndOrCancelCall}>
                        <Icon name="phone" size={30} color="white" />
                    </TouchableOpacity>
                </View>

                {/* {loading && <ActivityIndicator size="large" color="#00ff00" style={styles.loadingIndicator} />} */}
            </View>
        </SafeAreaView>
    );
};

export default CallingScreen;
