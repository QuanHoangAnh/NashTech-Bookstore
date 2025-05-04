# backend/app/models/schemas.py
from pydantic import BaseModel, Field, EmailStr, field_validator # Import field_validator
from typing import Optional, List
from decimal import Decimal
import datetime

# --- Base Schemas ---
# (CategoryBase and AuthorBase remain the same)
class CategoryBase(BaseModel):
    category_name: str
    category_desc: Optional[str] = None

class AuthorBase(BaseModel):
    author_name: str
    author_bio: Optional[str] = None

class BookBase(BaseModel):
    book_title: str
    book_summary: Optional[str] = None
    book_price: Decimal
    book_cover_photo: Optional[str] = None

# --- Discount Schemas ---
class DiscountBase(BaseModel):
    discount_start_date: datetime.date
    discount_end_date: Optional[datetime.date] = None
    discount_price: Decimal

class Discount(DiscountBase):
    id: int
    book_id: int

    class Config:
        from_attributes = True

# --- Schemas for Reading Data (includes ID) ---
class Category(CategoryBase):
    id: int

    class Config:
        from_attributes = True

class Author(AuthorBase):
    id: int

    class Config:
        from_attributes = True

# --- Updated Book Schema for Reading ---
class Book(BookBase):
    id: int
    author: Author
    category: Category
    discount_price: Optional[Decimal] = Field(None, description="Active discount price if available")

    class Config:
        from_attributes = True

# --- OrderItem Schemas ---
class OrderItemBase(BaseModel):
    book_id: int
    quantity: int = Field(..., gt=0, le=8) # Quantity must be between 1 and 8

class OrderItemCreate(OrderItemBase):
    # Price will be determined by the backend at time of order
    pass

class OrderItem(OrderItemBase): # Schema for reading order items
    id: int
    order_id: int
    price: Decimal # Price stored at the time of order

    # Optionally include nested book details if needed when reading orders
    # book: Book # Might cause circular refs if Book includes OrderItems

    class Config:
        from_attributes = True

# --- Order Schemas ---
class OrderBase(BaseModel):
    # Basic info, maybe not needed directly
    pass

class OrderCreate(BaseModel): # Input schema for creating an order
    items: List[OrderItemCreate] # Expects a list of items to order

class Order(OrderBase): # Schema for reading an order
    id: int
    user_id: int
    order_date: datetime.datetime
    order_amount: Decimal
    items: List[OrderItem] = [] # Include the items when reading an order

    class Config:
        from_attributes = True

# --- User Schemas ---
class UserBase(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str

class UserCreate(UserBase):
    password: str

class User(UserBase): # Used for reading user details
    id: int
    admin: bool

    class Config:
        from_attributes = True

# --- Nested User Schema for Reviews (only includes necessary fields) ---
class UserInReview(BaseModel):
    id: int
    first_name: str
    last_name: str

    class Config:
        from_attributes = True


# --- Review Schemas ---
class ReviewBase(BaseModel):
    review_title: str = Field(..., max_length=120) # Add max_length validation
    review_details: Optional[str] = None
    rating_start: int = Field(..., ge=1, le=5) # Rating must be 1-5

class ReviewCreate(ReviewBase): # Input schema for creating a review
    pass # Inherits fields from ReviewBase

class Review(ReviewBase): # Schema for reading a review
    id: int
    book_id: int
    # user_id: int # Maybe not needed if nesting UserInReview
    review_date: datetime.datetime
    user: UserInReview # Include nested user info

    class Config:
        from_attributes = True

# --- New Response Schema for Book List ---
class BookListResponse(BaseModel):
    items: List[Book] # Use the existing Book schema for items
    total_count: int
    
# --- Token Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str
    refresh_token: Optional[str] = None

class TokenData(BaseModel):
    email: Optional[str] = None # Subject of the token (user's email)

# --- CartItem Schemas ---
class CartItemBase(BaseModel):
    book_id: int
    quantity: int = Field(..., gt=0, le=8)

class CartItemCreate(CartItemBase):
    pass

class CartItem(CartItemBase):
    id: int
    user_id: int
    
    class Config:
        from_attributes = True

        
