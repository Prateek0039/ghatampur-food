from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Restaurant
from app.schemas import RestaurantOut, RestaurantDetailOut
from app.seed import seed_database

router = APIRouter(prefix="/api/restaurants", tags=["Restaurants"])


@router.get("", response_model=List[RestaurantOut], summary="Get all restaurants")
def get_all_restaurants(
    search: Optional[str] = Query(None, description="Search by restaurant name or cuisine"),
    db: Session = Depends(get_db)
):
    """
    Retrieve all active restaurants with optional search filtering.
    Automatically initializes & seeds the database with dummy restaurants if empty.
    """
    # Ensure database is seeded if empty
    if db.query(Restaurant).count() == 0:
        seed_database(db)

    query = db.query(Restaurant).filter(Restaurant.is_active != False)
    if search:
        search_term = f"%{search.strip().lower()}%"
        query = query.filter(
            (Restaurant.name.ilike(search_term)) | (Restaurant.cuisine.ilike(search_term))
        )
    return query.all()


@router.get("/{restaurant_id}", response_model=RestaurantDetailOut, summary="Get restaurant by ID")
def get_restaurant_by_id(restaurant_id: int, db: Session = Depends(get_db)):
    """
    Retrieve single restaurant details along with its full menu items.
    """
    if db.query(Restaurant).count() == 0:
        seed_database(db)

    restaurant = db.query(Restaurant).filter(
        Restaurant.id == restaurant_id,
        Restaurant.is_active != False
    ).first()

    if not restaurant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Restaurant with ID {restaurant_id} not found"
        )

    return restaurant
