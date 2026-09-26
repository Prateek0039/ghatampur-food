import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { orderAPI } from "../services/api";
import "./OrderHistory.css";

function OrderHistory({ user = null, token = null, onOpenAuth, orders: initialOrders = [], onOrderCancelled }) {
  const [orders, setOrders] = useState(initialOrders);
  const [loading, setLoading] = useState(Boolean(user));
  const [error, setError] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  const handleCancelOrder = async (orderIdentifier) => {
    if (!window.confirm(`Are you sure you want to cancel Order #${orderIdentifier}?`)) {
      return;
    }

    setCancellingId(orderIdentifier);
    try {
      const effectiveToken = token || (JSON.parse(localStorage.getItem("ghatampur_auth") || "{}")).token;
      const updated = await orderAPI.cancel(orderIdentifier, effectiveToken);
      setOrders((prev) =>
        prev.map((o) =>
          (o.id === updated.id || o.order_number === updated.order_number)
            ? { ...o, status: "Cancelled" }
            : o
        )
      );
      if (onOrderCancelled) {
        onOrderCancelled(updated);
      }
    } catch (err) {
      alert(err.message || "Failed to cancel order. Please try again.");
    } finally {
      setCancellingId(null);
    }
  };

  const fetchUserOrders = async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);
      const data = await orderAPI.getUserOrders(user.id, token);
      setOrders(data);
    } catch (err) {
      console.error("Failed to load user orders:", err);
      setError(err.message || "Failed to load your order history from server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserOrders();
    } else {
      setOrders([]);
      setLoading(false);
    }
  }, [user, token]);

  // Unauthenticated State
  if (!user) {
    return (
      <div className="orders-page-wrapper">
        <div className="empty-orders-view">
          <div className="empty-orders-icon">🔒</div>
          <h2>Please Log In to View Orders</h2>
          <p>
            Log in with your Ghatampur Food account to access your live order tracking and past purchase history.
          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginTop: "16px" }}>
            <button
              type="button"
              className="explore-food-btn"
              onClick={onOpenAuth}
            >
              🔑 Log In / Sign Up
            </button>
            <Link to="/" className="explore-food-btn" style={{ background: "#f1f5f9", color: "#334155" }}>
              Explore Restaurants
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Loading State
  if (loading) {
    return (
      <div className="orders-page-wrapper">
        <div className="empty-orders-view" style={{ padding: "60px 20px" }}>
          <div style={{ fontSize: "36px", marginBottom: "12px", animation: "spin 1s linear infinite" }}>🔄</div>
          <h2>Fetching Your Orders...</h2>
          <p>Connecting to backend database for {user.name}...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="orders-page-wrapper">
        <div className="empty-orders-view">
          <div className="empty-orders-icon">⚠️</div>
          <h2>Unable to Load Orders</h2>
          <p>{error}</p>
          <button
            type="button"
            className="explore-food-btn"
            onClick={fetchUserOrders}
          >
            🔄 Try Again
          </button>
        </div>
      </div>
    );
  }

  // Empty State
  if (orders.length === 0) {
    return (
      <div className="orders-page-wrapper">
        <div className="empty-orders-view">
          <div className="empty-orders-icon">📦</div>
          <h2>No Past Orders</h2>
          <p>Hi {user.name.split(" ")[0]}, you haven't placed any food orders yet. Authentic food from Ghatampur is waiting!</p>
          <Link to="/" className="explore-food-btn">
            Explore Restaurants
          </Link>
        </div>
      </div>
    );
  }

  const formatOrderDate = (dateVal) => {
    if (!dateVal) return "Recent";
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return String(dateVal);
      return d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return String(dateVal);
    }
  };

  return (
    <div className="orders-page-wrapper">
      <div className="orders-container-inner">
        <div className="orders-header-row">
          <div>
            <h1 className="orders-page-title">My Orders</h1>
            <p className="orders-page-subtitle">
              Welcome back, <strong>{user.name}</strong>! You have placed {orders.length}{" "}
              {orders.length === 1 ? "order" : "orders"} so far.
            </p>
          </div>
          <Link to="/" className="order-again-link">
            + Order More Food
          </Link>
        </div>

        <div className="orders-cards-stack">
          {orders.map((order) => {
            const displayId = order.order_number || order.id;
            const customerName = order.customer_name || (order.customer && order.customer.name) || user.name;
            const customerAddress = order.delivery_address || (order.customer && order.customer.address) || "Ghatampur";
            const customerPhone = order.customer_phone || (order.customer && order.customer.phone) || user.phone;
            const items = order.items || [];
            const displayDate = formatOrderDate(order.created_at || order.date);
            const statusStr = order.status || "Placed";

            return (
              <div className="polished-order-card" key={order.id || displayId}>
                <div className="order-card-top-bar">
                  <div className="order-meta-info">
                    <span className="order-id-label">Order #{displayId}</span>
                    <span className="order-dot-separator">•</span>
                    <span className="order-date-text">{displayDate}</span>
                  </div>

                  <span
                    className={`status-badge-pill status-${statusStr.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    ● {statusStr}
                  </span>
                </div>

                <div className="order-card-content-grid">
                  <div className="order-dishes-section">
                    <h4 className="section-mini-heading">ITEMS ORDERED</h4>
                    <ul className="dishes-list-clean">
                      {items.map((item, idx) => (
                        <li key={idx} className="dish-clean-item">
                          <div className="dish-left">
                            <span className="dish-qty-tag">{item.quantity}x</span>
                            <span className="dish-name-text">{item.item_name || item.name}</span>
                          </div>
                          <span className="dish-cost-text">
                            ₹{item.price * item.quantity}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="order-dest-section">
                    <h4 className="section-mini-heading">DELIVERED TO</h4>
                    <p className="dest-user-name">{customerName}</p>
                    <p className="dest-user-address">{customerAddress}</p>
                    {customerPhone && (
                      <p className="dest-user-phone">📞 {customerPhone}</p>
                    )}
                  </div>
                </div>

                <div className="order-card-bottom-bar">
                  <div className="order-paid-group">
                    <span className="paid-label">Total Amount Paid:</span>
                    <span className="paid-amount">₹{order.total}</span>
                  </div>

                  <div className="order-actions-row">
                    {statusStr.toLowerCase() === "placed" && (
                      <button
                        type="button"
                        className="cancel-order-sm-btn"
                        onClick={() => handleCancelOrder(displayId)}
                        disabled={cancellingId === displayId}
                      >
                        {cancellingId === displayId ? "Cancelling..." : "✕ Cancel Order"}
                      </button>
                    )}
                    <Link
                      to={`/track-order/${displayId}`}
                      className="track-live-btn"
                    >
                      📍 Track Status
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default OrderHistory;
