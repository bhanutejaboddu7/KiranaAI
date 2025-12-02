import google.genai as genai
import inspect

print("SDK Version:", genai.__version__)

# Try to find LiveConnectConfig or similar
if hasattr(genai, 'types'):
    print("\nFound genai.types")
    for name, obj in inspect.getmembers(genai.types):
        if "Live" in name or "Config" in name:
            print(f"- {name}")
            
    if hasattr(genai.types, 'LiveConnectConfig'):
        print("\nInspecting LiveConnectConfig:")
        print(inspect.signature(genai.types.LiveConnectConfig))
        print(genai.types.LiveConnectConfig.__annotations__)

# Also check client.aio.live.connect signature
try:
    client = genai.Client(api_key="TEST")
    print("\nclient.aio.live.connect signature:")
    print(inspect.signature(client.aio.live.connect))
except Exception as e:
    print(f"Error inspecting client: {e}")
