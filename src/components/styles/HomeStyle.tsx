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
        marginTop: Platform.OS === "ios" ? 50 : 20,
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
        marginHorizontal: 30
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
        marginTop: 10,
        backgroundColor: '#ccc',
        borderRadius: 5,
        padding: 10,
    },
    closeButtonText: {
        fontWeight: 'bold',
        alignSelf:'center'
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
        marginLeft: 10,
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
    avatarPlaceholder: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#cccccc',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarInitial: {
        fontSize: 20,
        color: '#ffffff',
    },
    
    headerTitle: {
        fontSize: 20,
        fontWeight: '600',
      },
      loader: {
        marginTop: 20,
      },
      emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      },
      emptyText: {
        fontSize: 16,
        color: '#8E8E93',
        textAlign: 'center',
      },
      fab: {
        position: 'absolute',
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#6200ee',
        alignItems: 'center',
        justifyContent: 'center',
        right: 20,
        bottom: 30,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      fabIcon: {
        fontSize: 30,
        color: '#fff',
        lineHeight: 30,
      },
      modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
      },
      typingText: {
        fontSize: 14,
        color: '#8E8E93',
        marginTop: 2,
        fontStyle: 'italic',
      },
      
    
      // User Selection Modal styles
      userModalContainer: {
        width: '80%',
        maxHeight: '80%',
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 20,
      },
    
      userItemModal: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomColor: '#ddd',
        borderBottomWidth: 1,
      },
      userAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
      },
      userInfoModal: {
        marginLeft: 10,
      },
      userNameModal: {
        fontSize: 16,
        fontWeight: '500',
      },
      userStatusModal: {
        fontSize: 14,
        color: '#666',
      },
      
});
