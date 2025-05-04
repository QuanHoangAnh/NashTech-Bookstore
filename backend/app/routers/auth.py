# backend/app/routers/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import Annotated, Optional
from jose import JWTError, jwt
from datetime import timedelta

from app.db.session import get_db
from app.models import database_models, schemas
from app.core import security  # Import the security module
from app.core.config import settings
from sqlalchemy import select

router = APIRouter()

# OAuth2 scheme definition
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="token",
    scheme_name="Bearer Auth"
)

def authenticate_user(db: Session, email: str, password: str) -> Optional[database_models.User]:
    """Find user by email and verify password."""
    stmt = select(database_models.User).where(database_models.User.email == email)
    user = db.scalars(stmt).first()
    if not user:
        return None
    if not security.verify_password(password, user.password):  # Now using the security module correctly
        return None
    return user

# --- Dependency to Get Current User ---
async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],  # Use oauth2_scheme consistently
    db: Session = Depends(get_db)
):
    """Decode token and return user, raise exception if invalid."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = schemas.TokenData(email=email)
    except JWTError:
        raise credentials_exception

    stmt = select(database_models.User).where(database_models.User.email == token_data.email)
    user = db.scalars(stmt).first()
    if user is None:
        raise credentials_exception
    return user

# --- Dependency for Active User (Optional - can combine with above) ---
async def get_current_active_user(current_user: Annotated[database_models.User, Depends(get_current_user)]):
    """Check if user is active (add is_active field to model if needed)."""
    # if current_user.disabled: # Example if you add an 'is_active' or 'disabled' field
    #     raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


# --- Token Endpoint ---
@router.post("/token", response_model=schemas.Token)
async def login_for_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: Session = Depends(get_db)
):
    user = authenticate_user(db, email=form_data.username, password=form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    refresh_token = security.create_refresh_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer", "refresh_token": refresh_token}


# --- Get Current User Endpoint ---
@router.get("/users/me", response_model=schemas.User)
async def read_users_me(current_user: Annotated[database_models.User, Depends(get_current_active_user)]):
    """Fetch the current logged in user."""
    return current_user

@router.post("/refresh-token", response_model=schemas.Token)
async def refresh_access_token(refresh_token: str):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid refresh token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(refresh_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        token_type: str = payload.get("type")
        if email is None or token_type != "refresh":
            raise credentials_exception
        
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": email}, expires_delta=access_token_expires
        )
        return {"access_token": access_token, "token_type": "bearer"}
    except JWTError:
        raise credentials_exception
