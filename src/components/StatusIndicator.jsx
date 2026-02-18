import { useMqttStatus } from '../hooks/useMqttStatus';
import './StatusIndicator.css';

function StatusIndicator() {
  const { status } = useMqttStatus();
  const isOnline = status === 'ONLINE';

  return (
    <div className={`status-indicator ${isOnline ? 'online' : 'offline'}`}>
      <span className="status-dot"></span>
      <span className="status-text">{isOnline ? 'Online' : 'Offline'}</span>
    </div>
  );
}

export default StatusIndicator;
