import { useContext } from 'react';
import { MqttStatusContext } from '../contexts/MqttStatusContext.js';

export const useMqttStatus = () => {
  const context = useContext(MqttStatusContext);
  if (!context) {
    throw new Error('useMqttStatus must be used within MqttStatusProvider');
  }
  return context;
};
