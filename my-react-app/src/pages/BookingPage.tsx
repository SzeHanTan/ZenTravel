import '../App.css';

export const BookingPage = ({ setView }: { setView: any }) => {
  return (
    <div className="home-page fade-in">
      <header className="home-header">Notifications</header>
      <div className="home-content">
        <p style={{color: 'white'}}>Your ZenTravel updates will appear here.</p>
      </div>
    </div>
  );
};