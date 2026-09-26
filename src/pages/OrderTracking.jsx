import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { orderAPI } from "../services/api";
import "./OrderTracking.css";

const stages = [
  {
    key: "placed",
    title: "Order Placed",
    statusValue: "Placed",
    statusMatch: "placed",
    desc: "We have received your order and sent it to the restaurant.",
    icon: "📝"
  },
  {
    key: "accepted",
    title: "Order Confirmed",
    statusValue: "Accepted",
    statusMatch: "accepted",
    desc: "The restaurant accepted your order and started queueing it.",
    icon: "👍"
  },
  {
    key: "preparing",
    title: "Chef is Cooking",
    statusValue: "Preparing",
    statusMatch: "preparing",
    desc: "Your food is being prepared fresh in the kitchen with care.",
    icon: "🍳"
  },
  {
    key: "out_for_delivery",
    title: "Out for Delivery",
    statusValue: "Out for Delivery",
    statusMatch: "out for delivery",
    desc: "Delivery partner is on the way to your doorstep.",
    icon: "🛵"
  },
  {
    key: "delivered",
    title: "Delivered",
    statusValue: "Delivered",
    statusMatch: "delivered",
    desc: "Order delivered safely. Enjoy your delicious food!",
    icon: "🎉"
  }
];

function OrderTracking({ orders = [], token = null, user = null, onOrderCancelled = null }) {
  const { orderId } = useParams();
  const [order, setOrder] = useState(() => {
    return orders.find((o) => o.id === orderId || o.order_number === orderId) || null;
  });
  const [loading, setLoading] = useState(!order);
  const [currentStageIndex, setCurrentStageIndex] = useState(2);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState(null);

  useEffect(() => {
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

  // Sync stage index when order status changes
  useEffect(() => {
    if (order && order.status) {
      const normalized = order.status.toLowerCase().trim();
      const matchIdx = stages.findIndex(
        (s) =>
          s.statusMatch === normalized ||
          (s.statusValue && s.statusValue.toLowerCase() === normalized) ||
          s.title.toLowerCase() === normalized
      );
      if (matchIdx >= 0) {
        setCurrentStageIndex(matchIdx);
      }
    }
  }, [order]);

  const handleCancelOrder = async () => {
    const backendIdentifier = order.order_number || order.id || orderId;
    if (!window.confirm(`Are you sure you want to cancel Order #${backendIdentifier}?`)) {
      return;
    }

    setCancelling(true);
    setCancelError(null);
    try {
      const effectiveToken = token || (JSON.parse(localStorage.getItem("ghatampur_auth") || "{}")).token;
      const updated = await orderAPI.cancel(backendIdentifier, effectiveToken);
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

  const handleStageClick = async (idx) => {
    if ((order?.status || "").toLowerCase() === "cancelled") return;

    setCurrentStageIndex(idx);
    const selectedStage = stages[idx];
    const backendIdentifier = order.order_number || order.id || orderId;
    const targetStatus = selectedStage.statusValue || selectedStage.title;

    try {
      await orderAPI.updateStatus(backendIdentifier, targetStatus);
      setOrder((prev) => (prev ? { ...prev, status: targetStatus } : prev));
    } catch (err) {
      console.warn("Could not update order status on server:", err);
    }
  };

  if (loading) {
    return (
      <div className="tracking-page-wrapper">
        <div className="tracking-card" style={{ textAlign: "center", padding: "40px" }}>
          <div style={{ fontSize: "36px", marginBottom: "12px", animation: "spin 1s linear infinite" }}>🔄</div>
          <h3>Connecting to Tracking Server...</h3>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="tracking-page-wrapper">
        <div className="tracking-card error-tracking">
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
  const activeStage = stages[currentStageIndex] || stages[0];
  const displayId = order.order_number || order.id;
  const customerName = order.customer ? order.customer.name : order.customer_name;
  const customerPhone = order.customer ? order.customer.phone : order.customer_phone;
  const customerAddress = order.customer ? order.customer.address : order.delivery_address;
  const customerInstructions = order.customer ? order.customer.instructions : order.instructions;
  const itemsList = order.items || [];

  return (
    <div className="tracking-page-wrapper">
      <div className="tracking-main-card">
        {/* Status Live Header */}
        <div className={`tracking-banner-header ${isCancelled ? "cancelled-header" : ""}`}>
          <div className="live-status-group">
            <span className={`live-pulse-dot ${isCancelled ? "cancelled-dot" : ""}`}></span>
            <div>
              <span className="live-status-title">
                {isCancelled ? "Order Cancelled" : activeStage.title}
              </span>
              <p className="live-status-desc">
                {isCancelled
                  ? "This order was cancelled and will not be prepared or delivered."
                  : activeStage.desc}
              </p>
            </div>
          </div>

          <div className="eta-badge-card">
            <span className="eta-caption">{isCancelled ? "STATUS" : "ESTIMATED ARRIVAL"}</span>
            <span className="eta-minutes">{isCancelled ? "CANCELLED" : "25 - 30 MINS"}</span>
          </div>
        </div>

        {/* Cancelled Notice Box */}
        {isCancelled && (
          <div className="cancelled-notice-box">
            <div className="cancelled-notice-icon">🚫</div>
            <div className="cancelled-notice-text">
              <h4>This Order Has Been Cancelled</h4>
              <p>Your order was cancelled. No food will be prepared or delivered for this order. Feel free to explore our restaurants to place a new order whenever you're ready!</p>
            </div>
          </div>
        )}

        {/* Stepper Timeline */}
        <div className="stepper-timeline-section" style={{ opacity: isCancelled ? 0.6 : 1 }}>
          <div className="stepper-items-track">
            {stages.map((stage, idx) => {
              const isDone = !isCancelled && idx < currentStageIndex;
              const isCurrent = !isCancelled && idx === currentStageIndex;

              return (
                <div
                  key={stage.key}
                  className={`track-step-node ${
                    isDone ? "done" : isCurrent ? "active" : "pending"
                  }`}
                  onClick={() => !isCancelled && handleStageClick(idx)}
                  title={isCancelled ? "Order is cancelled" : "Click to update status on server"}
                  style={{ cursor: isCancelled ? "not-allowed" : "pointer" }}
                >
                  <div className="node-marker">
                    <div className="marker-circle">
                      {isDone ? "✓" : stage.icon}
                    </div>
                    {idx < stages.length - 1 && (
                      <div className={`track-connector ${!isCancelled && idx < currentStageIndex ? "filled" : ""}`} />
                    )}
                  </div>

                  <div className="node-content">
                    <h4>{stage.title}</h4>
                    <p>{stage.desc}</p>
                    {isCurrent && (
                      <span className="current-state-tag">● Active Status</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {!isCancelled ? (
            <div className="simulation-notice">
              💡 Live Status Sync: Click any step above to update the status directly in the database!
            </div>
          ) : (
            <div className="simulation-notice" style={{ color: "#b91c1c" }}>
              🔒 Tracking disabled: This order is cancelled and cannot be progressed.
            </div>
          )}
        </div>

        {/* Delivery Partner Profile Card (only show if not cancelled) */}
        {!isCancelled && (
          <div className="delivery-partner-card">
            <div className="partner-avatar">🛵</div>
            <div className="partner-details">
              <h4>Ramesh Kumar</h4>
              <p>Delivery Partner • 4.9 ★ Rating (1,400+ deliveries)</p>
            </div>
            <button
              type="button"
              className="call-partner-btn"
              onClick={() => alert(`Calling delivery partner for Order #${displayId}: +91 9876543210`)}
            >
              📞 Call Partner
            </button>
          </div>
        )}

        {/* Order Details & Summary Grid */}
        <div className="tracking-details-columns">
          <div className="tracking-subcard">
            <h4>📍 Delivery Destination</h4>
            <p className="dest-name">{customerName}</p>
            <p className="dest-address">{customerAddress}</p>
            <p className="dest-phone">📞 {customerPhone}</p>
            {customerInstructions && (
              <p className="dest-note">📝 "{customerInstructions}"</p>
            )}
          </div>

          <div className="tracking-subcard">
            <h4>🧾 Order Summary (#{displayId})</h4>
            <div className="dishes-compact-list">
              {itemsList.map((item, idx) => (
                <div className="dish-compact-row" key={idx}>
                  <span>{item.quantity}x {item.item_name || item.name}</span>
                  <span className="dish-compact-price">
                    ₹{item.price * item.quantity}
                  </span>
                </div>
              ))}
            </div>
            <hr className="compact-divider" />
            <div className="dish-compact-row total-paid-line">
              <strong>Total Paid:</strong>
              <strong>₹{order.total}</strong>
            </div>
          </div>
        </div>

        {/* Error notification if cancel failed */}
        {cancelError && <div className="cancel-error-banner">{cancelError}</div>}

        {/* Footer Actions */}
        <div className="tracking-actions-bar">
          <Link to="/orders" className="view-orders-btn">
            ← View All Orders
          </Link>
          {isPlaced && (
            <button
              type="button"
              className="cancel-order-btn"
              onClick={handleCancelOrder}
              disabled={cancelling}
            >
              {cancelling ? "Cancelling..." : "✕ Cancel Order"}
            </button>
          )}
          <Link to="/" className="continue-ordering-btn">
            Order More Food
          </Link>
        </div>
      </div>
    </div>
  );
}

export default OrderTracking;
