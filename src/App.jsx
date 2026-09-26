import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import RestaurantPage from "./pages/RestaurantPage";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import OrderTracking from "./pages/OrderTracking";
import OrderHistory from "./pages/OrderHistory";
import Profile from "./pages/Profile";
import AuthModal from "./pages/AuthModal";
import { orderAPI } from "./services/api";

function App() {
  // Cart state persisted in localStorage
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem("ghatampur_cart");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("ghatampur_cart", JSON.stringify(cart));
    } catch (e) {
      console.error("Failed to save cart to localStorage:", e);
    }
  }, [cart]);

  // Applied coupon code (shared across Cart + Checkout, persisted like the cart)
  const [couponCode, setCouponCode] = useState(() => {
    try {
      return localStorage.getItem("ghatampur_coupon") || "";
    } catch {
      return "";
    }
  });

  useEffect(() => {
    try {
      if (couponCode) {
        localStorage.setItem("ghatampur_coupon", couponCode);
      } else {
        localStorage.removeItem("ghatampur_coupon");
      }
    } catch (e) {
      console.error("Failed to save coupon to localStorage:", e);
    }
  }, [couponCode]);

  // Authentication State
  const [auth, setAuth] = useState(() => {
    try {
      const saved = localStorage.getItem("ghatampur_auth");
      return saved ? JSON.parse(saved) : { user: null, token: null };
    } catch {
      return { user: null, token: null };
    }
  });

  const user = auth.user;
  const token = auth.token;
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const handleAuthSuccess = (authResponse) => {
    const newAuth = { user: authResponse.user, token: authResponse.token };
    setAuth(newAuth);
    try {
      localStorage.setItem("ghatampur_auth", JSON.stringify(newAuth));
    } catch (e) {
      console.error("Failed to save auth to localStorage:", e);
    }
  };

  const handleLogout = () => {
    setAuth({ user: null, token: null });
    setOrders([]);
    try {
      localStorage.removeItem("ghatampur_auth");
      localStorage.removeItem("ghatampur_orders");
    } catch (e) {
      console.error("Failed to clear auth from localStorage:", e);
    }
  };

  // Orders cache in state
  const [orders, setOrders] = useState(() => {
    try {
      const savedOrders = localStorage.getItem("ghatampur_orders");
      return savedOrders ? JSON.parse(savedOrders) : [];
    } catch {
      return [];
    }
  });

  // Keep localStorage synchronized whenever local orders change
  useEffect(() => {
    try {
      localStorage.setItem("ghatampur_orders", JSON.stringify(orders));
    } catch (e) {
      console.error("Failed to save orders to localStorage:", e);
    }
  }, [orders]);

  // Sync orders count for logged-in user
  useEffect(() => {
    if (user && user.id && token) {
      orderAPI
        .getUserOrders(user.id, token)
        .then((userOrders) => {
          if (Array.isArray(userOrders)) {
            setOrders(userOrders);
          }
        })
        .catch((err) => {
          console.warn("Could not sync user orders count:", err);
        });
    } else if (!user) {
      setOrders([]);
    }
  }, [user?.id, token]);

  // Cart operations
  const addToCart = (item) => {
    setCart((previousCart) => {
      const existingIndex = previousCart.findIndex(
        (i) => (item.id && i.id === item.id) || i.name === item.name
      );
      if (existingIndex > -1) {
        return previousCart.map((i, idx) =>
          idx === existingIndex ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...previousCart, { ...item, quantity: 1 }];
    });
  };

  const increaseQuantity = (itemName) => {
    setCart((previousCart) =>
      previousCart.map((item) =>
        item.name === itemName ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  };

  const decreaseQuantity = (itemName) => {
    setCart((previousCart) =>
      previousCart.map((item) =>
        item.name === itemName
          ? { ...item, quantity: Math.max(1, item.quantity - 1) }
          : item
      )
    );
  };

  const removeFromCart = (itemName) => {
    setCart((previousCart) =>
      previousCart.filter((item) => item.name !== itemName)
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  // Place order callback from Checkout component
  const handlePlaceOrder = (createdOrder) => {
    setOrders((prevOrders) => [createdOrder, ...prevOrders]);
    clearCart();
    // Coupon is consumed once the order is placed
    setCouponCode("");
    return createdOrder.order_number || createdOrder.id;
  };

  // Order cancelled callback
  const handleOrderCancelled = (cancelledOrder) => {
    setOrders((prevOrders) =>
      prevOrders.map((o) =>
        (o.id === cancelledOrder.id || o.order_number === cancelledOrder.order_number)
          ? { ...o, status: "Cancelled" }
          : o
      )
    );
  };

  // Dynamic cart count (sum of all quantities)
  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <BrowserRouter>
      <div className="app">
        <Navbar
          cartCount={totalCartCount}
          ordersCount={orders.length}
          user={user}
          onLogout={handleLogout}
          onOpenAuth={() => setIsAuthModalOpen(true)}
        />

        <Routes>
          <Route path="/" element={<Home />} />

          <Route
            path="/restaurant/:id"
            element={
              <RestaurantPage
                cart={cart}
                onAddToCart={addToCart}
                setCart={setCart}
              />
            }
          />

          <Route
            path="/cart"
            element={
              <Cart
                cart={cart}
                onIncrease={increaseQuantity}
                onDecrease={decreaseQuantity}
                onRemove={removeFromCart}
                couponCode={couponCode}
                onApplyCoupon={setCouponCode}
              />
            }
          />

          <Route
            path="/checkout"
            element={
              <Checkout
                cart={cart}
                onPlaceOrder={handlePlaceOrder}
                user={user}
                token={token}
                couponCode={couponCode}
                onOpenAuth={() => setIsAuthModalOpen(true)}
              />
            }
          />

          <Route
            path="/order-confirmation/:orderId"
            element={
              <OrderConfirmation
                orders={orders}
                token={token}
                user={user}
                onOrderCancelled={handleOrderCancelled}
              />
            }
          />

          <Route
            path="/track-order/:orderId"
            element={
              <OrderTracking
                orders={orders}
                token={token}
                user={user}
                onOrderCancelled={handleOrderCancelled}
              />
            }
          />

          <Route
            path="/orders"
            element={
              <OrderHistory
                user={user}
                token={token}
                onOpenAuth={() => setIsAuthModalOpen(true)}
                orders={orders}
                onOrderCancelled={handleOrderCancelled}
              />
            }
          />

          <Route
            path="/profile"
            element={
              <Profile
                user={user}
                onLogout={handleLogout}
                onOpenAuth={() => setIsAuthModalOpen(true)}
              />
            }
          />
        </Routes>

        {/* Global Authentication Modal */}
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onAuthSuccess={handleAuthSuccess}
        />
      </div>
    </BrowserRouter>
  );
}

export default App;