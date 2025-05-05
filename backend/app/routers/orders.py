# backend/app/routers/orders.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Annotated
# Removed unused imports like Decimal, datetime, select

from app.db.session import get_db
from app.models import database_models, schemas
from app.routers.auth import get_current_active_user
# Import the service
from app.services import order_service # Import order_service
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
    (No changes needed in this endpoint function itself)
    """
    try:
        new_order = await order_service.place_order(
            db=db,
            current_user=current_user,
            order_data=order_data
        )
        return new_order
    except EmptyOrderError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except ItemUnavailableError as e:
        headers = {"unavailable_items": ",".join(map(str, e.unavailable_ids))}
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Some items are not available",
            headers=headers
        )
    except InvalidQuantityError as e:
         raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except OrderCreationError as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
    except Exception as e:
        print(f"Unexpected error in create_order router: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail="An unexpected error occurred.")


@router.get("/orders", response_model=List[schemas.Order])
async def get_orders(
    current_user: Annotated[database_models.User, Depends(get_current_active_user)],
    db: Session = Depends(get_db)
):
    """
    Get all orders for the current user.
    Delegates logic to the order service.
    """
    # Call the service function to get orders
    orders = await order_service.get_user_orders(db=db, user_id=current_user.id)
    # FastAPI handles the conversion from List[ORM Order] to List[schemas.Order]
    return orders