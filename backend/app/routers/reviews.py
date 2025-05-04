# backend/app/routers/reviews.py
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Annotated, Optional
from sqlalchemy import select, desc, asc

from app.db.session import get_db
from app.models import database_models, schemas
from app.routers.auth import get_current_active_user

router = APIRouter(
    prefix="/books",
    tags=["Reviews"]
)

# Public endpoints (no authentication required)
@router.get("/{book_id}/reviews", response_model=List[schemas.Review])
def read_reviews_for_book(
    book_id: int,
    db: Session = Depends(get_db),
    sort_by: Optional[str] = Query("date_desc", enum=["date_asc", "date_desc"]),
    rating: Optional[int] = Query(None, ge=1, le=5),
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100)
):
    """
    Public endpoint to read reviews for a specific book.
    No authentication required.
    """
    # First verify the book exists
    book = db.get(database_models.Book, book_id)
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Book not found"
        )

    query = (
        select(database_models.Review)
        .where(database_models.Review.book_id == book_id)
        .options(joinedload(database_models.Review.user))
    )
    
    # Add rating filter
    if rating is not None:
        query = query.where(database_models.Review.rating_start == rating)
    
    if sort_by == "date_desc":
        query = query.order_by(desc(database_models.Review.review_date))
    else:  # date_asc
        query = query.order_by(asc(database_models.Review.review_date))
    
    query = query.offset(skip).limit(limit)
    reviews = db.scalars(query).unique().all()
    return reviews

# Protected endpoints (authentication required)
@router.post(
    "/{book_id}/reviews",
    response_model=schemas.Review,
    status_code=status.HTTP_201_CREATED
)
async def create_review_for_book(
    book_id: int,
    review: schemas.ReviewCreate,
    current_user: Annotated[database_models.User, Depends(get_current_active_user)],
    db: Session = Depends(get_db)
):
    """
    Protected endpoint to create a review for a specific book.
    Requires authentication.
    """
    # Check if book exists
    book = db.get(database_models.Book, book_id)
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Book not found"
        )

    # Create the review (removed check for existing review)
    db_review = database_models.Review(
        **review.model_dump(),
        book_id=book_id,
        user_id=current_user.id
    )
    
    db.add(db_review)
    try:
        db.commit()
        db.refresh(db_review)
        
        # Reload with user relationship for response
        refreshed_review = db.scalar(
            select(database_models.Review)
            .where(database_models.Review.id == db_review.id)
            .options(joinedload(database_models.Review.user))
        )
        return refreshed_review
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create review"
        )

@router.delete("/{book_id}/reviews/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_review(
    book_id: int,
    review_id: int,
    current_user: Annotated[database_models.User, Depends(get_current_active_user)],
    db: Session = Depends(get_db)
):
    """
    Protected endpoint to delete a review.
    Users can only delete their own reviews.
    Admins can delete any review.
    """
    review = db.scalar(
        select(database_models.Review)
        .where(
            database_models.Review.id == review_id,
            database_models.Review.book_id == book_id
        )
    )
    
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found"
        )
    
    # Check if user owns the review or is admin
    if review.user_id != current_user.id and not current_user.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this review"
        )
    
    try:
        db.delete(review)
        db.commit()
        return None
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete review"
        )

