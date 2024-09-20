import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F0F0F0', // Light background for the entire screen
    },
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF', // White background for the chat
        padding: 15,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between', 
        marginBottom:15,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#58b6a6', // Header color
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius:10
    },
    backButton: {
        marginRight: 10,
    },
    backButtonText: {
        fontSize: 24,
        color: '#fff',
    },
    infoButton: {
        // backgroundColor: '#34C759', // Info button color
        borderRadius: 20,
        // borderWidth:2,
        padding: 8,
    },
    infoButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
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
    headerText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
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
        backgroundColor: '#E1FFC7', // Sent message color
        alignSelf: 'flex-end',
    },
    receivedMessage: {
        backgroundColor: '#F0F0F0', // Received message color
        alignSelf: 'flex-start',
    },
    deletedMessage: {
        backgroundColor: '#FFCCCB', // Color for deleted messages
    },
    deletedText: {
        color: '#A9A9A9',
        fontStyle: 'italic',
    },
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
        marginTop:6,
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
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        // alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
    },
    modalContent: {
        // width: '90%',
        flex:1,
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        padding: 20,
    },
    modalGroupName: {
        fontSize: 30,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    modalSubName: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
        marginTop:20,
    },
    membersList: {
        maxHeight: '90%',
        // width:'100%',
        marginBottom: 10,
    },
    memberItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 5,
    },
    memberAvatar: {
        width: 30,
        height: 30,
        borderRadius: 15,
        marginRight: 10,
    },
    memberName: {
        fontSize: 16,
    },
    closeButton: {
        backgroundColor: '#FF3B30',
        borderRadius: 20,
        paddingVertical: 5,
        
        paddingHorizontal: 10,
        flex: 1, // Use flex to ensure buttons take equal space
        marginRight: 5, // Add space between buttons
    },
    closeButtonText: {
        color: '#fff',
        paddingVertical:10,
        fontSize:18,
        fontWeight: 'bold',
        textAlign: 'center', // Center text within the button
    },
    leaveButton: {
        backgroundColor: '#FFCC00',
        borderRadius: 20,
        paddingVertical: 5,
        paddingHorizontal: 10,
        flex: 1, // Use flex to ensure buttons take equal space
        marginLeft: 5, // Add space between buttons
    },
    leaveButtonText: {
        // color: '#fff',
        paddingVertical:10,
        fontSize:18,
        // fontWeight: 'bold',
        // textAlign: 'center',
        color: '#fff',
        fontWeight: 'bold',
        textAlign: 'center', // Center text within the button
    },
});