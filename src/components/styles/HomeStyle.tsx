import { StyleSheet } from "react-native";
import { Platform } from "react-native";

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f8f9fa',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
        marginTop: Platform.OS === "ios" ? 50 :20,
    },
    logo: {
        width: 40,
        height: 40,
    },
    logoutButton: {
        backgroundColor: '#6200ee',
        borderRadius: 5,
        padding: 10,
    },
    logoutText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    userItem: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
    },
    userName: {
        fontSize: 16,
        color: '#333',
    },
    groupItem: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    groupName: {
        fontSize: 16,
        color: '#333',
    },
    createGroupButton: {
        backgroundColor: '#6200ee',
        borderRadius: 10,
        padding: 10,
        marginTop: 10,
        alignItems: 'center',
        marginHorizontal:30
    },
    createGroupButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    modalBackground: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContainer: {
        width: '80%',
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 10,
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    input: {
        width: '100%',
        borderColor: '#ddd',
        borderWidth: 1,
        borderRadius: 5,
        padding: 10,
        marginBottom: 20,
    },
    friendContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    friendItem: {
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    friendName: {
        fontSize: 16,
        color: '#333',
    },
    closeButton: {
        marginHorizontal:30,
        marginTop: 10,
        backgroundColor: '#ccc',
        borderRadius: 5,
        padding: 10,
    },
    closeButtonText: {
        fontWeight: 'bold',
    },
    conversationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      },
      userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
      },
      lastMessage: {
        color: '#888',
        fontSize: 14,
        marginTop: 2,
      },
      statusContainer: {
        alignItems: 'flex-end',
      },
      unreadCountContainer: {
        backgroundColor: '#6200ee',
        borderRadius: 12,
        paddingHorizontal: 6,
        paddingVertical: 2,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 5,
        // marginRight: 50, 
      },
      unreadCountText: {
        color: '#fff',
        fontSize: 12,
      },
      avatarContainer: {
        position: 'relative',
      },
      statusIndicator: {
        position: 'absolute',
        bottom: 0,
        right: 40,
        width: 14,
        height: 14,
        borderRadius: 7,
        borderWidth: 2,
        borderColor: '#fff',
      },
      textContainer: {
        flex: 1,
      },
      
});
