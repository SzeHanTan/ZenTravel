import { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { MessageSquare, ChevronLeft } from 'lucide-react';
import '../styles/ViewTicket.css';

interface ViewTicketProps {
  ticketId: string;
  setView: (view: any) => void;
}

export const ViewTicket = ({ ticketId, setView }: ViewTicketProps) => {
  const [ticket, setTicket] = useState<any>(null);

  useEffect(() => {
    if (!ticketId) return;

    const unsubscribe = onSnapshot(doc(db, "Booking", ticketId), (docSnap) => {
      if (docSnap.exists()) {
        setTicket({ id: docSnap.id, ...docSnap.data() });
      }
    }, (error) => {
      console.error("Error fetching ticket:", error);
    });

    return () => unsubscribe();
  }, [ticketId]);

  const formatTime = (ts: any) => {
    if (!ts) return '--:--';
    
    if (ts.toDate) {
      const date = ts.toDate();
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    }
    
    if (typeof ts === 'string') return ts;
    
    return '--:--';
  };

  if (!ticket) {
    return (
      <div className="vt-container">
        <div className="loading" style={{ padding: '20px', textAlign: 'center' }}>
          Loading ticket details...
        </div>
      </div>
    );
  }

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
          <span>{ticket.from || 'N/A'}</span>
          <span className="vt-plane-icon">✈️</span>
          <span>{ticket.to || 'N/A'}</span>
        </div>

        <div className="vt-info-header">
          <p>Booking Number: {ticket.bookNum || ticket.bookingNum || ticket.id?.slice(0, 8)}</p>
          <p>Passenger Name: {ticket.name || ticket.userName || 'Customer'}</p>
        </div>

        <div className="vt-card">
          <div className="vt-card-row">
            <div className="vt-loc">
              <span className="vt-city-code">{ticket.from || '---'}</span>
              <span className="vt-time-display">{formatTime(ticket.timeDepart)}</span>
            </div>
            
            <div className="vt-divider">
              <span className="vt-plane-mini">✈️</span>
            </div>
            
            <div className="vt-loc vt-right">
              <span className="vt-city-code">{ticket.to || '---'}</span>
              <span className="vt-time-display">{formatTime(ticket.timeLanding)}</span>
            </div>
          </div>

          <div className="vt-card-details">
            <div className="vt-detail-item vt-align-left">
              <label>Flight no.</label>
              <span>{ticket.flightNum || ticket.flightNo || 'TBA'}</span>
            </div>
            <div className="vt-detail-item vt-align-center">
              <label>Departing</label>
              <span>{ticket.date || 'TBA'}</span>
            </div>
            <div className="vt-detail-item vt-align-right">
              <label>Status</label>
              <span className="vt-status-on" style={{ color: ticket.status === 'cancelled' ? '#ff3b30' : '#4cd964' }}>
                {ticket.status === 'upcoming' ? 'On time' : (ticket.status || 'Confirmed')}
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};