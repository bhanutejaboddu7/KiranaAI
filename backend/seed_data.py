from backend.database import SessionLocal, engine
from backend.database import SessionLocal, engine, Base, Product, Sale
from sqlalchemy import text
import datetime

def seed_data():
    db = SessionLocal()
    try:
        # Check if data exists
        if db.query(Product).count() > 0:
            print("Data already exists. Skipping seed.")
            return

        print("Seeding data...")
        
        # Products
        products = [
            Product(name="Sona Masoori Rice", price=55.0, stock=100, category="Grains", shelf_position="A1"),
            Product(name="Toor Dal", price=120.0, stock=50, category="Pulses", shelf_position="A2"),
            Product(name="Sunflower Oil 1L", price=140.0, stock=30, category="Oil", shelf_position="B1"),
            Product(name="Sugar", price=42.0, stock=80, category="Essentials", shelf_position="B2"),
            Product(name="Tata Salt", price=25.0, stock=60, category="Essentials", shelf_position="B3"),
            Product(name="Maggi Noodles", price=14.0, stock=100, category="Snacks", shelf_position="C1"),
            Product(name="Good Day Biscuit", price=20.0, stock=40, category="Snacks", shelf_position="C2"),
            Product(name="Colgate Toothpaste", price=85.0, stock=25, category="Personal Care", shelf_position="D1"),
            Product(name="Lux Soap", price=35.0, stock=50, category="Personal Care", shelf_position="D2"),
            Product(name="Surf Excel 1kg", price=110.0, stock=20, category="Household", shelf_position="E1"),
        ]
        
        db.add_all(products)
        db.commit()
        
        # Sales
        rice = db.query(Product).filter_by(name="Sona Masoori Rice").first()
        oil = db.query(Product).filter_by(name="Sunflower Oil 1L").first()
        
        sales = [
            Sale(product_id=rice.id, quantity=5, total_amount=275.0, timestamp=datetime.datetime.now() - datetime.timedelta(hours=2)),
            Sale(product_id=oil.id, quantity=2, total_amount=280.0, timestamp=datetime.datetime.now() - datetime.timedelta(hours=1)),
        ]
        
        db.add_all(sales)
        db.commit()
        print("Seeding complete!")
        
    except Exception as e:
        print(f"Error seeding data: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()
