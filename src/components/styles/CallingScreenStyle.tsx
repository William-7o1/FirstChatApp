import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#000',
    },
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 20,
    },
    userName: {
        color: 'white',
        fontSize: 20,
        marginBottom: 10,
    },
    callStatus: {
        color: 'white',
        fontSize: 18,
        marginBottom: 30,
    },
    controlsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        marginBottom: 20,
    },
    controlButton: {
        backgroundColor: '#007bff',
        borderRadius: 50,
        padding: 10,
    },
    endCallButton: {
        backgroundColor: 'red',
        borderRadius: 50,
        padding: 10,
    },
    loadingIndicator: {
        marginTop: 20,
    },
    callComponentContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        height: '100%',
        width: '100%',
    },
});
