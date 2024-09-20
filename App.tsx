import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Home from './src/components/home/Home';
import { Login } from './src/components/login/Login';
import UserList from './src/components/screen/UserList';
import ChatScreen from './src/components/screen/ChatScreen';
import GroupChatScreen from './src/components/screen/GroupChatScreen';
// import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

const Stack = createNativeStackNavigator();
// const Tab = createBottomTabNavigator();

function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login" >
        <Stack.Screen name="Login" component={Login} options={{ headerShown: false }} />
        <Stack.Screen name="UserList" component={UserList} />
        <Stack.Screen name="GroupChatScreen" component={GroupChatScreen}  options={{ headerShown: false }}/>
        <Stack.Screen name="Chat" component={ChatScreen}  options={{ headerShown: false }}/>
        <Stack.Screen name="Home" component={Home}  options={{ headerShown: false }}  />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;
