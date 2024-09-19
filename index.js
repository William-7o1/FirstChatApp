/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import { AppConstants } from './AppConstants';
import { CometChat } from '@cometchat/chat-sdk-react-native';


let appID = AppConstants.APP_ID;
let region = AppConstants.REGION;
let appSetting = new CometChat.AppSettingsBuilder()
  .subscribePresenceForAllUsers()
  .setRegion(region)
  .autoEstablishSocketConnection(true)
  .build();
CometChat.init(appID, appSetting).then(
  () => {
    console.log("Initialization completed successfully");
  },
  (error) => {
    console.log("Initialization failed with error:", error);
  }
);

AppRegistry.registerComponent(appName, () => App);
