import { useAuth } from '../contexts/AuthContext';
import './Dashboard.css';

const Dashboard = () => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-card">
        <h1>Welcome to Dashboard!</h1>
        <div className="user-info">
          <h2>User Information</h2>
          <div className="info-item">
            <span className="info-label">Username:</span>
            <span className="info-value">{user?.username}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Email:</span>
            <span className="info-value">{user?.email}</span>
          </div>
          <div className="info-item">
            <span className="info-label">User ID:</span>
            <span className="info-value">{user?.id}</span>
          </div>
        </div>
        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
