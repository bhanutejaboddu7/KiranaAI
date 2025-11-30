from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, init_db
from .routes import inventory, sales, chat, mandi, vision

# Initialize database
init_db()

app = FastAPI(title="Kirana Shop Talk to Data")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all for dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(inventory.router)
app.include_router(sales.router)
app.include_router(chat.router)
app.include_router(mandi.router)
app.include_router(vision.router)

@app.get("/")
def read_root():
    return {"message": "Kirana Shop API is running"}
