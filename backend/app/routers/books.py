# backend/app/routers/books.py

# Keep existing imports
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional

# Add ilike if not already imported (though it's used in service now)
# from sqlalchemy import select, func, desc, asc, case, and_, or_, literal_column, distinct, ilike

from app.db.session import get_db
from app.models import database_models, schemas
from app.services import book_service # Keep existing service import

router = APIRouter()

# --- Existing /books endpoint remains the same ---
@router.get("/books", response_model=schemas.BookListResponse)
async def read_books( # Keep this endpoint for browsing/filtering
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100), # Default limit 20
    sort_by: Optional[str] = Query("on_sale", enum=[
        "on_sale", "on_sale_home", "popularity", "popular",
        "price_asc", "price_desc", "recommended"
    ]),
    category_id: Optional[int] = Query(None),
    author_id: Optional[int] = Query(None),
    min_rating: Optional[int] = Query(None, ge=1, le=5) # Rating 1-5
):
    """
    Retrieve books with pagination, filtering, and sorting.
    Delegates logic to the book service.
    """
    book_list_response = await book_service.list_books(
        db=db,
        skip=skip,
        limit=limit,
        sort_by=sort_by,
        category_id=category_id,
        author_id=author_id,
        min_rating=min_rating
    )
    return book_list_response

# --- NEW SEARCH ENDPOINT ---
@router.get("/search", response_model=schemas.BookListResponse)
async def search_books_endpoint(
    q: str = Query(..., min_length=1, description="Search term for book title or author"), # 'q' is common for query
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100) # Default limit 20
):
    """
    Search for books by title or author name.
    """
    search_result = await book_service.search_books(
        db=db,
        search_term=q,
        skip=skip,
        limit=limit
    )
    return search_result

# --- Existing /books/{book_id} endpoint remains the same ---
@router.get("/books/{book_id}", response_model=schemas.Book)
async def read_book(book_id: int, db: Session = Depends(get_db)):
    """
    Retrieve details for a single book by its ID.
    Delegates logic to the book service.
    """
    book = await book_service.get_book_details(db=db, book_id=book_id)
    if book is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="Book not found")
    return book