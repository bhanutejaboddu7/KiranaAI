from fastapi import APIRouter, HTTPException
import os
import logging
from livekit.api import AccessToken, VideoGrants
from dotenv import load_dotenv

router = APIRouter(prefix="/api/live-chat", tags=["live-chat"])
logger = logging.getLogger("live_chat")

# Load environment variables
dotenv_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), '.env')
load_dotenv(dotenv_path)

@router.get("/token")
async def get_token(participant_name: str = "Shopkeeper"):
    """
    Generates a LiveKit access token for the frontend to connect to the voice agent.
    """
    try:
        api_key = os.environ.get("LIVEKIT_API_KEY")
        api_secret = os.environ.get("LIVEKIT_API_SECRET")
        livekit_url = os.environ.get("LIVEKIT_URL")

        if not api_key or not api_secret or not livekit_url:
            logger.error("LiveKit credentials not found in environment variables")
            raise HTTPException(status_code=500, detail="Server misconfiguration: Missing LiveKit credentials")

        # Create a grant for the participant
        # We use a fixed room name "kirana-shop" for simplicity, or generate dynamic ones
        room_name = "kirana-shop"
        grant = VideoGrants(room_join=True, room=room_name)
        
        # Create the access token
        access_token = AccessToken(api_key, api_secret)
        access_token.identity = f"user-{participant_name}"
        access_token.name = participant_name
        access_token.with_grants(grant)
        
        token = access_token.to_jwt()
        
        logger.info(f"Generated token for participant: {participant_name} in room: {room_name}")
        
        return {
            "token": token,
            "url": livekit_url,
            "room": room_name
        }

    except Exception as e:
        logger.error(f"Error generating token: {e}")
        raise HTTPException(status_code=500, detail=str(e))
