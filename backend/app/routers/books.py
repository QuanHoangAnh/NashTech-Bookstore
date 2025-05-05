# backend/app/routers/books.py
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.session import get_db
from app.models import database_models, schemas
from app.services import book_service

router = APIRouter()

@router.get("/books", response_model=schemas.BookListResponse)
async def read_books(
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(25, ge=1, le=100),
    sort_by: Optional[str] = Query("on_sale", enum=[
        "on_sale", "on_sale_home", "popularity", "popular",
        "price_asc", "price_desc", "recommended"
    ]),
    category_id: Optional[int] = Query(None),
    author_id: Optional[int] = Query(None),
    min_rating: Optional[int] = Query(None, ge=1, le=5),
    search: Optional[str] = Query(None, min_length=1, max_length=100) # <-- Add search query param
):
    """
    Retrieve books with pagination, filtering, sorting, and optional search.
    Delegates logic to the book service.
    """
    # Call the service function, passing the search term
    book_list_response = await book_service.list_books(
        db=db,
        skip=skip,
        limit=limit,
        sort_by=sort_by,
        category_id=category_id,
        author_id=author_id,
        min_rating=min_rating,
        search_term=search # <-- Pass search parameter value
    )
    return book_list_response

# --- read_book endpoint remains unchanged ---
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