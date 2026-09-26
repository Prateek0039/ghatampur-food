import { useState } from "react";
import { authAPI } from "../services/api";
import "./AuthModal.css";

function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [activeTab, setActiveTab] = useState("login"); // 'login' or 'signup'
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Login form state
  const [loginData, setLoginData] = useState({
    identifier: "",
    password: "",
  });

  // Signup form state
  const [signupData, setSignupData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    address: "",
  });

  if (!isOpen) return null;

  const handleLoginChange = (e) => {
    setLoginData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (errorMessage) setErrorMessage("");
  };

  const handleSignupChange = (e) => {
    setSignupData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (errorMessage) setErrorMessage("");
  };

  const validateSignup = () => {
    if (!signupData.name.trim()) return "Please enter your full name.";
    if (signupData.name.trim().length < 2) return "Name must be at least 2 characters.";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(signupData.email.trim())) {
      return "Please enter a valid email address (e.g. user@example.com).";
    }

    const phoneDigits = signupData.phone.trim().replace(/\D/g, "");
    if (phoneDigits.length !== 10) {
      return "Phone number must be a valid 10-digit mobile number.";
    }

    if (signupData.password.length < 6) {
      return "Password must be at least 6 characters.";
    }

    if (signupData.password !== signupData.confirmPassword) {
      return "Passwords do not match. Please re-check.";
    }

    return null;
  };

  const validateLogin = () => {
    if (!loginData.identifier.trim()) {
      return "Please enter your email or 10-digit phone number.";
    }
    if (!loginData.password) {
      return "Please enter your password.";
    }
    return null;
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    const error = validateLogin();
    if (error) {
      setErrorMessage(error);
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const response = await authAPI.login({
        identifier: loginData.identifier.trim(),
        password: loginData.password,
      });

      onAuthSuccess(response);
      onClose();
    } catch (err) {
      setErrorMessage(err.message || "Failed to log in. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    const error = validateSignup();
    if (error) {
      setErrorMessage(error);
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const response = await authAPI.signup({
        name: signupData.name.trim(),
        email: signupData.email.trim().toLowerCase(),
        phone: signupData.phone.trim().replace(/\D/g, ""),
        password: signupData.password,
        address: signupData.address.trim() || undefined,
      });

      onAuthSuccess(response);
      onClose();
    } catch (err) {
      setErrorMessage(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button
          type="button"
          className="auth-close-btn"
          onClick={onClose}
          aria-label="Close modal"
        >
          ✕
        </button>

        {/* Modal Brand Header */}
        <div className="auth-modal-header">
          <div className="auth-brand-badge">🍔 Ghatampur Food</div>
          <h2>{activeTab === "login" ? "Welcome Back!" : "Create an Account"}</h2>
          <p>
            {activeTab === "login"
              ? "Log in to track orders, save addresses, and checkout fast."
              : "Sign up today to enjoy fresh meals delivered to your doorstep."}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="auth-tab-row">
          <button
            type="button"
            className={`auth-tab-btn ${activeTab === "login" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("login");
              setErrorMessage("");
            }}
          >
            Log In
          </button>
          <button
            type="button"
            className={`auth-tab-btn ${activeTab === "signup" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("signup");
              setErrorMessage("");
            }}
          >
            Sign Up
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="auth-error-banner">
            <span className="error-icon">⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        {activeTab === "login" ? (
          <form className="auth-form" onSubmit={handleLoginSubmit} noValidate>
            <div className="auth-input-group">
              <label htmlFor="login-identifier">Email or 10-digit Phone</label>
              <div className="auth-input-wrapper">
                <span className="auth-field-icon">👤</span>
                <input
                  type="text"
                  id="login-identifier"
                  name="identifier"
                  placeholder="e.g. rahul@example.com or 9876543210"
                  value={loginData.identifier}
                  onChange={handleLoginChange}
                  required
                />
              </div>
            </div>

            <div className="auth-input-group">
              <label htmlFor="login-password">Password</label>
              <div className="auth-input-wrapper">
                <span className="auth-field-icon">🔒</span>
                <input
                  type="password"
                  id="login-password"
                  name="password"
                  placeholder="Enter your password"
                  value={loginData.password}
                  onChange={handleLoginChange}
                  required
                />
              </div>
            </div>

            <div className="demo-hint-box">
              💡 <strong>Demo Account:</strong> <code>rahul@example.com</code> / <code>password123</code>
            </div>

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Log In →"}
            </button>

            <div className="auth-toggle-link">
              Don't have an account yet?{" "}
              <button
                type="button"
                className="link-btn"
                onClick={() => {
                  setActiveTab("signup");
                  setErrorMessage("");
                }}
              >
                Sign up here
              </button>
            </div>
          </form>
        ) : (
          /* Signup Form */
          <form className="auth-form" onSubmit={handleSignupSubmit} noValidate>
            <div className="auth-input-group">
              <label htmlFor="signup-name">Full Name *</label>
              <div className="auth-input-wrapper">
                <span className="auth-field-icon">👤</span>
                <input
                  type="text"
                  id="signup-name"
                  name="name"
                  placeholder="Enter your full name"
                  value={signupData.name}
                  onChange={handleSignupChange}
                  required
                />
              </div>
            </div>

            <div className="auth-grid-two">
              <div className="auth-input-group">
                <label htmlFor="signup-email">Email Address *</label>
                <div className="auth-input-wrapper">
                  <span className="auth-field-icon">✉️</span>
                  <input
                    type="email"
                    id="signup-email"
                    name="email"
                    placeholder="user@example.com"
                    value={signupData.email}
                    onChange={handleSignupChange}
                    required
                  />
                </div>
              </div>

              <div className="auth-input-group">
                <label htmlFor="signup-phone">10-Digit Mobile *</label>
                <div className="auth-input-wrapper">
                  <span className="auth-field-icon">📞</span>
                  <input
                    type="tel"
                    id="signup-phone"
                    name="phone"
                    placeholder="9876543210"
                    maxLength="10"
                    value={signupData.phone}
                    onChange={handleSignupChange}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="auth-input-group">
              <label htmlFor="signup-address">Delivery Address (Optional)</label>
              <div className="auth-input-wrapper">
                <span className="auth-field-icon">🏠</span>
                <input
                  type="text"
                  id="signup-address"
                  name="address"
                  placeholder="Street / Colony / Landmark, Ghatampur"
                  value={signupData.address}
                  onChange={handleSignupChange}
                />
              </div>
            </div>

            <div className="auth-grid-two">
              <div className="auth-input-group">
                <label htmlFor="signup-password">Password (min 6) *</label>
                <div className="auth-input-wrapper">
                  <span className="auth-field-icon">🔒</span>
                  <input
                    type="password"
                    id="signup-password"
                    name="password"
                    placeholder="At least 6 characters"
                    value={signupData.password}
                    onChange={handleSignupChange}
                    required
                  />
                </div>
              </div>

              <div className="auth-input-group">
                <label htmlFor="signup-confirm">Confirm Password *</label>
                <div className="auth-input-wrapper">
                  <span className="auth-field-icon">🔑</span>
                  <input
                    type="password"
                    id="signup-confirm"
                    name="confirmPassword"
                    placeholder="Re-type password"
                    value={signupData.confirmPassword}
                    onChange={handleSignupChange}
                    required
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={loading}
            >
              {loading ? "Creating Account..." : "Create Account →"}
            </button>

            <div className="auth-toggle-link">
              Already have an account?{" "}
              <button
                type="button"
                className="link-btn"
                onClick={() => {
                  setActiveTab("login");
                  setErrorMessage("");
                }}
              >
                Log in here
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default AuthModal;

