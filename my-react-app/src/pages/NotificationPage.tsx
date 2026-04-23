import React from 'react';
import '../App.css';
import '../styles/NotificationPage.css';

interface NotificationPageProps {
  setView: (v: any) => void;
}

interface Notification {
  id: number;
  title: string;
  message: string;
  date: string;
  type: 'delay' | 'success' | 'info' | 'warning';
}

export const NotificationPage: React.FC<NotificationPageProps> = () => {
  const notifications: Notification[] = [
    {
      id: 1,
      title: 'Flight Delay',
      message: 'Your flight from Kuala Lumpur to London is delayed.',
      date: '22 April 2026',
      type: 'delay'
    },
    {
      id: 2,
      title: 'Booking Success',
      message: 'Your reservation for ABC Hotel is successfully.',
      date: '22 April 2026',
      type: 'success'
    }
  ];

  return (
    <div className="notification-page fade-in">
      <header className="notification-header">Notifications</header>
      
      <main className="notification-content">
        <div className="notifications-list">
          {notifications.map((notification) => (
            <div key={notification.id} className="notification-card">
              <div className="notification-header-row">
                <h3 className="notification-title">{notification.title}</h3>
                <span className="notification-date">{notification.date}</span>
              </div>
              <p className="notification-message">{notification.message}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};