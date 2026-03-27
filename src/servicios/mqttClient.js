// src/servicios/mqttClient.js
import { connect } from 'mqtt';

const client = connect('mqtt://your_broker_url');

export const publishCommand = (command) => {
    client.publish('robot/control/rtde_start', JSON.stringify(command));
};

export default client;