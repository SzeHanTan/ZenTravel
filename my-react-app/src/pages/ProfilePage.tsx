import { useState, useEffect } from 'react';
import { auth, db } from '../services/firebase';
import { signOut } from 'firebase/auth';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { 
  Ticket, Wallet, MapPin, UserCircle, Heart, Star, 
  Globe, Eye, CircleDollarSign, Ruler, HelpCircle, Info,
  Search, X, InfoIcon, ChevronLeft
} from 'lucide-react';
import { Achievement } from './Achievement'; 
import { Currency } from './Currency'; 
import { Cashback } from './Cashback'; 
import mascotImg from '../assets/MASCOT.png'; 
import '../styles/ProfilePage.css';

export const ProfilePage = ({ setView, globalCurrency, setGlobalCurrency, cashbackBalance, setCashbackBalance }: any) => {
  const [localView, setLocalView] = useState<'main' | 'coupons' | 'achievements' | 'currency' | 'cashback'>('main');
  const [bookingStats, setBookingStats] = useState({ count: 0, cities: 0, zensUnlocked: 2 });
  const [hasRedeemed, setHasRedeemed] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [promoInput, setPromoInput] = useState('');

  const user = auth.currentUser;
  const symbol = globalCurrency.code.split(' | ')[0]; // 获取当前选中的货币符号

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "Booking"), where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => d.data());
      const hotelDocs = docs.filter(d => d.type === 'hotel');
      const uniqueCities = new Set(hotelDocs.map(d => d.name)).size || (docs.length > 0 ? 1 : 0);
      let unlocked = 2; 
      if (docs.length > 0) unlocked += 1; 
      if (hotelDocs.length >= 2) unlocked += 1; 
      if (docs.some(d => d.type === 'transport' || d.type === 'flight')) unlocked += 1; 

      setBookingStats({ count: docs.length, cities: uniqueCities, zensUnlocked: unlocked });
    });
    return () => unsubscribe();
  }, [user]);

  const handleRedeem = () => {
    if (promoInput.trim() === 'KCL0605') setShowSuccessModal(true);
  };

  const closeAndShowCoupons = () => {
    setShowSuccessModal(false);
    setHasRedeemed(true);
    setPromoInput('');
  };

  // --- 子路由渲染 ---
  if (localView === 'achievements') return <Achievement setLocalView={setLocalView} />;
  if (localView === 'currency') return <Currency setLocalView={setLocalView} currentCurrency={globalCurrency.code} setCurrentCurrency={setGlobalCurrency} />;
  if (localView === 'cashback') return <Cashback setLocalView={setLocalView} balance={cashbackBalance} setBalance={setCashbackBalance} symbol={symbol} />;

  if (localView === 'coupons') {
    return (
      <div className="profile-container fade-in">
        <div className="zen-header">ZenTravel</div>
        <div className="sub-page-header">
          <ChevronLeft onClick={() => setLocalView('main')} className="back-icon" />
          <span>Coupon Wallet</span>
        </div>
        <div className="sub-page-body">
          {hasRedeemed && (
            <div className="coupon-summary-card fade-in">
              <div className="inner-tag">🎟️ 1 coupon</div>
              <div className="inner-val">{symbol} 31</div>
              <p className="inner-desc">Estimated savings based on collected coupons...</p>
            </div>
          )}
          <div className="promo-section">
            <div className="promo-input-container">
              <input type="text" placeholder="Enter Promo Code" value={promoInput} onChange={(e) => setPromoInput(e.target.value)} />
              <Search className="search-btn" onClick={handleRedeem} />
            </div>
          </div>
          {!hasRedeemed ? (
            <div className="empty-state">
              <img src={mascotImg} alt="Bot" className="empty-bot" />
              <p>Sorry, you have no coupons available in your wallet!</p>
            </div>
          ) : (
            <div className="coupon-list fade-in">
              <div className="auto-apply-box">
                <InfoIcon size={14} /> <span>Applied automatically to your booking</span>
              </div>
              <div className="coupon-item">
                <div className="coupon-left">Up to 9% OFF</div>
                <div className="coupon-mid"><h4>Up to 9%</h4><p>2nd App Booking Coupon</p></div>
                <div className="coupon-right"><button className="btn-use">Use</button></div>
              </div>
            </div>
          )}
        </div>
        {showSuccessModal && (
          <div className="modal-overlay">
            <div className="redeem-modal">
              <X className="modal-close" onClick={closeAndShowCoupons} />
              <h2>Redeem Successfully!</h2>
              <p>Enjoy your {symbol} 31 off</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- 主 Profile 页面渲染 ---
  return (
    <div className="profile-container fade-in">
      <div className="profile-header">
        <div className="user-profile-info">
          <div className="user-avatar" style={{ backgroundImage: `url(${user?.photoURL || 'https://via.placeholder.com/100'})` }} onClick={() => setView('edit-profile')}></div>
          <div className="user-meta">
            <h2>Welcome, {user?.displayName || user?.email?.split('@')[0] || 'User'}</h2>
            <p>{user?.email || 'wy@gmail.com'}</p>
          </div>
        </div>
      </div>

      <div className="profile-body">
        {/* Card 1: Reward and Savings */}
        <div className="ui-card">
          <h3 className="ui-card-title">Reward and Savings</h3>
          <div className="ui-row clickable" onClick={() => setLocalView('coupons')}>
            <Ticket size={18} /> <span>Coupons</span>
          </div>
          <div className="ui-row clickable" onClick={() => setLocalView('cashback')}>
            <Wallet size={18} /> <span>Cashback Rewards</span> 
            {/* 这里联动：显示全局余额 */}
            <span className="ui-val">{symbol} {cashbackBalance.toFixed(2)}</span>
          </div>
        </div>

        {/* Card 2: Travel Achievements */}
        <div className="ui-card">
          <div className="ui-card-header">
            <h3 className="ui-card-title">Travel Achievements</h3>
            <span className="see-more" onClick={() => setLocalView('achievements')}>See more</span>
          </div>
          <div className="achieve-split-layout no-click">
            <div className="achieve-item">
              <img src={mascotImg} alt="Zen" />
              <div className="achieve-text"><strong>{bookingStats.zensUnlocked}/7</strong><span>Zens</span></div>
            </div>
            <div className="v-divider"></div>
            <div className="achieve-item">
              <MapPin color="#7b2cbf" size={32} />
              <div className="achieve-text"><strong>{bookingStats.cities}</strong><span>city</span></div>
            </div>
          </div>
        </div>

        {/* Card 3: My Account */}
        <div className="ui-card">
          <h3 className="ui-card-title">My Account</h3>
          <div className="ui-row clickable" onClick={() => setView('edit-profile')}><UserCircle size={18} /> <span>Profile Edit</span></div>
          <div className="ui-row clickable" onClick={() => setView('saved')}><Heart size={18} /> <span>Saved</span></div>
          <div className="ui-row clickable" onClick={() => setView('my-reviews')}><Star size={18} /> <span>My reviews</span></div>
        </div>

        {/* Card 4: Settings */}
        <div className="ui-card">
          <h3 className="ui-card-title">Settings</h3>
          <div className="ui-row no-click"><Globe size={18} /> <span>Language</span> <span className="ui-val">English</span></div>
          <div className="ui-row no-click"><Eye size={18} /> <span>Price display</span> <span className="ui-val">Base per night</span></div>
          <div className="ui-row clickable" onClick={() => setLocalView('currency')}>
            <CircleDollarSign size={18} /> <span>Currency</span> <span className="ui-val">{globalCurrency.code}</span>
          </div>
          <div className="ui-row no-click"><Ruler size={18} /> <span>Distance</span> <span className="ui-val">km</span></div>
        </div>

        {/* Card 5: Help and Info */}
        <div className="ui-card">
          <h3 className="ui-card-title">Help and Info</h3>
          <div className="ui-row clickable" onClick={() => setView('about')}><Info size={18} /> <span>About Us</span></div>
          <div className="ui-row clickable" onClick={() => setView('help')}><HelpCircle size={18} /> <span>Help Center</span></div>
        </div>

        <button className="ui-logout-btn" onClick={() => signOut(auth).then(() => setView('auth'))}>LOGOUT</button>
      </div>
    </div>
  );
};