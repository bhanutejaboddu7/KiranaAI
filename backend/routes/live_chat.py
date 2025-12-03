import os
import io
import base64
import google.generativeai as genai
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from gtts import gTTS
from .. import database, models
from dotenv import load_dotenv

from pathlib import Path
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

router = APIRouter(prefix="/live", tags=["live"])

api_key = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=api_key)

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_shop_context(db: Session):
    # Fetch products and recent sales to build context
    products = db.execute(text("SELECT name, price, stock, shelf_position FROM products")).fetchall()
    sales = db.execute(text("SELECT p.name, s.quantity, s.total_amount, s.timestamp FROM sales s JOIN products p ON s.product_id = p.id ORDER BY s.timestamp DESC LIMIT 5")).fetchall()
    
    context = "Current Inventory:\n"
    for p in products:
        context += f"- {p.name}: Price ₹{p.price}, Stock {p.stock}, Shelf {p.shelf_position}\n"
    
    context += "\nRecent Sales:\n"
    for s in sales:
        context += f"- Sold {s.quantity} {s.name} for ₹{s.total_amount} at {s.timestamp}\n"
        
    return context

def detect_language(text):
    for char in text:
        if '\u0900' <= char <= '\u097F': # Devanagari
            return 'hi'
        if '\u0C00' <= char <= '\u0C7F': # Telugu
            return 'te'
    return 'en'

@router.post("/chat")
async def live_chat(file: UploadFile = File(...), db: Session = Depends(get_db)):
    try:
        # Read audio file
        audio_content = await file.read()
        
        # Get context
        shop_context = get_shop_context(db)
        
        system_instruction = (
            "System Instruction: You are a helpful shop assistant for KiranaAI. "
            "You have access to the following real-time shop data:\n\n"
            f"{shop_context}\n\n"
            "Use this data to answer user queries accurately. "
            "Answer concisely. You MUST reply in the SAME language as the user's input. "
            "If the user speaks Hindi, reply in Hindi. If Telugu, reply in Telugu. "
            "CRITICAL: You are a voice assistant. Do NOT output any internal thoughts, headers, or status updates like 'Reviewing the Shop Status'. "
            "Do NOT narrate your actions. Do NOT use markdown formatting like bold or headers. "
            "Just provide the final spoken response directly and naturally."
        )
        
        model = genai.GenerativeModel('gemini-2.5-flash', system_instruction=system_instruction)
        
        # Generate response from audio
        # Note: We assume the audio is in a format Gemini accepts (mp3, wav, aac, etc.)
        # Browser MediaRecorder usually outputs webm/ogg. Gemini supports these.
        response = model.generate_content([
            {"mime_type": file.content_type or "audio/webm", "data": audio_content},
            "Listen to the user and respond."
        ])
        
        text_response = response.text.strip()
        
        # Detect language for TTS
        lang = detect_language(text_response)
        
        # Convert text to speech
        tts = gTTS(text=text_response, lang=lang, tld='co.in' if lang == 'en' else 'com') 
        
        mp3_fp = io.BytesIO()
        tts.write_to_fp(mp3_fp)
        mp3_fp.seek(0)
        audio_base64 = base64.b64encode(mp3_fp.read()).decode('utf-8')
        
        return {
            "text_response": text_response,
            "audio_base64": audio_base64,
            "language": lang
        }
        
    except Exception as e:
        print(f"Error in live chat: {str(e)}")
        # Return a safe error response that the frontend can handle
        return {
            "text_response": "I'm having trouble hearing you. Please try again.",
            "error": str(e)
        }
