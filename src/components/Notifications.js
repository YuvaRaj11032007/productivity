import React from 'react';
import { useAppContext } from '../contexts/AppContext';

const Notifications = () => {
  const { state, dispatch } = useAppContext();
  const { notifications, subjects } = state;

  // Sort notifications by creation date (newest first)
  const sortedNotifications = [...notifications].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  const handleClearNotification = (id) => {
    dispatch({ type: 'CLEAR_NOTIFICATION', payload: id });
  };

  const handleClearAll = () => {
    if (window.confirm('Clear all notifications?')) {
      notifications.forEach(notification => {
        dispatch({ type: 'CLEAR_NOTIFICATION', payload: notification.id });
      });
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getSubjectName = (subjectId) => {
    const subject = subjects.find(s => s.id === subjectId);
    return subject ? subject.name : 'Unknown Subject';
  };

  return (
    <div className="notifications-container">
      <div className="notifications-header">
        <h2>Notifications</h2>
        {notifications.length > 0 && (
          <button 
            className="clear-all-btn" 
            onClick={handleClearAll}
          >
            Clear All
          </button>
        )}
      </div>

      {sortedNotifications.length === 0 ? (
        <div className="empty-notifications">
          <p>No notifications at the moment.</p>
          <p>You'll be notified here when you miss deadlines or daily study goals.</p>
        </div>
      ) : (
        <ul className="notifications-list">
          {sortedNotifications.map(notification => (
            <li key={notification.id} className={`notification-item ${notification.type.toLowerCase()}`}>
              <div className="notification-content">
                <p className="notification-message">{notification.message}</p>
                <p className="notification-meta">
                  <span className="notification-subject">
                    {notification.subjectId && getSubjectName(notification.subjectId)}
                  </span>
                  <span className="notification-time">
                    {formatDate(notification.createdAt)}
                  </span>
                </p>
              </div>
              <button 
                className="clear-notification-btn" 
                onClick={() => handleClearNotification(notification.id)}
                aria-label="Clear notification"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Notifications;