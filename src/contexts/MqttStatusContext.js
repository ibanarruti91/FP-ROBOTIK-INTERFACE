import { createContext } from 'react';

export const MqttStatusContext = createContext({
  status: 'OFFLINE',
  lastMessageTime: null,
  telemetryData: null,
  publishCommand: () => {}
});
