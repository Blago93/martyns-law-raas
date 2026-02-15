# User Testing Guide - Martyn's Law RaaS

## 1. Login Credentials
To access the testing environment, use the following credentials:
- **Username:** `testowner`
- **Password:** `Safety1st`

## 2. How to Test on Mobile (Phone/Tablet)
You can test the "Video Audit" feature directly on your phone without installing an app store app.

1.  **Start the Server:**
    Ensure the development server is running on your PC:
    ```bash
    cd frontend
    npm run dev
    ```

2.  **Find Your Network Address:**
    Open a new terminal on your PC and run:
    ```bash
    node scripts/show_access_info.js
    ```
    This will display something like: `http://192.168.1.15:3000`

3.  **Connect via Phone:**
    - Make sure your phone is on the **same Wi-Fi network** as your PC.
    - Open Chrome (Android) or Safari (iOS).
    - Type in the address from Step 2 (e.g., `192.168.1.15:3000`).

4.  **Log In:**
    - You will see the RaaS Login Screen.
    - Enter `testowner` / `Safety1st`.

5.  **Run the Audit:**
    - Tap **"Start Video Audit"**.
    - Allow Camera/Microphone permissions when asked.
    - Record your walkthrough.
    - Test "Pause", "Resume", and "Discard" to see how the app handles interruptions.
    - Click "Finish & Secure" to generate the Digital Thread Hash.

## 3. Features to Test
- **Voiceover:** Try speaking while recording.
- **Interruption:** Try pausing the video halfway through and resuming.
- **Mistake:** Try starting a recording, deciding it's bad, hitting "Discard & Restart", and capturing a clean take.
