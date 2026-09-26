import { Link } from "react-router-dom";
import "./Profile.css";

function Profile({ user = null, onLogout, onOpenAuth }) {
  // ---------------------------------------------------------------------------
  // 1. Logged-out state: Prompt user to log in or register
  // ---------------------------------------------------------------------------
  if (!user) {
    return (
      <div className="profile-page-wrapper">
        <div className="profile-card profile-guest-card">
          <div className="profile-guest-icon">🔒</div>
          <h2 className="profile-guest-title">Please Log In</h2>
          <p className="profile-guest-subtitle">
            Log in with your Ghatampur Food account to view your profile details,
            saved delivery address, and live order tracking.
          </p>

          <div className="profile-guest-actions">
            <button
              type="button"
              className="profile-login-btn"
              onClick={onOpenAuth}
            >
              🔑 Log In / Sign Up
            </button>
            <Link to="/" className="profile-explore-btn">
              Explore Restaurants
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // 2. Logged-in state: Display user's profile details
  // ---------------------------------------------------------------------------
  const userInitial = user.name ? user.name.trim().charAt(0).toUpperCase() : "U";

  const formatJoinDate = (dateVal) => {
    if (!dateVal) return "Recently Joined";
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return "Member";
      return d.toLocaleDateString("en-IN", {
        month: "short",
        year: "numeric",
      });
    } catch {
      return "Member";
    }
  };

  return (
    <div className="profile-page-wrapper">
      <div className="profile-container">
        {/* Profile Card Header */}
        <div className="profile-card profile-header-card">
          <div className="profile-avatar-circle">
            <span>{userInitial}</span>
          </div>

          <div className="profile-user-summary">
            <div className="profile-name-row">
              <h1 className="profile-user-name">{user.name}</h1>
              <span className="profile-member-badge">✓ Verified Customer</span>
            </div>
            <p className="profile-user-email">✉ {user.email}</p>
            <span className="profile-joined-text">
              Member since {formatJoinDate(user.created_at)} • Ghatampur Local
            </span>
          </div>
        </div>

        {/* Account Details & Quick Navigation Grid */}
        <div className="profile-sections-grid">
          {/* Section 1: Contact & Delivery Info */}
          <div className="profile-card profile-details-card">
            <div className="card-heading-row">
              <h3 className="section-title">Personal Information</h3>
            </div>

            <div className="info-fields-stack">
              <div className="info-field-row">
                <span className="info-label">Full Name</span>
                <span className="info-value">{user.name}</span>
              </div>

              <div className="info-field-row">
                <span className="info-label">Email Address</span>
                <span className="info-value">{user.email}</span>
              </div>

              <div className="info-field-row">
                <span className="info-label">Phone Number</span>
                <span className="info-value">
                  {user.phone ? `+91 ${user.phone}` : "Not provided"}
                </span>
              </div>

              <div className="info-field-row">
                <span className="info-label">Saved Address</span>
                <span className="info-value">
                  {user.address || "Ghatampur, Kanpur Nagar, Uttar Pradesh"}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Quick Links & Actions */}
          <div className="profile-card profile-actions-card">
            <h3 className="section-title">Account Actions</h3>

            <div className="quick-links-stack">
              <Link to="/orders" className="profile-action-link">
                <div className="action-link-content">
                  <span className="action-link-icon">📦</span>
                  <div>
                    <strong>My Orders</strong>
                    <p>Track live delivery status & view past history</p>
                  </div>
                </div>
                <span className="action-arrow">→</span>
              </Link>

              <Link to="/cart" className="profile-action-link">
                <div className="action-link-content">
                  <span className="action-link-icon">🛒</span>
                  <div>
                    <strong>My Food Cart</strong>
                    <p>Review items in cart ready for checkout</p>
                  </div>
                </div>
                <span className="action-arrow">→</span>
              </Link>

              <Link to="/" className="profile-action-link">
                <div className="action-link-content">
                  <span className="action-link-icon">🍽️</span>
                  <div>
                    <strong>Explore Restaurants</strong>
                    <p>Browse menus from top Ghatampur food spots</p>
                  </div>
                </div>
                <span className="action-arrow">→</span>
              </Link>
            </div>

            <hr className="profile-divider" />

            <button
              type="button"
              className="profile-logout-btn"
              onClick={onLogout}
            >
              <span>🚪</span>
              <span>Log Out of Account</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;

