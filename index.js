/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import { AppConstants } from './AppConstants';
import { CometChat } from '@cometchat/chat-sdk-react-native';
import { CometChatCalls } from '@cometchat/calls-sdk-react-native';

const appID = AppConstants.APP_ID;
const region = AppConstants.REGION;

// Initialize CometChat Chat SDK
const appSetting = new CometChat.AppSettingsBuilder()
  .subscribePresenceForAllUsers()
  .setRegion(region)
  .autoEstablishSocketConnection(true)
  .build();

CometChat.init(appID, appSetting).then(
  () => {
    console.log('Chat SDK initialization completed successfully');
    // Initialize CometChatCalls SDK after Chat SDK is initialized
    const callAppSettings = new CometChatCalls.CallAppSettingsBuilder()
      .setAppId(appID)
      .setRegion(region)
      .build();

    CometChatCalls.init(callAppSettings).then(
      () => {
        console.log('CometChatCalls initialized successfully');
      },
      (error) => {
        console.error('CometChatCalls initialization failed', error);
      }
    );
  },
  (error) => {
    console.error('Chat SDK initialization failed with error:', error);
  }
);

AppRegistry.registerComponent(appName, () => App);
