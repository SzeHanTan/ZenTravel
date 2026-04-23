import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, Users, PlaneTakeoff, PlaneLanding, ArrowUpDown, X, Plus, Minus, PlusCircle, Check } from 'lucide-react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { BottomNav } from '../components/BottomNav';
import "../styles/FlightsPage.css";

const recommendations = [
  { id: 1, name: "Bali, Indonesia", pos: { lat: -8.4095, lng: 115.1889 } },
  { id: 2, name: "Tokyo, Japan", pos: { lat: 35.6762, lng: 139.6503 } },
  { id: 3, name: "Phuket, Thailand", pos: { lat: 7.8804, lng: 98.3923 } }
];

const FLIGHT_CLASSES = [
  "Economy", 
  "Economy/premium economy", 
  "Premium Economy", 
  "Business/First", 
  "Business", 
  "First"
];

export const FlightsPage: React.FC<{ setView: (v: string) => void }> = ({ setView }) => {
  const [tripType, setTripType] = useState('Return');
  
  // --- Search States ---
  const [flights, setFlights] = useState([{ origin: "KUL Kuala Lumpur", destination: "Bali", date: "2026-04-28" }]);
  const [returnDate, setReturnDate] = useState("2026-05-01");
  
  // --- Passenger/Class States ---
  const [passengers, setPassengers] = useState({ adult: 1, child: 0, baby: 0 });
  const [flightClass, setFlightClass] = useState("Economy/premium economy");
  
  // --- UI Modals ---
  const [showPassengerModal, setShowPassengerModal] = useState(false);
  const [showClassModal, setShowClassModal] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [activeDateIndex, setActiveDateIndex] = useState(0);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY 
  });

  useEffect(() => {
    if (tripType !== 'Multi-city' && flights.length > 1) {
      setFlights([flights[0]]);
    }
  }, [tripType]);

  const addFlightRow = () => {
    if (flights.length < 4) {
      setFlights([...flights, { origin: flights[flights.length-1].destination || "", destination: "", date: "" }]);
    }
  };

  const updateFlight = (index: number, field: string, value: string) => {
    const newFlights = [...flights];
    newFlights[index] = { ...newFlights[index], [field]: value };
    setFlights(newFlights);
  };

  const handleExchange = (index: number) => {
    const newFlights = [...flights];
    const temp = newFlights[index].origin;
    newFlights[index].origin = newFlights[index].destination;
    newFlights[index].destination = temp;
    setFlights(newFlights);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "Select Date";
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const openDateModal = (index: number) => {
    setActiveDateIndex(index);
    setShowDateModal(true);
  };

  return (
    <div className="home-page fade-in">
      <header className="home-header">
        <ArrowLeft onClick={() => setView('home')} style={{ cursor: 'pointer', marginRight: '10px' }} />
        ZenTravel
      </header>

      <main className="flights-container">
        <h2 className="section-title">Flights</h2>

        <div className="flight-search-card">
          <div className="trip-type-row">
            {['One-way', 'Return', 'Multi-city'].map(type => (
              <button key={type} className={`type-btn ${tripType === type ? 'active' : ''}`} onClick={() => setTripType(type)}>{type}</button>
            ))}
          </div>

          {(tripType === 'Multi-city' ? flights : [flights[0]]).map((f, i) => (
            <div key={i} className="flight-block">
              {tripType === 'Multi-city' && <div className="flight-block-title">Flight {i + 1}</div>}
              
              <div className="flight-row">
                <PlaneTakeoff size={18} color="#7b2cbf" />
                <input value={f.origin} onChange={(e) => updateFlight(i, 'origin', e.target.value)} placeholder="From?" />
                <div className="exchange-icon" onClick={() => handleExchange(i)}><ArrowUpDown size={16} color="#7b2cbf" /></div>
              </div>

              <div className="flight-row">
                <PlaneLanding size={18} color="#7b2cbf" />
                <input value={f.destination} onChange={(e) => updateFlight(i, 'destination', e.target.value)} placeholder="Where to?" />
              </div>

              <div className="flight-row clickable" onClick={() => openDateModal(i)}>
                <Calendar size={18} color="#7b2cbf" />
                <div className="row-text">
                  {tripType === 'Return' && i === 0 
                    ? `${formatDate(f.date)} - ${formatDate(returnDate)}`
                    : formatDate(f.date)
                  }
                </div>
              </div>
            </div>
          ))}

          {tripType === 'Multi-city' && (
            <button className="add-flight-btn" onClick={addFlightRow}>
              <PlusCircle size={18} /> Add another flight
            </button>
          )}

          <div className="flight-row clickable-row" onClick={() => setShowPassengerModal(true)}>
            <Users size={18} color="#7b2cbf" />
            <div style={{fontSize: '0.85rem', marginLeft: '10px', flex: 1}}>
              {passengers.adult} Adult {passengers.child} Child {passengers.baby} Baby | 
              <span className="class-trigger" onClick={(e) => { e.stopPropagation(); setShowClassModal(true); }}>
                {flightClass}
              </span>
            </div>
          </div>

          <div className="bundle-section">
            <div className="save-badge">Save 6% on avg.</div>
            <div className="bundle-checkbox">
                <input type="checkbox" id="bundle" />
                <label htmlFor="bundle">Flight + Hotel</label>
            </div>
          </div>

          <button className="btn-primary-search" style={{width: '100%', marginTop: '15px'}}>Search</button>
        </div>

        <h3 className="section-title">Travel Inspiration</h3>
        <div className="map-container">
           {isLoaded ? (
             <GoogleMap mapContainerStyle={{width:'100%', height:'100%'}} center={{lat:15, lng:110}} zoom={3} options={{disableDefaultUI:true}}>
               {recommendations.map(p => <Marker key={p.id} position={p.pos} label={{text:p.name, color:'#7b2cbf', fontWeight:'bold'}}/>)}
             </GoogleMap>
           ) : <div className="map-placeholder">Loading Map...</div>}
        </div>
      </main>

      {/* --- MODAL: Image-style Date Selector --- */}
      {showDateModal && (
        <div className="modal-overlay" onClick={() => setShowDateModal(false)}>
          <div className="modal-card date-picker-modal" onClick={e => e.stopPropagation()}>
            <X className="close-icon" onClick={() => setShowDateModal(false)} />
            <h3 className="modal-title-purple">Select Dates</h3>
            
            <div className="date-input-section">
              <label className="date-label">Departure</label>
              <div className="custom-date-input">
                <input 
                  type="date" 
                  value={flights[activeDateIndex]?.date} 
                  onChange={(e) => updateFlight(activeDateIndex, 'date', e.target.value)} 
                />
              </div>

              {tripType === 'Return' && activeDateIndex === 0 && (
                <>
                  <label className="date-label" style={{marginTop: '15px'}}>Return</label>
                  <div className="custom-date-input">
                    <input 
                      type="date" 
                      value={returnDate} 
                      onChange={(e) => setReturnDate(e.target.value)} 
                    />
                  </div>
                </>
              )}
            </div>

            <button className="confirm-btn-purple" onClick={() => setShowDateModal(false)}>
              Confirm
            </button>
          </div>
        </div>
      )}

      {/* --- MODAL: Passenger & Class (Stay Same) --- */}
      {showPassengerModal && (
        <div className="modal-overlay" onClick={() => setShowPassengerModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <X className="close-icon" onClick={() => setShowPassengerModal(false)} />
            <h3>Passengers</h3>
            {['adult', 'child', 'baby'].map(type => (
              <div key={type} className="counter-row">
                <span style={{textTransform: 'capitalize'}}>{type}</span>
                <div className="counter-controls">
                  <Minus onClick={() => setPassengers({...passengers, [type as keyof typeof passengers]: Math.max(0, passengers[type as keyof typeof passengers] - 1)})} />
                  <span>{passengers[type as keyof typeof passengers]}</span>
                  <Plus onClick={() => setPassengers({...passengers, [type as keyof typeof passengers]: passengers[type as keyof typeof passengers] + 1})} />
                </div>
              </div>
            ))}
            <button className="modal-action-btn" onClick={() => setShowPassengerModal(false)}>Apply</button>
          </div>
        </div>
      )}

      {showClassModal && (
        <div className="modal-overlay" onClick={() => setShowClassModal(false)}>
          <div className="modal-card glass-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header-simple">Class</div>
            {FLIGHT_CLASSES.map(c => (
              <div key={c} className={`class-option ${flightClass === c ? 'selected' : ''}`} onClick={() => { setFlightClass(c); setShowClassModal(false); }}>
                {c}{flightClass === c && <Check size={18} />}
              </div>
            ))}
          </div>
        </div>
      )}

      <BottomNav setView={setView} currentView="home" />
    </div>
  );
};