import os
import requests
from fastapi import APIRouter, HTTPException
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/mandi", tags=["mandi"])

MANDI_API_KEY = "579b464db66ec23bdd000001b54c44682b914aa571845c4bb6d93ff3"
BASE_URL = "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070"

@router.get("/prices")
async def get_mandi_prices(limit: int = 10):
    try:
        params = {
            "api-key": MANDI_API_KEY,
            "format": "json",
            "limit": limit
        }
        response = requests.get(BASE_URL, params=params)
        response.raise_for_status()
        data = response.json()
        
        # Extract relevant records
        records = data.get("records", [])
        return {"prices": records}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch Mandi prices: {str(e)}")
