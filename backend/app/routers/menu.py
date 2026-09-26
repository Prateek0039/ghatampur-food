from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Restaurant, MenuItem
from app.schemas import MenuItemOut
from app.seed import seed_database

router = APIRouter(tags=["Menu"])


@router.get("/api/restaurants/{restaurant_id}/menu", response_model=List[MenuItemOut], summary="Get menu items for a restaurant")
def get_restaurant_menu(restaurant_id: int, db: Session = Depends(get_db)):
    """
    Retrieve all available menu items for a specific restaurant.
    """
    if db.query(Restaurant).count() == 0:
        seed_database(db)

    restaurant = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if not restaurant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Restaurant with ID {restaurant_id} not found"
        )

    items = db.query(MenuItem).filter(
        MenuItem.restaurant_id == restaurant_id,
        MenuItem.is_available != False
    ).all()

    return items


@router.get("/api/menu-items/{item_id}", response_model=MenuItemOut, summary="Get individual menu item by ID")
def get_menu_item_by_id(item_id: int, db: Session = Depends(get_db)):
    """
    Retrieve details of an individual menu item by its ID.
    """
    item = db.query(MenuItem).filter(MenuItem.id == item_id).first()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Menu item with ID {item_id} not found"
        )

    return item
