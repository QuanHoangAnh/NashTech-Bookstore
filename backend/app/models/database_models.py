# backend/app/models/database_models.py
from sqlalchemy import (
    Column, Integer, String, Text, Numeric, ForeignKey, 
    Date, TIMESTAMP, Boolean, BigInteger, SmallInteger, UniqueConstraint
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base
import datetime

class Category(Base):
    __tablename__ = "category"
    id = Column(BigInteger, primary_key=True, index=True)
    category_name = Column(String(120), nullable=False, index=True)
    category_desc = Column(String(255))
    books = relationship("Book", back_populates="category")

class Author(Base):
    __tablename__ = "author"
    id = Column(BigInteger, primary_key=True, index=True)
    author_name = Column(String(255), nullable=False, index=True)
    author_bio = Column(Text)
    books = relationship("Book", back_populates="author")

class Book(Base):
    __tablename__ = "book"
    # ... book columns ...
    id = Column(BigInteger, primary_key=True, index=True)
    category_id = Column(BigInteger, ForeignKey("category.id"), nullable=False)
    author_id = Column(BigInteger, ForeignKey("author.id"), nullable=False)
    book_title = Column(String(255), nullable=False, index=True)
    book_summary = Column(Text)
    book_price = Column(Numeric(5, 2), nullable=False)
    book_cover_photo = Column(String(20))

    category = relationship("Category", back_populates="books")
    author = relationship("Author", back_populates="books")
    discounts = relationship("Discount", back_populates="book")
    order_items = relationship("OrderItem", back_populates="book")
    # Add relationship to Review
    reviews = relationship("Review", back_populates="book")

# New Discount Model
class Discount(Base):
    __tablename__ = "discount"
    id = Column(BigInteger, primary_key=True, index=True)
    book_id = Column(BigInteger, ForeignKey("book.id"), nullable=False, index=True)
    discount_start_date = Column(Date, nullable=False)
    discount_end_date = Column(Date, nullable=True)
    discount_price = Column(Numeric(5, 2), nullable=False)
    book = relationship("Book", back_populates="discounts")

class User(Base):
    __tablename__ = "user"
    # ... user columns ...
    id = Column(BigInteger, primary_key=True, index=True)
    first_name = Column(String(50), nullable=False)
    last_name = Column(String(50), nullable=False)
    email = Column(String(70), unique=True, index=True, nullable=False)
    password = Column(String(255), nullable=False)
    admin = Column(Boolean, default=False)

    orders = relationship("Order", back_populates="user")
    # Add relationship to Review
    reviews = relationship("Review", back_populates="user")
    cart_items = relationship("CartItem", back_populates="user", cascade="all, delete-orphan")


class Order(Base): # Ensure Order is defined before OrderItem if not already
     __tablename__ = "order"
     # ... order columns ...
     id = Column(BigInteger, primary_key=True, index=True)
     user_id = Column(BigInteger, ForeignKey("user.id"), nullable=False)
     order_date = Column(TIMESTAMP(timezone=False), server_default=func.now())
     order_amount = Column(Numeric(8, 2), nullable=False)

     user = relationship("User", back_populates="orders")
     items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base): # Ensure OrderItem is defined
     __tablename__ = "order_item"
     # ... order_item columns ...
     id = Column(BigInteger, primary_key=True, index=True)
     order_id = Column(BigInteger, ForeignKey("order.id"), nullable=False)
     book_id = Column(BigInteger, ForeignKey("book.id"), nullable=False)
     quantity = Column(SmallInteger, nullable=False)
     price = Column(Numeric(5, 2), nullable=False)

     order = relationship("Order", back_populates="items")
     book = relationship("Book", back_populates="order_items")

# --- New Review Model ---
class Review(Base):
    __tablename__ = "review"
    id = Column(BigInteger, primary_key=True, index=True)
    book_id = Column(BigInteger, ForeignKey("book.id"), nullable=False, index=True)
    user_id = Column(BigInteger, ForeignKey("user.id"), nullable=False, index=True) # Reviews must be by users
    review_title = Column(String(120), nullable=False) # Max length 120
    review_details = Column(Text, nullable=True) # Optional details
    # ERD shows rating_start as varchar(255)? Let's assume it should be integer rating 1-5
    rating_start = Column(SmallInteger, nullable=False) # Store rating as 1, 2, 3, 4, 5
    review_date = Column(TIMESTAMP(timezone=False), server_default=func.now()) # Default to now

    book = relationship("Book", back_populates="reviews")
    user = relationship("User", back_populates="reviews")

class CartItem(Base):
    __tablename__ = "cart_item"
    
    id = Column(BigInteger, primary_key=True, index=True)
    user_id = Column(BigInteger, ForeignKey("user.id"), nullable=False)
    book_id = Column(BigInteger, ForeignKey("book.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    
    user = relationship("User", back_populates="cart_items")
    book = relationship("Book")
    
    __table_args__ = (
        UniqueConstraint('user_id', 'book_id', name='uq_cart_item_user_book'),
    )
