# backend/app/services/book_service.py
import datetime
from decimal import Decimal
from typing import List, Optional, Tuple

# Keep existing imports: select, func, desc, asc, case, and_, or_, literal_column, distinct, Column
from sqlalchemy import select, func, desc, asc, case, and_, or_, literal_column, distinct, Column
from sqlalchemy.orm import Session, joinedload, selectinload, contains_eager, aliased

from app.models import database_models, schemas

# --- Helper function remains as it's used elsewhere ---
def get_active_discount_price(book_row: database_models.Book) -> Optional[Decimal]:
    """Get active discount price from a book ORM instance."""
    today = datetime.date.today()
    active_discount_price = None
    if book_row.discounts:
        for discount in book_row.discounts:
            if (discount.discount_start_date <= today and
                    (discount.discount_end_date is None or discount.discount_end_date >= today)):
                active_discount_price = discount.discount_price
                break
    return active_discount_price

# --- list_books function remains the same ---
async def list_books(
    db: Session,
    skip: int,
    limit: int,
    sort_by: Optional[str],
    category_id: Optional[int],
    author_id: Optional[int],
    min_rating: Optional[int]
) -> schemas.BookListResponse:
    """
    Service function to retrieve a paginated, filtered, and sorted list of books.
    Refactored to use joined subquery value for discount price in response.
    """
    today = datetime.date.today()

    # --- Subquery Definitions (remain the same) ---
    review_subquery = (
        select(
            database_models.Review.book_id,
            func.count(database_models.Review.id).label("review_count"),
            func.avg(database_models.Review.rating_start).label("average_rating")
        )
        .group_by(database_models.Review.book_id)
        .subquery("review_stats")
    )

    active_discount_subquery = (
        select(
            database_models.Discount.book_id,
            database_models.Discount.discount_price.label("active_discount_price")
        )
        .where(
            database_models.Discount.discount_start_date <= today,
            or_(
                database_models.Discount.discount_end_date == None,
                database_models.Discount.discount_end_date >= today
            )
        )
        .distinct(database_models.Discount.book_id)
        .subquery("active_discount")
    )

    # --- Base query: Select Book ORM and the active_discount_price column ---
    base_query = (
        select(
            database_models.Book,
            active_discount_subquery.c.active_discount_price
        )
        .outerjoin(review_subquery, database_models.Book.id == review_subquery.c.book_id)
        .outerjoin(active_discount_subquery, database_models.Book.id == active_discount_subquery.c.book_id)
        # Also join Author to allow searching by author name later if needed
        .join(database_models.Book.author)
    )

    # --- Apply filters (remains the same) ---
    filtered_query = base_query
    if category_id is not None:
        filtered_query = filtered_query.where(database_models.Book.category_id == category_id)
    if author_id is not None:
        filtered_query = filtered_query.where(database_models.Book.author_id == author_id)
    if min_rating is not None:
        filtered_query = filtered_query.where(
            func.coalesce(review_subquery.c.average_rating, 0) >= min_rating
        )

    # --- Get total count (remains the same logic, applied to filtered query) ---
    count_subquery = filtered_query.with_only_columns(database_models.Book.id).distinct().subquery()
    count_query = select(func.count()).select_from(count_subquery)
    total_count = db.scalar(count_query)

    # --- Apply sort_by="on_sale_home" filter AFTER counting (remains the same) ---
    if sort_by == "on_sale_home":
        filtered_query = filtered_query.where(
            active_discount_subquery.c.active_discount_price != None
        )

    # --- Apply sorting (logic remains the same, applied to filtered_query) ---
    final_price = func.coalesce(
        active_discount_subquery.c.active_discount_price,
        database_models.Book.book_price
    ).label("final_price")

    # Sorting logic remains identical, using subquery columns and final_price
    order_logic = []
    if sort_by == "on_sale":
        order_logic = [
            desc(active_discount_subquery.c.active_discount_price.is_not(None)),
            asc(final_price)
        ]
        final_query_base = filtered_query.order_by(*order_logic)
    elif sort_by == "on_sale_home":
         # Calculate discount amount for sorting
        discount_amount = database_models.Book.book_price - active_discount_subquery.c.active_discount_price
        final_query_base = filtered_query.order_by(desc(discount_amount)) # Order by largest discount
    elif sort_by == "popularity" or sort_by == "popular":
        order_logic = [
            desc(func.coalesce(review_subquery.c.review_count, 0)),
            asc(final_price)
        ]
        final_query_base = filtered_query.order_by(*order_logic)
    elif sort_by == "recommended":
        order_logic = [
            desc(func.coalesce(review_subquery.c.average_rating, 0)),
            asc(final_price)
        ]
        final_query_base = filtered_query.order_by(*order_logic)
    elif sort_by == "price_asc":
        final_query_base = filtered_query.order_by(asc(final_price))
    elif sort_by == "price_desc":
        final_query_base = filtered_query.order_by(desc(final_price))
    else: # Default case (same as on_sale)
        order_logic = [
            desc(active_discount_subquery.c.active_discount_price.is_not(None)),
            asc(final_price)
        ]
        final_query_base = filtered_query.order_by(*order_logic)


    # --- Apply pagination and load relationships ---
    final_query = (
        final_query_base
        .options(
            # Eager load relationships needed for the response schema
            joinedload(database_models.Book.author),
            joinedload(database_models.Book.category),
            # Keep discounts for flexibility, even if not strictly needed for price now
            selectinload(database_models.Book.discounts)
        )
        .offset(skip)
        .limit(limit)
    )

    # --- Execute query and process results ---
    results = db.execute(final_query).unique().all() # Use execute for multi-column select

    # --- Prepare response schema ---
    result_books_schema = []
    for row in results:
        book_orm = row[0] # The Book ORM object is the first element
        joined_discount_price = row[1] # The active_discount_price from the subquery

        # Validate ORM object with Pydantic schema for reading
        # Use model_dump() for Pydantic v2
        book_data = schemas.Book.model_validate(book_orm).model_dump()

        # Use the discount price directly from the query result
        book_data['discount_price'] = joined_discount_price # Assign the value selected
        result_books_schema.append(book_data)

    return schemas.BookListResponse(
        items=result_books_schema,
        total_count=total_count
    )


# --- NEW SEARCH FUNCTION ---
async def search_books(
    db: Session,
    search_term: str,
    skip: int,
    limit: int
) -> schemas.BookListResponse:
    """
    Service function to retrieve books based on a search term (title or author).
    """
    if not search_term: # Handle empty search term
        return schemas.BookListResponse(items=[], total_count=0)

    today = datetime.date.today()
    search_pattern = f"%{search_term}%" # Pattern for ILIKE

    # --- Subquery Definitions (Can reuse from list_books) ---
    review_subquery = (
        select(
            database_models.Review.book_id,
            func.count(database_models.Review.id).label("review_count"),
            func.avg(database_models.Review.rating_start).label("average_rating")
        )
        .group_by(database_models.Review.book_id)
        .subquery("review_stats")
    )

    active_discount_subquery = (
        select(
            database_models.Discount.book_id,
            database_models.Discount.discount_price.label("active_discount_price")
        )
        .where(
            database_models.Discount.discount_start_date <= today,
            or_(
                database_models.Discount.discount_end_date == None,
                database_models.Discount.discount_end_date >= today
            )
        )
        .distinct(database_models.Discount.book_id)
        .subquery("active_discount")
    )

    # --- Base query: Select Book ORM and the active_discount_price column ---
    # Join Author to allow searching by author name
    base_query = (
        select(
            database_models.Book,
            active_discount_subquery.c.active_discount_price
        )
        .outerjoin(review_subquery, database_models.Book.id == review_subquery.c.book_id)
        .outerjoin(active_discount_subquery, database_models.Book.id == active_discount_subquery.c.book_id)
        .join(database_models.Book.author) # Ensure Author is joined
    )

    # --- Apply Search Filter ---
    # Filter by book title OR author name using case-insensitive LIKE
    search_query = base_query.where(
        or_(
            database_models.Book.book_title.ilike(search_pattern),
            database_models.Author.author_name.ilike(search_pattern)
        )
    )

    # --- Get total count for search results ---
    count_subquery = search_query.with_only_columns(database_models.Book.id).distinct().subquery()
    count_query = select(func.count()).select_from(count_subquery)
    total_count = db.scalar(count_query)

    # --- Apply sorting (Optional: Default to relevance or title? Let's default to title for simplicity) ---
    final_query_base = search_query.order_by(asc(database_models.Book.book_title))

    # --- Apply pagination and load relationships ---
    final_query = (
        final_query_base
        .options(
            joinedload(database_models.Book.author),
            joinedload(database_models.Book.category),
            selectinload(database_models.Book.discounts)
        )
        .offset(skip)
        .limit(limit)
    )

    # --- Execute query and process results ---
    results = db.execute(final_query).unique().all()

    # --- Prepare response schema (same logic as list_books) ---
    result_books_schema = []
    for row in results:
        book_orm = row[0]
        joined_discount_price = row[1]
        book_data = schemas.Book.model_validate(book_orm).model_dump()
        book_data['discount_price'] = joined_discount_price
        result_books_schema.append(book_data)

    return schemas.BookListResponse(
        items=result_books_schema,
        total_count=total_count
    )


# --- get_book_details function remains the same ---
async def get_book_details(db: Session, book_id: int) -> Optional[schemas.Book]:
    """
    Service function to retrieve detailed information for a single book.
    """
    stmt = (
        select(database_models.Book)
        .where(database_models.Book.id == book_id)
        .options(
            joinedload(database_models.Book.author),
            joinedload(database_models.Book.category),
            selectinload(database_models.Book.discounts) # Need discounts for helper
        )
    )
    book_orm = db.scalars(stmt).unique().first()

    if book_orm is None:
        return None

    # Prepare response schema
    # Use model_dump() for Pydantic v2
    book_data = schemas.Book.model_validate(book_orm).model_dump()

    # Use helper here, as we have the loaded ORM object
    book_data['discount_price'] = get_active_discount_price(book_orm)

    # Re-validate after adding the calculated discount price
    # This ensures the final output matches the schema
    final_book_schema = schemas.Book.model_validate(book_data)

    return final_book_schema
