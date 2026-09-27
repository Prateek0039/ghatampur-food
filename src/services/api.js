/**
 * Centralized API Service for Ghatampur Food application.
 * Uses native Fetch API without external dependencies.
 */

let apiBaseUrl = "https://ghatampur-food-api.onrender.com";

/**
 * Generic request helper with automatic JSON parsing, dual-stack loopback retry,
 * and clear error messages.
 */
async function request(endpoint, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  let response;
  try {
    response = await fetch(`${apiBaseUrl}${endpoint}`, {
      ...options,
      headers,
    });
  } catch (initialErr) {
    // Retry with alternate loopback if connection fails
    const alternateUrl = apiBaseUrl.includes("127.0.0.1")
      ? apiBaseUrl.replace("127.0.0.1", "localhost")
      : apiBaseUrl.includes("localhost")
      ? apiBaseUrl.replace("localhost", "127.0.0.1")
      : "";

    let succeeded = false;
    if (alternateUrl) {
      try {
        response = await fetch(`${alternateUrl}${endpoint}`, {
          ...options,
          headers,
        });
        apiBaseUrl = alternateUrl;
        succeeded = true;
      } catch {
        // Next, try relative path via Vite dev proxy
        try {
          response = await fetch(endpoint, {
            ...options,
            headers,
          });
          apiBaseUrl = "";
          succeeded = true;
        } catch {
          // Both failed
        }
      }
    }

    if (!succeeded) {
      throw new Error(
        "Cannot connect to FastAPI backend server at http://127.0.0.1:8000. Please start the backend server with: python main.py"
      );
    }
  }

  // Handle non-JSON or empty response
  let data = null;
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    data = await response.json();
  }

  if (!response.ok) {
    const errorDetail = data && data.detail
      ? (typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail))
      : `Request failed with status ${response.status}`;
    throw new Error(errorDetail);
  }

  return data;
}

// ---------------------------------------------------------------------------
// Authentication APIs
// ---------------------------------------------------------------------------
export const authAPI = {
  signup: async (userData) => {
    return request("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  },

  login: async (credentials) => {
    return request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  },

  getMe: async (token) => {
    return request("/api/auth/me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },
};

// ---------------------------------------------------------------------------
// Restaurant APIs
// ---------------------------------------------------------------------------
export const restaurantAPI = {
  getAll: async (search = "") => {
    const query = search ? `?search=${encodeURIComponent(search)}` : "";
    const data = await request(`/api/restaurants${query}`, { method: "GET" });
    return Array.isArray(data) ? data : [];
  },

  getById: async (id) => {
    return request(`/api/restaurants/${id}`, { method: "GET" });
  },

  getMenu: async (restaurantId) => {
    const data = await request(`/api/restaurants/${restaurantId}/menu`, { method: "GET" });
    return Array.isArray(data) ? data : [];
  },

  getMenuItem: async (itemId) => {
    return request(`/api/menu-items/${itemId}`, { method: "GET" });
  },
};

// ---------------------------------------------------------------------------
// Order APIs
// ---------------------------------------------------------------------------
export const orderAPI = {
  create: async (orderData, token = null) => {
    const headers = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    return request("/api/orders", {
      method: "POST",
      headers,
      body: JSON.stringify(orderData),
    });
  },

  getById: async (orderIdentifier) => {
    return request(`/api/orders/${orderIdentifier}`, { method: "GET" });
  },

  getUserOrders: async (userId, token = null) => {
    const headers = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    const data = await request(`/api/users/${userId}/orders`, {
      method: "GET",
      headers,
    });
    return Array.isArray(data) ? data : [];
  },

  updateStatus: async (orderIdentifier, status) => {
    return request(`/api/orders/${orderIdentifier}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },

  cancel: async (orderIdentifier, token = null) => {
    const headers = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    return request(`/api/orders/${orderIdentifier}/cancel`, {
      method: "POST",
      headers,
    });
  },
};

export default {
  auth: authAPI,
  restaurants: restaurantAPI,
  orders: orderAPI,
};
