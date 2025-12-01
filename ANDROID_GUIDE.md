# How to Run KiranaAI in Android Studio

## Prerequisites
- **Android Studio** must be installed.
- **Java Development Kit (JDK)** (usually bundled with Android Studio).

## Method 1: The Easy Way (Command Line)
1. Open your terminal in the project folder (`d:\Desktop\KiranaMobile`).
2. Run the following command:
   ```bash
   npx cap open android
   ```
   This will automatically launch Android Studio and open the correct project folder.

## Method 2: The Manual Way
1. Open **Android Studio**.
2. Click **File > Open**.
3. Navigate to `d:\Desktop\KiranaMobile\android`.
   > **IMPORTANT**: Select the `android` folder inside your project, NOT the main `KiranaMobile` folder.
4. Click **OK**.

## Running the App on Emulator
1. Once Android Studio opens, wait for the **Gradle Sync** to finish (look at the bottom right status bar).
2. Look at the top toolbar. You should see a dropdown for devices (e.g., "Pixel 4 API 30" or "No Devices").
3. **If you have an emulator**:
   - Select it from the dropdown.
   - Click the green **Play** button (Run 'app').
4. **If you DON'T have an emulator**:
   - Click the **Device Manager** icon (phone icon on the right sidebar or top bar).
   - Click **Create Device**.
   - Choose a hardware profile (e.g., Pixel 6).
   - Select a System Image (Recommended: **API 33** or **API 34**). Download it if needed.
   - Click **Finish**.
   - Select your new device and click **Play**.

## Troubleshooting
- **Gradle Errors**: If you see errors about "SDK location not found", make sure your `local.properties` file exists in the `android` folder and points to your Android SDK. Android Studio usually fixes this automatically.
- **"Waiting for all target devices to come online"**: Be patient, emulators can take a minute to start.
