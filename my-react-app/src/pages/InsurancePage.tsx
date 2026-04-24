import { useState } from 'react';
import { ArrowLeft, X } from 'lucide-react';
import "../styles/InsurancePage.css";

export const InsurancePage = ({ setView }: { setView: (v: string) => void }) => {
  const [showBookingsModal, setShowBookingsModal] = useState(false);
  const [showPoliciesModal, setShowPoliciesModal] = useState(false);

  // Generated Content for Modals
  const bookings = [
    { id: 'BK102', destination: 'Tokyo, Japan', date: '28/04/2026', status: 'Uninsured' },
    { id: 'BK105', destination: 'Bali, Indonesia', date: '15/05/2026', status: 'Uninsured' }
  ];

  const policies = [
    { id: 'POL-9921', type: 'Overseas PA', expiry: '02/05/2026', status: 'Active' },
    { id: 'POL-4410', type: 'Domestic PA', expiry: '12/12/2025', status: 'Expired' }
  ];

  return (
    <div className="home-page fade-in">
      <header className="home-header">
        <ArrowLeft onClick={() => setView('home')} style={{ cursor: 'pointer', marginRight: '10px' }} />
        ZenTravel
      </header>

      <main className="insurance-container">
        <p style={{ fontWeight: 'bold', marginBottom: '20px' }}>Travel Insurance</p>

        {/* --- Card 1: Overseas --- */}
        <div className="insurance-card">
          <h3>Travel PA - Overseas</h3>
          <ul>
            <li>Overseas medical expenses up to RM 300,000</li>
            <li>Cancellation or postponement RM 20,000</li>
            <li>Baggage and personal effects RM 5,000</li>
          </ul>
          <div className="price-tag">From RM 55.00</div>
        </div>

        {/* --- Card 2: Domestic --- */}
        <div className="insurance-card">
          <h3>Travel PA - Domestic</h3>
          <ul>
            <li>Medical expenses RM 50,000</li>
            <li>Travel delay RM 1,000</li>
            <li>Baggage and personal effects RM 2,000</li>
          </ul>
          <div className="price-tag">From RM 15.00</div>
        </div>

        {/* --- Yellow Action Buttons --- */}
        <div className="action-row">
          <button className="btn-yellow" onClick={() => setShowBookingsModal(true)}>
            My bookings
          </button>
          <button className="btn-yellow" onClick={() => setShowPoliciesModal(true)}>
            My Policies
          </button>
        </div>

        <div className="declaration-text">
          Declaration: By purchasing, you agree to the terms of service and confirm that all travelers are fit for travel...
        </div>

        {/* --- MODAL: My Bookings --- */}
        {showBookingsModal && (
          <div className="modal-overlay" onClick={() => setShowBookingsModal(false)}>
            <div className="modal-card date-picker-modal" onClick={e => e.stopPropagation()}>
              <X className="close-icon" onClick={() => setShowBookingsModal(false)} />
              <h3 className="modal-title-purple">Current Bookings</h3>
              <div className="modal-list">
                {bookings.map(b => (
                  <div key={b.id} className="modal-item">
                    <h4>{b.destination}</h4>
                    <p>Booking ID: {b.id}</p>
                    <p>Travel Date: {b.date}</p>
                    <span className="status-badge" style={{background: '#ffebee', color: '#c62828'}}>
                        {b.status}
                    </span>
                  </div>
                ))}
              </div>
              <button className="confirm-btn-purple" onClick={() => setShowBookingsModal(false)}>Close</button>
            </div>
          </div>
        )}

        {/* --- MODAL: My Policies --- */}
        {showPoliciesModal && (
          <div className="modal-overlay" onClick={() => setShowPoliciesModal(false)}>
            <div className="modal-card date-picker-modal" onClick={e => e.stopPropagation()}>
              <X className="close-icon" onClick={() => setShowPoliciesModal(false)} />
              <h3 className="modal-title-purple">My Policies</h3>
              <div className="modal-list">
                {policies.map(p => (
                  <div key={p.id} className="modal-item">
                    <h4>{p.type}</h4>
                    <p>Policy No: {p.id}</p>
                    <p>Expiry: {p.expiry}</p>
                    <span className="status-badge" style={{
                        background: p.status === 'Active' ? '#e8f5e9' : '#eeeeee',
                        color: p.status === 'Active' ? '#2e7d32' : '#777'
                    }}>
                        {p.status}
                    </span>
                  </div>
                ))}
              </div>
              <button className="confirm-btn-purple" onClick={() => setShowPoliciesModal(false)}>Close</button>
            </div>
          </div>
        )}
      </main>

    </div>
  );
};