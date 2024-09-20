import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#e5ddd5',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 40,
    },
    logo: {
        width: 40,
        height: 40,
    },
    logoutButton: {
        padding: 10,
    },
    logoutText: {
        fontSize: 16,
        color: '#6200ee',
    },
    listContainer: {
        flex: 1,
        marginTop: 20,
    },
    listHeader: {
        // flex:2/3,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    listHeadText: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    addGroupText: {
        fontSize: 16,
        color: '#6200ee',
    },
    userItem: {
        flexDirection:'row',
        justifyContent:'space-between',
        padding: 15,
        backgroundColor: '#fff',
        borderRadius: 8,
        marginBottom: 10,
        elevation: 1,
    },
    userName: {
        fontSize: 18,
        alignSelf:'center',
        color: '#333',
    },
    groupItem: {
        padding: 15,
        backgroundColor: '#fff',
        borderRadius: 8,
        marginBottom: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        elevation: 1,
    },
    groupName: {
        alignSelf:'center',
        fontSize: 18,
        color: '#333',
    },
    deleteGroupText: {
        fontSize: 16,
        color: '#ff0000',
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
        borderRadius: 10,
        padding: 20,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 10,
        marginBottom: 15,
    },
    modalUserList: {
        maxHeight: 150,
    },
    selectedUser: {
        backgroundColor: '#cfe9c6',
    },
    createGroupButton: {
        backgroundColor: '#6200ee',
        borderRadius: 5,
        padding: 10,
        alignItems: 'center',
        marginVertical: 10,
    },
    createGroupButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    closeButton: {
        alignItems: 'center',
        padding: 10,
    },
    closeButtonText: {
        color: '#6200ee',
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    statusDot: {
        marginLeft:6,
        alignSelf:'center',
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 5,
    },
    statusText: {
        fontSize: 12,
        color: '#555',
    },
});