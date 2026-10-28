# WhatsApp Web with Google Drive Sync

A decentralized WhatsApp Web interface powered by a shared Google Drive folder. No custom backend server or database is required—Google Drive acts as the real-time data layer and file store.

---

## 🚀 How It Works (Decentralized Google Drive Architecture)

1. **Shared Drive Data Store**:
   - The app connects to a shared folder in Google Drive (by default `WhatsApp_Web_Data` or any custom shared folder ID).
   - `chats.json`: Stores all chat channels, participant emails, and last-message snippets.
   - `messages_{chatId}.json`: Stores full message streams with timestamps, reactions, and reply references.
   - `media/` subfolder: Binary storage for shared photos, documents, and recorded voice notes.
2. **Real-time Client Synchronization**:
   - The browser polls the shared Google Drive folder every 5 seconds.
   - When any participant sends a message or reacts, the Drive file changes, and all connected users immediately update in sync.
3. **1-Click Room Invitation**:
   - Users can share the folder directly via Google Drive with friends or team members.
   - App URLs with `?folderId=<FOLDER_ID>` automatically open into the shared room.

---

## 🌐 How to Host on GitHub Pages

Because this application is 100% client-side:

### Step 1: Create a GitHub Repository
Push this codebase to your GitHub repository on the `main` branch.

### Step 2: Configure GitHub Pages
1. Go to your repository on GitHub.
2. Navigate to **Settings** > **Pages**.
3. Under **Build and deployment** > **Source**, choose **GitHub Actions**.
4. The workflow in `.github/workflows/deploy.yml` will automatically build and publish your app every time you push changes!

### Step 3: Google Cloud OAuth Settings
1. Open the [Google Cloud Console](https://console.cloud.google.com/).
2. Go to **APIs & Services** > **Credentials**.
3. Select your Web OAuth 2.0 Client ID.
4. Under **Authorized JavaScript Origins**, add:
   ```
   https://<your-github-username>.github.io
   ```
5. Save your changes. Users can now sign in with Google directly on your GitHub Pages site!

---

## 🛠️ Features Included
- **WhatsApp Web Dark UI**: Pixel-accurate WhatsApp layout with signature teal/green accents, doodle wallpaper pattern, and message bubbles.
- **Audio Voice Notes**: Browser microphone recording using `MediaRecorder` with live waveform bars and audio playback.
- **Media Attachments**: Photo previews and document downloads backed by Google Drive.
- **Message Reactions**: Quick emoji reactions synchronized across all participants.
- **Group & Direct Chats**: Create 1-on-1 chats or multi-user groups with Gmail participant addresses.
- **Safety**: Complies with Google Workspace integration security and user confirmation requirements for destructive actions.
