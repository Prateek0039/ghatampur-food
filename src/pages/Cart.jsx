import { useState } from "react";
import { Link } from "react-router-dom";
import "./Cart.css";

function Cart({
  cart = [],
  onIncrease,
  onDecrease,
  onRemove,
  couponCode = "",
  onApplyCoupon,
}) {
  const [instructions, setInstructions] = useState("");

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const deliveryFee = subtotal > 0 ? (subtotal >= 299 ? 0 : 40) : 0;
  // Coupon state lives in App so it is shared with Checkout and the backend order
  const couponApplied = couponCode === "GHATAMPUR20";
  const discount = couponApplied ? Math.round(subtotal * 0.2) : 0;
  const grandTotal = Math.max(0, subtotal + deliveryFee - discount);

  if (cart.length === 0) {
    return (
      <div className="cart-page-wrapper">
        <div className="empty-cart-card">
          <div className="empty-cart-illustration">🛒</div>
          <h2>Your Cart is Empty</h2>
          <p>
            Good food is always just a few taps away! Explore the best restaurants
            in Ghatampur and add your favourites.
          </p>
          <Link to="/" className="browse-now-btn">
            See Restaurants Near You
          </Link>
        </div>
      </div>
    );
  }

  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="cart-page-wrapper">
      <div className="cart-layout-grid">
        {/* Left Column: Cart Items & Preferences */}
        <div className="cart-main-column">
          <div className="cart-surface-card">
            <div className="cart-surface-header">
              <div>
                <h2>Order Items ({totalItemsCount})</h2>
                <span className="cart-subtitle">Review items before checkout</span>
              </div>
              <Link to="/" className="add-more-items-link">
                + Add more items
              </Link>
            </div>

            <div className="cart-items-stack">
              {cart.map((item, index) => {
                const itemTotal = item.price * item.quantity;
                return (
                  <div className="cart-row-item" key={item.name || index}>
                    <div className="cart-item-info">
                      <div className="veg-badge-mini">
                        <div className="veg-dot-mini"></div>
                      </div>
                      <div>
                        <h4 className="cart-item-name">{item.name}</h4>
                        <span className="cart-item-unit-price">₹{item.price} each</span>
                      </div>
                    </div>

                    <div className="cart-row-actions">
                      <div className="modern-stepper">
                        <button
                          type="button"
                          className="stepper-action-btn"
                          onClick={() => onDecrease(item.name)}
                          disabled={item.quantity <= 1}
                          title={
                            item.quantity <= 1
                              ? "Minimum quantity is 1"
                              : "Decrease quantity"
                          }
                        >
                          −
                        </button>
                        <span className="stepper-count">{item.quantity}</span>
                        <button
                          type="button"
                          className="stepper-action-btn"
                          onClick={() => onIncrease(item.name)}
                          title="Increase quantity"
                        >
                          +
                        </button>
                      </div>

                      <div className="cart-row-total">₹{itemTotal}</div>

                      <button
                        type="button"
                        className="cart-remove-icon-btn"
                        onClick={() => onRemove(item.name)}
                        title="Remove item"
                        aria-label="Remove item"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Delivery Note Input */}
          <div className="cart-surface-card instructions-card">
            <label htmlFor="delivery-note" className="instructions-label">
              📝 Delivery or Cooking Instructions (Optional)
            </label>
            <input
              id="delivery-note"
              type="text"
              placeholder="e.g. Please avoid plastic cutlery, leave at gate, make spicy..."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="instructions-input"
            />
          </div>

          {/* Coupon Code Strip */}
          <div className="cart-surface-card coupon-box">
            <div className="coupon-left">
              <span className="coupon-icon">🏷️</span>
              <div>
                <strong>GHATAMPUR20</strong>
                <p>Save 20% on orders above ₹149</p>
              </div>
            </div>
            <button
              type="button"
              className={`coupon-apply-btn ${couponApplied ? "applied" : ""}`}
              onClick={() => onApplyCoupon && onApplyCoupon(couponApplied ? "" : "GHATAMPUR20")}
            >
              {couponApplied ? "REMOVE" : "APPLY"}
            </button>
          </div>
        </div>

        {/* Right Column: Bill Details & Checkout CTA */}
        <div className="cart-sidebar-column">
          <div className="cart-surface-card bill-details-card">
            <h3 className="bill-title">Bill Details</h3>

            <div className="bill-row">
              <span>Item Subtotal</span>
              <span>₹{subtotal}</span>
            </div>

            <div className="bill-row">
              <span>Delivery Fee</span>
              <span>
                {deliveryFee === 0 ? (
                  <strong className="free-tag">FREE</strong>
                ) : (
                  `₹${deliveryFee}`
                )}
              </span>
            </div>

            {couponApplied && (
              <div className="bill-row discount-row">
                <span>Coupon Discount (20%)</span>
                <span>−₹{discount}</span>
              </div>
            )}

            <div className="bill-row">
              <span>Platform Fee</span>
              <span className="free-tag">FREE</span>
            </div>

            {subtotal < 299 ? (
              <div className="delivery-upsell-callout">
                🚚 Add items worth <strong>₹{299 - subtotal}</strong> more to unlock <strong>FREE Delivery</strong>!
              </div>
            ) : (
              <div className="delivery-unlocked-callout">
                🎉 Awesome! You've unlocked <strong>FREE Delivery</strong>.
              </div>
            )}

            <hr className="bill-divider" />

            <div className="bill-row grand-total-row">
              <div>
                <span className="grand-label">To Pay</span>
                <span className="taxes-note">Inclusive of all taxes</span>
              </div>
              <span className="grand-amount">₹{grandTotal}</span>
            </div>

            <Link to="/checkout" className="proceed-checkout-btn">
              Proceed to Checkout →
            </Link>

            <div className="safe-delivery-badge">
              <span>🛡️ 100% Safe & Hygienic Delivery Guarantee</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Cart;