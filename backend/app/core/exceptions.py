# backend/app/core/exceptions.py

class OrderCreationError(Exception):
    """Base exception for order creation errors."""
    pass

class EmptyOrderError(OrderCreationError):
    """Exception raised when attempting to create an empty order."""
    pass

class ItemUnavailableError(OrderCreationError):
    """Exception raised when one or more items in an order are unavailable."""
    def __init__(self, unavailable_ids: list[int]):
        self.unavailable_ids = unavailable_ids
        super().__init__(f"Some items are not available: {unavailable_ids}")

class InvalidQuantityError(OrderCreationError):
    """Exception raised for invalid item quantity during order creation."""
    def __init__(self, book_id: int, quantity: int):
        self.book_id = book_id
        self.quantity = quantity
        super().__init__(f"Invalid quantity {quantity} for book ID {book_id}. Must be between 1 and 8.")