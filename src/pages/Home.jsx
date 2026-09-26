import { useState, useEffect } from "react";
import RestaurantCard from "../components/RestaurantCard";
import { restaurantAPI } from "../services/api";
import "../App.css";

const CATEGORIES = [
  { id: "All", name: "All Dishes", icon: "🍽️" },
  { id: "North Indian", name: "North Indian", icon: "🍛" },
  { id: "Chinese", name: "Chinese", icon: "🍜" },
  { id: "Pizza", name: "Pizza", icon: "🍕" },
  { id: "Burger", name: "Burgers", icon: "🍔" },
  { id: "Street Food", name: "Street Food", icon: "🥟" },
  { id: "Snacks", name: "Snacks", icon: "🍟" },
  { id: "Fast Food", name: "Fast Food", icon: "🥪" }
];

function Home() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [filterRating4Plus, setFilterRating4Plus] = useState(false);

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await restaurantAPI.getAll();
      setRestaurants(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch restaurants:", err);
      setError(err.message || "Could not connect to FastAPI backend. Please check that Uvicorn is running at http://localhost:8000.");
      setRestaurants([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const safeRestaurants = Array.isArray(restaurants) ? restaurants : [];

  const filteredRestaurants = safeRestaurants.filter((restaurant) => {
    const cuisineText = restaurant.cuisine || "";
    const nameText = restaurant.name || "";

    const matchesSearch =
      nameText.toLowerCase().includes(search.toLowerCase()) ||
      cuisineText.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      selectedCategory === "All" ||
      cuisineText.toLowerCase().includes(selectedCategory.toLowerCase());

    const matchesRating = filterRating4Plus
      ? parseFloat(restaurant.rating || "0") >= 4.4
      : true;

    return matchesSearch && matchesCategory && matchesRating;
  });

  return (
    <div className="home-page-wrapper">
      {/* Hero Section */}
      <section className="app-hero">
        <div className="hero-inner">
          <span className="hero-location-tag">📍 Serving Ghatampur & Nearby</span>
          <h1 className="hero-headline">
            Hungry? Order from top restaurants around you.
          </h1>
          <p className="hero-subtext">
            Authentic flavours, hot meals, and doorstep delivery in 30 mins.
          </p>

          <div className="hero-search-box">
            <span className="search-icon-symbol">🔍</span>
            <input
              type="text"
              placeholder="Search dishes, restaurants or cuisines..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="hero-search-input"
            />
            {search && (
              <button
                type="button"
                className="search-reset-btn"
                onClick={() => setSearch("")}
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </section>

      <main className="main-content-area">
        {/* Promotional Offers Grid */}
        <section className="promos-strip">
          <div className="promo-banner promo-deal">
            <div className="promo-badge">WELCOME DEAL</div>
            <div className="promo-title">Flat 20% OFF</div>
            <p className="promo-desc">On your first food order today</p>
            <div className="promo-coupon">Code: <strong>GHATAMPUR20</strong></div>
          </div>

          <div className="promo-banner promo-delivery">
            <div className="promo-badge">FREE DELIVERY</div>
            <div className="promo-title">Zero Delivery Fee</div>
            <p className="promo-desc">On all orders above ₹299</p>
            <div className="promo-coupon">Applied Automatically</div>
          </div>

          <div className="promo-banner promo-fast">
            <div className="promo-badge">EXPRESS</div>
            <div className="promo-title">30 Mins Delivery</div>
            <p className="promo-desc">Freshly prepared & hot packed</p>
            <div className="promo-coupon">Live GPS Tracking</div>
          </div>
        </section>

        {/* Categories Section with Circular Icons */}
        <section className="categories-block">
          <div className="block-header">
            <h2 className="block-title">Inspiration for your order</h2>
            <span className="block-subtitle">Explore popular cuisines</span>
          </div>

          <div className="categories-carousel">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`category-item-btn ${
                  selectedCategory === cat.id ? "selected" : ""
                }`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                <div className="category-circle-icon">
                  <span>{cat.icon}</span>
                </div>
                <span className="category-label-text">{cat.name}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Restaurants Section */}
        <section className="restaurants-block">
          <div className="block-header filter-header">
            <div>
              <h2 className="block-title">Top Restaurants in Ghatampur</h2>
              <span className="block-subtitle">
                {loading
                  ? "Loading restaurants from backend..."
                  : error
                  ? "Unable to connect to server"
                  : safeRestaurants.length === 0
                  ? "No restaurants currently available"
                  : `${filteredRestaurants.length} restaurant${filteredRestaurants.length === 1 ? "" : "s"} available`}
              </span>
            </div>

            <div className="filter-chips-row">
              <button
                type="button"
                className={`filter-pill ${filterRating4Plus ? "active" : ""}`}
                onClick={() => setFilterRating4Plus(!filterRating4Plus)}
              >
                ⭐ Rating 4.4+
              </button>

              {(search || selectedCategory !== "All" || filterRating4Plus) && (
                <button
                  type="button"
                  className="filter-reset-pill"
                  onClick={() => {
                    setSearch("");
                    setSelectedCategory("All");
                    setFilterRating4Plus(false);
                  }}
                >
                  Clear All
                </button>
              )}
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <div style={{ fontSize: "32px", marginBottom: "12px", animation: "spin 1s linear infinite" }}>🔄</div>
              <p style={{ color: "var(--text-secondary)", fontWeight: "600" }}>Connecting to backend & fetching restaurants...</p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#991b1b",
              borderRadius: "16px",
              padding: "24px",
              textAlign: "center",
              margin: "20px 0"
            }}>
              <div style={{ fontSize: "28px", marginBottom: "8px" }}>⚠️</div>
              <h3 style={{ margin: "0 0 6px 0", color: "#b91c1c" }}>Unable to Connect to Backend</h3>
              <p style={{ margin: "0 0 16px 0", fontSize: "14px" }}>{error}</p>
              <button
                type="button"
                onClick={fetchRestaurants}
                style={{
                  background: "#e23744",
                  color: "#ffffff",
                  border: "none",
                  padding: "8px 20px",
                  borderRadius: "8px",
                  fontWeight: "700",
                  cursor: "pointer"
                }}
              >
                🔄 Retry Connection
              </button>
            </div>
          )}

          {/* Data State / Filtered Results / Empty Database State */}
          {!loading && !error && (
            safeRestaurants.length > 0 ? (
              filteredRestaurants.length > 0 ? (
                <div className="restaurants-grid">
                  {filteredRestaurants.map((restaurant) => (
                    <RestaurantCard
                      key={restaurant.id}
                      id={restaurant.id}
                      name={restaurant.name}
                      rating={restaurant.rating}
                      time={restaurant.delivery_time || restaurant.time || "25-35 min"}
                      cuisine={restaurant.cuisine}
                    />
                  ))}
                </div>
              ) : (
                <div className="empty-restaurants-view">
                  <span className="empty-plate-icon">🔍</span>
                  <h3>No restaurants match your filters</h3>
                  <p>Try resetting your search query or cuisine selection.</p>
                  <button
                    type="button"
                    className="reset-action-btn"
                    onClick={() => {
                      setSearch("");
                      setSelectedCategory("All");
                      setFilterRating4Plus(false);
                    }}
                  >
                    Show All Restaurants
                  </button>
                </div>
              )
            ) : (
              <div className="empty-restaurants-view">
                <span className="empty-plate-icon">🍽️</span>
                <h3>No restaurants found in database</h3>
                <p>The backend database appears to be unseeded or empty.</p>
                <button
                  type="button"
                  className="reset-action-btn"
                  onClick={fetchRestaurants}
                >
                  🔄 Refresh Restaurants
                </button>
              </div>
            )
          )}
        </section>
      </main>
    </div>
  );
}

export default Home;