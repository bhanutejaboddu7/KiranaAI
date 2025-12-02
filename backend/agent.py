import asyncio
import logging
from dotenv import load_dotenv
from livekit import agents, rtc
from livekit.agents import AgentServer, AgentSession, Agent, room_io
from livekit.plugins import google, noise_cancellation
from database import get_db_connection, Product, Sale
from sqlalchemy import func
from datetime import datetime
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("voice-agent")

# Load local .env
dotenv_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
load_dotenv(dotenv_path)

if not os.getenv("LIVEKIT_URL"):
    logger.error("LIVEKIT_URL not found in environment variables!")
    logger.error(f"Attempted to load .env from: {dotenv_path}")
else:
    logger.info(f"Loaded LIVEKIT_URL: {os.getenv('LIVEKIT_URL')}")

def get_shop_context():
    """Fetches a summary of inventory and recent sales for context."""
    try:
        # Create a new session for this request
        db = next(get_db_connection())
        
        # Inventory Summary
        products = db.query(Product).all()
        inventory_text = "Current Inventory:\n"
        if not products:
            inventory_text += "No items in stock.\n"
        else:
            for p in products:
                inventory_text += f"- {p.name}: {p.stock} units (Price: ₹{p.price})\n"
        
        # Sales Summary (Today)
        today = datetime.now().date()
        sales = db.query(Sale).filter(func.date(Sale.timestamp) == today).all()
        sales_text = "Sales Today:\n"
        if not sales:
            sales_text += "No sales yet today.\n"
        else:
            total_revenue = sum(s.total_amount for s in sales)
            sales_text += f"Total Revenue: ₹{total_revenue}\n"
            sales_text += f"Total Transactions: {len(sales)}\n"

        return f"{inventory_text}\n{sales_text}"
    except Exception as e:
        logger.error(f"Error fetching shop context: {e}")
        return "Error fetching shop data."

# Minimal Assistant subclass
class Assistant(Agent):
    def __init__(self) -> None:
        super().__init__(instructions="You are a helpful voice AI assistant.")

server = AgentServer()

# Helper: choose noise cancellation implementation based on participant kind
def choose_noise_cancellation(params):
    return noise_cancellation.BVCTelephony() if params.participant.kind == rtc.ParticipantKind.PARTICIPANT_KIND_SIP else noise_cancellation.BVC()

@server.rtc_session()
async def my_agent(ctx: agents.JobContext):
    """Create and start a short-lived agent session for an incoming RTC job."""
    
    # Fetch real-time context
    shop_context = get_shop_context()
    logger.info(f"Injected Context: {shop_context[:100]}...")

    # System instruction with context
    sys_instruction = (
        "System Instruction: You are KiranaAI, an intelligent and helpful shop assistant. "
        "Your goal is to assist the shopkeeper using the real-time data provided below.\n\n"
        "<shop_data>\n"
        f"{shop_context}\n"
        "</shop_data>\n\n"
        "Guidelines:\n"
        "1. **Language Matching**: You MUST reply in the EXACT SAME language as the user's input. "
        "If the user speaks Hindi, reply in Hindi. If Telugu, reply in Telugu. If English, reply in English.\n"
        "2. **Voice-Only Output**: You are a voice assistant. Do NOT output any internal thoughts, headers, markdown formatting (like **bold**, ## headers), or status updates.\n"
        "3. **Conciseness**: Be direct, natural, and concise. Do not narrate your actions (e.g., 'Checking the database...'). Just give the answer.\n"
        "4. **Data Grounding**: Use the data in <shop_data> to answer questions accurately. If the information is not there, politely say you don't know."
    )

    llm = google.realtime.RealtimeModel(
        model="gemini-2.5-flash-native-audio-preview-09-2025",
        voice="Kore",
        temperature=0.6,
        instructions=sys_instruction,
    )

    session = AgentSession(
        llm=llm,
    )

    await session.start(
        room=ctx.room,
        agent=Assistant(),
        room_options=room_io.RoomOptions(
            audio_input=room_io.AudioInputOptions(
                noise_cancellation=choose_noise_cancellation,
            ),
        ),
    )

    await session.generate_reply(
        instructions=(
            "Greet the user and offer your assistance. You should start by speaking in English."
        )
    )

if __name__ == "__main__":
    agents.cli.run_app(server)
