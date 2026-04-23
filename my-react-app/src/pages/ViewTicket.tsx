import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { MessageSquare, ChevronLeft } from 'lucide-react';
import '../styles/ViewTicket.css';

export const ViewTicket = ({ ticketId, setView }: { ticketId: string; setView: any }) => {
  const [ticket, setTicket] = useState<any>(null);

  useEffect(() => {
    if (!ticketId) return;
    // 监听 Firebase 中的特定 Booking
    const unsubscribe = onSnapshot(doc(db, "Booking", ticketId), (docSnap) => {
      if (docSnap.exists()) {
        setTicket({ id: docSnap.id, ...docSnap.data() });
      }
    });
    return () => unsubscribe();
  }, [ticketId]);

  // 格式化 Firebase Timestamp (假设数据库字段是 timeDepart 和 timeLanding)
  const formatTime = (ts: any) => {
    if (!ts || !ts.toDate) return '--:--';
    const date = ts.toDate();
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  if (!ticket) return <div className="loading">Loading...</div>;

  return (
    <div className="vt-container">
      <header className="vt-header">
        <div className="vt-header-left">
          <ChevronLeft className="vt-back" onClick={() => setView('booking')} />
          <h1>ZenTravel</h1>
        </div>
        <MessageSquare color="white" />
      </header>

      <main className="vt-content">
        <h2 className="vt-title">My Ticket</h2>
        <div className="vt-route-summary">
          <span>{ticket.from}</span>
          <span className="vt-plane-icon">✈️</span>
          <span>{ticket.to}</span>
        </div>

        <div className="vt-info-header">
          <p>Booking Number: {ticket.bookNum || ticket.bookingNum}</p>
          <p>Passenger Name: {ticket.name}</p>
        </div>

        <div className="vt-card">
          <div className="vt-card-row">
            {/* 左侧：地点在上，时间在下 */}
            <div className="vt-loc">
              <span className="vt-city-code">{ticket.from}</span>
              <span className="vt-time-display">{formatTime(ticket.timeDepart)}</span>
            </div>
            
            <div className="vt-divider">
              <span className="vt-plane-mini">✈️</span>
            </div>
            
            {/* 右侧：地点在上，时间在下 */}
            <div className="vt-loc vt-right">
              <span className="vt-city-code">{ticket.to}</span>
              <span className="vt-time-display">{formatTime(ticket.timeLanding)}</span>
            </div>
          </div>

          <div className="vt-card-details">
            <div className="vt-detail-item vt-align-left">
              <label>Flight no.</label>
              <span>{ticket.flightNum || ticket.flightNo || 'XXXXX'}</span>
            </div>
            <div className="vt-detail-item vt-align-center">
              <label>Departing</label>
              <span>{ticket.date}</span>
            </div>
            <div className="vt-detail-item vt-align-right">
              <label>Status</label>
              <span className="vt-status-on">
                {ticket.status === 'upcoming' ? 'On time' : ticket.status}
              </span>
            </div>
          </div>
        </div>
      </main>

      <footer className="vt-nav">
        <span onClick={() => setView('home')}>🏠</span>
        <span onClick={() => setView('notification')}>🔔</span>
        <span className="active" onClick={() => setView('booking')}>📅</span>
        <span onClick={() => setView('profile')}>👤</span>
      </footer>
    </div>
  );
};