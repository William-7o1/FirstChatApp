import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Home from './src/components/home/Home';
import { Login } from './src/components/login/Login';
import UserList from './src/components/screen/UserList';
import ChatScreen from './src/components/screen/ChatScreen';

const Stack = createNativeStackNavigator();

function App() {
  return (
    <NavigationContainer>
      {/* <Stack.Navigator initialRouteName="Login"> */}
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Login" component={Login} options={{title: 'Welcome'}}/>
        <Stack.Screen name="UserList" component={UserList} />
        <Stack.Screen name="Chat" component={ChatScreen}  options={{ headerShown: false }}/>
        <Stack.Screen name="Home" component={Home}  options={{ headerShown: false }}  />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;
