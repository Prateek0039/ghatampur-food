from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field

# ---------------------------------------------------------------------------
# User Schemas
# ---------------------------------------------------------------------------
class UserBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: str = Field(
        ...,
        pattern=r"^[\w\.-]+@[\w\.-]+\.\w+$",
        description="Valid email address"
    )
    phone: Optional[str] = Field(None, max_length=20)
    address: Optional[str] = Field(None, max_length=255)

class UserCreate(UserBase):
    password: str = Field(..., min_length=6, description="Password (min 6 characters)")

class UserRegister(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: str = Field(
        ...,
        pattern=r"^[\w\.-]+@[\w\.-]+\.\w+$",
        description="Valid email address"
    )
    phone: str = Field(
        ...,
        pattern=r"^\d{10}$",
        description="10-digit mobile number"
    )
    password: str = Field(..., min_length=6, description="Password (min 6 characters)")
    address: Optional[str] = Field(None, max_length=255)

class LoginRequest(BaseModel):
    identifier: str = Field(..., min_length=3, description="Email or 10-digit phone number")
    password: str = Field(..., min_length=1, description="Password")

class UserOut(UserBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class AuthResponse(BaseModel):
    token: str
    user: UserOut


# ---------------------------------------------------------------------------
# Menu Item Schemas
# ---------------------------------------------------------------------------
class MenuItemBase(BaseModel):
    name: str
    price: float = Field(..., gt=0)
    category: str
    description: Optional[str] = None
    is_veg: bool = True
    is_available: bool = True

class MenuItemOut(MenuItemBase):
    id: int
    restaurant_id: int

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Restaurant Schemas
# ---------------------------------------------------------------------------
class RestaurantBase(BaseModel):
    name: str
    rating: str = "4.0"
    ratings_count: str = "100+ ratings"
    cuisine: str
    delivery_time: str = "30-40 min"
    cost_for_two: str = "₹200 for two"
    outlet: str = "Ghatampur Central"
    is_active: bool = True

class RestaurantOut(RestaurantBase):
    id: int

    model_config = ConfigDict(from_attributes=True)

class RestaurantDetailOut(RestaurantOut):
    menu_items: List[MenuItemOut] = []

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Order Item Schemas
# ---------------------------------------------------------------------------
class OrderItemCreate(BaseModel):
    menu_item_id: Optional[int] = None
    item_name: Optional[str] = None
    price: Optional[float] = 0.0  # Optional: Backend recalculates price from DB!
    quantity: int = Field(1, ge=1)

class OrderItemOut(BaseModel):
    id: int
    menu_item_id: Optional[int] = None
    item_name: str
    price: float
    quantity: int

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Order Schemas
# ---------------------------------------------------------------------------
class OrderCreate(BaseModel):
    customer_name: str = Field(..., min_length=2, max_length=100)
    customer_phone: str = Field(..., min_length=10, max_length=15)
    delivery_address: str = Field(..., min_length=5, max_length=255)
    instructions: Optional[str] = Field(None, max_length=255)
    coupon_code: Optional[str] = Field(None, max_length=50)
    subtotal: Optional[float] = 0.0   # Calculated securely by backend
    delivery_fee: Optional[float] = 0.0 # Calculated securely by backend
    total: Optional[float] = 0.0       # Calculated securely by backend
    items: List[OrderItemCreate] = Field(..., min_length=1)
    user_id: Optional[int] = None

class OrderStatusUpdate(BaseModel):
    status: str = Field(
        ...,
        description="Allowed statuses: Placed, Accepted, Preparing, Out for Delivery, Delivered, Cancelled"
    )

class OrderOut(BaseModel):
    id: int
    order_number: str
    user_id: Optional[int] = None
    customer_name: str
    customer_phone: str
    delivery_address: str
    instructions: Optional[str] = None
    subtotal: float
    delivery_fee: float
    total: float
    status: str
    created_at: datetime
    items: List[OrderItemOut] = []

    model_config = ConfigDict(from_attributes=True)
