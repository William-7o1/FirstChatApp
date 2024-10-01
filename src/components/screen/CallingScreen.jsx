import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, ActivityIndicator, SafeAreaView } from 'react-native';
import { CometChat } from '@cometchat/chat-sdk-react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { styles } from '../styles/CallingScreenStyle';
import { CometChatCalls } from '@cometchat/calls-sdk-react-native';

const CallingScreen = async ({ navigation, route }) => {
    const { sessionID, user = {} } = route.params || {};
    const [callStatus, setCallStatus] = useState('Connecting...');
    const [isInCall, setInCall] = useState(false);
    const [callToken, setCallToken] = useState(null);

    
    useEffect(async ()=>{
        const createlogedInUserAuthToken = async () => {
            try {
                let loggedInUser = await CometChat.getLoggedinUser();
                let authToken = loggedInUser?.getAuthToken();
                console.log(authToken,'authToken123')
                return authToken;
            } catch (error) {
                console.error("Error fetching auth token: ", error);
                return null;
            }
        };

        const generateTokenCall = async () => {
            CometChatCalls.generateToken(sessionID, token).then((res) => {
                setCallToken(res.token);
            }).catch(error => {
                console.error('Error generating token:', error);
            });
        }

        const token = await createlogedInUserAuthToken();
        generateTokenCall();
    })


    useEffect(async () => {
        CometChat.addCallListener("UNIQUE_LISTENER_ID", {
            onUserJoined: (joinedUser) => {
                console.log("User joined:", joinedUser);
                setInCall(true);
                setCallStatus('In Call...');
            },
            onUserLeft: (leftUser) => {
                console.log("User left:", leftUser);
            },
            onCallEnded: () => {
                console.log("Call ended");
                setInCall(false);
                setCallStatus('Call Ended');
                navigation.goBack();
            },
            onError: (error) => {
                console.log("Call error:", error);
                setCallStatus('Call Failed');
            },
        });

        return () => {
            CometChat.removeCallListener("UNIQUE_LISTENER_ID");
        };
    }, []);

    useEffect(() => {
        if (callToken) {
            const callListener = new CometChatCalls.OngoingCallListener({
                onUserJoined: (joinedUser) => {
                    console.log("User joined:", joinedUser);
                    setInCall(true);
                    setCallStatus('In Call...');
                },
                onUserLeft: (leftUser) => {
                    console.log("User left:", leftUser);
                },
                onCallEnded: () => {
                    console.log("Call ended");
                    setInCall(false);
                    setCallStatus('Call Ended');
                    navigation.goBack();
                },
                onError: (error) => {
                    console.log("Call error:", error);
                    setCallStatus('Call Failed');
                },
            });

            // Call settings for video/audio
            const callSettings = new CometChatCalls.CallSettingsBuilder()
                .setSessionID(sessionID)
                .setIsAudioOnlyCall(false)  // Set true for audio-only calls
                .setCallEventListener(callListener)
                .enableDefaultLayout(true)
                .build();

            // Start the call session
            CometChatCalls.startSession(callToken, callSettings)
                .then(() => {
                    console.log('Call session started');
                    setCallStatus('In Call');
                })
                .catch((error) => {
                    console.error('Error starting call session:', error);
                    setCallStatus('Call Failed');
                });
        }
    }, [callToken]);

    const endCall = () => {
        CometChat.endCall(sessionID).then(() => {
            console.log('Call ended');
            setInCall(false);
            setCallStatus('Call Ended');
            navigation.goBack();
        }).catch((error) => {
            console.log('Error ending call:', error);
        });
    };

    const cancelCall = () => {
        const cancelStatus = CometChat.CALL_STATUS.CANCELLED;
        CometChat.rejectCall(sessionID, cancelStatus).then((call) => {
            console.log("Call cancelled successfully", call);
            setCallStatus('Call Cancelled');
            navigation.goBack();
        }).catch((error) => {
            console.log("Call cancellation failed with error:", error);
        });
    };

    const handleEndOrCancelCall = () => {
        if (isInCall) {
            endCall();
        } else {
            cancelCall();
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <Image source={{ uri: user.avatar }} style={styles.avatar} />
                <Text style={styles.userName}>{user.name}</Text>
                <Text style={styles.callStatus}>{callStatus}</Text>

                <View style={styles.controlsContainer}>
                    <TouchableOpacity style={styles.endCallButton} onPress={handleEndOrCancelCall}>
                        <Icon name="phone" size={30} color="white" />
                    </TouchableOpacity>
                </View>

                {!isInCall && <ActivityIndicator size="large" color="#00ff00" style={styles.loadingIndicator} />}
            </View>
        </SafeAreaView>
    );
};

export default CallingScreen;


// CallingScreen.tsx

// import React, { useEffect, useState } from 'react';
// import { View, Text, Image, TouchableOpacity, ActivityIndicator, SafeAreaView } from 'react-native';
// import { CometChat } from '@cometchat/chat-sdk-react-native';
// import { CometChatCalls } from '@cometchat/calls-sdk-react-native';
// import Icon from 'react-native-vector-icons/FontAwesome';
// import { styles } from '../styles/CallingScreenStyle';

// interface CallingScreenProps {
//   navigation: any;
//   route: {
//     params: {
//       sessionID: string;
//       isOutgoing: boolean;
//       callType: string;
//       user: {
//         uid: string;
//         name: string;
//         avatar?: string;
//       };
//     };
//   };
// }

// const CallingScreen: React.FC<CallingScreenProps> = ({ navigation, route }) => {
//   const { sessionID, isOutgoing, callType, user } = route.params;
//   const [callStatus, setCallStatus] = useState('Connecting...');
//   const [isInCall, setInCall] = useState(false);
//   const [callToken, setCallToken] = useState<string | null>(null);

//   useEffect(() => {
//     const initializeCall = async () => {
//         try {
//           const loggedInUser = await CometChat.getLoggedinUser();
//           const authToken = loggedInUser?.getAuthToken();
      
//           if (!authToken) {
//             console.error('User is not logged in.');
//             return;
//           }
      
//           // Generate call token
//           const response = await CometChatCalls.generateToken(sessionID, authToken);
//           setCallToken(response.token);
//         } catch (error) {
//           console.error('Error initializing call:', error);
//           setCallStatus('Call Failed');
//         }
//       };

//     initializeCall();
//   }, [sessionID]);

//   useEffect(() => {
//     if (callToken) {
//       const callListener = new CometChatCalls.OngoingCallListener({
//         onUserJoined: (joinedUser) => {
//           console.log('User joined:', joinedUser);
//           setInCall(true);
//           setCallStatus('In Call...');
//         },
//         onUserLeft: (leftUser) => {
//           console.log('User left:', leftUser);
//         },
//         onCallEnded: () => {
//           console.log('Call ended');
//           setInCall(false);
//           setCallStatus('Call Ended');
//           navigation.goBack();
//         },
//         onError: (error) => {
//           console.log('Call error:', error);
//           setCallStatus('Call Failed');
//         },
//       });
  
//       const callSettings = new CometChatCalls.CallSettingsBuilder()
//         .setSessionID(sessionID)
//         .setIsAudioOnlyCall(callType === 'audio')
//         .setCallEventListener(callListener)
//         .enableDefaultLayout(true)
//         .build();
  
//       CometChatCalls.startCall(callToken, callSettings)
//         .then(() => {
//           console.log('Call session started');
//           setCallStatus('In Call');
//         })
//         .catch((error) => {
//           console.error('Error starting call session:', error);
//           setCallStatus('Call Failed');
//         });
  
//       return () => {
//         CometChatCalls.endCall();
//       };
//     }
//   }, [callToken]);
  

//   const endCall = () => {
//     CometChatCalls.endCall()
//       .then(() => {
//         console.log('Call ended');
//         setInCall(false);
//         setCallStatus('Call Ended');
//         navigation.goBack();
//       })
//       .catch((error) => {
//         console.log('Error ending call:', error);
//       });
//   };

//   return (
//     <SafeAreaView style={styles.safeArea}>
//       <View style={styles.container}>
//         <Image source={{ uri: user.avatar }} style={styles.avatar} />
//         <Text style={styles.userName}>{user.name}</Text>
//         <Text style={styles.callStatus}>{callStatus}</Text>

//         <View style={styles.controlsContainer}>
//           <TouchableOpacity style={styles.endCallButton} onPress={endCall}>
//             <Icon name="phone" size={30} color="white" />
//           </TouchableOpacity>
//         </View>

//         {!isInCall && (
//           <ActivityIndicator size="large" color="#00ff00" style={styles.loadingIndicator} />
//         )}
//       </View>
//     </SafeAreaView>
//   );
// };

// export default CallingScreen;
