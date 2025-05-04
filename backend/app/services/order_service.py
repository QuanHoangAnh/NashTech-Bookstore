# backend/app/services/order_service.py
import datetime
from decimal import Decimal
from typing import List

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload, joinedload

from app.models import database_models, schemas
# Import the helper function from book_service or a shared utils module
from app.services.book_service import get_active_discount_price
# Import custom exceptions
from app.core.exceptions import OrderCreationError, EmptyOrderError, ItemUnavailableError, InvalidQuantityError


async def place_order(
    db: Session,
    current_user: database_models.User,
    order_data: schemas.OrderCreate
) -> database_models.Order:
    """
    Service function to handle the logic of creating a new order.
    Raises specific exceptions on failure.
    """
    if not order_data.items:
        raise EmptyOrderError("Cannot create an empty order.")

    total_amount = Decimal("0.00")
    order_items_to_create_data = [] # Store data needed to create OrderItem ORM objects
    book_ids_to_fetch = [item.book_id for item in order_data.items]
    unavailable_items_ids = []

    # --- Fetch all required books and their discounts efficiently ---
    stmt_books = (
        select(database_models.Book)
        .where(database_models.Book.id.in_(book_ids_to_fetch))
        .options(selectinload(database_models.Book.discounts)) # Eager load discounts
    )
    books_in_db_list = db.scalars(stmt_books).unique().all()
    books_in_db_map = {book.id: book for book in books_in_db_list}

    # --- Validate items and calculate totals ---
    for item_data in order_data.items:
        book = books_in_db_map.get(item_data.book_id)

        if not book:
            unavailable_items_ids.append(item_data.book_id)
            continue # Check all items before failing

        # Add stock check here if implemented in Book model
        # if book.stock < item_data.quantity:
        #     unavailable_items_ids.append(item_data.book_id)
        #     continue

        # Validate quantity (Pydantic already does range check, this is a safeguard)
        if not (1 <= item_data.quantity <= 8):
             # If Pydantic validation is trusted, this check can be removed
             # Otherwise, raise a specific error
             raise InvalidQuantityError(book_id=item_data.book_id, quantity=item_data.quantity)


        # Determine price at time of order
        active_discount_price = get_active_discount_price(book)
        effective_price = active_discount_price if active_discount_price is not None else book.book_price

        line_total = effective_price * item_data.quantity
        total_amount += line_total

        # Prepare OrderItem data for creation later
        order_items_to_create_data.append({
            "book_id": book.id,
            "quantity": item_data.quantity,
            "price": effective_price # Store price paid
        })

    # --- If any items were unavailable, raise an error ---
    if unavailable_items_ids:
        raise ItemUnavailableError(unavailable_ids=unavailable_items_ids)

    # --- Create Order and OrderItems within a transaction ---
    try:
        # Create the Order record
        new_order = database_models.Order(
            user_id=current_user.id,
            order_amount=total_amount
            # order_date is set by server default in the model
        )
        db.add(new_order)
        db.flush() # Flush to get the new_order.id for order items

        # Create OrderItem records
        for item_info in order_items_to_create_data:
            order_item = database_models.OrderItem(
                order_id=new_order.id,
                book_id=item_info["book_id"],
                quantity=item_info["quantity"],
                price=item_info["price"]
            )
            db.add(order_item)

        db.commit()
        # Refresh necessary to load relationships like 'items' automatically
        # db.refresh(new_order) # Refresh might not load relationships automatically

        # Eager load items for the response model after commit
        stmt_refresh = (
            select(database_models.Order)
            .where(database_models.Order.id == new_order.id)
            .options(selectinload(database_models.Order.items)) # Eager load items
        )
        refreshed_order = db.scalars(stmt_refresh).first()
        if not refreshed_order:
             # Should not happen if commit succeeded, but handle defensively
             raise OrderCreationError("Failed to reload created order.")

        return refreshed_order

    except Exception as e:
        db.rollback()
        # Log the exception e
        print(f"Error creating order: {e}") # Replace with proper logging
        # Raise a generic order creation error
        raise OrderCreationError(f"An internal error occurred while creating the order: {e}")