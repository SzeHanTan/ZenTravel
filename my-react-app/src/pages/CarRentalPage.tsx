import React, { useState } from 'react';
import { 
  ArrowLeft, Calendar, User, X, MapPin, 
  PlaneTakeoff, Check, Minus, Plus 
} from 'lucide-react';
import { BottomNav } from '../components/BottomNav';
import "../styles/CarRentalPage.css";

export const CarRentalPage: React.FC<{ setView: (v: string) => void }> = ({ setView }) => {
  // --- UI Navigation State ---
  const [mainTab, setMainTab] = useState('Rentals'); // 'Rentals' or 'Transfers'
  const [transferType, setTransferType] = useState('Pick-up'); // 'Pick-up' or 'Drop-off'
  
  // --- Form Data States ---
  const [location, setLocation] = useState("Kuala Lumpur");
  const [pickupPoint, setPickupPoint] = useState("");
  const [flightNum, setFlightNum] = useState("");
  const [transferDest, setTransferDest] = useState("");
  const [dates, setDates] = useState({ start: "22/04/2026", end: "23/04/2026" });
  const [selectedPrefs, setSelectedPrefs] = useState<string[]>(["Age: 26-65"]);

  // --- Modal Toggles ---
  const [showDateModal, setShowDateModal] = useState(false);
  const [showDriverModal, setShowDriverModal] = useState(false);

  // Configuration for Driver Preference Modal
  const driverCategories = [
    { label: "Driver Age", items: ["21-25", "26-65", "65+"] },
    { label: "Driver Gender", items: ["Male", "Female", "No Preference"] },
    { label: "Additional Needs", items: ["GPS", "Child Seat", "Insurance Plus"] }
  ];

  const togglePref = (item: string) => {
    setSelectedPrefs(prev => 
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  return (
    <div className="home-page fade-in">
      <header className="home-header">
        <ArrowLeft onClick={() => setView('home')} style={{ cursor: 'pointer', marginRight: '10px' }} />
        ZenTravel
      </header>

      <main className="rental-container">
        <p style={{ fontWeight: 'bold', marginBottom: '20px' }}>Car Rentals</p>

        {/* Main Tabs Selection */}
        <div className="main-tabs">
          <button 
            className={`tab-btn ${mainTab === 'Rentals' ? 'active' : ''}`}
            onClick={() => setMainTab('Rentals')}
          >
            Car Rentals
          </button>
          <button 
            className={`tab-btn ${mainTab === 'Transfers' ? 'active' : ''}`}
            onClick={() => setMainTab('Transfers')}
          >
            Airport Transfers
          </button>
        </div>

        <div className="rental-form-card">
          {mainTab === 'Rentals' ? (
            /* --- RENTALS VIEW --- */
            <>
              <label className="rental-label-purple">Airport or City</label>
              <div className="input-with-icon">
                <MapPin size={22} color="#7b2cbf" />
                <input 
                  type="text" 
                  value={location} 
                  onChange={(e) => setLocation(e.target.value)} 
                  placeholder="Where to pick up?"
                />
              </div>

              <label className="rental-label-purple">Rental Duration</label>
              <div className="rental-display-box" onClick={() => setShowDateModal(true)}>
                <Calendar size={22} color="#7b2cbf" />
                <span className="rental-display-text">{dates.start} - {dates.end}</span>
              </div>

              <label className="rental-label-purple">Driver's Preference</label>
              <div className="rental-display-box" onClick={() => setShowDriverModal(true)}>
                <User size={22} color="#7b2cbf" />
                <span className="rental-display-text">
                  {selectedPrefs.length > 0 ? selectedPrefs.join(", ") : "Select Preferences"}
                </span>
              </div>
            </>
          ) : (
            /* --- AIRPORT TRANSFERS VIEW --- */
            <>
              <div className="sub-tabs">
                <button 
                  className={`sub-tab-btn ${transferType === 'Pick-up' ? 'active' : ''}`}
                  onClick={() => setTransferType('Pick-up')}
                >
                  Airport pick-up
                </button>
                <button 
                  className={`sub-tab-btn ${transferType === 'Drop-off' ? 'active' : ''}`}
                  onClick={() => setTransferType('Drop-off')}
                >
                  Airport drop-off
                </button>
              </div>

              <div style={{ marginTop: '20px' }}>
                {transferType === 'Pick-up' ? (
                  <>
                    <label className="rental-label-purple">Which flight?</label>
                    <input 
                      className="rental-input-field" 
                      placeholder="Flight Number" 
                      value={flightNum}
                      onChange={(e) => setFlightNum(e.target.value)}
                    />
                    <label className="rental-label-purple">Destination</label>
                    <input 
                      className="rental-input-field" 
                      placeholder="Hotel or Address" 
                      value={transferDest}
                      onChange={(e) => setTransferDest(e.target.value)}
                    />
                  </>
                ) : (
                  <>
                    <label className="rental-label-purple">Where from?</label>
                    <input 
                      className="rental-input-field" 
                      placeholder="Pick-up point" 
                      value={pickupPoint}
                      onChange={(e) => setPickupPoint(e.target.value)}
                    />
                    <label className="rental-label-purple">Airport or city</label>
                    <div className="input-with-icon">
                      <PlaneTakeoff size={22} color="#7b2cbf" />
                      <input 
                        type="text" 
                        value={location} 
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="Airport Name" 
                      />
                    </div>
                  </>
                )}
              </div>
            </>
          )}

          <button className="confirm-btn-purple" style={{ marginTop: '30px' }}>Search</button>
        </div>
      </main>

      {/* --- MODAL: Driver Preferences --- */}
      {showDriverModal && (
        <div className="modal-overlay" onClick={() => setShowDriverModal(false)}>
          <div className="modal-card date-picker-modal" onClick={e => e.stopPropagation()}>
            <X className="close-icon" onClick={() => setShowDriverModal(false)} />
            <h3 className="modal-title-purple">Driver Preferences</h3>
            
            <div className="pref-scroll-area">
              {driverCategories.map(cat => (
                <div key={cat.label} className="preference-section">
                  <span className="section-label">{cat.label}</span>
                  <div className="chips-container">
                    {cat.items.map(item => (
                      <div 
                        key={item} 
                        className={`chip ${selectedPrefs.includes(item) ? 'active' : ''}`}
                        onClick={() => togglePref(item)}
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <button className="confirm-btn-purple" style={{ background: '#4461F2' }} onClick={() => setShowDriverModal(false)}>
              Confirm
            </button>
          </div>
        </div>
      )}

      {/* --- MODAL: Date Picker --- */}
      {showDateModal && (
        <div className="modal-overlay" onClick={() => setShowDateModal(false)}>
          <div className="modal-card date-picker-modal" onClick={e => e.stopPropagation()}>
            <X className="close-icon" onClick={() => setShowDateModal(false)} />
            <h3 className="modal-title-purple">Select Dates</h3>
            <div className="date-input-section">
              <label className="date-label">Pick-up Date</label>
              <div className="custom-date-input">
                <input type="date" onChange={(e) => setDates({...dates, start: e.target.value})} />
              </div>
              <label className="date-label" style={{marginTop: '15px'}}>Drop-off Date</label>
              <div className="custom-date-input">
                <input type="date" onChange={(e) => setDates({...dates, end: e.target.value})} />
              </div>
            </div>
            <button className="confirm-btn-purple" onClick={() => setShowDateModal(false)}>Confirm</button>
          </div>
        </div>
      )}

      <BottomNav setView={setView} currentView="home" />
    </div>
  );
};