import random
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import MenuItem, Order, OrderItem, User
from app.schemas import OrderCreate, OrderOut, OrderStatusUpdate
from app.security import get_current_user, get_optional_current_user

router = APIRouter(prefix="/api/orders", tags=["Orders"])
user_orders_router = APIRouter(prefix="/api/users", tags=["Orders"])

ALLOWED_STATUSES = [
    "Placed",
    "Accepted",
    "Preparing",
    "Out for Delivery",
    "Delivered",
    "Cancelled"
]

# Supported coupon: code -> percentage discount (validated server-side)
VALID_COUPONS = {
    "GHATAMPUR20": 0.20
}

STATUS_ALIASES = {
    "order confirmed": "Accepted",
    "confirmed": "Accepted",
    "chef is cooking": "Preparing",
    "cooking": "Preparing",
    "dispatched": "Out for Delivery",
    "completed": "Delivered"
}

def generate_order_number(db: Session) -> str:
    """
    Generates a unique order number like ORD784920.
    """
    for _ in range(10):
        rand_digits = random.randint(100000, 999999)
        order_num = f"ORD{rand_digits}"
        if not db.query(Order).filter(Order.order_number == order_num).first():
            return order_num
    import time
    return f"ORD{int(time.time()) % 1000000}"


@router.post("", response_model=OrderOut, status_code=status.HTTP_201_CREATED, summary="Create a new order")
def create_order(
    order_in: OrderCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """
    Place a new food delivery order:
    - Associates order with authenticated user if logged in
    - Never trusts prices sent by frontend: recalculates totals using SQLite prices
    - Saves Order and line OrderItems
    """
    # Determine user_id from token or payload
    effective_user_id = current_user.id if current_user else order_in.user_id
    if effective_user_id:
        user = db.query(User).filter(User.id == effective_user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User with ID {effective_user_id} does not exist"
            )

    # Calculate subtotal using database prices (SECURITY: never trust client-sent prices)
    calculated_subtotal = 0.0
    verified_items = []

    for item_in in order_in.items:
        menu_item = None
        if item_in.menu_item_id:
            menu_item = db.query(MenuItem).filter(MenuItem.id == item_in.menu_item_id).first()

        if not menu_item and item_in.item_name:
            menu_item = db.query(MenuItem).filter(
                MenuItem.name.ilike(item_in.item_name.strip())
            ).first()

        if not menu_item:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Item '{item_in.item_name or item_in.menu_item_id}' not found in database menu"
            )

        db_price = float(menu_item.price)
        qty = int(item_in.quantity)
        calculated_subtotal += db_price * qty

        verified_items.append({
            "menu_item_id": menu_item.id,
            "item_name": menu_item.name,
            "price": db_price,
            "quantity": qty
        })

    # Business rule: Free delivery on orders ₹299 and above, otherwise ₹40
    calculated_delivery_fee = 0.0 if (calculated_subtotal >= 299.0 or calculated_subtotal == 0.0) else 40.0

    # Apply coupon discount (validated server-side so order.total matches the UI)
    calculated_discount = 0.0
    if order_in.coupon_code:
        coupon = order_in.coupon_code.strip().upper()
        percent = VALID_COUPONS.get(coupon)
        if not percent:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid or expired coupon code '{order_in.coupon_code}'"
            )
        calculated_discount = round(calculated_subtotal * percent)

    calculated_total = round(
        max(0.0, calculated_subtotal + calculated_delivery_fee - calculated_discount), 2
    )

    order_number = generate_order_number(db)

    db_order = Order(
        order_number=order_number,
        user_id=effective_user_id,
        customer_name=order_in.customer_name.strip(),
        customer_phone=order_in.customer_phone.strip(),
        delivery_address=order_in.delivery_address.strip(),
        instructions=order_in.instructions.strip() if order_in.instructions else None,
        subtotal=round(calculated_subtotal, 2),
        delivery_fee=calculated_delivery_fee,
        total=calculated_total,
        status="Placed"
    )
    db.add(db_order)
    db.flush()  # Generates db_order.id

    for v_item in verified_items:
        db_item = OrderItem(
            order_id=db_order.id,
            menu_item_id=v_item["menu_item_id"],
            item_name=v_item["item_name"],
            price=v_item["price"],
            quantity=v_item["quantity"]
        )
        db.add(db_item)

    db.commit()
    db.refresh(db_order)
    return db_order


@router.get("", response_model=List[OrderOut], summary="Get all orders")
def get_orders(
    user_id: Optional[int] = Query(None, description="Filter orders by user ID"),
    phone: Optional[str] = Query(None, description="Filter orders by customer phone number"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """
    Retrieve orders list ordered newest first.
    If authenticated, returns orders belonging to current user.
    If unauthenticated with a phone query, filters by phone.
    """
    query = db.query(Order).order_by(Order.created_at.desc())

    if current_user:
        query = query.filter(Order.user_id == current_user.id)
    elif user_id is not None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required to view user order history."
        )
    elif phone is not None:
        query = query.filter(Order.customer_phone == phone.strip())
    else:
        return []

    return query.all()


@user_orders_router.get("/{user_id}/orders", response_model=List[OrderOut], summary="Get orders for a user")
def get_orders_by_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieve all orders placed by a specific user by user ID.
    Enforces that users can only view their own orders.
    """
    if current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view this order history."
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found"
        )
    return db.query(Order).filter(Order.user_id == user_id).order_by(Order.created_at.desc()).all()


@router.get("/user/{user_id}", response_model=List[OrderOut], summary="Get orders for a user (alias)")
def get_orders_by_user_alias(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Alternative endpoint to retrieve all orders placed by a specific user.
    """
    return get_orders_by_user(user_id=user_id, db=db, current_user=current_user)


@router.get("/{order_identifier}", response_model=OrderOut, summary="Get order by ID or order number")
def get_order_by_identifier(order_identifier: str, db: Session = Depends(get_db)):
    """
    Retrieve an order by numeric ID or order_number (e.g. 1 or ORD123456).
    """
    order = None
    if order_identifier.isdigit():
        order = db.query(Order).filter(Order.id == int(order_identifier)).first()

    if not order:
        order = db.query(Order).filter(Order.order_number == order_identifier.upper()).first()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order '{order_identifier}' not found"
        )

    return order


@router.patch("/{order_identifier}/status", response_model=OrderOut, summary="Update order status (PATCH)")
@router.put("/{order_identifier}/status", response_model=OrderOut, summary="Update order status (PUT)", include_in_schema=False)
def update_order_status(
    order_identifier: str,
    status_update: OrderStatusUpdate,
    db: Session = Depends(get_db)
):
    """
    Update the status of an existing order.
    Allowed values: Placed, Accepted, Preparing, Out for Delivery, Delivered, Cancelled
    Supports friendly aliases like 'Order Confirmed' -> 'Accepted'.
    """
    raw_status = status_update.status.strip()
    normalized_status = STATUS_ALIASES.get(raw_status.lower(), raw_status.title())

    matching_status = next(
        (s for s in ALLOWED_STATUSES if s.lower() == normalized_status.lower()),
        None
    )
    if not matching_status:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status '{status_update.status}'. Allowed values: {', '.join(ALLOWED_STATUSES)}"
        )

    order = None
    if order_identifier.isdigit():
        order = db.query(Order).filter(Order.id == int(order_identifier)).first()

    if not order:
        order = db.query(Order).filter(Order.order_number == order_identifier.upper()).first()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order '{order_identifier}' not found"
        )

    if order.status == "Cancelled":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This order is already cancelled and its status cannot be modified."
        )

    if matching_status == "Cancelled" and order.status != "Placed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot cancel order. Orders in '{order.status}' status cannot be cancelled; only 'Placed' orders can be cancelled."
        )

    order.status = matching_status
    db.commit()
    db.refresh(order)
    return order


@router.post("/{order_identifier}/cancel", response_model=OrderOut, summary="Cancel an order")
@router.patch("/{order_identifier}/cancel", response_model=OrderOut, summary="Cancel an order (PATCH alias)", include_in_schema=False)
def cancel_order(
    order_identifier: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Cancel an order:
    - User must be authenticated
    - Order must belong to the logged-in user
    - Only orders with status 'Placed' can be cancelled
    - Returns HTTP 400 if order is already Accepted, Preparing, Out for Delivery, Delivered, or Cancelled
    """
    order = None
    if order_identifier.isdigit():
        order = db.query(Order).filter(Order.id == int(order_identifier)).first()

    if not order:
        order = db.query(Order).filter(Order.order_number == order_identifier.upper()).first()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order '{order_identifier}' not found"
        )

    # Verify user owns the order
    if order.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to cancel this order."
        )

    # Cancellation rules check
    current_status = (order.status or "").strip()
    if current_status.lower() == "cancelled":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This order has already been cancelled."
        )

    if current_status.lower() != "placed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Order cannot be cancelled because it is already '{current_status}'. Only orders in 'Placed' status can be cancelled."
        )

    order.status = "Cancelled"
    db.commit()
    db.refresh(order)
    return order
