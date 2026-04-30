import logoRR from '../../assets/logo_rr.png';

function Header() {
  return (
    <header className="hero">
      <div className="logo-container">
        <img src={logoRR} alt="RentRebel" className="brand-mark" />
      </div>
      <p className="eyebrow">Rent agreement intelligence</p>
      <h1>RentRebel</h1>
      <p className="hero-copy">AI-powered rental agreement analyzer</p>
    </header>
  );
}

export default Header;