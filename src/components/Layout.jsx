import Sidebar from './Sidebar';
import StatusIndicator from './StatusIndicator';
import './Layout.css';

function Layout({ children }) {
  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content">
        <div className="main-header">
          <StatusIndicator />
        </div>
        <div className="main-body">
          {children}
        </div>
      </main>
    </div>
  );
}

export default Layout;
