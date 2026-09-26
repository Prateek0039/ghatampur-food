# 🍔 Ghatampur Food - FastAPI Backend

A clean, beginner-friendly REST backend built using **Python 3**, **FastAPI**, **SQLite**, **SQLAlchemy**, and **Uvicorn**.

---

## 📁 Backend Directory Structure

```text
backend/
├── app/
│   ├── __init__.py
│   ├── config.py              # Loads settings from .env (Database URL, CORS, Port)
│   ├── database.py            # SQLite engine, SessionLocal, and DB init
│   ├── models.py              # SQLAlchemy ORM models (User, Restaurant, MenuItem, Order, OrderItem)
│   ├── schemas.py             # Pydantic schemas for request validation and response serialization
│   ├── security.py            # Salted PBKDF2-SHA256 password hashing & verification
│   ├── seed.py                # Populates database with dummy data matching React frontend
│   └── routers/
│       ├── __init__.py
│       ├── restaurants.py     # Endpoints for restaurant listing & details
│       ├── menu.py            # Endpoints for restaurant menu & individual dishes
│       └── orders.py          # Endpoints for creating orders, status updates, and lookups
├── .env                       # Active environment variables
├── .env.example               # Template environment configuration
├── main.py                    # FastAPI app, CORS middleware, lifespan setup, and server entry
├── requirements.txt           # Minimal, lightweight dependencies
└── README.md                  # Complete documentation and API testing guide
```

---

## 🗄️ Database Tables & Relationships

The backend uses **SQLite** (`food_delivery.db`). The database file is created automatically on server startup.

### Entity Relationships
- **User → many Orders**: A user can place multiple food orders.
- **Restaurant → many MenuItems**: Each restaurant offers a list of dishes.
- **Order → many OrderItems**: An order contains one or more ordered dishes with quantities.
- **MenuItem → many OrderItems**: A dish can appear across multiple order line items.

### Table Schema Summary

1. **`users`**
   - `id` (Integer, Primary Key)
   - `name` (String)
   - `email` (String, Unique)
   - `hashed_password` (String, salted PBKDF2-SHA256 hash — **passwords are never stored as plain text**)
   - `phone` (String)
   - `address` (String)
   - `created_at` (DateTime)

2. **`restaurants`**
   - `id` (Integer, Primary Key)
   - `name` (String, e.g. "Sharma Restaurant")
   - `rating` (String, e.g. "4.3")
   - `ratings_count` (String, e.g. "500+ ratings")
   - `cuisine` (String, e.g. "North Indian • Fast Food")
   - `delivery_time` (String, e.g. "30-40 min")
   - `cost_for_two` (String, e.g. "₹250 for two")
   - `outlet` (String, e.g. "Ghatampur Market")
   - `is_active` (Boolean)

3. **`menu_items`**
   - `id` (Integer, Primary Key)
   - `restaurant_id` (Integer, Foreign Key to `restaurants.id`)
   - `name` (String, e.g. "Paneer Butter Masala")
   - `price` (Float)
   - `category` (String, e.g. "North Indian")
   - `description` (String)
   - `is_veg` (Boolean)
   - `is_available` (Boolean)

4. **`orders`**
   - `id` (Integer, Primary Key)
   - `order_number` (String, Unique, e.g. "ORD184920")
   - `user_id` (Integer, Foreign Key to `users.id`, Nullable for guest checkout)
   - `customer_name` (String)
   - `customer_phone` (String)
   - `delivery_address` (String)
   - `instructions` (String)
   - `subtotal` (Float)
   - `delivery_fee` (Float)
   - `total` (Float)
   - `status` (String: *Placed*, *Accepted*, *Preparing*, *Out for Delivery*, *Delivered*, *Cancelled*)
   - `created_at` (DateTime)

5. **`order_items`**
   - `id` (Integer, Primary Key)
   - `order_id` (Integer, Foreign Key to `orders.id`)
   - `menu_item_id` (Integer, Foreign Key to `menu_items.id`, Nullable)
   - `item_name` (String)
   - `price` (Float)
   - `quantity` (Integer)

---

## 📦 How to Install Dependencies

Open your terminal, navigate to the `backend` folder:

```powershell
cd backend
```

### Option A: Direct Installation
```powershell
pip install -r requirements.txt
```

### Option B: Using a Virtual Environment (Recommended)
```powershell
# 1. Create a virtual environment
python -m venv venv

# 2. Activate it (Windows PowerShell)
venv\Scripts\Activate.ps1
# (or in Windows CMD: venv\Scripts\activate.bat)

# 3. Install packages
pip install -r requirements.txt
```

---

## ▶️ How to Start the Server

From inside the `backend` folder, run:

```powershell
python main.py
```

*Alternatively, run with Uvicorn directly:*
```powershell
uvicorn main:app --reload --port 8000
```

When started:
- 🌐 **Backend API:** `http://localhost:8000`
- 📑 **Interactive Swagger UI:** `http://localhost:8000/docs`
- 📖 **Alternative Redoc:** `http://localhost:8000/redoc`
- 💚 **Health Check:** `http://localhost:8000/api/health`

---

## 🧪 How to Test Each API

You can test all APIs visually by opening **`http://localhost:8000/docs`** in your browser, or using PowerShell / curl:

### 1. Health Check
```powershell
Invoke-RestMethod -Uri "http://localhost:8000/api/health" -Method GET
```

### 2. User Authentication (Signup & Login)
```powershell
# Signup
$signupBody = @{
    name = "Priya Sharma"
    email = "priya@example.com"
    phone = "9876543299"
    password = "secretpassword"
    address = "Civil Lines, Ghatampur"
} | ConvertTo-Json

$signupRes = Invoke-RestMethod -Uri "http://localhost:8000/api/auth/signup" -Method POST -Body $signupBody -ContentType "application/json"
$token = $signupRes.token

# Login
$loginBody = @{
    identifier = "priya@example.com"
    password = "secretpassword"
} | ConvertTo-Json

$loginRes = Invoke-RestMethod -Uri "http://localhost:8000/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
$token = $loginRes.token

# Get Current Authenticated Profile
Invoke-RestMethod -Uri "http://localhost:8000/api/auth/me" -Method GET -Headers @{ Authorization = "Bearer $token" }
```

### 2. Get All Restaurants
```powershell
# PowerShell
Invoke-RestMethod -Uri "http://localhost:8000/api/restaurants" -Method GET

# Search for specific cuisine or name
Invoke-RestMethod -Uri "http://localhost:8000/api/restaurants?search=pizza" -Method GET
```

### 3. Get Restaurant by ID (with full menu)
```powershell
# PowerShell
Invoke-RestMethod -Uri "http://localhost:8000/api/restaurants/1" -Method GET
```

### 4. Get Menu Items for a Restaurant
```powershell
# PowerShell
Invoke-RestMethod -Uri "http://localhost:8000/api/restaurants/1/menu" -Method GET
```

### 5. Get an Individual Menu Item
```powershell
# PowerShell
Invoke-RestMethod -Uri "http://localhost:8000/api/menu-items/1" -Method GET
```

### 6. Create a New Order
```powershell
# PowerShell
$body = @{
    customer_name = "Rahul Sharma"
    customer_phone = "9876543210"
    delivery_address = "House 42, Civil Lines, Ghatampur"
    instructions = "Ring the doorbell"
    subtotal = 300.0
    delivery_fee = 0.0
    total = 300.0
    items = @(
        @{
            menu_item_id = 1
            item_name = "Paneer Butter Masala"
            price = 180.0
            quantity = 1
        },
        @{
            menu_item_id = 2
            item_name = "Chole Bhature"
            price = 120.0
            quantity = 1
        }
    )
    user_id = 1
} | ConvertTo-Json -Depth 5

Invoke-RestMethod -Uri "http://localhost:8000/api/orders" -Method POST -Body $body -ContentType "application/json"
```

### 7. Get Order by ID or Order Number
```powershell
# By numeric ID:
Invoke-RestMethod -Uri "http://localhost:8000/api/orders/1" -Method GET

# By order number (e.g. ORD123456):
Invoke-RestMethod -Uri "http://localhost:8000/api/orders/ORD123456" -Method GET
```

### 8. Get Orders for a User
```powershell
# Via dedicated user endpoint:
Invoke-RestMethod -Uri "http://localhost:8000/api/users/1/orders" -Method GET

# Or via query parameter:
Invoke-RestMethod -Uri "http://localhost:8000/api/orders?user_id=1" -Method GET
```

### 9. Update Order Status
```powershell
# PowerShell (Allowed: Placed, Accepted, Preparing, Out for Delivery, Delivered, Cancelled)
$statusBody = @{
    status = "Out for Delivery"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/api/orders/1/status" -Method PATCH -Body $statusBody -ContentType "application/json"
```

---

## 📋 Full End-to-End Testing Checklist

Follow this complete checklist to test the application from start to finish:

1. **Start the FastAPI Backend**:
   ```powershell
   cd backend
   python main.py
   ```
   *(Confirm: `[START] Ghatampur Food API started successfully!` on port 8000)*

2. **Start the Vite Frontend**:
   ```powershell
   cd ..
   npm run dev
   ```
   *(Open `http://localhost:5173` in your browser)*

3. **Step 1: Sign Up**:
   - Click **🔑 Log In / Sign Up** in the top navbar.
   - Switch to the **Sign Up** tab.
   - Enter Name, Email, 10-digit Phone, Password, and Confirm Password.
   - Click **Create Account →**.
   - **Expected**: Modal closes, navbar updates to show `👤 <YourName>` and a **Logout** button.

4. **Step 2: Log Out & Log In Again**:
   - Click **Logout** in the navbar.
   - **Expected**: Navbar reverts to `🔑 Log In / Sign Up`.
   - Click **Log In / Sign Up**, enter your registered email/phone and password, click **Log In →**.
   - **Expected**: Logged in successfully; navbar displays your name.

5. **Step 3: Browse Restaurants**:
   - On the Home page, verify restaurants (*Sharma Restaurant*, *Gupta Food Corner*, etc.) are fetched dynamically from FastAPI.
   - Test the search bar (e.g. type `Pizza` or `Chinese`) and filter chips (`⭐ Rating 4.4+`).

6. **Step 4: View Restaurant Menu & Add to Cart**:
   - Click any restaurant card (e.g., *Sharma Restaurant*).
   - Verify category filters work and dishes are loaded with prices.
   - Click **ADD +** on dishes (e.g. *Paneer Butter Masala* and *Chole Bhature*).
   - **Expected**: Floating cart bar appears at bottom showing items count and subtotal.

7. **Step 5: Checkout**:
   - Click **View Cart** or **Cart** in the navbar.
   - Review cart items, then click **PROCEED TO CHECKOUT →**.
   - On the Checkout page, notice your Name, Phone, and Address are automatically pre-filled from your profile!
   - Enter or edit delivery address and click **🔒 PLACE ORDER**.

8. **Step 6: Order Confirmation & Server-Side Price Verification**:
   - The backend validates the order, verifies prices against SQLite, calculates totals, and creates the order.
   - **Expected**: Redirected to `/order-confirmation/ORDxxxxxx` displaying the unique Order ID, customer details, and ordered items.

9. **Step 7: Track Order Live**:
   - Click **📍 Track Order Status Live**.
   - Click any stage on the timeline (*Order Confirmed*, *Chef is Cooking*, *Out for Delivery*, *Delivered*).
   - **Expected**: Status updates in SQLite database!

10. **Step 8: View Order History**:
    - Click **Orders** in the navbar.
    - **Expected**: Displays your placed order with Order ID, items, date, total, and live status badge.
    - Click **Logout** and visit `/orders`. Notice the prompt: *"Please Log In to View Orders"*.
    - Log in again and verify your orders reappear!

