from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Annotated

from app.db.session import get_db
from app.models import database_models, schemas
from app.routers.auth import get_current_active_user

router = APIRouter()

@router.get("/cart", response_model=List[schemas.CartItem])
async def get_user_cart(
    current_user: Annotated[database_models.User, Depends(get_current_active_user)],
    db: Session = Depends(get_db),
):
    """Get the current user's cart items"""
    cart_items = db.query(database_models.CartItem).filter(
        database_models.CartItem.user_id == current_user.id
    ).all()
    
    return cart_items

@router.post("/cart", status_code=status.HTTP_201_CREATED)
async def update_user_cart(
    cart_items: List[schemas.CartItemCreate],
    current_user: Annotated[database_models.User, Depends(get_current_active_user)],
    db: Session = Depends(get_db),
):
    """Update the current user's cart items"""
    # Clear existing cart items
    db.query(database_models.CartItem).filter(
        database_models.CartItem.user_id == current_user.id
    ).delete()
    
    # Add new cart items
    for item in cart_items:
        db_item = database_models.CartItem(
            user_id=current_user.id,
            book_id=item.book_id,
            quantity=item.quantity
        )
        db.add(db_item)
    
    db.commit()
    return {"message": "Cart updated successfully"}