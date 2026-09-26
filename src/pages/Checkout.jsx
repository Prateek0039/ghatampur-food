import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { orderAPI } from "../services/api";
import "./Checkout.css";

function Checkout({ cart = [], onPlaceOrder, user, token, couponCode = "", onOpenAuth }) {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: user ? user.name : "",
    phone: user && user.phone ? user.phone : "",
    address: user && user.address ? user.address : "",
    instructions: "",
    paymentMethod: "cod"
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  // Sync user info into form when user logs in
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: prev.name || user.name || "",
        phone: prev.phone || user.phone || "",
        address: prev.address || user.address || "",
      }));
    }
  }, [user]);

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const deliveryFee = subtotal > 0 ? (subtotal >= 299 ? 0 : 40) : 0;
  // Coupon (GHATAMPUR20) is shared from App state; discount must be reflected
  // in the summary AND sent to the backend so the saved order.total matches.
  const couponApplied = couponCode === "GHATAMPUR20";
  const discount = couponApplied ? Math.round(subtotal * 0.2) : 0;
  const grandTotal = Math.max(0, subtotal + deliveryFee - discount);

  if (cart.length === 0) {
    return (
      <div className="checkout-page-wrapper">
        <div className="checkout-empty-card">
          <div className="empty-cart-icon">🛒</div>
          <h2>Your Cart is Empty</h2>
          <p>Please add food items to your cart before proceeding to checkout.</p>
          <Link to="/" className="browse-restaurants-btn">
            Browse Restaurants
          </Link>
        </div>
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (serverError) setServerError("");
  };

  const validate = () => {
    const newErrors = {};

    if (!user) {
      newErrors.auth = "Please log in or sign up before placing your order.";
    }

    if (!formData.name.trim()) {
      newErrors.name = "Please enter your full name.";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters.";
    }

    const cleanPhone = formData.phone.trim().replace(/\D/g, "");
    if (!cleanPhone) {
      newErrors.phone = "Phone number is required.";
    } else if (cleanPhone.length !== 10) {
      newErrors.phone = "Enter a valid 10-digit mobile number (e.g. 9876543210).";
    }

    if (!formData.address.trim()) {
      newErrors.address = "Delivery address is required.";
    } else if (formData.address.trim().length < 6) {
      newErrors.address = "Please provide complete street / house address.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      if (onOpenAuth) onOpenAuth();
      return;
    }

    if (!validate()) {
      return;
    }

    setSubmitting(true);
    setServerError("");

    try {
      // Prepare order payload with item IDs
      const payload = {
        customer_name: formData.name.trim(),
        customer_phone: formData.phone.trim().replace(/\D/g, ""),
        delivery_address: formData.address.trim(),
        instructions: formData.instructions.trim() || undefined,
        items: cart.map((item) => ({
          menu_item_id: item.id || null,
          item_name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
        coupon_code: couponApplied ? couponCode : undefined,
        user_id: user ? user.id : undefined,
      };

      // Create order via FastAPI backend
      const createdOrder = await orderAPI.create(payload, token);

      // Notify parent App state
      onPlaceOrder(createdOrder);

      // Navigate to order confirmation
      navigate(`/order-confirmation/${createdOrder.order_number}`);
    } catch (err) {
      console.error("Order creation failed:", err);
      setServerError(err.message || "Failed to place order on server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="checkout-page-wrapper">
      {/* Login Prompt Banner if not logged in */}
      {!user && (
        <div style={{
          background: "#fffbeb",
          border: "1px solid #fef3c7",
          padding: "16px 20px",
          borderRadius: "14px",
          marginBottom: "20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px"
        }}>
          <div>
            <strong style={{ color: "#b45309", display: "block", marginBottom: "2px" }}>
              🔑 Account required to place orders
            </strong>
            <span style={{ fontSize: "13px", color: "#92400e" }}>
              Log in to save order history, track status in real-time, and get doorstep delivery.
            </span>
          </div>
          <button
            type="button"
            onClick={onOpenAuth}
            style={{
              background: "#e23744",
              color: "#ffffff",
              border: "none",
              padding: "9px 20px",
              borderRadius: "8px",
              fontWeight: "700",
              cursor: "pointer"
            }}
          >
            Log In / Sign Up
          </button>
        </div>
      )}

      {serverError && (
        <div style={{
          background: "#fef2f2",
          border: "1px solid #fecaca",
          color: "#b91c1c",
          padding: "14px",
          borderRadius: "12px",
          marginBottom: "20px"
        }}>
          ⚠️ {serverError}
        </div>
      )}

      <div className="checkout-layout-grid">
        {/* Left Form: Delivery Address & Payment */}
        <div className="checkout-form-column">
          {/* Section 1: Address */}
          <div className="checkout-step-card">
            <div className="step-card-header">
              <span className="step-number">1</span>
              <div>
                <h3>Delivery Address</h3>
                <p>Where should we deliver your hot food?</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              <div className="form-field-group">
                <label htmlFor="name" className="field-label">
                  Full Name <span className="req-star">*</span>
                </label>
                <div className="input-with-icon">
                  <span className="field-icon">👤</span>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`form-input-control ${errors.name ? "has-error" : ""}`}
                  />
                </div>
                {errors.name && <span className="error-message">{errors.name}</span>}
              </div>

              <div className="form-field-group">
                <label htmlFor="phone" className="field-label">
                  Phone Number (10 Digits) <span className="req-star">*</span>
                </label>
                <div className="input-with-icon">
                  <span className="field-icon">📞</span>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    placeholder="10-digit mobile number"
                    maxLength="10"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`form-input-control ${errors.phone ? "has-error" : ""}`}
                  />
                </div>
                {errors.phone && <span className="error-message">{errors.phone}</span>}
              </div>

              <div className="form-field-group">
                <label htmlFor="address" className="field-label">
                  Complete Address <span className="req-star">*</span>
                </label>
                <div className="input-with-icon">
                  <span className="field-icon">🏠</span>
                  <textarea
                    id="address"
                    name="address"
                    rows="3"
                    placeholder="House/Flat number, Street or Landmark, Ghatampur"
                    value={formData.address}
                    onChange={handleChange}
                    className={`form-input-control ${errors.address ? "has-error" : ""}`}
                  />
                </div>
                {errors.address && <span className="error-message">{errors.address}</span>}
              </div>

              <div className="form-field-group">
                <label htmlFor="instructions" className="field-label">
                  Landmark or Delivery Instructions (Optional)
                </label>
                <input
                  type="text"
                  id="instructions"
                  name="instructions"
                  placeholder="e.g. Near Shiv Mandir, ring the doorbell"
                  value={formData.instructions}
                  onChange={handleChange}
                  className="form-input-control"
                />
              </div>

              {/* Section 2: Payment */}
              <div className="checkout-step-card payment-step-card">
                <div className="step-card-header">
                  <span className="step-number">2</span>
                  <div>
                    <h3>Payment Method</h3>
                    <p>Select your preferred mode of payment</p>
                  </div>
                </div>

                <div className="payment-options-list">
                  <label className="payment-option-label selected">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cod"
                      checked={formData.paymentMethod === "cod"}
                      onChange={handleChange}
                    />
                    <div className="payment-option-info">
                      <span className="payment-title">💵 Cash on Delivery</span>
                      <span className="payment-desc">Pay cash when your order arrives</span>
                    </div>
                    <span className="selected-check">✓</span>
                  </label>

                  <label className="payment-option-label">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="upi"
                      checked={formData.paymentMethod === "upi"}
                      onChange={handleChange}
                    />
                    <div className="payment-option-info">
                      <span className="payment-title">📱 UPI on Delivery</span>
                      <span className="payment-desc">Scan QR via GPay / PhonePe / Paytm</span>
                    </div>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                className="final-place-order-btn"
                disabled={submitting}
              >
                <span>🔒 {submitting ? "VERIFYING & PLACING..." : "PLACE ORDER"}</span>
                <span className="final-btn-amount">₹{grandTotal}</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right Sidebar: Order Summary */}
        <div className="checkout-sidebar-column">
          <div className="checkout-summary-card">
            <div className="summary-card-header">
              <h3>Order Summary</h3>
              <Link to="/cart" className="summary-edit-btn">
                Edit Cart
              </Link>
            </div>

            <div className="summary-items-scroll">
              {cart.map((item, index) => (
                <div className="summary-dish-row" key={index}>
                  <div className="summary-dish-left">
                    <span className="summary-dish-qty">{item.quantity}x</span>
                    <span className="summary-dish-title">{item.name}</span>
                  </div>
                  <span className="summary-dish-price">
                    ₹{item.price * item.quantity}
                  </span>
                </div>
              ))}
            </div>

            <hr className="summary-divider" />

            <div className="summary-cost-row">
              <span>Item Subtotal</span>
              <span>₹{subtotal}</span>
            </div>

            <div className="summary-cost-row">
              <span>Delivery Partner Fee</span>
              <span>
                {deliveryFee === 0 ? (
                  <strong className="free-text">FREE</strong>
                ) : (
                  `₹${deliveryFee}`
                )}
              </span>
            </div>

            {couponApplied && (
              <div className="summary-cost-row summary-discount-row">
                <span>Coupon Discount (20%)</span>
                <span className="discount-text">−₹{discount}</span>
              </div>
            )}

            <div className="summary-cost-row">
              <span>Restaurant Packaging</span>
              <span className="free-text">FREE</span>
            </div>

            <hr className="summary-divider" />

            <div className="summary-cost-row final-total-row">
              <span>Grand Total</span>
              <span className="grand-price-text">₹{grandTotal}</span>
            </div>

            <div className="order-promise-strip">
              <span>✨ Fresh food packed with extra care & hygiene.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Checkout;
