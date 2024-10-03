// Top Code 

// import React, { useEffect, useState } from 'react';
// import { View, Text, Image, TouchableOpacity, ActivityIndicator, SafeAreaView } from 'react-native';
// import { CometChat } from '@cometchat/chat-sdk-react-native';
// import Icon from 'react-native-vector-icons/FontAwesome';
// import { styles } from '../styles/CallingScreenStyle';
// import { CometChatCalls } from '@cometchat/calls-sdk-react-native';

// const CallingScreen = ({ navigation, route }) => {
//     const { sessionID } = route.params || {};
//     const [callStatus, setCallStatus] = useState('Connecting...');
//     const [isInCall, setInCall] = useState(false);
//     // const [callSet, setCallSet] = useState(null);
//     const [callSettings, setCallSettings] = useState(null);
//     const [check, setCheck] = useState(false);
//     const [callToken, setCallToken] = useState(null);
//     const [logUser, setlogUser] = useState(null);

//     useEffect(() => {
//         const initializeCall = async () => {
//             try {
//                 // Fetch the logged-in user's auth token
//                 const loggedInUser = await CometChat.getLoggedinUser();
//                 setlogUser(loggedInUser);
//                 const authToken = loggedInUser?.getAuthToken();
//                 console.log('Auth Token:', authToken);

//                 if (!authToken) {
//                     throw new Error('Auth token is null');
//                 }

//                 // Generate call token using CometChatCalls
//                 const res = await CometChatCalls.generateToken(sessionID, authToken);
//                 setCallToken(res.token);

//             } catch (error) {
//                 console.error('Error initializing call:', error);
//                 setCallStatus('Call Failed');
//             }
//         };

//         initializeCall();
//     }, [sessionID]);

//     useEffect(() => {
//         if (callToken) {
//             const callListener = new CometChatCalls.OngoingCallListener({
//                 onUserJoined: (joinedUser) => {
//                     setCheck(true)
//                     console.log('User joined: onUserJoined', joinedUser.name);
//                     setInCall(true);
//                     setCallStatus('In Call...');
//                 },
//                 onUserLeft: (leftUser) => {
//                     console.log('User left: leftUser ', leftUser.name);
//                 },
//                 onCallEnded: () => {
//                     console.log('Call ended onCallEnded',);
//                     // setInCall(false);
//                     setCallStatus('Call Ended');
//                     navigation.goBack();
//                     CometChatCalls.endSession();
//                 },
//                 onCallEndButtonPressed: () => {
//                   endCall() 
//                 //   : cancelCall();
//                   console.log("End Call button pressed");
//               },
//                 onError: (error) => {
//                     console.log('Call error:', error);
//                     setCallStatus('Call Failed');
//                 },
//             });

            
            
//             const settings = new CometChatCalls.CallSettingsBuilder()
//                 .setIsAudioOnlyCall(true)  // Set true for audio-only calls
//                 .setCallEventListener(callListener)
//                 .enableDefaultLayout(true)
//                 .build();


//             setCallSettings(settings);

//             // Cleanup listener on unmount
//             return () => {
//                 CometChatCalls.removeCallEventListener(callListener);
//             };
//         }
//     }, [callToken, sessionID, navigation]);

//     const endCall = () => {
//         // logUser ? 
//         CometChat.endCall(sessionID)
//             .then(() => {
//                 console.log('Call ended,  CometChat.endCall CometChat.endCall');
//                 setInCall(false);
//                 setCallStatus('Call Ended');
//                 CometChat.clearActiveCall();
//                 CometChatCalls.endSession();
//                 navigation.goBack();
//             })
//             .catch((error) => {
//                 console.log('Error ending call:', error);
//             })

//     };

//     const cancelCall = () => {
//         const cancelStatus = CometChat.CALL_STATUS.CANCELLED;
//         CometChat.rejectCall(sessionID, cancelStatus)
//             .then((call) => {
//                 console.log('Call cancelled successfully', call);
//                 setCallStatus('Call Cancelled');
//                 navigation.goBack();
//                 setInCall(false);
//             })
//             .catch((error) => {
//                 console.log('Call cancellation failed with error:', error);
//             });
//     };

//     return (
//       <View style={{height: '100%', width: '100%', 
//       // position: 'relative'
//       }}>
//           {callSettings && callToken ? 
//             <>
//             <CometChatCalls.Component
//                   callSettings={callSettings}
//                   callToken={callToken}
//               />
//             </> 
//             :
//             ''
//           } 
//       </View>
//   );
  
// };

// export default CallingScreen;



// import React, { useEffect, useState } from 'react';
// import { View, Text, Image, TouchableOpacity, ActivityIndicator, SafeAreaView } from 'react-native';
// import { CometChat } from '@cometchat/chat-sdk-react-native';
// import Icon from 'react-native-vector-icons/FontAwesome';
// import { styles } from '../styles/CallingScreenStyle';
// import { CometChatCalls } from '@cometchat/calls-sdk-react-native';

// const CallingScreen = ({ navigation, route }) => {
//     const { sessionID } = route.params || {};
//     const [callStatus, setCallStatus] = useState('Connecting...');
//     const [isInCall, setInCall] = useState(false);
//     // const [callSet, setCallSet] = useState(null);
//     const [callSettings, setCallSettings] = useState(null);
//     const [check, setCheck] = useState(false);
//     const [callToken, setCallToken] = useState(null);
//     const [logUser, setlogUser] = useState(null);

//     useEffect(() => {
//         const initializeCall = async () => {
//             try {
//                 // Fetch the logged-in user's auth token
//                 const loggedInUser = await CometChat.getLoggedinUser();
//                 setlogUser(loggedInUser);
//                 const authToken = loggedInUser?.getAuthToken();
//                 console.log('Auth Token:', authToken);

//                 if (!authToken) {
//                     throw new Error('Auth token is null');
//                 }

//                 // Generate call token using CometChatCalls
//                 const res = await CometChatCalls.generateToken(sessionID, authToken);
//                 setCallToken(res.token);

//             } catch (error) {
//                 console.error('Error initializing call:', error);
//                 setCallStatus('Call Failed');
//             }
//         };

//         initializeCall();
//     }, [sessionID]);

//     useEffect(() => {
//         if (callToken) {
//             const callListener = new CometChatCalls.OngoingCallListener({
//                 onUserJoined: (joinedUser) => {
//                     setCheck(true);
//                     console.log('User joined: onUserJoined', joinedUser.name);
//                     setInCall(true);
//                     setCallStatus('In Call...');
//                 },
//                 onUserLeft: (leftUser) => {
//                     console.log('User left: leftUser ', leftUser.name);
//                 },
//                 onCallEnded: () => {
//                     console.log('Call ended onCallEnded');
//                     setCallStatus('Call Ended');
//                     navigation.goBack();
//                     CometChatCalls.endSession();
//                 },
//                 onCallEndButtonPressed: () => {
//                     if (isInCall) {
//                         endCall();
//                     } else {
//                         cancelCall();
//                     }
//                 },
//                 onError: (error) => {
//                     console.log('Call error:', error);
//                     setCallStatus('Call Failed');
//                 },
//             });

//             const settings = new CometChatCalls.CallSettingsBuilder()
//                 .setIsAudioOnlyCall(true)  // Set true for audio-only calls
//                 .setCallEventListener(callListener)
//                 .enableDefaultLayout(true)
//                 .build();

//             setCallSettings(settings);

//             // Cleanup listener on unmount
//             return () => {
//                 CometChatCalls.removeCallEventListener(callListener);
//             };
//         }
//     }, [callToken, sessionID, navigation, isInCall]);

//     const endCall = () => {
//         CometChat.endCall(sessionID)
//             .then(() => {
//                 console.log('Call ended, CometChat.endCall');
//                 setInCall(false);
//                 setCallStatus('Call Ended');
//                 CometChat.clearActiveCall();
//                 CometChatCalls.endSession();
//                 navigation.goBack();
//             })
//             .catch((error) => {
//                 console.log('Error ending call:', error);
//             });
//     };

//     const cancelCall = () => {
//         const cancelStatus = CometChat.CALL_STATUS.CANCELLED;
//         CometChat.rejectCall(sessionID, cancelStatus)
//             .then((call) => {
//                 console.log('Call cancelled successfully', call);
//                 setCallStatus('Call Cancelled');
//                 navigation.goBack();
//                 setInCall(false);
//             })
//             .catch((error) => {
//                 console.log('Call cancellation failed with error:', error);
//             });
//     };

//     return (
//       <View style={{height: '100%', width: '100%'}}>
//           {callSettings && callToken ? 
//             <>
//               <CometChatCalls.Component
//                   callSettings={callSettings}
//                   callToken={callToken}
//               />
//             </> 
//             :
//             <View style={styles.loaderContainer}>
//                 <ActivityIndicator size="large" color="#0000ff" />
//                 <Text>{callStatus}</Text>
//             </View>
//           } 
//       </View>
//   );
  
// };

// export default CallingScreen;


//MAIN CODE
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { CometChat } from '@cometchat/chat-sdk-react-native';
import { styles } from '../styles/CallingScreenStyle';
import { CometChatCalls } from '@cometchat/calls-sdk-react-native';

const CallingScreen = ({ navigation, route }) => {
    const { sessionID } = route.params || {};
    const [callStatus, setCallStatus] = useState('Connecting...');
    const [isInCall, setInCall] = useState(false);
    const [callSettings, setCallSettings] = useState(null);
    const [callToken, setCallToken] = useState(null);
    const [logUser, setlogUser] = useState(null);

    // Ref to track the latest isInCall state
    const isInCallRef = useRef(false);

    useEffect(() => {
        const initializeCall = async () => {
            try {
                // Fetch the logged-in user's auth token
                const loggedInUser = await CometChat.getLoggedinUser();
                setlogUser(loggedInUser);
                const authToken = loggedInUser?.getAuthToken();
                console.log('Auth Token:', authToken);

                if (!authToken) {
                    throw new Error('Auth token is null');
                }

                // Generate call token using CometChatCalls
                const res = await CometChatCalls.generateToken(sessionID, authToken);
                setCallToken(res.token);
                console.log('Call Token Generated:', res.token);
            } catch (error) {
                console.error('Error initializing call:', error);
                setCallStatus(`Call Failed: ${error.message || 'Unknown Error'}`);
            }
        };

        initializeCall();
    }, [sessionID]);

    useEffect(() => {
        if (callToken) {
            const callListener = new CometChatCalls.OngoingCallListener({
                onUserJoined: (joinedUser) => {
                    console.log('Event: onUserJoined -', joinedUser.name);
                    setInCall(true);
                    setCallStatus('In Call...');
                },
                onUserLeft: (leftUser) => {
                    console.log('Event: onUserLeft -', leftUser.name);
                },
                onUserListUpdated: (userList) => {
                    console.log("onUserListUpdated userList length", userList.length);
                    userList.length > 1 ? isInCallRef.current = true : isInCallRef.current = false; 
                    console.log(isInCallRef.current, "isInCallRef.current - onUserListUpdated")
    
                },
                // onCallEnded: () => {
                //     console.log('Event: onCallEnded');
                //     setCallStatus('Call Ended');
                //     setInCall(false);
                //     isInCallRef.current = false;
                //     CometChat.clearActiveCall(); // Ensures the active call is cleared
                //     CometChatCalls.endSession();
                //     navigation.goBack();
                // },
                onCallEnded: async () => {
                    console.log('Event: onCallEnded');
                    setCallStatus('Call Ended');
                    setInCall(false);
                    isInCallRef.current = false;
                
                    try {
                        // Clear active call for the user
                        await CometChat.clearActiveCall();
                        console.log('Action: Active Call Cleared');
                
                        // End the call session to release resources
                        await CometChatCalls.endSession();
                        console.log('Action: Call Session Ended');
                
                        // Navigate back after cleanup
                        navigation.goBack();
                    } catch (error) {
                        console.log('Error in onCallEnded:', error);
                        setCallStatus(`Error Ending Call: ${error.message || 'Unknown Error'}`);
                    }
                },
                // onCallEndButtonPressed: () => {
                //     console.log('Event: onCallEndButtonPressed');
                //     if (isInCallRef.current) {
                //         // endCall();
                //         CometChat.endCall(sessionID)
                //             .then(() => {
                //                 console.log('Action: Call Ended Successfully');
                //                 setInCall(false);
                //                 isInCallRef.current = false; // Update the ref
                //                 setCallStatus('Call Ended'); 
                //                 navigation.goBack();
                //             })
                //             .catch((error) => {
                //                 console.log('Error Ending Call:', error);
                //                 setCallStatus(`Error Ending Call: ${error.message || 'Unknown Error'}`);
                //             });
                //     } else {
                //         cancelCall();
                //     }
                // },
                onCallEndButtonPressed: async () => {
                    console.log('Event: onCallEndButtonPressed');
                    if (isInCallRef.current) {
                        try {
                            // End the call using CometChat Chat SDK
                            await CometChat.endCall(sessionID);
                            console.log('Action: Call Ended Successfully');
                
                            // Clean up calling resources using CometChat Calls SDK
                            await CometChatCalls.endSession();
                            console.log('Action: Call Session Ended Successfully');
                
                            // Update state
                            setInCall(false);
                            isInCallRef.current = false; // Update the ref
                            setCallStatus('Call Ended'); 
                
                            // Navigate back after cleanup
                            navigation.goBack();
                        } catch (error) {
                            console.log('Error Ending Call:', error);
                            setCallStatus(`Error Ending Call: ${error.message || 'Unknown Error'}`);
                        }
                    } else {
                        cancelCall();
                    }
                },
                
                onError: (error) => {
                    console.log('Event: onError -', error);
                    setCallStatus(`Call Failed: ${error.message || 'Unknown Error'}`);
                },
            });

            const settings = new CometChatCalls.CallSettingsBuilder()
                .setIsAudioOnlyCall(true)  // Set to false if video call is needed
                .setCallEventListener(callListener)
                .enableDefaultLayout(true)
                .build();

            setCallSettings(settings);
            console.log('Call Settings Configured');

            // Cleanup listener on unmount
            return () => {
                console.log('Cleanup: Removing Call Listener');
                CometChatCalls.removeCallEventListener(callListener);
            };
        }
    }, [callToken, sessionID, navigation]);

    // const endCall = () => {
        

    const cancelCall = () => {
        const cancelStatus = CometChat.CALL_STATUS.CANCELLED;
        CometChat.rejectCall(sessionID, cancelStatus)
            .then((call) => {
                console.log('Action: Call Cancelled Successfully', call);
                setCallStatus('Call Cancelled');
                setInCall(false);
                isInCallRef.current = false; // Update the ref
                navigation.goBack();
            })
            .catch((error) => {
                console.log('Error Cancelling Call:', error);
                setCallStatus(`Error Cancelling Call: ${error.message || 'Unknown Error'}`);
            });
    };

    return (
        <View style={{ height: '100%', width: '100%' }}>
            {callSettings && callToken ?
                <CometChatCalls.Component
                    callSettings={callSettings}
                    callToken={callToken}
                />
                :
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color="#0000ff" />
                    <Text>{callStatus}</Text>
                </View>
            }
        </View>
    );
};

export default CallingScreen;

