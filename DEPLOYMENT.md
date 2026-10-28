# OmniChat: GitHub Hosting & Deployment Guide

This guide explains step-by-step how to push OmniChat from your local computer to a GitHub repository, host it on GitHub Pages (or Vercel), and configure Firebase & Google Cloud Console so login and Google Drive synchronization work seamlessly.

---

## 1. Push to GitHub from Your Computer

Open your terminal or command prompt inside the project folder on your computer:

```bash
# 1. Initialize git (if not already done)
git init

# 2. Stage all project files
git add .

# 3. Create initial commit
git commit -m "Deploy OmniChat to GitHub"

# 4. Set main branch
git branch -M main

# 5. Add your GitHub repository remote
# (Replace YOUR_GITHUB_USERNAME and YOUR_REPO_NAME with your GitHub details)
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/YOUR_REPO_NAME.git

# 6. Push to GitHub
git push -u origin main
```

---

## 2. Enable GitHub Pages Automated Deployment

The project already includes `.github/workflows/deploy.yml` which builds and publishes automatically on every `git push`.

1. Go to your repository on GitHub: `https://github.com/YOUR_GITHUB_USERNAME/YOUR_REPO_NAME`
2. Click **Settings** (top tab of repository).
3. In the left sidebar, click **Pages**.
4. Under **Build and deployment > Source**, select:
   👉 **GitHub Actions**
5. Wait ~1 minute. Go to the **Actions** tab in your repository to watch the deployment build and succeed.
6. Your live website URL will be:
   `https://YOUR_GITHUB_USERNAME.github.io/YOUR_REPO_NAME/`

---

## 3. Configure Firebase Authentication

To allow users to sign in from your GitHub Pages URL:

1. Open the Firebase Console for your project:
   👉 [Firebase Authentication Settings](https://console.firebase.google.com/project/gen-lang-client-0045745983/authentication/settings)
2. Scroll to the **Authorized domains** section.
3. Click **Add domain**.
4. Enter your GitHub Pages domain (without `https://` and without subpaths):
   👉 `YOUR_GITHUB_USERNAME.github.io`
   *(Example: `venkatasubbaiahvs2003.github.io`)*
5. Click **Save**.

---

## 4. Configure Google Cloud Console (OAuth Client ID)

To allow Google Sign-In and Google Drive access from your GitHub domain:

1. Open Google Cloud Credentials:
   👉 [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials?project=gen-lang-client-0045745983)
2. Under **OAuth 2.0 Client IDs**, click on your Web client ID.
3. Under **Authorized JavaScript origins**, click **+ ADD URI**:
   👉 `https://YOUR_GITHUB_USERNAME.github.io`
   *(Note: MUST start with `https://` and have NO trailing slash)*
4. Under **Authorized redirect URIs**, verify:
   `https://gen-lang-client-0045745983.firebaseapp.com/__/auth/handler` is present.
5. Click **Save**.

---

## 5. Verify Google Drive API is Enabled

1. Open Google Cloud Library:
   👉 [Google Drive API](https://console.cloud.google.com/apis/library/drive.googleapis.com?project=gen-lang-client-0045745983)
2. Ensure the status shows **API Enabled**. If not, click **Enable**.

---

## 6. How Multi-User Sync Works on GitHub Pages

1. User A visits `https://YOUR_GITHUB_USERNAME.github.io/YOUR_REPO_NAME/` and signs in with their Google Account.
2. User A clicks **Drive Folder & Sharing** -> **Share Folder** and enters User B's Gmail address.
3. User B clicks the invitation link or opens the same website with `?folderId=<FOLDER_ID>`:
   `https://YOUR_GITHUB_USERNAME.github.io/YOUR_REPO_NAME/?folderId=<FOLDER_ID>`
4. Both users now share the exact same Google Drive data folder (`OmniChat_Data`).
5. All chats, messages, photos, and voice notes automatically synchronize directly between their Google Drives without any backend server required!
