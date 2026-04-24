import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { db, auth } from '../services/firebase';
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  serverTimestamp
} from 'firebase/firestore';
import { BottomNav } from '../components/BottomNav';
import '../App.css';
import "../styles/HomePage.css";

// Assets
import carRentalImg from '../assets/CarRental_pic.jpg';
import flightsImg from '../assets/Flights_pic.jpg';
import hotelsImg from '../assets/Hotels_pic.jpg';
import insuranceImg from '../assets/Insurances_pic.png';
import tripPlannerImg from '../assets/TripPlanner_pic.png';

interface HomeProps {
  setView: (v: string) => void;
  globalCurrency: { name: string; code: string };
}

export const HomePage: React.FC<HomeProps> = ({ setView, globalCurrency }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [rates, setRates] = useState<any>({ MYR: 1 });

  const currencySymbol = globalCurrency.code.split(' | ')[0];
  const currencyCode = globalCurrency.code.split(' | ')[1];

  // Fetch exchange rates from API
  useEffect(() => {
    fetch(`https://open.er-api.com/v6/latest/MYR`)
      .then(res => res.json())
      .then(data => {
        if (data && data.rates) {
          setRates(data.rates);
        }
      })
      .catch(err => console.error("Exchange API error:", err));
  }, []);

  // Calculation logic for converted price
  const baseInsurancePrice = 65; 
  const convertedInsurancePrice = (baseInsurancePrice * (rates[currencyCode] || 1)).toFixed(2);

  const recommendation = {
    title: "AI RECOMMENDATION",
    message: `Your flight to Tokyo (ZT-402) is confirmed! Since you're traveling soon, we recommend booking a hotel in the Shinjuku area and getting travel insurance for peace of mind. We've found 3 hotels matching your style and a premium insurance plan starting at ${currencySymbol} ${convertedInsurancePrice}.`,
    isEmergency: false
  };

  const fetchHistory = async () => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      const q = query(
        collection(db, "search_history"),
        where("userId", "==", user.uid),
        orderBy("timestamp", "desc"),
        limit(3)
      );
      const querySnapshot = await getDocs(q);
      const docs = querySnapshot.docs.map(doc => doc.data().term);
      setHistory([...new Set(docs)]);
    } catch (error: any) {
      console.error("Error fetching history:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) fetchHistory();
    });
    return () => unsubscribe();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const term = searchTerm.trim();
    if (!term || !auth.currentUser) return;
    try {
      await addDoc(collection(db, "search_history"), {
        userId: auth.currentUser.uid,
        term: term,
        timestamp: serverTimestamp()
      });
      setSearchTerm("");
      await fetchHistory();
    } catch (err) {
      console.error("Error saving search:", err);
    }
  };

  return (
    <div className="home-page fade-in">
      <header className="home-header">ZenTravel</header>
     
      <main className="home-content">
        <div className="category-grid">
          <div className="cat-box red" onClick={() => setView('hotels')}>
              <span className="cat-label">HOTELS</span>
              <div className="cat-img-wrapper"><img src={hotelsImg} alt="Hotels" className="cat-img-fit" /></div>
          </div>
         
          <div className="cat-box orange" onClick={() => setView('flights')}>
              <span className="cat-label">FLIGHTS</span>
              <div className="cat-img-wrapper"><img src={flightsImg} alt="Flights" className="cat-img-fit" /></div>
          </div>
         
          <div className="cat-box yellow" onClick={() => setView('insurance')}>
              <span className="cat-label">INSURANCE</span>
              <div className="cat-img-wrapper"><img src={insuranceImg} alt="Insurance" className="cat-img-fit" /></div>
          </div>
         
          <div className="cat-box green" onClick={() => setView('tripplanner')}>
              <span className="cat-label">TRIP PLANNER</span>
              <div className="cat-img-wrapper"><img src={tripPlannerImg} alt="Trip Planner" className="cat-img-fit" /></div>
          </div>
         
          <div className="cat-box blue" onClick={() => setView('carrental')}>
              <span className="cat-label">CAR RENTAL</span>
              <div className="cat-img-wrapper"><img src={carRentalImg} alt="Car Rental" className="cat-img-fit" /></div>
          </div>
        </div>

        <div className="search-section">
          <form className="search-bar-container" onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Search destinations..."
              className="main-search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button type="submit" className="search-submit-btn">
              <Search size={22} color="#7b2cbf" />
            </button>
          </form>
         
          <div className="search-history-row">
            {history.length > 0 && <span className="history-label">Recent:</span>}
            {history.map((item, index) => (
              <div key={index} className="history-pill">{item}</div>
            ))}
          </div>
        </div>

        <div className="ai-recommendation" onClick={() => setShowModal(true)}>
          <h3>{recommendation.title}</h3>
          <p className="truncate">{recommendation.message}</p>
          <span className="more-link">Press to know more</span>
        </div>

        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <button className="close-modal" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
              <h3>{recommendation.title}</h3>
              <p>{recommendation.message}</p>
              <button className="modal-action-btn">Book Now</button>
            </div>
          </div>
        )}
      </main>

      <BottomNav setView={setView} currentView="home" />
    </div>
  );
};