import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F0F0F0',
    },
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        padding: 15,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#58b6a6',
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 10,
        justifyContent:'space-between'
    },
    messageStatus: {
        fontSize: 12,
        color: 'gray',
        // textAlign: 'left',
        marginLeft: 5,
    },
    backButton: {
        alignSelf:'center',
        marginRight: 10,
    },
    backButtonText: {
        fontSize: 24,
        color: '#fff',
    },
    // headerContent: {
    //     flex: 1,
    //     flexDirection: 'row',
    //     alignItems: 'center',
    // },
    // avatar: {
    //     width: 40,
    //     height: 40,
    //     borderRadius: 20,
    //     marginRight: 10,
    // },
    // headerText: {
    //     fontSize: 18,
    //     fontWeight: 'bold',
    //     color: '#fff',
    // },
    headerContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
      },
      avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
      },
      nameContainer: {
        flexDirection: 'column',
      },
      headerText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
      },
      typingText: {
        marginLeft: 0,
        fontSize: 14,
        marginTop: 3,
        color: 'white',
      },
    messageList: {
        paddingBottom: 15,
    },
    messageBubble: {
        maxWidth: '80%',
        padding: 10,
        borderRadius: 15,
        marginVertical: 5,
    },
    sentMessage: {
        backgroundColor: '#E1FFC7',
        alignSelf: 'flex-end',
    },
    receivedMessage: {
        backgroundColor: '#F0F0F0',
        alignSelf: 'flex-start',
    },
    // deletedMessage: {
    //     backgroundColor: '#FFCCCB',
    // },
    // deletedText: {
    //     color: '#A9A9A9',
    //     fontStyle: 'italic',
    // },
    messageText: {
        fontSize: 16,
        color: '#333',
    },
    editedText: {
        fontSize: 12,
        color: '#A9A9A9',
    },
    senderName: {
        fontSize: 12,
        color: '#777',
        textAlign: 'right',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: '#DDDDDD',
    },
    input: {
        flex: 1,
        padding: 10,
        borderRadius: 20,
        backgroundColor: '#F0F0F0',
        marginRight: 10,
        borderColor: '#DDDDDD',
        borderWidth: 1,
    },
    sendButton: {
        backgroundColor: '#007AFF',
        borderRadius: 20,
        paddingVertical: 10,
        paddingHorizontal: 20,
    },
    sendButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    infoButton: {
        borderRadius: 20,
        padding: 8,
    },
    tickMark: {
        marginLeft: 5,
    },
    callButton:{
        marginRight:12
    },
    receiptContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    receiptText: {
        fontSize: 12,
        color: '#888', // You can choose your own color
        marginLeft: 5,
    },
    typingIndicator: {
        padding: 10,
        backgroundColor: '#f0f0f0',
        borderRadius: 5,
        marginVertical: 5,
        alignSelf: 'flex-start',
    },
    
modalOverlay: {
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
    alignItems: 'center',
  },
  callerAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 20,
  },
  callerAvatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  callerInitial: {
    fontSize: 30,
    color: '#fff',
  },
  callerName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  rejectButton: {
    backgroundColor: '#e74c3c',
  },
  acceptButton: {
    backgroundColor: '#2ecc71',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  callBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 15,
    marginVertical: 5,
    maxWidth: '80%',
  },
  sentCallBubble: {
    backgroundColor: '#697565', // Blue color for sent calls
    alignSelf: 'flex-end',
  },
  receivedCallBubble: {
    backgroundColor: '#3A6D8C', // Green color for received calls (you can choose blue as well)
    alignSelf: 'flex-start',
  },
  callIcon: {
    marginRight: 8,
  },
  callText: {
    color: '#fff',
    fontSize: 16,
  },
  callTimestamp: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 'auto',
  },
  deletedMessage: {
    backgroundColor: '#FFCCCB', // Color for deleted messages
  },
  deletedText: {
      color: '#A9A9A9',
      fontStyle: 'italic',
  },
});