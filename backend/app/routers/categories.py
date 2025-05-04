# backend/app/routers/categories.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.models import database_models, schemas # Import both model types
from sqlalchemy import select # Use select for SQLAlchemy 2.0 style

router = APIRouter()

@router.get("/categories", response_model=List[schemas.Category])
def read_categories(db: Session = Depends(get_db), skip: int = 0, limit: int = 100):
    """
    Retrieve all categories.
    """
    # SQLAlchemy 2.0 style query
    stmt = select(database_models.Category).offset(skip).limit(limit)
    categories = db.scalars(stmt).all()
    return categories