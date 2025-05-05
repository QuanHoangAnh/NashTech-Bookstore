# backend/app/repositories/order_repository.py
from decimal import Decimal
from typing import List, Sequence, Dict

from sqlalchemy import select, desc
from sqlalchemy.orm import Session, selectinload

from app.models import database_models

class OrderRepository:
    """
    Handles database operations for Order and OrderItem entities.
    """
    def __init__(self, db: Session):
        self.db = db

    def create_order_with_items(
        self,
        user_id: int,
        total_amount: Decimal,
        items_data: List[Dict] # Expects list of dicts with book_id, quantity, price
    ) -> database_models.Order:
        """
        Creates Order and OrderItem records within a transaction.
        Handles commit, flush, and rollback.
        Returns the created Order object with items loaded.
        Raises Exception on commit failure.
        """
        # Create the Order record
        new_order = database_models.Order(
            user_id=user_id,
            order_amount=total_amount
        )
        self.db.add(new_order)
        try:
            self.db.flush() # Flush to get the new_order.id

            # Create OrderItem records
            for item_info in items_data:
                order_item = database_models.OrderItem(
                    order_id=new_order.id,
                    book_id=item_info["book_id"],
                    quantity=item_info["quantity"],
                    price=item_info["price"]
                )
                self.db.add(order_item)

            self.db.commit()

            # Eager load items for the response after commit
            stmt_refresh = (
                select(database_models.Order)
                .where(database_models.Order.id == new_order.id)
                .options(selectinload(database_models.Order.items))
            )
            refreshed_order = self.db.scalars(stmt_refresh).first()
            if not refreshed_order:
                 # This indicates a problem post-commit, potentially DB issues
                 raise Exception("Failed to reload created order after commit.")

            return refreshed_order

        except Exception as e:
            self.db.rollback()
            # Log the error e
            print(f"Error in OrderRepository.create_order_with_items: {e}") # Replace with proper logging
            raise # Re-raise the exception to be handled by the service/router

    def list_orders_by_user_id(self, user_id: int) -> Sequence[database_models.Order]:
        """ Fetches all orders for a given user, loading items. """
        stmt = (
            select(database_models.Order)
            .where(database_models.Order.user_id == user_id)
            .options(selectinload(database_models.Order.items)) # Eager load items
            .order_by(desc(database_models.Order.order_date))
        )
        orders = self.db.scalars(stmt).all()
        return orders