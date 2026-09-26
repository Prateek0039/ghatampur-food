import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { orderAPI } from "../services/api";
import "./OrderConfirmation.css";

function OrderConfirmation({ orders = [], token = null, user = null, onOrderCancelled = null }) {
  const { orderId } = useParams();
  const [copied, setCopied] = useState(false);
  const [order, setOrder] = useState(() => {
    return orders.find((o) => o.id === orderId || o.order_number === orderId) || null;
  });
  const [loading, setLoading] = useState(!order);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState(null);

  useEffect(() => {
    // If order not found in prop list, fetch from backend API
    if (!order && orderId) {
      let isMounted = true;
      orderAPI
        .getById(orderId)
        .then((data) => {
          if (isMounted) {
            setOrder(data);
            setLoading(false);
          }
        })
        .catch((err) => {
          console.warn("Could not fetch order from backend:", err);
          if (isMounted) setLoading(false);
        });

      return () => {
        isMounted = false;
      };
    }
  }, [orderId, order]);

  const handleCancelOrder = async () => {
    const displayId = order.order_number || order.id || orderId;
    if (!window.confirm(`Are you sure you want to cancel Order #${displayId}?`)) {
      return;
    }

    setCancelling(true);
    setCancelError(null);
    try {
      const effectiveToken = token || (JSON.parse(localStorage.getItem("ghatampur_auth") || "{}")).token;
      const updated = await orderAPI.cancel(displayId, effectiveToken);
      setOrder(updated);
      if (onOrderCancelled) {
        onOrderCancelled(updated);
      }
    } catch (err) {
      setCancelError(err.message || "Failed to cancel order. Please try again.");
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="confirmation-page-wrapper">
        <div className="confirmation-card" style={{ textAlign: "center", padding: "40px" }}>
          <div style={{ fontSize: "36px", marginBottom: "12px", animation: "spin 1s linear infinite" }}>🔄</div>
          <h3>Loading Order Details...</h3>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="confirmation-page-wrapper">
        <div className="confirmation-card not-found-order">
          <h2>Order Not Found</h2>
          <p>We couldn't locate order #{orderId}.</p>
          <Link to="/" className="home-action-btn">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const isCancelled = (order.status || "").toLowerCase() === "cancelled";
  const isPlaced = (order.status || "").toLowerCase() === "placed";
  const displayId = order.order_number || order.id;
  const customerName = order.customer ? order.customer.name : order.customer_name;
  const customerPhone = order.customer ? order.customer.phone : order.customer_phone;
  const customerAddress = order.customer ? order.customer.address : order.delivery_address;
  const customerInstructions = order.customer ? order.customer.instructions : order.instructions;
  const itemsList = order.items || [];

  const handleCopyId = () => {
    navigator.clipboard.writeText(displayId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="confirmation-page-wrapper">
      <div className="confirmation-card">
        {/* Celebration Header */}
        <div
          className="celebration-badge-outer"
          style={isCancelled ? { backgroundColor: "#fee2e2" } : {}}
        >
          <div
            className="celebration-badge-inner"
            style={isCancelled ? { backgroundColor: "#dc2626", boxShadow: "0 4px 14px rgba(220, 38, 38, 0.35)" } : {}}
          >
            {isCancelled ? "✕" : "✓"}
          </div>
        </div>

        {isCancelled ? (
          <div className="cancelled-confirmation-notice">
            <span className="cancelled-pill">ORDER CANCELLED</span>
            <p>This order was successfully cancelled. No food will be prepared or delivered.</p>
          </div>
        ) : (
          <>
            <h1 className="confirmation-headline">Order Placed Successfully!</h1>
            <p className="confirmation-subtext">
              Thank you, <strong>{customerName}</strong>! The restaurant has
              received your order and started preparing it.
            </p>
          </>
        )}

        {/* Order ID Pill with Copy */}
        <div className="order-number-pill" onClick={handleCopyId} title="Click to copy">
          <span className="order-tag-label">Order ID:</span>
          <span className="order-tag-code">#{displayId}</span>
          <span className="copy-hint">{copied ? "Copied! ✓" : "📋"}</span>
        </div>

        {/* Live Delivery ETA Banner (only if not cancelled) */}
        {!isCancelled && (
          <div className="eta-delivery-banner">
            <div className="eta-icon">🛵</div>
            <div className="eta-text">
              <strong>Estimated Delivery: 25-35 mins</strong>
              <p>Delivery partner will be assigned shortly</p>
            </div>
          </div>
        )}

        {/* Details Grid */}
        <div className="order-details-grid">
          <div className="order-detail-card">
            <h4>📍 Delivery Address</h4>
            <p className="detail-person">{customerName}</p>
            <p className="detail-address">{customerAddress}</p>
            <p className="detail-phone">📞 {customerPhone}</p>
            {customerInstructions && (
              <p className="detail-note">Note: "{customerInstructions}"</p>
            )}
          </div>

          <div className="order-detail-card">
            <h4>🧾 Ordered Items</h4>
            <div className="ordered-dishes-list">
              {itemsList.map((item, index) => (
                <div className="ordered-dish-row" key={index}>
                  <span>{item.quantity}x {item.item_name || item.name}</span>
                  <span className="dish-price">₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>
            <hr className="detail-divider" />
            <div className="ordered-dish-row total-row-highlight">
              <strong>Total Paid:</strong>
              <strong>₹{order.total}</strong>
            </div>
          </div>
        </div>

        {/* Cancellation error message */}
        {cancelError && (
          <div className="confirmation-cancel-error">
            {cancelError}
          </div>
        )}

        {/* Action Buttons */}
        <div className="confirmation-buttons-group">
          <Link to={`/track-order/${displayId}`} className="track-order-cta">
            📍 Track Order Status Live
          </Link>
          {isPlaced && (
            <button
              type="button"
              className="confirmation-cancel-btn"
              onClick={handleCancelOrder}
              disabled={cancelling}
            >
              {cancelling ? "Cancelling..." : "✕ Cancel Order"}
            </button>
          )}
          <Link to="/" className="home-action-btn">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default OrderConfirmation;
