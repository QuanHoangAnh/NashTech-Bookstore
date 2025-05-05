# backend/app/services/book_service.py
import datetime
from decimal import Decimal
from typing import List, Optional, Tuple, Sequence # Added Sequence

from sqlalchemy.orm import Session # Keep Session for type hinting

from app.models import database_models, schemas
# Import the repository
from app.repositories.book_repository import BookRepository

# Helper function definition - MUST be present in this file
def get_active_discount_price(book_row: database_models.Book) -> Optional[Decimal]:
    """Get active discount price from a book ORM instance."""
    today = datetime.date.today()
    active_discount_price = None
    # Check if discounts were loaded, handle if not
    if book_row.discounts:
        for discount in book_row.discounts:
            if (discount.discount_start_date <= today and
                    (discount.discount_end_date is None or discount.discount_end_date >= today)):
                active_discount_price = discount.discount_price
                break # Found the active discount
    return active_discount_price

async def list_books(
    db: Session,
    skip: int,
    limit: int,
    sort_by: Optional[str],
    category_id: Optional[int],
    author_id: Optional[int],
    min_rating: Optional[int],
    search_term: Optional[str] = None # Added search_term from search implementation
) -> schemas.BookListResponse:
    """
    Service function to retrieve a paginated, filtered, sorted, and searched list of books.
    Delegates database operations to BookRepository.
    """
    book_repo = BookRepository(db)

    # Call the repository method, passing the search term
    results, total_count = book_repo.list_and_count_books(
        skip=skip,
        limit=limit,
        sort_by=sort_by,
        category_id=category_id,
        author_id=author_id,
        min_rating=min_rating,
        search_term=search_term # Pass search_term
    )

    # --- Process results from repository ---
    result_books_schema = []
    for row in results:
        book_orm = row[0] # Book ORM object
        joined_discount_price = row[1] # Active discount price from query

        # Validate ORM object with Pydantic schema
        book_data = schemas.Book.model_validate(book_orm).model_dump()
        # Assign the discount price obtained from the repository query
        book_data['discount_price'] = joined_discount_price
        result_books_schema.append(book_data)

    return schemas.BookListResponse(
        items=result_books_schema,
        total_count=total_count
    )


async def get_book_details(db: Session, book_id: int) -> Optional[schemas.Book]:
    """
    Service function to retrieve detailed information for a single book.
    Delegates database operation to BookRepository. Uses the helper function.
    """
    book_repo = BookRepository(db)
    book_orm = book_repo.get_book_by_id(book_id=book_id)

    if book_orm is None:
        return None

    # Prepare response schema using the helper for discount price
    book_data = schemas.Book.model_validate(book_orm).model_dump()
    # Use helper here, as we have the loaded ORM object
    book_data['discount_price'] = get_active_discount_price(book_orm) # Call the helper

    # Re-validate
    final_book_schema = schemas.Book.model_validate(book_data)
    return final_book_schema