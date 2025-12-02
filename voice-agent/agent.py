from dotenv import load_dotenv

from livekit import agents, rtc
from livekit.agents import AgentServer, AgentSession, Agent, room_io
from livekit.plugins import google, noise_cancellation

# Load local .env
load_dotenv('.env.local')

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
    """Create and start a short-lived agent session for an incoming RTC job.

    The function is intentionally compact: model config, room options and the
    initial prompt are all declared inline for clarity.
    """
    llm = google.realtime.RealtimeModel(
        model="gemini-2.5-flash-native-audio-preview-09-2025",
        voice="Kore",
        temperature=0.6,
        instructions="You are a helpful assistant",
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
