import base64
import hashlib
import hmac
import os
import secrets
import time
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.database import get_db

SECRET_KEY = os.getenv("SECRET_KEY", "ghatampur-food-secret-key-2026-safe-auth")
security_bearer = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    """
    Hashes a password using PBKDF2-HMAC-SHA256 with a unique random salt.
    Format stored in database: salt$hash
    """
    salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac(
        hash_name="sha256",
        password=password.encode("utf-8"),
        salt=salt.encode("utf-8"),
        iterations=100_000
    )
    return f"{salt}${key.hex()}"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifies a plain password against the stored salt$hash string.
    """
    try:
        salt, expected_key = hashed_password.split("$", 1)
        actual_key = hashlib.pbkdf2_hmac(
            hash_name="sha256",
            password=plain_password.encode("utf-8"),
            salt=salt.encode("utf-8"),
            iterations=100_000
        )
        return secrets.compare_digest(actual_key.hex(), expected_key)
    except Exception:
        return False


def create_access_token(user_id: int, expires_in_seconds: int = 86400 * 7) -> str:
    """
    Creates a stateless, tamper-proof access token using HMAC-SHA256.
    Payload: user_id:expiry_timestamp
    """
    expiry = int(time.time()) + expires_in_seconds
    payload = f"{user_id}:{expiry}".encode("utf-8")
    signature = hmac.new(SECRET_KEY.encode("utf-8"), payload, hashlib.sha256).digest()
    token_bytes = payload + b":" + signature
    return base64.urlsafe_b64encode(token_bytes).decode("utf-8")


def verify_access_token(token: str) -> Optional[int]:
    """
    Verifies the HMAC signature and expiration of an access token.
    Returns the user_id if valid, or None if invalid or expired.
    """
    try:
        token_bytes = base64.urlsafe_b64decode(token.encode("utf-8"))
        parts = token_bytes.split(b":")
        if len(parts) != 3:
            return None
        user_id_bytes, expiry_bytes, signature = parts
        payload = user_id_bytes + b":" + expiry_bytes
        expected_sig = hmac.new(SECRET_KEY.encode("utf-8"), payload, hashlib.sha256).digest()

        if not hmac.compare_digest(signature, expected_sig):
            return None

        expiry = int(expiry_bytes.decode("utf-8"))
        if expiry < int(time.time()):
            return None

        return int(user_id_bytes.decode("utf-8"))
    except Exception:
        return None


def get_optional_current_user(
    auth: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
    db: Session = Depends(get_db)
):
    """
    FastAPI dependency: Returns the current User if a valid Bearer token is provided,
    otherwise returns None.
    """
    if not auth or not auth.credentials:
        return None

    user_id = verify_access_token(auth.credentials)
    if not user_id:
        return None

    from app.models import User
    return db.query(User).filter(User.id == user_id).first()


def get_current_user(
    current_user = Depends(get_optional_current_user)
):
    """
    FastAPI dependency: Requires a valid Bearer token and returns the current User.
    Raises HTTP 401 if not authenticated.
    """
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please log in.",
            headers={"WWW-Authenticate": "Bearer"}
        )
    return current_user
