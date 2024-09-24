import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#f5f5f5',
    },
    logo: {
        width: 120,
        height: 120,
        marginBottom: 30,
    },
    title: {
        fontSize: 30,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333',
    },
    loader: {
        marginVertical: 20,
    },
    loginButton: {
        marginTop:10,
        backgroundColor: '#6200ee',
        paddingVertical: 15,
        paddingHorizontal: 40,
        borderRadius: 25,
        marginBottom: 20,
    },
    loginButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    newUserText: {
        marginTop: 50, // Adjust as needed
        textAlign: 'center',
        fontSize: 16,
        color: '#000',
    },
    newUserButton: {
        marginTop: 10,
        backgroundColor: '#03dac5',
        paddingVertical: 15,
        paddingHorizontal: 40,
        borderRadius: 25,
        marginBottom: 20,
    },
    newUserButtonText: {
        color: '#fff',
        fontSize: 22,
        fontWeight: '600',
    },
    logoutButton: {
        backgroundColor: '#ff5252',
        paddingVertical: 15,
        paddingHorizontal: 40,
        borderRadius: 25,
        position: 'absolute',
        bottom: 20,
    },
    logoutButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        width: '80%',
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 10,
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    input: {
        width: '100%',
        padding: 10,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 5,
        marginBottom: 20,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    modalButton: {
        backgroundColor: '#6200ee',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
    },
    modalButtonText: {
        color: '#fff',
        fontSize: 16,
    },
});
