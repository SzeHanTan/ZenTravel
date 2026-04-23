import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase'; 
import { collection, query, onSnapshot } from 'firebase/firestore';
import { MessageSquare } from 'lucide-react';
import mascotImg from '../assets/MASCOT.png'; 
import '../styles/BookingPage.css';

export const BookingPage = ({ setView }: { setView: (view: any, id?: string) => void }) => {
  const [activeTab, setActiveTab] = useState('upcoming');
  const [bookings, setBookings] = useState<any[]>([]);

  // 【关键修复】安全转换日期函数，防止渲染 Firestore Object 导致崩溃
  const safeDate = (val: any) => {
    if (!val) return "No Date";
    // 如果是 Firestore Timestamp 对象 {seconds, nanoseconds}
    if (typeof val === 'object' && val.seconds) {
      return new Date(val.seconds * 1000).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    }
    // 如果已经是字符串，直接返回
    return String(val);
  };

  useEffect(() => {
    const q = query(collection(db, "Booking")); 
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setBookings(items);
    }, (error) => {
      console.error("Firestore error: ", error);
    });
    return () => unsubscribe();
  }, []);

  const filterBy = (type: string) => {
    return bookings.filter(b => 
      (b.status === activeTab) && 
      (b.type === type || (type === 'ticket' && b.type === 'flight'))
    );
  };

  const renderSection = (title: string, type: string) => {
    const data = filterBy(type);
    return (
      <section className="zen-section">
        <h3 className="section-title">{title}</h3>
        {data.length === 0 ? (
          <div className="zen-no-booking">
            <img src={mascotImg} alt="No Booking" className="zen-mascot" />
            <p>no booking</p>
          </div>
        ) : (
          data.map(item => {
            const isFlight = item.type === 'flight' || item.type === 'ticket';
            return (
              <div key={item.id} className="zen-card-wrapper">
                <div className="zen-status-badge">
                  {isFlight ? 'Check-in' : 'Confirmed'}
                </div>
                <div className="zen-card-body">
                  {isFlight ? (
                    <div className="zen-ticket-content">
                      <div className="ticket-left">
                        <h4 className="ticket-main-title">Depart</h4>
                        {/* 【已修复】使用 safeDate */}
                        <p className="ticket-text-large">{safeDate(item.date)}</p>
                        <p className="ticket-location">From: {item.from || "N/A"}</p>
                        <p className="ticket-location">To: {item.to || "N/A"}</p>
                      </div>
                      <div className="ticket-right">
                        <p className="ticket-sub">booking no: {item.bookingNum || item.bookNum || "N/A"}</p>
                        <p className="ticket-sub">{item.airline || "Airline"}</p>
                        <p className="ticket-sub">{item.pax || 1} pax.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="zen-card-main-content">
                      <img src={item.imageUrl || "https://via.placeholder.com/60"} alt="item" className="zen-item-thumb" />
                      <div className="zen-item-details">
                        <div className="zen-detail-header">
                          <h4 className="zen-item-name">{item.name || item.hotelName}</h4>
                          <span className="zen-booking-no">no: {item.bookingNum || item.bookNum}</span>
                        </div>
                        {/* 【已修复】使用 safeDate */}
                        <p className="zen-date-normal">{safeDate(item.date)}</p>
                        <p className="zen-description">
                          {item.type === 'transport' 
                            ? `plate: ${item.plateNum || 'TBD'}` 
                            : (item.details || "Details available")}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <div className="zen-action-row">
                    {activeTab === 'upcoming' && (
                      <span 
                        className="zen-refund-btn" 
                        onClick={() => setView('refund', item.id)}
                      >
                        Refund
                      </span>
                    )}
                    
                    {isFlight && (
                      <span 
                        className="zen-view-btn" 
                        onClick={() => setView('view-ticket', item.id)}
                      >
                        View
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </section>
    );
  };

  return (
    <div className="zen-container">
      <header className="zen-purple-header">
        <h1>ZenTravel</h1>
        <div className="zen-notif-wrapper" onClick={() => setView('notification')}>
          <MessageSquare color="white" />
          {bookings.some(b => b.hasNotification) && <span className="zen-red-dot"></span>}
        </div>
      </header>

      <div className="zen-tab-bar">
        {['upcoming', 'past', 'cancelled'].map(t => (
          <button 
            key={t} 
            className={activeTab === t ? 'active' : ''} 
            onClick={() => setActiveTab(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <main className="zen-list" style={{ paddingBottom: '80px' }}>
        {renderSection('My Ticket', 'ticket')}
        {renderSection('My Hotel', 'hotel')}
        {renderSection('My Transport', 'transport')}
      </main>
      
      {/* 底部导航 (确保逻辑与 App.tsx 一致) */}
      <footer className="zen-nav">
        <span onClick={() => setView('home')}>🏠</span>
        <span onClick={() => setView('notification')}>🔔</span>
        <span className="active" onClick={() => setView('booking')}>📅</span>
        <span onClick={() => setView('profile')}>👤</span>
      </footer>
    </div>
  );
};