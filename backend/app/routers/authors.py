# backend/app/routers/authors.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.models import database_models, schemas
from sqlalchemy import select

router = APIRouter()

@router.get("/authors", response_model=List[schemas.Author])
def read_authors(db: Session = Depends(get_db), skip: int = 0, limit: int = 100):
    """
    Retrieve all authors.
    """
    stmt = select(database_models.Author).offset(skip).limit(limit)
    authors = db.scalars(stmt).all()
    return authors