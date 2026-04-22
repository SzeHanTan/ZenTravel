import { auth } from '../services/firebase';
import { signOut } from 'firebase/auth';
import { Ticket, Wallet, Landmark, MapPin, User, MessageCircle } from 'lucide-react';
import '../styles/ProfilePage.css';

export const ProfilePage = ({ setView }: { setView: any }) => {
  return (
    <div className="profile-container fade-in">
      {/* 顶部紫色头部 */}
      <div className="profile-header">
        <span className="setting-label">setting here</span>
        <div className="user-info">
          <div className="avatar-white"></div>
          <div className="user-text">
            <h2>Welcome, {auth.currentUser?.email?.split('@')[0] || 'WY'}</h2>
            <p>{auth.currentUser?.email}</p>
          </div>
        </div>
      </div>

      <div className="profile-body">
        {/* 卡片 1: Rewards */}
        <div className="profile-card">
          <h3 className="card-title">Reward and Savings</h3>
          <div className="card-row"><Ticket size={18}/> <span>Coupons</span></div>
          <div className="card-row"><Wallet size={18}/> <span>Cashback Rewards</span> <span className="val">RM 0.00</span></div>
          <div className="card-row"><Landmark size={18}/> <span>ZenCash</span> <span className="val">RM 0.00</span></div>
        </div>

        {/* 卡片 2: Achievements */}
        <div className="profile-card">
          <div className="flex-between">
             <h3 className="card-title">Travel Achievements</h3>
             <span className="see-more">See more</span>
          </div>
          <div className="achieve-content">
            <div className="achieve-item">🤩 3/7 <br/><span>Zens</span></div>
            <div className="divider-v"></div>
            <div className="achieve-item"><MapPin color="#7b2cbf"/> 1 <br/><span>city</span></div>
          </div>
        </div>

        {/* 卡片 3: Account */}
        <div className="profile-card">
          <h3 className="card-title">My Account</h3>
          <div className="list-item">Profile Edit</div>
          <div className="list-item">Saved</div>
          <div className="list-item">My saved cards</div>
          <div className="list-item">My reviews</div>
        </div>

        {/* 卡片 4: Settings */}
        <div className="profile-card">
          <h3 className="card-title">Settings</h3>
          <div className="card-row"><span>Language</span> <span className="val">English</span></div>
          <div className="card-row"><span>Price display</span> <span className="val">Base per night</span></div>
          <div className="card-row"><span>Currency</span> <span className="val">RM | MYR</span></div>
        </div>

        <button className="logout-btn" onClick={() => signOut(auth).then(() => setView('auth'))}>LOGOUT</button>
      </div>

      {/* 悬浮 Chatbot */}
      <div className="chatbot-circle">
        <MessageCircle size={24}/>
        <span>chatbot</span>
      </div>

      {/* 底部导航 */}
      <nav className="bottom-nav">
        <div className="nav-item" onClick={() => setView('home')}>Home Page</div>
        <div className="nav-item">Notification</div>
        <div className="nav-ai">AI</div>
        <div className="nav-item">Booking details</div>
        <div className="nav-item active">Profile</div>
      </nav>
    </div>
  );
};