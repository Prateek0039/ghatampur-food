from sqlalchemy.orm import Session
from app.models import Restaurant, MenuItem, User
from app.security import hash_password

DUMMY_RESTAURANTS_DATA = [
  {
    "name": "Sharma Restaurant",
    "rating": "4.3",
    "ratings_count": "500+ ratings",
    "cuisine": "North Indian • Fast Food",
    "delivery_time": "30-40 min",
    "cost_for_two": "₹250 for two",
    "outlet": "Ghatampur Market",
    "menu": [
      {
        "name": "Paneer Butter Masala",
        "price": 180.0,
        "category": "North Indian",
        "description": "Rich cottage cheese in a buttery tomato gravy.",
        "is_veg": True
      },
      {
        "name": "Chole Bhature",
        "price": 120.0,
        "category": "North Indian",
        "description": "Spiced chickpeas served with two fluffy bhature.",
        "is_veg": True
      },
      {
        "name": "Veg Biryani",
        "price": 150.0,
        "category": "Biryani",
        "description": "Aromatic basmati rice cooked with fresh seasonal vegetables.",
        "is_veg": True
      }
    ]
  },
  {
    "name": "Gupta Food Corner",
    "rating": "4.1",
    "ratings_count": "350+ ratings",
    "cuisine": "Chinese • Snacks",
    "delivery_time": "25-35 min",
    "cost_for_two": "₹200 for two",
    "outlet": "Station Road",
    "menu": [
      {
        "name": "Veg Noodles",
        "price": 100.0,
        "category": "Chinese",
        "description": "Wok-tossed noodles with crunchy vegetables and soya.",
        "is_veg": True
      },
      {
        "name": "Veg Manchurian",
        "price": 120.0,
        "category": "Chinese",
        "description": "Crispy vegetable balls tossed in spicy garlic Manchurian sauce.",
        "is_veg": True
      },
      {
        "name": "Spring Roll",
        "price": 80.0,
        "category": "Snacks",
        "description": "Crispy rolls stuffed with spiced vegetables.",
        "is_veg": True
      }
    ]
  },
  {
    "name": "Ghatampur Bites",
    "rating": "4.5",
    "ratings_count": "800+ ratings",
    "cuisine": "Pizza • Burgers",
    "delivery_time": "20-30 min",
    "cost_for_two": "₹300 for two",
    "outlet": "Civil Lines",
    "menu": [
      {
        "name": "Veg Burger",
        "price": 90.0,
        "category": "Burger",
        "description": "Crispy potato patty with fresh lettuce, mayo and toasted buns.",
        "is_veg": True
      },
      {
        "name": "Margherita Pizza",
        "price": 180.0,
        "category": "Pizza",
        "description": "Classic cheese pizza topped with 100% mozzarella and basil.",
        "is_veg": True
      },
      {
        "name": "French Fries",
        "price": 80.0,
        "category": "Snacks",
        "description": "Golden salted potato fries served with dip.",
        "is_veg": True
      }
    ]
  },
  {
    "name": "Prateek's Kitchen",
    "rating": "4.6",
    "ratings_count": "1.2k+ ratings",
    "cuisine": "Indian • Street Food",
    "delivery_time": "15-25 min",
    "cost_for_two": "₹180 for two",
    "outlet": "Main Chowk",
    "menu": [
      {
        "name": "Aloo Tikki",
        "price": 60.0,
        "category": "Street Food",
        "description": "Crisp potato patties garnished with sweet chutney and curd.",
        "is_veg": True
      },
      {
        "name": "Pav Bhaji",
        "price": 100.0,
        "category": "Street Food",
        "description": "Spicy mashed vegetable curry served with butter-toasted pav.",
        "is_veg": True
      },
      {
        "name": "Masala Maggi",
        "price": 70.0,
        "category": "Snacks",
        "description": "Street style spicy Maggi with onions, tomatoes and peas.",
        "is_veg": True
      }
    ]
  }
]

def seed_database(db: Session):
    """
    Seeds the database with initial restaurants, menu items, and a demo user
    if the restaurants table is currently empty.
    """
    existing_count = db.query(Restaurant).count()
    if existing_count > 0:
        return  # Database already seeded

    print("[SEED] Seeding initial restaurant and menu data...")

    try:
        # Check if demo user already exists before adding
        existing_user = db.query(User).filter(User.email == "rahul@example.com").first()
        if not existing_user:
            demo_user = User(
                name="Rahul Sharma",
                email="rahul@example.com",
                hashed_password=hash_password("password123"),
                phone="9876543210",
                address="House 42, Civil Lines, Ghatampur"
            )
            db.add(demo_user)
            db.flush()

        # Seed restaurants and menu items
        for r_data in DUMMY_RESTAURANTS_DATA:
            menu_items_data = r_data["menu"]
            restaurant = Restaurant(
                name=r_data["name"],
                rating=r_data["rating"],
                ratings_count=r_data["ratings_count"],
                cuisine=r_data["cuisine"],
                delivery_time=r_data["delivery_time"],
                cost_for_two=r_data["cost_for_two"],
                outlet=r_data["outlet"],
                is_active=True
            )
            db.add(restaurant)
            db.flush()  # Populates restaurant.id for foreign key

            for item_data in menu_items_data:
                menu_item = MenuItem(
                    restaurant_id=restaurant.id,
                    name=item_data["name"],
                    price=item_data["price"],
                    category=item_data["category"],
                    description=item_data.get("description"),
                    is_veg=item_data.get("is_veg", True),
                    is_available=True
                )
                db.add(menu_item)

        db.commit()
        print("[SEED] Database seeding completed successfully!")
    except Exception as e:
        db.rollback()
        print(f"[SEED ERROR] Failed to seed database: {e}")
        raise e

