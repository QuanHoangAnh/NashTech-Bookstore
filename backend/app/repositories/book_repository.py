# backend/app/repositories/book_repository.py
import datetime
from decimal import Decimal
from typing import List, Optional, Tuple, Sequence

# Remove 'ilike' from this import
from sqlalchemy import select, func, desc, asc, case, and_, or_, literal_column, distinct, Column
from sqlalchemy.orm import Session, joinedload, selectinload, contains_eager

from app.models import database_models

class BookRepository:
    """
    Handles database operations for Book entities.
    """
    def __init__(self, db: Session):
        self.db = db

    def list_and_count_books(
        self,
        skip: int,
        limit: int,
        sort_by: Optional[str],
        category_id: Optional[int],
        author_id: Optional[int],
        min_rating: Optional[int],
        search_term: Optional[str] = None
    ) -> Tuple[Sequence[Tuple[database_models.Book, Optional[Decimal]]], int]:
        """
        Fetches a paginated, filtered, sorted, and searched list of books
        along with the active discount price and the total count.
        Returns a tuple: (list_of_results, total_count)
        Each result in the list is a tuple: (Book ORM object, active_discount_price)
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

        # --- Base query ---
        base_query = (
            select(
                database_models.Book,
                active_discount_subquery.c.active_discount_price
            )
            .join(database_models.Book.author) # Keep join for author name search
            .outerjoin(review_subquery, database_models.Book.id == review_subquery.c.book_id)
            .outerjoin(active_discount_subquery, database_models.Book.id == active_discount_subquery.c.book_id)
        )

        # --- Apply filters ---
        filtered_query = base_query
        if category_id is not None:
            filtered_query = filtered_query.where(database_models.Book.category_id == category_id)
        if author_id is not None:
            filtered_query = filtered_query.where(database_models.Book.author_id == author_id)
        if min_rating is not None:
            filtered_query = filtered_query.where(
                func.coalesce(review_subquery.c.average_rating, 0) >= min_rating
            )

        # --- Apply search filter --- *** CORRECTED USAGE *** ---
        if search_term:
            search_pattern = f"%{search_term}%"
            filtered_query = filtered_query.where(
                or_(
                    # Use the .ilike() method on the column object
                    database_models.Book.book_title.ilike(search_pattern),
                    database_models.Author.author_name.ilike(search_pattern)
                )
            )
        # --- End Search Filter ---

        # --- Get total count (remains the same) ---
        count_subquery = filtered_query.with_only_columns(database_models.Book.id).distinct().subquery()
        count_query = select(func.count()).select_from(count_subquery)
        total_count = self.db.scalar(count_query)

        # --- Apply sort_by="on_sale_home" filter AFTER counting (remains the same) ---
        if sort_by == "on_sale_home":
            filtered_query = filtered_query.where(
                active_discount_subquery.c.active_discount_price != None
            )

        # --- Apply sorting (remains the same) ---
        final_price = func.coalesce(
            active_discount_subquery.c.active_discount_price,
            database_models.Book.book_price
        ).label("final_price")

        # Sorting logic remains identical
        if sort_by == "on_sale":
            order_logic = [
                desc(active_discount_subquery.c.active_discount_price.is_not(None)),
                asc(final_price)
            ]
            final_query_base = filtered_query.order_by(*order_logic)
        elif sort_by == "on_sale_home":
            discount_amount = database_models.Book.book_price - active_discount_subquery.c.active_discount_price
            final_query_base = filtered_query.order_by(desc(discount_amount))
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
        else: # Default case
             order_logic = [
                desc(active_discount_subquery.c.active_discount_price.is_not(None)),
                asc(final_price)
             ]
             final_query_base = filtered_query.order_by(*order_logic)


        # --- Apply pagination and load relationships (remains the same) ---
        final_query = (
            final_query_base
            .options(
                contains_eager(database_models.Book.author), # Ensure author loaded
                joinedload(database_models.Book.category),
                selectinload(database_models.Book.discounts)
            )
            .offset(skip)
            .limit(limit)
        )

        # --- Execute query (remains the same) ---
        results = self.db.execute(final_query).unique().all()

        return results, total_count


    # --- get_book_by_id and get_books_by_ids_with_discounts remain unchanged ---
    def get_book_by_id(self, book_id: int) -> Optional[database_models.Book]:
        """ Fetches a single book by ID with author, category, and discounts loaded. """
        stmt = (
            select(database_models.Book)
            .where(database_models.Book.id == book_id)
            .options(
                joinedload(database_models.Book.author),
                joinedload(database_models.Book.category),
                selectinload(database_models.Book.discounts)
            )
        )
        book_orm = self.db.scalars(stmt).unique().first()
        return book_orm

    def get_books_by_ids_with_discounts(self, book_ids: List[int]) -> Sequence[database_models.Book]:
         """ Fetches multiple books by their IDs, eager loading discounts. """
         if not book_ids:
             return []
         stmt = (
             select(database_models.Book)
             .where(database_models.Book.id.in_(book_ids))
             .options(selectinload(database_models.Book.discounts))
         )
         books = self.db.scalars(stmt).unique().all()
         return books