import requests
import wave
import struct
import os

# Create a dummy wav file (1 second of silence)
def create_dummy_wav(filename):
    with wave.open(filename, 'w') as f:
        f.setnchannels(1)
        f.setsampwidth(2)
        f.setframerate(44100)
        f.writeframes(b'\x00\x00' * 44100)

create_dummy_wav('test.wav')

try:
    url = 'http://localhost:8000/live/chat'
    files = {'file': ('test.wav', open('test.wav', 'rb'), 'audio/wav')}
    
    print(f"Sending request to {url}...")
    response = requests.post(url, files=files)
    
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        with open('error.log', 'w', encoding='utf-8') as f:
            f.write(str(data))
        print("Full Response written to error.log")
    else:
        print("Error Response:", response.text)

except Exception as e:
    print(f"Test failed: {e}")

finally:
    if os.path.exists('test.wav'):
        os.remove('test.wav')
