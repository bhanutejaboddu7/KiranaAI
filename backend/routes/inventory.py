from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import database, models

router = APIRouter(prefix="/inventory", tags=["inventory"])

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/", response_model=List[models.Product])
def read_products(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    products = db.query(database.Product).offset(skip).limit(limit).all()
    return products

@router.post("/", response_model=models.Product)
def create_product(product: models.ProductCreate, db: Session = Depends(get_db)):
    db_product = database.Product(**product.dict())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

@router.post("/bulk", response_model=List[models.Product])
def create_products_bulk(products: List[models.ProductCreate], db: Session = Depends(get_db)):
    new_products = []
    for product in products:
        db_product = database.Product(**product.dict())
        db.add(db_product)
        new_products.append(db_product)
    db.commit()
    for p in new_products:
        db.refresh(p)
    return new_products

@router.put("/{product_id}", response_model=models.Product)
def update_product(product_id: int, product: models.ProductCreate, db: Session = Depends(get_db)):
    db_product = db.query(database.Product).filter(database.Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    for key, value in product.dict().items():
        setattr(db_product, key, value)
    
    db.commit()
    db.refresh(db_product)
    return db_product

@router.delete("/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db)):
    db_product = db.query(database.Product).filter(database.Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    db.delete(db_product)
    db.commit()
    return {"message": "Product deleted"}
