import { ChatMessage, ChatRoom, DriveFolderConfig, MediaAttachment } from '../types';
import { getAccessToken } from './auth';

const ROOT_FOLDER_NAME = 'OmniChat_Data';
const FALLBACK_FOLDER_NAME = 'WhatsApp_Web_Data';
const MEDIA_FOLDER_NAME = 'media';
const CHATS_FILE_NAME = 'chats.json';

// In-memory cache for folder & file IDs
let cachedRootFolderId: string | null = null;
let cachedMediaFolderId: string | null = null;
let cachedChatsFileId: string | null = null;
const cachedMessagesFileIds: Record<string, string> = {};

/**
 * Helper to make authorized Google Drive API requests
 */
async function driveFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Not authenticated with Google Drive. Please sign in.');
  }

  const headers = new Headers(options.headers || {});
  headers.set('Authorization', `Bearer ${token}`);

  const url = endpoint.startsWith('http')
    ? endpoint
    : `https://www.googleapis.com/drive/v3/${endpoint}`;

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `Google Drive API error (${response.status}): ${response.statusText}`;
    try {
      const parsed = JSON.parse(errorText);
      if (parsed.error?.message) {
        errorMessage = parsed.error.message;
      }
    } catch {
      // ignore json parse error
    }
    if (
      errorMessage.toLowerCase().includes('insufficient') ||
      errorMessage.toLowerCase().includes('scope')
    ) {
      errorMessage =
        'Insufficient Google Drive permission. Please Sign Out and Sign In again, making sure to CHECK THE BOX granting Google Drive access on the Google permission screen.';
    }

    throw new Error(errorMessage);
  }

  return response;
}

/**
 * Search or create the shared WhatsApp Web root folder
 */
export async function getOrCreateRootFolder(customFolderId?: string): Promise<DriveFolderConfig> {
  if (customFolderId) {
    // Verify custom folder with supportsAllDrives
    const res = await driveFetch(
      `files/${customFolderId}?fields=id,name,webViewLink,shared,owners&supportsAllDrives=true`
    );
    const data = await res.json();
    cachedRootFolderId = data.id;
    return {
      id: data.id,
      name: data.name,
      webViewLink: data.webViewLink,
      isShared: !!data.shared,
      ownerEmail: data.owners?.[0]?.emailAddress,
    };
  }

  if (cachedRootFolderId) {
    try {
      const res = await driveFetch(`files/${cachedRootFolderId}?fields=id,name,webViewLink,shared,owners`);
      const data = await res.json();
      return {
        id: data.id,
        name: data.name,
        webViewLink: data.webViewLink,
        isShared: !!data.shared,
        ownerEmail: data.owners?.[0]?.emailAddress,
      };
    } catch {
      cachedRootFolderId = null;
    }
  }

  // Search for existing folder (OmniChat_Data or previously created WhatsApp_Web_Data)
  const q = `(name = '${ROOT_FOLDER_NAME}' or name = '${FALLBACK_FOLDER_NAME}') and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  const listRes = await driveFetch(`files?q=${encodeURIComponent(q)}&fields=files(id,name,webViewLink,shared,owners)&spaces=drive&supportsAllDrives=true&includeItemsFromAllDrives=true`);
  const listData = await listRes.json();

  if (listData.files && listData.files.length > 0) {
    const folder = listData.files[0];
    cachedRootFolderId = folder.id;
    return {
      id: folder.id,
      name: folder.name,
      webViewLink: folder.webViewLink,
      isShared: !!folder.shared,
      ownerEmail: folder.owners?.[0]?.emailAddress,
    };
  }

  // Create root folder
  const createRes = await driveFetch('files?supportsAllDrives=true', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: ROOT_FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder',
      description: 'Shared data folder for OmniChat Drive Sync. Share this folder with others to chat in real time.',
    }),
  });
  const newFolder = await createRes.json();
  cachedRootFolderId = newFolder.id;

  return {
    id: newFolder.id,
    name: newFolder.name || ROOT_FOLDER_NAME,
    webViewLink: newFolder.webViewLink,
    isShared: false,
  };
}

/**
 * Get or create the 'media' subfolder inside the root folder
 */
export async function getOrCreateMediaFolder(rootFolderId: string): Promise<string> {
  if (cachedMediaFolderId) return cachedMediaFolderId;

  const q = `'${rootFolderId}' in parents and name = '${MEDIA_FOLDER_NAME}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  const listRes = await driveFetch(`files?q=${encodeURIComponent(q)}&fields=files(id,name)`);
  const listData = await listRes.json();

  if (listData.files && listData.files.length > 0) {
    const foundId = listData.files[0].id as string;
    cachedMediaFolderId = foundId;
    return foundId;
  }

  const createRes = await driveFetch('files', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: MEDIA_FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [rootFolderId],
    }),
  });
  const data = await createRes.json();
  cachedMediaFolderId = data.id;
  return data.id;
}

const ROOMS_FOLDER_NAME = 'chats';
let cachedRoomsFolderId: string | null = null;
const cachedChatFolderIds: Record<string, string> = {};

/**
 * Get or create the master 'chats' subfolder
 */
export async function getOrCreateRoomsFolder(rootFolderId: string): Promise<string> {
  if (cachedRoomsFolderId) return cachedRoomsFolderId;

  const q = `'${rootFolderId}' in parents and name = '${ROOMS_FOLDER_NAME}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  const listRes = await driveFetch(
    `files?q=${encodeURIComponent(q)}&fields=files(id,name)&supportsAllDrives=true&includeItemsFromAllDrives=true`
  );
  const listData = await listRes.json();

  if (listData.files && listData.files.length > 0) {
    cachedRoomsFolderId = listData.files[0].id;
    return cachedRoomsFolderId!;
  }

  const createRes = await driveFetch('files?supportsAllDrives=true', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: ROOMS_FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [rootFolderId],
    }),
  });
  const data = await createRes.json();
  cachedRoomsFolderId = data.id;
  return data.id;
}

/**
 * Get or create a private subfolder for a specific chat room
 */
export async function getOrCreateChatSubfolder(
  rootFolderId: string,
  chatId: string,
  chatName?: string
): Promise<string> {
  if (cachedChatFolderIds[chatId]) return cachedChatFolderIds[chatId];

  const roomsFolderId = await getOrCreateRoomsFolder(rootFolderId);
  const folderName = `room_${chatId}`;
  const q = `'${roomsFolderId}' in parents and name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  const listRes = await driveFetch(
    `files?q=${encodeURIComponent(q)}&fields=files(id,name)&supportsAllDrives=true&includeItemsFromAllDrives=true`
  );
  const listData = await listRes.json();

  if (listData.files && listData.files.length > 0) {
    const id = listData.files[0].id as string;
    cachedChatFolderIds[chatId] = id;
    return id;
  }

  const createRes = await driveFetch('files?supportsAllDrives=true', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: folderName,
      description: `Private chat subfolder for: ${chatName || chatId}`,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [roomsFolderId],
    }),
  });
  const data = await createRes.json();
  cachedChatFolderIds[chatId] = data.id;
  return data.id;
}

/**
 * Read chats.json from Google Drive
 */
export async function fetchChatsFromDrive(rootFolderId: string): Promise<ChatRoom[]> {
  const q = `'${rootFolderId}' in parents and name = '${CHATS_FILE_NAME}' and trashed = false`;
  const listRes = await driveFetch(
    `files?q=${encodeURIComponent(q)}&fields=files(id,name,modifiedTime)&supportsAllDrives=true&includeItemsFromAllDrives=true`
  );
  const listData = await listRes.json();

  if (!listData.files || listData.files.length === 0) {
    return [];
  }

  const file = listData.files[0];
  cachedChatsFileId = file.id;

  const contentRes = await driveFetch(`files/${file.id}?alt=media&supportsAllDrives=true`);
  const text = await contentRes.text();
  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to parse chats.json from Drive:', err);
    return [];
  }
}

/**
 * Save chats.json to Google Drive
 */
export async function saveChatsToDrive(rootFolderId: string, chats: ChatRoom[]): Promise<void> {
  const jsonContent = JSON.stringify(chats, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });

  if (cachedChatsFileId) {
    // Update existing file
    await driveFetch(
      `https://www.googleapis.com/upload/drive/v3/files/${cachedChatsFileId}?uploadType=media&supportsAllDrives=true`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: blob,
      }
    );
    return;
  }

  // Check if file already exists
  const q = `'${rootFolderId}' in parents and name = '${CHATS_FILE_NAME}' and trashed = false`;
  const listRes = await driveFetch(
    `files?q=${encodeURIComponent(q)}&fields=files(id)&supportsAllDrives=true&includeItemsFromAllDrives=true`
  );
  const listData = await listRes.json();

  if (listData.files && listData.files.length > 0) {
    cachedChatsFileId = listData.files[0].id;
    await driveFetch(
      `https://www.googleapis.com/upload/drive/v3/files/${cachedChatsFileId}?uploadType=media&supportsAllDrives=true`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: blob,
      }
    );
  } else {
    // Create new file
    const metadata = {
      name: CHATS_FILE_NAME,
      parents: [rootFolderId],
      mimeType: 'application/json',
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', blob);

    const createRes = await driveFetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id&supportsAllDrives=true',
      {
        method: 'POST',
        body: form,
      }
    );
    const result = await createRes.json();
    cachedChatsFileId = result.id;
  }
}

/**
 * Fetch messages for a specific chat from Google Drive
 */
export async function fetchMessagesFromDrive(
  rootFolderId: string,
  chatId: string,
  subfolderId?: string
): Promise<ChatMessage[]> {
  const fileName = `messages_${chatId}.json`;
  let fileId = cachedMessagesFileIds[chatId];

  if (!fileId) {
    // Check inside subfolder if specified
    if (subfolderId) {
      try {
        const qSub = `'${subfolderId}' in parents and name = '${fileName}' and trashed = false`;
        const listResSub = await driveFetch(
          `files?q=${encodeURIComponent(qSub)}&fields=files(id,name)&supportsAllDrives=true&includeItemsFromAllDrives=true`
        );
        const listDataSub = await listResSub.json();
        if (listDataSub.files && listDataSub.files.length > 0) {
          fileId = listDataSub.files[0].id;
          cachedMessagesFileIds[chatId] = fileId;
        }
      } catch {
        // Fallback to checking root
      }
    }

    // Check inside root folder
    if (!fileId) {
      const q = `'${rootFolderId}' in parents and name = '${fileName}' and trashed = false`;
      const listRes = await driveFetch(
        `files?q=${encodeURIComponent(q)}&fields=files(id,name)&supportsAllDrives=true&includeItemsFromAllDrives=true`
      );
      const listData = await listRes.json();

      if (listData.files && listData.files.length > 0) {
        fileId = listData.files[0].id;
        cachedMessagesFileIds[chatId] = fileId;
      } else {
        return [];
      }
    }
  }

  try {
    const contentRes = await driveFetch(`files/${fileId}?alt=media&supportsAllDrives=true`);
    const text = await contentRes.text();
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn(`Could not read messages for ${chatId}:`, err);
    return [];
  }
}

/**
 * Save messages array for a chat to Google Drive with merge support
 */
export async function saveMessagesToDrive(
  rootFolderId: string,
  chatId: string,
  messages: ChatMessage[],
  subfolderId?: string
): Promise<void> {
  const fileName = `messages_${chatId}.json`;
  let fileId = cachedMessagesFileIds[chatId];
  const jsonContent = JSON.stringify(messages, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const targetParent = subfolderId || rootFolderId;

  if (!fileId) {
    if (subfolderId) {
      try {
        const qSub = `'${subfolderId}' in parents and name = '${fileName}' and trashed = false`;
        const listResSub = await driveFetch(
          `files?q=${encodeURIComponent(qSub)}&fields=files(id)&supportsAllDrives=true&includeItemsFromAllDrives=true`
        );
        const listDataSub = await listResSub.json();
        if (listDataSub.files && listDataSub.files.length > 0) {
          fileId = listDataSub.files[0].id;
          cachedMessagesFileIds[chatId] = fileId;
        }
      } catch {
        // fallback
      }
    }

    if (!fileId) {
      const q = `'${rootFolderId}' in parents and name = '${fileName}' and trashed = false`;
      const listRes = await driveFetch(
        `files?q=${encodeURIComponent(q)}&fields=files(id)&supportsAllDrives=true&includeItemsFromAllDrives=true`
      );
      const listData = await listRes.json();

      if (listData.files && listData.files.length > 0) {
        fileId = listData.files[0].id;
        cachedMessagesFileIds[chatId] = fileId;
      }
    }
  }

  if (fileId) {
    // Update existing file
    await driveFetch(
      `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media&supportsAllDrives=true`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: blob,
      }
    );
  } else {
    // Create file inside target folder
    const metadata = {
      name: fileName,
      parents: [targetParent],
      mimeType: 'application/json',
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', blob);

    const createRes = await driveFetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id&supportsAllDrives=true',
      {
        method: 'POST',
        body: form,
      }
    );
    const result = await createRes.json();
    cachedMessagesFileIds[chatId] = result.id;
  }
}

/**
 * Upload a media attachment (photo, voice note, document) to Google Drive
 */
export async function uploadMediaToDrive(
  rootFolderId: string,
  fileBlob: Blob,
  fileName: string,
  type: 'image' | 'audio' | 'document' | 'video',
  targetFolderId?: string
): Promise<MediaAttachment> {
  const uploadFolderId = targetFolderId || (await getOrCreateMediaFolder(rootFolderId));

  const metadata = {
    name: `${Date.now()}_${fileName}`,
    parents: [uploadFolderId],
    mimeType: fileBlob.type || 'application/octet-stream',
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', fileBlob);

  const res = await driveFetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,size,mimeType,webContentLink,webViewLink',
    {
      method: 'POST',
      body: form,
    }
  );

  const driveFile = await res.json();
  const blobUrl = URL.createObjectURL(fileBlob);
  mediaBlobUrlCache.set(driveFile.id, blobUrl);

  return {
    id: driveFile.id,
    name: fileName,
    mimeType: fileBlob.type,
    size: fileBlob.size,
    driveFileId: driveFile.id,
    url: blobUrl, // Local preview URL
    thumbnailUrl: type === 'image' ? blobUrl : undefined,
    type,
  };
}

// In-memory cache for downloaded Google Drive media blob URLs
const mediaBlobUrlCache = new Map<string, string>();

export function setCachedMediaBlobUrl(driveFileId: string, url: string) {
  mediaBlobUrlCache.set(driveFileId, url);
}

export function getCachedMediaBlobUrl(driveFileId: string): string | undefined {
  return mediaBlobUrlCache.get(driveFileId);
}

/**
 * Download or resolve a media file from Google Drive as a local Blob URL
 */
export async function fetchMediaBlobUrl(driveFileId: string): Promise<string> {
  if (mediaBlobUrlCache.has(driveFileId)) {
    return mediaBlobUrlCache.get(driveFileId)!;
  }

  const res = await driveFetch(`files/${driveFileId}?alt=media&supportsAllDrives=true`);
  const blob = await res.blob();
  const blobUrl = URL.createObjectURL(blob);
  mediaBlobUrlCache.set(driveFileId, blobUrl);
  return blobUrl;
}

/**
 * Download a media file directly to user device
 */
export async function downloadMediaFile(driveFileId: string, fileName: string): Promise<void> {
  const url = await fetchMediaBlobUrl(driveFileId);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * Delete a file from Google Drive (e.g. deleting a message attachment or chat history)
 * Note: Workspace Skill requires explicit confirmation before calling this.
 */
export async function deleteFileFromDrive(fileId: string): Promise<void> {
  await driveFetch(`files/${fileId}?supportsAllDrives=true`, {
    method: 'DELETE',
  });
}

/**
 * Share a Google Drive folder with a specific Gmail user by creating a permission
 */
export async function shareFolderWithEmail(
  folderId: string,
  emailAddress: string,
  role: 'writer' | 'reader' = 'writer'
): Promise<any> {
  const res = await driveFetch(`files/${folderId}/permissions?sendNotificationEmail=true`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      role,
      type: 'user',
      emailAddress,
    }),
  });
  return await res.json();
}

/**
 * Fetch list of people who have access to this Google Drive folder
 */
export async function fetchFolderPermissions(folderId: string): Promise<any[]> {
  try {
    const res = await driveFetch(
      `files/${folderId}/permissions?fields=permissions(id,displayName,emailAddress,role,photoLink)`
    );
    const data = await res.json();
    return data.permissions || [];
  } catch (err) {
    console.warn('Could not fetch permissions (might not be folder owner):', err);
    return [];
  }
}

/**
 * Ensure an empty folder is fully initialized with media folder and chats.json
 */
export async function ensureFolderInitialized(
  folderId: string,
  defaultChats: ChatRoom[]
): Promise<ChatRoom[]> {
  // Ensure media subfolder exists
  await getOrCreateMediaFolder(folderId);

  // Check if chats.json exists
  const existingChats = await fetchChatsFromDrive(folderId);
  if (existingChats && existingChats.length > 0) {
    return existingChats;
  }

  // Folder is empty! Seed with initial chat rooms
  await saveChatsToDrive(folderId, defaultChats);
  return defaultChats;
}

