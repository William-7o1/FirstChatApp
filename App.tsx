import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Home from './src/components/home/Home';
import { Login } from './src/components/login/Login';
import UserList from './src/components/screen/UserList';
import ChatScreen from './src/components/screen/ChatScreen';
import GroupChatScreen from './src/components/screen/GroupChatScreen';

const Stack = createNativeStackNavigator();

function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login" >
      {/* <Stack.Navigator initialRouteName="Home"> */}
        <Stack.Screen name="Login" component={Login} 
        // options={{title: 'Welcome' , headerTintColor: '#e5ddd5'}}
        options={{ headerShown: false }} 
        />
        <Stack.Screen name="UserList" component={UserList} />
        {/* <Stack.Screen name="GroupChat" component={GroupChat} /> */}
        <Stack.Screen name="GroupChatScreen" component={GroupChatScreen}  options={{ headerShown: false }}/>
        <Stack.Screen name="Chat" component={ChatScreen}  options={{ headerShown: false }}/>
        <Stack.Screen name="Home" component={Home}  options={{ headerShown: false }}  />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;
