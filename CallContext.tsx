import React, { createContext, useContext, useState } from 'react';
import { CometChat } from '@cometchat/chat-sdk-react-native';

interface CallContextType {
  sessionID: string | null;
  caller: { name: string; avatar?: string } | null;
  incomingCallVisible: boolean;
  setIncomingCallVisible: (visible: boolean) => void;
  setCaller: (caller: { name: string; avatar?: string } | null) => void;
  setSessionID: (sessionID: string | null) => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
};

export const CallProvider: React.FC = ({ children }) => {
  const [sessionID, setSessionID] = useState<string | null>(null);
  const [caller, setCaller] = useState<{ name: string; avatar?: string } | null>(null);
  const [incomingCallVisible, setIncomingCallVisible] = useState(false);

  return (
    <CallContext.Provider
      value={{
        sessionID,
        caller,
        incomingCallVisible,
        setIncomingCallVisible,
        setCaller,
        setSessionID,
      }}
    >
      {children}
    </CallContext.Provider>
  );
};
