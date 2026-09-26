import { Link } from "react-router-dom";
import "./RestaurantCard.css";

function RestaurantCard({ id, name, rating, time, cuisine = "" }) {
  const getCuisineIcon = (c = "") => {
    const safeC = (c || "").toLowerCase();
    if (safeC.includes("pizza")) return "🍕";
    if (safeC.includes("chinese")) return "🍜";
    if (safeC.includes("north indian") || safeC.includes("indian")) return "🍛";
    return "🥘";
  };

  return (
    <Link to={`/restaurant/${id}`} className="restaurant-card-link">
      <div className="restaurant-card">
        <div className="restaurant-image-container">
          <span className="card-emoji-visual">{getCuisineIcon(cuisine)}</span>
          <div className="discount-overlay-tag">FLAT 20% OFF</div>
          <div className="delivery-time-pill">🕐 {time || "25-35 min"}</div>
        </div>

        <div className="restaurant-card-body">
          <div className="card-title-row">
            <h3 className="restaurant-name">{name}</h3>
            <span className="rating-pill">★ {rating || "4.0"}</span>
          </div>

          <p className="cuisine-line">{cuisine || "Multi-Cuisine"}</p>

          <div className="card-meta-footer">
            <span className="price-tag">₹200 for two</span>
            <span className="view-menu-link">View Menu →</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default RestaurantCard;