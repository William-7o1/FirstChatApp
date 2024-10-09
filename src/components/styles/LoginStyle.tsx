
import { StyleSheet, Dimensions } from "react-native";

// Get device dimensions for responsive design
const { width, height } = Dimensions.get('window');

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#ffffff', // Clean white background
    },
    logo: {
        width: width * 0.3, // Responsive width
        height: width * 0.3,
        resizeMode: 'contain',
        marginBottom: 20,
    },
    title: {
        fontSize: 26,
        fontWeight: '700',
        marginBottom: 5,
        color: '#075E54', // WhatsApp green
    },
    subtitle: {
        fontSize: 16,
        color: '#555555',
        marginBottom: 25,
    },
    loader: {
        marginVertical: 20,
    },
    inputContainer: {
        width: '100%',
        marginBottom: 15,
    },
    input: {
        width: '100%',
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderColor: '#e0e0e0',
        borderWidth: 1,
        borderRadius: 25,
        backgroundColor: '#f0f0f0',
        fontSize: 16,
        color: '#333333',
    },
    loginButton: {
        backgroundColor: '#25D366', // WhatsApp green
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 25,
        alignItems: 'center',
        shadowColor: '#25D366',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3,
        elevation: 3, // For Android shadow
        marginBottom: 15,
        width: '100%',
    },
    loginButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
    newUserText: {
        textAlign: 'center',
        fontSize: 14,
        color: '#555555',
        marginTop:30,
        paddingBottom:10
    },
    newUserButton: {
        marginTop: 8,
        backgroundColor: '#128C7E', // Darker WhatsApp green
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 25,
        alignItems: 'center',
        shadowColor: '#128C7E',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3,
        elevation: 3,
        width: '100%',
    },
    newUserButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
    logoutButton: {
        backgroundColor: '#ff5252',
        paddingVertical: 10,
        paddingHorizontal: 25,
        borderRadius: 20,
        position: 'absolute',
        bottom: 20,
        shadowColor: '#ff5252',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3,
        elevation: 3,
        marginTop:30,
        marginBottom:20
    },
    logoutButtonText: {
        color: '#ffffff',
        fontSize: 14,
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
        backgroundColor: '#ffffff',
        padding: 20,
        borderRadius: 15,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 15,
        color: '#333333',
    },
    modalInput: {
        width: '100%',
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderColor: '#e0e0e0',
        borderWidth: 1,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
        fontSize: 16,
        color: '#333333',
        marginBottom: 15,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    modalButton: {
        backgroundColor: '#25D366',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 20,
        alignItems: 'center',
        flex: 1,
        marginHorizontal: 5,
    },
    modalButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
    cancelButton: {
        backgroundColor: '#cccccc',
    },
    cancelButtonText: {
        color: '#333333',
    },
});
