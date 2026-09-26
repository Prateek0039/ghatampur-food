import { Link, useLocation } from "react-router-dom";
import "./Navbar.css";

function Navbar({ cartCount = 0, ordersCount = 0, user = null, onLogout, onOpenAuth }) {
  const location = useLocation();

  return (
    <>
      {/* Top Navigation Bar */}
      <header className="main-navbar">
        <div className="navbar-inner">
          <div className="navbar-brand-group">
            <Link to="/" className="navbar-brand">
              <span className="brand-icon">🍔</span>
              <span className="brand-name">Ghatampur<span className="brand-highlight">Food</span></span>
            </Link>
            <div className="delivery-location">
              <span className="location-pin">📍</span>
              <span className="location-text">Ghatampur Central</span>
              <span className="location-arrow">▾</span>
            </div>
          </div>

          <nav className="desktop-nav-links">
            <Link
              to="/"
              className={`nav-item ${location.pathname === "/" ? "active" : ""}`}
            >
              <span className="nav-icon">🏠</span>
              <span>Home</span>
            </Link>

            <Link
              to="/orders"
              className={`nav-item ${location.pathname === "/orders" ? "active" : ""}`}
            >
              <span className="nav-icon">📦</span>
              <span>Orders</span>
              {ordersCount > 0 && (
                <span className="nav-badge orders-count">{ordersCount}</span>
              )}
            </Link>

            <Link
              to="/cart"
              className={`nav-item cart-btn ${location.pathname === "/cart" ? "active" : ""}`}
            >
              <span className="nav-icon">🛒</span>
              <span>Cart</span>
              {cartCount > 0 && (
                <span className="nav-badge cart-count">{cartCount}</span>
              )}
            </Link>

            {/* Authentication / Profile Section */}
            {user ? (
              <div className="nav-user-cluster">
                <Link
                  to="/profile"
                  className={`nav-user-pill ${location.pathname === "/profile" ? "active" : ""}`}
                  title={`View profile for ${user.email}`}
                >
                  <span className="user-icon">👤</span>
                  <span className="user-firstname">{user.name.split(" ")[0]}</span>
                </Link>
                <button
                  type="button"
                  className="nav-logout-btn"
                  onClick={onLogout}
                  title="Log out of your account"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="nav-user-cluster">
                <Link
                  to="/profile"
                  className={`nav-item ${location.pathname === "/profile" ? "active" : ""}`}
                >
                  <span className="nav-icon">👤</span>
                  <span>Profile</span>
                </Link>
                <button
                  type="button"
                  className="nav-login-btn"
                  onClick={onOpenAuth}
                >
                  <span>🔑 Log In / Sign Up</span>
                </button>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (app-like experience) */}
      <nav className="mobile-bottom-nav">
        <Link
          to="/"
          className={`mobile-nav-item ${location.pathname === "/" ? "active" : ""}`}
        >
          <span className="mobile-nav-icon">🏠</span>
          <span className="mobile-nav-label">Home</span>
        </Link>

        <Link
          to="/orders"
          className={`mobile-nav-item ${location.pathname === "/orders" ? "active" : ""}`}
        >
          <div className="mobile-icon-wrapper">
            <span className="mobile-nav-icon">📦</span>
            {ordersCount > 0 && (
              <span className="mobile-badge">{ordersCount}</span>
            )}
          </div>
          <span className="mobile-nav-label">Orders</span>
        </Link>

        <Link
          to="/cart"
          className={`mobile-nav-item ${location.pathname === "/cart" ? "active" : ""}`}
        >
          <div className="mobile-icon-wrapper">
            <span className="mobile-nav-icon">🛒</span>
            {cartCount > 0 && (
              <span className="mobile-badge cart-badge-mobile">{cartCount}</span>
            )}
          </div>
          <span className="mobile-nav-label">Cart</span>
        </Link>

        <Link
          to="/profile"
          className={`mobile-nav-item ${location.pathname === "/profile" ? "active" : ""}`}
        >
          <span className="mobile-nav-icon">👤</span>
          <span className="mobile-nav-label">
            {user ? user.name.split(" ")[0] : "Profile"}
          </span>
        </Link>
      </nav>
    </>
  );
}

export default Navbar;
