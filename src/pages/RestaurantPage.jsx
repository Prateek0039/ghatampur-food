import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import FoodCard from "../components/FoodCard";
import { restaurantAPI } from "../services/api";
import "./RestaurantPage.css";

function RestaurantPage({ cart = [], onAddToCart, setCart }) {
  const { id } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState("All");

  const fetchRestaurantDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await restaurantAPI.getById(id);
      setRestaurant(data);
    } catch (err) {
      console.error(`Failed to fetch restaurant #${id}:`, err);
      setError(err.message || "Failed to load restaurant details from server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurantDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="restaurant-page-container" style={{ textAlign: "center", padding: "60px 20px" }}>
        <div style={{ fontSize: "36px", marginBottom: "12px", animation: "spin 1s linear infinite" }}>🔄</div>
        <p style={{ color: "var(--text-secondary)", fontWeight: "600" }}>
          Fetching restaurant details & menu from backend...
        </p>
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div className="restaurant-page-container">
        <div className="not-found-card">
          <h2>Restaurant Not Found</h2>
          <p>{error || `We couldn't locate restaurant #${id} in the database.`}</p>
          <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginTop: "16px" }}>
            <button
              type="button"
              onClick={fetchRestaurantDetails}
              style={{
                background: "#e23744",
                color: "#ffffff",
                border: "none",
                padding: "8px 18px",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "700"
              }}
            >
              🔄 Retry
            </button>
            <Link to="/" className="back-link">
              ← Back to All Restaurants
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const menuList = restaurant.menu_items || restaurant.menu || [];

  const handleAddToCart = (item) => {
    // Preserve item ID so backend can calculate prices reliably
    const cartItem = {
      id: item.id,
      name: item.name,
      price: item.price,
      category: item.category,
    };

    if (onAddToCart) {
      onAddToCart(cartItem);
    } else if (setCart) {
      setCart((previousCart) => {
        const existingIndex = previousCart.findIndex((i) => i.id === item.id || i.name === item.name);
        if (existingIndex > -1) {
          return previousCart.map((i, idx) =>
            idx === existingIndex ? { ...i, quantity: i.quantity + 1 } : i
          );
        }
        return [...previousCart, { ...cartItem, quantity: 1 }];
      });
    }
  };

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // Extract unique categories from this restaurant's menu
  const menuCategories = [
    "All",
    ...new Set(menuList.map((item) => item.category))
  ];

  const displayedMenu =
    activeCategory === "All"
      ? menuList
      : menuList.filter((item) => item.category === activeCategory);

  return (
    <div className="restaurant-page-wrapper">
      {/* Breadcrumb Navigation */}
      <div className="restaurant-breadcrumbs">
        <Link to="/" className="bc-link">Home</Link>
        <span className="bc-sep">/</span>
        <span className="bc-current">{restaurant.name}</span>
      </div>

      {/* Main Restaurant Info Card */}
      <div className="restaurant-header-card">
        <div className="restaurant-primary-info">
          <h1 className="restaurant-main-title">{restaurant.name}</h1>
          <p className="restaurant-main-cuisine">{restaurant.cuisine}</p>
          <p className="restaurant-outlet-info">
            📍 {restaurant.outlet || "Ghatampur"} • {restaurant.delivery_time || restaurant.time || "25-35 min"}
          </p>
          <span className="restaurant-cost-info">{restaurant.cost_for_two || "₹250 for two"}</span>
        </div>

        <div className="restaurant-rating-box">
          <div className="rating-score">★ {restaurant.rating || "4.2"}</div>
          <div className="ratings-total">{restaurant.ratings_count || "200+ ratings"}</div>
        </div>
      </div>

      {/* Deals & Coupons Strip */}
      <div className="restaurant-offers-strip">
        <div className="rest-offer-card">
          <span className="rest-offer-icon">🏷️</span>
          <div>
            <strong>20% OFF UP TO ₹50</strong>
            <p>Use code GHATAMPUR20 | Min order ₹149</p>
          </div>
        </div>

        <div className="rest-offer-card">
          <span className="rest-offer-icon">🚚</span>
          <div>
            <strong>FREE DELIVERY</strong>
            <p>On all food orders above ₹299</p>
          </div>
        </div>
      </div>

      {/* Menu Categories Pills */}
      <div className="menu-categories-bar">
        <span className="filter-label">Filter by Category:</span>
        <div className="category-tabs-row">
          {menuCategories.map((category) => (
            <button
              key={category}
              type="button"
              className={`cat-tab-btn ${activeCategory === category ? "active" : ""}`}
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Items Grid */}
      <section className="restaurant-menu-area">
        <div className="menu-section-heading">
          <h2>Menu ({displayedMenu.length} items)</h2>
          <p>Prepared fresh upon order</p>
        </div>

        <div className="modern-food-grid">
          {displayedMenu.map((item, index) => (
            <FoodCard
              key={item.id || item.name || index}
              name={item.name}
              price={item.price}
              category={item.category}
              onAddToCart={() => handleAddToCart(item)}
            />
          ))}
        </div>
      </section>

      {/* Floating Sticky Bottom Cart Bar */}
      {totalCartCount > 0 && (
        <div className="floating-cart-bar">
          <div className="floating-cart-inner">
            <div className="floating-cart-details">
              <span className="floating-items-count">
                🛒 {totalCartCount} {totalCartCount === 1 ? "item" : "items"} added
              </span>
              <span className="floating-subtotal">₹{cartSubtotal} (Subtotal)</span>
            </div>

            <Link to="/cart" className="floating-checkout-btn">
              VIEW CART →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default RestaurantPage;