from datetime import datetime
from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    Boolean,
    DateTime,
    ForeignKey,
    Text
)
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    """
    User model representing registered customers.
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=True)
    address = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship: User -> many Orders
    orders = relationship("Order", back_populates="user")


class Restaurant(Base):
    """
    Restaurant model representing food outlets in Ghatampur.
    """
    __tablename__ = "restaurants"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    rating = Column(String(10), default="4.0")
    ratings_count = Column(String(50), default="100+ ratings")
    cuisine = Column(String(120), nullable=False)
    delivery_time = Column(String(50), default="30-40 min")
    cost_for_two = Column(String(50), default="₹200 for two")
    outlet = Column(String(100), default="Ghatampur Central")
    is_active = Column(Boolean, default=True)

    # Relationship: Restaurant -> many MenuItems
    menu_items = relationship(
        "MenuItem",
        back_populates="restaurant",
        cascade="all, delete-orphan"
    )


class MenuItem(Base):
    """
    Menu item model representing individual dishes offered by restaurants.
    """
    __tablename__ = "menu_items"

    id = Column(Integer, primary_key=True, index=True)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"), nullable=False)
    name = Column(String(120), nullable=False)
    price = Column(Float, nullable=False)
    category = Column(String(50), nullable=False)
    description = Column(String(255), nullable=True)
    is_veg = Column(Boolean, default=True)
    is_available = Column(Boolean, default=True)

    # Relationship: MenuItem belongs to Restaurant
    restaurant = relationship("Restaurant", back_populates="menu_items")

    # Relationship: MenuItem -> many OrderItems
    order_items = relationship("OrderItem", back_populates="menu_item")


class Order(Base):
    """
    Order model representing customer orders.
    """
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String(20), unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Optional for guest checkout
    customer_name = Column(String(100), nullable=False)
    customer_phone = Column(String(20), nullable=False)
    delivery_address = Column(String(255), nullable=False)
    instructions = Column(String(255), nullable=True)
    subtotal = Column(Float, nullable=False)
    delivery_fee = Column(Float, default=0.0)
    total = Column(Float, nullable=False)
    status = Column(String(50), default="Placed")  # Placed, Accepted, Preparing, Out for Delivery, Delivered, Cancelled
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship: Order belongs to User (optional)
    user = relationship("User", back_populates="orders")

    # Relationship: Order -> many OrderItems
    items = relationship(
        "OrderItem",
        back_populates="order",
        cascade="all, delete-orphan"
    )


class OrderItem(Base):
    """
    OrderItem model representing items and quantities contained in an order.
    """
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    menu_item_id = Column(Integer, ForeignKey("menu_items.id"), nullable=True)
    item_name = Column(String(120), nullable=False)
    price = Column(Float, nullable=False)
    quantity = Column(Integer, nullable=False, default=1)

    # Relationships
    order = relationship("Order", back_populates="items")
    menu_item = relationship("MenuItem", back_populates="order_items")

