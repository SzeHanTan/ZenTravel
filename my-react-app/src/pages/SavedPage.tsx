import { useEffect, useState } from 'react';
import { db, auth } from '../services/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { ArrowLeft, Heart, MapPin } from 'lucide-react';
import mascotImg from '../assets/MASCOT.png'; 
import '../styles/SavedPage.css';

interface SavedItem {
  id: string;
  hotelId: string;
  name: string;
  location: string;
  price: number | string;
  imageUrl?: string;
  userId: string;
}

export const SavedPage = ({ setView }: { setView: (v: any, id?: string) => void }) => {
  const [favorites, setFavorites] = useState<SavedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }
    const q = query(collection(db, "favorites"), where("userId", "==", auth.currentUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const favData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as SavedItem[];
      setFavorites(favData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="saved-page-root">
      <header className="zen-purple-header">
        <ArrowLeft className="header-icon-left" onClick={() => setView('profile')} />
        <h1 className="header-centered-title">Saved</h1>
        <div className="header-placeholder-right"></div>
      </header>

      <div className="white-content-area">
        {loading ? (
          <div className="empty-state-container"><p>Loading...</p></div>
        ) : favorites.length === 0 ? (
          <div className="empty-state-container">
            <img src={mascotImg} alt="Mascot" className="mascot-img-center" />
            <p className="empty-msg-text">Your wishlist is empty!</p>
            <button className="zen-solid-purple-btn" onClick={() => setView('home')}>
              Explore Hotels
            </button>
          </div>
        ) : (
          <div className="saved-items-grid">
            {favorites.map((item) => (
              <div key={item.id} className="saved-item-card" onClick={() => setView('booking', item.hotelId)}>
                <div className="card-image-box">
                  <img src={item.imageUrl || 'https://via.placeholder.com/150'} alt={item.name} />
                  <div className="heart-icon-badge"><Heart size={14} fill="#ff4d4d" color="#ff4d4d" /></div>
                </div>
                <div className="card-details-box">
                  <h3 className="hotel-name-text">{item.name}</h3>
                  <p className="hotel-loc-text"><MapPin size={14} /> {item.location}</p>
                  <span className="hotel-price-tag">RM {item.price} <small>/night</small></span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};