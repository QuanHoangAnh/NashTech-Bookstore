# backend/app/services/order_service.py
import datetime
from decimal import Decimal
from typing import List, Sequence # Added Sequence

from sqlalchemy.orm import Session # Keep Session for type hinting

from app.models import database_models, schemas
# Import the helper function from book_service
from app.services.book_service import get_active_discount_price
# Import custom exceptions
from app.core.exceptions import OrderCreationError, EmptyOrderError, ItemUnavailableError, InvalidQuantityError
# Import repositories
from app.repositories.book_repository import BookRepository
from app.repositories.order_repository import OrderRepository


async def place_order(
    db: Session,
    current_user: database_models.User,
    order_data: schemas.OrderCreate
) -> database_models.Order: # Return ORM model, router handles schema conversion
    """
    Service function to handle the logic of creating a new order.
    Uses BookRepository and OrderRepository.
    Raises specific exceptions on failure.
    """
    if not order_data.items:
        raise EmptyOrderError("Cannot create an empty order.")

    book_repo = BookRepository(db)
    order_repo = OrderRepository(db)

    total_amount = Decimal("0.00")
    order_items_to_create_repo_data = [] # Data format for OrderRepository
    book_ids_to_fetch = [item.book_id for item in order_data.items]
    unavailable_items_ids = []

    # --- Fetch required books using BookRepository ---
    # Fetch books with discounts loaded
    books_in_db_list = book_repo.get_books_by_ids_with_discounts(book_ids=book_ids_to_fetch)
    books_in_db_map = {book.id: book for book in books_in_db_list}

    # --- Validate items and calculate totals (Business Logic remains in Service) ---
    for item_data in order_data.items:
        book = books_in_db_map.get(item_data.book_id)

        if not book:
            unavailable_items_ids.append(item_data.book_id)
            continue

        # Add stock check here if implemented
        # if book.stock < item_data.quantity:
        #     unavailable_items_ids.append(item_data.book_id)
        #     continue

        if not (1 <= item_data.quantity <= 8):
             raise InvalidQuantityError(book_id=item_data.book_id, quantity=item_data.quantity)

        # Determine price at time of order using helper
        active_discount_price = get_active_discount_price(book)
        effective_price = active_discount_price if active_discount_price is not None else book.book_price

        line_total = effective_price * item_data.quantity
        total_amount += line_total

        # Prepare data for OrderRepository
        order_items_to_create_repo_data.append({
            "book_id": book.id,
            "quantity": item_data.quantity,
            "price": effective_price
        })

    if unavailable_items_ids:
        raise ItemUnavailableError(unavailable_ids=unavailable_items_ids)

    # --- Create Order using OrderRepository ---
    try:
        # Delegate database persistence to the repository
        new_order = order_repo.create_order_with_items(
            user_id=current_user.id,
            total_amount=total_amount,
            items_data=order_items_to_create_repo_data
        )
        return new_order # Return the ORM model returned by the repository
    except Exception as e:
        # Catch potential exceptions from the repository commit/refresh
        # Log the error e
        print(f"Error during order repository interaction: {e}") # Replace with proper logging
        # Raise a generic service-level error
        raise OrderCreationError(f"An internal error occurred while saving the order: {e}")


async def get_user_orders(db: Session, user_id: int) -> Sequence[database_models.Order]:
    """
    Service function to retrieve all orders for a user.
    Delegates database operation to OrderRepository.
    """
    order_repo = OrderRepository(db)
    orders = order_repo.list_orders_by_user_id(user_id=user_id)
    return orders