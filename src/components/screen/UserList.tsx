import React, { useEffect, useState } from 'react';
import { FlatList, TouchableOpacity, Text } from 'react-native';
import { CometChat } from '@cometchat/chat-sdk-react-native';

const UserList = ({ navigation }) => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      const usersRequest = new CometChat.UsersRequestBuilder().setLimit(30).build();
      try {
        const userList = await usersRequest.fetchNext();
        setUsers(userList);
      } catch (error) {
        console.error('User list fetching failed with error:', error);
      }
    };

    fetchUsers();
  }, []);

  const navigateToChat = (user) => {
    navigation.navigate('Chat', { user });
  };

  return (
    <FlatList
      data={users}
      keyExtractor={(item) => item.uid}
      renderItem={({ item }) => (
        <TouchableOpacity onPress={() => navigateToChat(item)}>
          <Text>{item.name}</Text>
        </TouchableOpacity>
      )}
    />
  );
};

export default UserList;
