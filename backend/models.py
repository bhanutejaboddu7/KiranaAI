from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class ProductBase(BaseModel):
    name: str
    category: str
    price: float
    stock: int
    shelf_position: Optional[str] = None
    image_url: Optional[str] = None

class ProductCreate(ProductBase):
    pass

class Product(ProductBase):
    id: int

    class Config:
        from_attributes = True

class SaleCreate(BaseModel):
    product_id: int
    quantity: int

class Sale(BaseModel):
    id: int
    product_id: int
    quantity: int
    total_amount: float
    timestamp: datetime
    product_name: Optional[str] = None # Helper for frontend display

    class Config:
        from_attributes = True

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = []

class ChatResponse(BaseModel):
    response: str
    sql_query: Optional[str] = None
