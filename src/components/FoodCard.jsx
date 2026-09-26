import { useState } from "react";
import "./FoodCard.css";

function FoodCard({ name, price, category, onAddToCart }) {
  const [justAdded, setJustAdded] = useState(false);

  const getFoodIcon = (cat, itemName) => {
    const text = `${cat} ${itemName}`.toLowerCase();
    if (text.includes("pizza")) return "🍕";
    if (text.includes("burger")) return "🍔";
    if (text.includes("biryani") || text.includes("rice")) return "🍚";
    if (text.includes("noodle") || text.includes("chinese") || text.includes("manchurian"))
      return "🍜";
    if (text.includes("fries") || text.includes("roll")) return "🍟";
    if (text.includes("tikki") || text.includes("bhaji") || text.includes("street"))
      return "🥟";
    if (text.includes("paneer") || text.includes("chole") || text.includes("indian"))
      return "🍛";
    return "🍽️";
  };

  const handleAddClick = () => {
    onAddToCart();
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 800);
  };

  return (
    <div className="modern-food-card">
      <div className="food-text-side">
        <div className="veg-badge-container">
          <div className="veg-icon-outer">
            <div className="veg-icon-inner"></div>
          </div>
          <span className="food-category-pill">{category}</span>
        </div>

        <h3 className="food-title">{name}</h3>
        <div className="food-price-tag">₹{price}</div>
        <p className="food-description">
          Freshly made with authentic ingredients and traditional spices.
        </p>
      </div>

      <div className="food-media-side">
        <div className="food-thumb-box">
          <span className="food-thumb-emoji">{getFoodIcon(category, name)}</span>
        </div>

        <button
          type="button"
          className={`add-action-btn ${justAdded ? "added-success" : ""}`}
          onClick={handleAddClick}
          aria-label={`Add ${name} to cart`}
        >
          {justAdded ? "ADDED ✓" : "ADD +"}
        </button>
      </div>
    </div>
  );
}

export default FoodCard;