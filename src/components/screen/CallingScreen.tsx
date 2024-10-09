// Top Code 

//MAIN CODE
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { CometChat } from '@cometchat/chat-sdk-react-native';
import { styles } from '../styles/CallingScreenStyle';
import { CometChatCalls } from '@cometchat/calls-sdk-react-native';

const CallingScreen = ({ navigation, route }) => {
    const { sessionID, callType } = route.params || {}; 
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
                onCallEnded: () => {
                    CometChatCalls.endSession();
                    CometChat.clearActiveCall();
                    
                    console.log('Event: onCallEnded onCallEndedonCallEnded');
                    setCallStatus('Call Ended');
                    setInCall(false);
                    isInCallRef.current = false;

                    
                    navigation.goBack();
                },
                onCallEndButtonPressed:  () => {
                    if (isInCallRef.current) {
                        CometChat.endCall(sessionID)
                        .then(() => {
                            console.log('CometChat.endCall(sessionID)');
                        })
                        .catch((err: any) => {
                            console.log("Error", err);
                        })
                        console.log('Action: Call Ended Successfully');
            
                        // Update state
                        setInCall(false);
                        isInCallRef.current = false;
                        setCallStatus('Call Ended'); 
                        navigation.goBack();
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
                .setIsAudioOnlyCall(callType === CometChat.CALL_TYPE.AUDIO) // Set to false if video call is needed
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

// import React, { useEffect, useState, useRef } from 'react';
// import { View, Text, ActivityIndicator } from 'react-native';
// import { CometChat } from '@cometchat/chat-sdk-react-native';
// import { styles } from '../styles/CallingScreenStyle';
// import { CometChatCalls } from '@cometchat/calls-sdk-react-native';

// const CallingScreen = ({ navigation, route }) => {
//     const { sessionID } = route.params || {};
//     const [callStatus, setCallStatus] = useState('Connecting...');
//     const [isInCall, setInCall] = useState(false);
//     const [callSettings, setCallSettings] = useState(null);
//     const [callToken, setCallToken] = useState(null);
//     const [logUser, setlogUser] = useState(null);

//     // Ref to track the latest isInCall state
//     const isInCallRef = useRef(false);

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
//                 console.log('Call Token Generated:', res.token);
//             } catch (error) {
//                 console.error('Error initializing call:', error);
//                 setCallStatus(`Call Failed: ${error.message || 'Unknown Error'}`);
//             }
//         };

//         initializeCall();
//     }, [sessionID]);

//     useEffect(() => {
//         if (callToken) {
//             const callListener = new CometChatCalls.OngoingCallListener({
//                 onUserJoined: (joinedUser) => {
//                     console.log('Event: onUserJoined -', joinedUser.name);
//                     setInCall(true);
//                     setCallStatus('In Call...');
//                 },
//                 onUserLeft: (leftUser) => {
//                     console.log('Event: onUserLeft -', leftUser.name);
//                 },
//                 onUserListUpdated: (userList) => {
//                     console.log("onUserListUpdated userList length", userList.length);
//                     userList.length > 1 ? isInCallRef.current = true : isInCallRef.current = false; 
//                     console.log(isInCallRef.current, "isInCallRef.current - onUserListUpdated")
    
//                 },
//                 onCallEnded: () => {
//                     console.log('Event: onCallEnded onCallEndedonCallEndedonCallEnded');
//                     setCallStatus('Call Ended');
//                     setInCall(false);
//                     isInCallRef.current = false;
//                     CometChatCalls.endSession()
//                     CometChat.clearActiveCall()
//                     // navigation.goBack();
//                 },
//                 onCallEndButtonPressed: () => {
//                     console.log('Event: onCallEndButtonPressed');
//                     if (isInCallRef.current) {                  
//                         // CometChat.endCall(sessionID);
//                         console.log('Action: Call Ended Successfully onCallEndButtonPressed');
//                         setInCall(false);
//                         isInCallRef.current = false; // Update the ref
//                         setCallStatus('Call Ended'); 
//                     } else {
//                         cancelCall();
//                     }
//                 },
                
//                 onError: (error) => {
//                     console.log('Event: onError -', error);
//                     setCallStatus(`Call Failed: ${error.message || 'Unknown Error'}`);
//                 },
//             });

//             const settings = new CometChatCalls.CallSettingsBuilder()
//                 .setIsAudioOnlyCall(true)  // Set to false if video call is needed
//                 .setCallEventListener(callListener)
//                 .enableDefaultLayout(true)
//                 .build();

//             setCallSettings(settings);
//             console.log('Call Settings Configured');

//             // Cleanup listener on unmount
//             return () => {
//                 console.log('Cleanup: Removing Call Listener');
//                 CometChatCalls.removeCallEventListener(callListener);
//             };
//         }
//     }, [callToken, sessionID, navigation]);

//     // const endCall = () => {
        

//     const cancelCall = () => {
//         const cancelStatus = CometChat.CALL_STATUS.CANCELLED;
//         CometChat.rejectCall(sessionID, cancelStatus)
//             .then((call) => {
//                 console.log('Action: Call Cancelled Successfully', call);
//                 setCallStatus('Call Cancelled');
//                 setInCall(false);
//                 isInCallRef.current = false; // Update the ref
//                 navigation.goBack();
//             })
//             .catch((error) => {
//                 console.log('Error Cancelling Call:', error);
//                 setCallStatus(`Error Cancelling Call: ${error.message || 'Unknown Error'}`);
//             });
//     };

//     return (
//         <View style={{ height: '100%', width: '100%' }}>
//             {callSettings && callToken ?
//                 <CometChatCalls.Component
//                     callSettings={callSettings}
//                     callToken={callToken}
//                 />
//                 :
//                 <View style={styles.loaderContainer}>
//                     <ActivityIndicator size="large" color="#0000ff" />
//                     <Text>{callStatus}</Text>
//                 </View>
//             }
//         </View>
//     );
// };

// export default CallingScreen;