file_path = r"d:\Desktop\KiranaMobile\.venv\Lib\site-packages\google\genai\types.py"

try:
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
        
    lines = content.splitlines()
    print("Searching for 'transcription'...")
    for i, line in enumerate(lines):
        if "transcription" in line.lower() and "config" in line.lower():
            print(f"Line {i+1}: {line.strip()}")
            
    print("\nSearching for 'speech_config'...")
    for i, line in enumerate(lines):
        if "speech_config" in line.lower():
            print(f"Line {i+1}: {line.strip()}")


except Exception as e:
    print(f"Error reading file: {e}")
