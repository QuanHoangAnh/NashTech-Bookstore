# backend/app/routers/orders.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session # Keep Session for dependency
from typing import List, Annotated
from decimal import Decimal # Keep if needed elsewhere
import datetime # Keep if needed elsewhere

from app.db.session import get_db
from app.models import database_models, schemas
from app.routers.auth import get_current_active_user
# Removed direct import of get_active_discount_price
# from .books import get_active_discount_price
# Removed direct import of select
# from sqlalchemy import select

# Import the service
from app.services import order_service
# Import custom exceptions
from app.core.exceptions import OrderCreationError, EmptyOrderError, ItemUnavailableError, InvalidQuantityError


router = APIRouter()

@router.post("/orders", response_model=schemas.Order, status_code=status.HTTP_201_CREATED)
async def create_order(
    order_data: schemas.OrderCreate,
    current_user: Annotated[database_models.User, Depends(get_current_active_user)],
    db: Session = Depends(get_db),
):
    """
    Creates a new order for the currently authenticated user.
    Delegates core logic to the order service.
    """
    try:
        # Call the service function to place the order
        new_order = await order_service.place_order(
            db=db,
            current_user=current_user,
            order_data=order_data
        )
        # Service function returns the ORM model, FastAPI handles response_model conversion
        return new_order
    except EmptyOrderError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except ItemUnavailableError as e:
        # Pass unavailable item IDs in headers as before, if desired by frontend
        headers = {"unavailable_items": ",".join(map(str, e.unavailable_ids))}
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Some items are not available",
            headers=headers
        )
    except InvalidQuantityError as e:
         raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except OrderCreationError as e:
        # Catch the generic service error for internal issues
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
    except Exception as e:
        # Catch any other unexpected errors
        # Log the error e
        print(f"Unexpected error in create_order router: {e}") # Replace with proper logging
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail="An unexpected error occurred.")


@router.get("/orders", response_model=List[schemas.Order])
async def get_orders(
    current_user: Annotated[database_models.User, Depends(get_current_active_user)],
    db: Session = Depends(get_db)
):
    """Get all orders for the current user"""
    # --- Implementation for fetching orders ---
    # This logic could also be moved to order_service.py for consistency

    stmt = (
        select(database_models.Order)
        .where(database_models.Order.user_id == current_user.id)
        .options(selectinload(database_models.Order.items)) # Eager load items
        .order_by(desc(database_models.Order.order_date)) # Example: sort by newest first
    )
    orders = db.scalars(stmt).all()
    return orders # FastAPI handles conversion to List[schemas.Order]