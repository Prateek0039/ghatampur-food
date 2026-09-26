from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.schemas import AuthResponse, LoginRequest, UserOut, UserRegister
from app.security import (
    create_access_token,
    get_current_user,
    hash_password,
    verify_password
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED, summary="Register a new user")
def signup(user_in: UserRegister, db: Session = Depends(get_db)):
    """
    Register a new customer account:
    - Validates email and 10-digit phone
    - Checks for existing user
    - Hashes password securely
    - Generates authentication session token
    """
    # Check if email is already registered
    existing_email = db.query(User).filter(User.email == user_in.email.lower().strip()).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists."
        )

    # Check if phone is already registered
    existing_phone = db.query(User).filter(User.phone == user_in.phone.strip()).first()
    if existing_phone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this phone number already exists."
        )

    new_user = User(
        name=user_in.name.strip(),
        email=user_in.email.lower().strip(),
        phone=user_in.phone.strip(),
        hashed_password=hash_password(user_in.password),
        address=user_in.address.strip() if user_in.address else None
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_access_token(new_user.id)
    return AuthResponse(token=token, user=new_user)


@router.post("/login", response_model=AuthResponse, summary="Login user")
def login(login_in: LoginRequest, db: Session = Depends(get_db)):
    """
    Log in with email or 10-digit phone and password:
    - Verifies password against PBKDF2 hash
    - Returns session token and user profile
    """
    ident = login_in.identifier.strip()
    user = db.query(User).filter(
        (User.email == ident.lower()) | (User.phone == ident)
    ).first()

    if not user or not verify_password(login_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email/phone or password."
        )

    token = create_access_token(user.id)
    return AuthResponse(token=token, user=user)


@router.get("/me", response_model=UserOut, summary="Get current logged in user")
def get_me(current_user: User = Depends(get_current_user)):
    """
    Retrieve profile details of the currently authenticated user.
    """
    return current_user

