import os
import google.generativeai as genai
from fastapi import APIRouter, UploadFile, File, HTTPException
from PIL import Image
import io
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/vision", tags=["vision"])

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    print("Warning: GEMINI_API_KEY not found in environment variables")
else:
    genai.configure(api_key=api_key)

model = genai.GenerativeModel('gemini-2.5-flash')

@router.post("/ocr")
async def process_bill(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        
        prompt = """
        Analyze this bill of lading image. Extract the list of items, their quantities, and prices.
        Return the data in a pure JSON format like this:
        [
            {"name": "Item Name", "quantity": 10, "price": 100},
            ...
        ]
        Do not include any markdown formatting or explanation. Just the JSON array.
        """
        
        response = model.generate_content([prompt, image])
        return {"data": response.text.strip()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OCR failed: {str(e)}")

@router.post("/shelf")
async def analyze_shelf(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        
        prompt = """
        Analyze this shelf image. Identify the products visible and their shelf position (e.g., "Top Shelf", "Middle Shelf", "Rack 1").
        Return the data in a pure JSON format like this:
        [
            {"name": "Product Name", "shelf": "Top Shelf"},
            ...
        ]
        Do not include any markdown formatting or explanation. Just the JSON array.
        """
        
        response = model.generate_content([prompt, image])
        return {"data": response.text.strip()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Shelf analysis failed: {str(e)}")
