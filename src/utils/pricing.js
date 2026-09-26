/**
 * Unified Pricing & Coupon Utility for Ghatampur Food application.
 * Serves as the single source of truth for frontend price calculations.
 */

export const VALID_COUPONS = {
  GHATAMPUR20: {
    code: "GHATAMPUR20",
    minOrder: 149,
    discountPercent: 20,
    description: "20% OFF on orders above ₹149",
  },
};

/**
 * Calculates item subtotal, delivery fee, coupon discount, and grand total.
 * 
 * @param {Array} cart - Array of cart items [{ price, quantity }, ...]
 * @param {string} couponCode - Applied coupon code string
 * @returns {Object} Calculated pricing breakdown
 */
export function calculateOrderTotals(cart = [], couponCode = "") {
  const subtotal = cart.reduce(
    (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1),
    0
  );

  // Free delivery on orders ₹299 and above, otherwise ₹40
  const deliveryFee = subtotal > 0 ? (subtotal >= 299 ? 0 : 40) : 0;

  const normalizedCode = (couponCode || "").trim().toUpperCase();
  const couponConfig = VALID_COUPONS[normalizedCode];

  let isValidCoupon = false;
  let couponError = "";

  if (normalizedCode) {
    if (!couponConfig) {
      couponError = "Invalid coupon code. Use GHATAMPUR20 for 20% OFF.";
    } else if (subtotal < couponConfig.minOrder) {
      couponError = `Coupon ${couponConfig.code} requires a minimum order of ₹${couponConfig.minOrder}.`;
    } else {
      isValidCoupon = true;
    }
  }

  const discount = isValidCoupon
    ? Math.round(subtotal * (couponConfig.discountPercent / 100))
    : 0;

  const grandTotal = Math.max(0, subtotal + deliveryFee - discount);

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    deliveryFee,
    discount,
    grandTotal: Math.round(grandTotal * 100) / 100,
    isValidCoupon,
    couponCode: isValidCoupon ? normalizedCode : "",
    couponError,
  };
}
