import firebaseConfig from '../../firebase-applet-config.json';

/**
 * Google Drive Client Integration for e-Perpus
 * Handles:
 * 1. Client-side OAuth Token acquisition with GSI (Google Identity Services)
 * 2. Uploading JSON Database backups to Google Drive
 * 3. Finding and listing existing e-Perpus backups on Drive
 * 4. Downloading backup files and restoring to local server DB
 * 5. Direct file upload for digital e-Books (.pdf, .epub) to a dedicated Drive folder
 */

const GOOGLE_CLIENT_ID = firebaseConfig.oAuthClientId || '532715376248-0c9q5dikchoeaujda9ofsdtq0gglioac.apps.googleusercontent.com';

const SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.appdata'
].join(' ');

// Storage keys
const TOKEN_STORAGE_KEY = 'eperpus_gdrive_access_token';
const TOKEN_EXPIRY_KEY = 'eperpus_gdrive_token_expires_at';
const USER_INFO_KEY = 'eperpus_gdrive_user_info';

export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  createdTime?: string;
  modifiedTime?: string;
  size?: string;
  webViewLink?: string;
  webContentLink?: string;
}

export interface DriveUserInfo {
  email?: string;
  name?: string;
  picture?: string;
  storageQuota?: {
    limit?: string; // total bytes
    usage?: string; // used bytes
    usageInDrive?: string;
    usageInDriveTrash?: string;
  };
}

declare global {
  interface Window {
    google?: any;
  }
}

const PRIMARY_DB_SETTING_KEY = 'eperpus_use_drive_as_primary_db';
const LAST_SYNC_KEY = 'eperpus_last_drive_sync';
const MASTER_DB_FILE_ID_KEY = 'eperpus_master_db_file_id';

export function isDrivePrimaryDb(): boolean {
  return localStorage.getItem(PRIMARY_DB_SETTING_KEY) === 'true';
}

export function setDrivePrimaryDb(enabled: boolean): void {
  localStorage.setItem(PRIMARY_DB_SETTING_KEY, String(enabled));
}

export function getLastDriveSync(): string | null {
  return localStorage.getItem(LAST_SYNC_KEY);
}

export function setLastDriveSync(timestamp: string): void {
  localStorage.setItem(LAST_SYNC_KEY, timestamp);
}

/**
 * Get cached access token if still valid
 */
export function getStoredToken(): string | null {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  const expiresAt = localStorage.getItem(TOKEN_EXPIRY_KEY);

  if (!token || !expiresAt) return null;
  if (Date.now() >= Number(expiresAt)) {
    // Expired
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
    return null;
  }
  return token;
}

export function getStoredUserInfo(): DriveUserInfo | null {
  const info = localStorage.getItem(USER_INFO_KEY);
  if (!info) return null;
  try {
    return JSON.parse(info);
  } catch {
    return null;
  }
}

export function logoutGoogleDrive() {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
  localStorage.removeItem(USER_INFO_KEY);
  localStorage.removeItem(MASTER_DB_FILE_ID_KEY);
}

/**
 * Fetch Google Drive storage quota and user profile
 */
export async function fetchDriveAbout(token: string): Promise<DriveUserInfo | null> {
  try {
    const res = await fetch('https://www.googleapis.com/drive/v3/about?fields=storageQuota,user', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) return null;
    const data = await res.json();

    const userInfo: DriveUserInfo = {
      email: data.user?.emailAddress,
      name: data.user?.displayName,
      picture: data.user?.photoLink,
      storageQuota: data.storageQuota
    };

    localStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfo));
    return userInfo;
  } catch (err) {
    console.warn('Could not fetch Drive about info:', err);
    return null;
  }
}

/**
 * Request Google Drive OAuth token via Google Identity Services (GSI)
 * @param forceAccountSelection If true, shows the Google account chooser so the user can switch accounts
 */
export async function requestGoogleDriveAuth(forceAccountSelection: boolean = false): Promise<string> {
  return new Promise((resolve, reject) => {
    // Check if window.google is ready
    if (typeof window === 'undefined' || !window.google?.accounts?.oauth2) {
      let tries = 0;
      const interval = setInterval(() => {
        tries++;
        if (window.google?.accounts?.oauth2) {
          clearInterval(interval);
          startTokenFlow(resolve, reject, forceAccountSelection);
        } else if (tries > 20) {
          clearInterval(interval);
          reject(new Error('Google Identity Services SDK tidak dapat dimuat. Pastikan koneksi internet stabil.'));
        }
      }, 150);
      return;
    }

    startTokenFlow(resolve, reject, forceAccountSelection);
  });
}

function startTokenFlow(
  resolve: (token: string) => void, 
  reject: (err: any) => void,
  forceAccountSelection: boolean = false
) {
  try {
    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: SCOPES,
      callback: async (resp: any) => {
        if (resp.error) {
          console.error('Google OAuth error:', resp);
          return reject(new Error(resp.error_description || resp.error));
        }

        const accessToken = resp.access_token;
        const expiresIn = Number(resp.expires_in || 3500);
        const expiresAt = Date.now() + expiresIn * 1000;

        localStorage.setItem(TOKEN_STORAGE_KEY, accessToken);
        localStorage.setItem(TOKEN_EXPIRY_KEY, String(expiresAt));

        // Fetch detailed user profile and Drive storage quota
        await fetchDriveAbout(accessToken);

        resolve(accessToken);
      }
    });

    // Request access token with popup dialog (prompt select_account if switching)
    const promptParam = forceAccountSelection ? 'select_account consent' : 'consent';
    tokenClient.requestAccessToken({ prompt: promptParam });
  } catch (err) {
    reject(err);
  }
}

/**
 * Switch Google Drive Account: cleans current session and triggers account selection
 */
export async function switchGoogleDriveAccount(): Promise<string> {
  logoutGoogleDrive();
  return await requestGoogleDriveAuth(true);
}

/**
 * Ensure valid token or prompt user
 */
export async function getOrRequestToken(): Promise<string> {
  const existing = getStoredToken();
  if (existing) return existing;
  return await requestGoogleDriveAuth(false);
}

/**
 * Find or create a designated folder "E-Perpus Database & Cadangan" in user's Drive
 */
export async function getOrCreateAppFolder(token: string): Promise<string> {
  const folderName = 'E-Perpus Backup & Koleksi';
  
  // Search for folder
  const query = `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`;
  const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    throw new Error('Gagal memeriksa folder di Google Drive');
  }

  const data = await res.json();
  if (data.files && data.files.length > 0) {
    return data.files[0].id;
  }

  // Create folder if not found
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      description: 'Folder penyimpanan otomatis cadangan database dan e-book e-Perpus'
    })
  });

  if (!createRes.ok) {
    throw new Error('Gagal membuat folder cadangan di Google Drive');
  }

  const created = await createRes.json();
  return created.id;
}

/**
 * Upload database JSON snapshot directly to Google Drive
 */
export async function uploadBackupToDrive(
  token: string, 
  dbData: any, 
  customFilename?: string
): Promise<DriveFileItem> {
  const folderId = await getOrCreateAppFolder(token);

  const now = new Date();
  const dateStr = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const fileName = customFilename || `eperpus_db_backup_${dateStr}.json`;

  const metadata = {
    name: fileName,
    mimeType: 'application/json',
    parents: [folderId],
    description: `Cadangan Database Perpustakaan Otomatis per ${now.toLocaleString('id-ID')}`
  };

  const fileContent = JSON.stringify(dbData, null, 2);
  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: application/json\r\n\r\n' +
    fileContent +
    closeDelimiter;

  const uploadRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,createdTime,size,webViewLink', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`
    },
    body: multipartRequestBody
  });

  if (!uploadRes.ok) {
    const errorText = await uploadRes.text();
    throw new Error('Gagal mengunggah cadangan ke Google Drive: ' + errorText);
  }

  return await uploadRes.json();
}

/**
 * List all backup files saved in Google Drive
 */
export async function listDriveBackups(token: string): Promise<DriveFileItem[]> {
  try {
    const folderId = await getOrCreateAppFolder(token);
    const query = `'${folderId}' in parents and mimeType='application/json' and trashed=false`;
    
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&orderBy=createdTime desc&fields=files(id,name,mimeType,createdTime,modifiedTime,size,webViewLink)`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    if (!res.ok) {
      throw new Error('Gagal mengambil daftar file cadangan dari Google Drive');
    }

    const data = await res.json();
    return data.files || [];
  } catch (err) {
    console.error('Error listing drive backups:', err);
    throw err;
  }
}

/**
 * Download a backup JSON file content from Google Drive
 */
export async function downloadDriveBackupContent(token: string, fileId: string): Promise<any> {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    throw new Error('Gagal mengunduh file cadangan dari Google Drive');
  }

  return await res.json();
}

/**
 * Upload an E-Book PDF / EPUB directly to Google Drive and make it accessible/shareable
 */
export async function uploadEbookToDrive(
  token: string, 
  file: File, 
  bookTitle: string
): Promise<{ fileId: string; webViewLink: string; webContentLink?: string }> {
  const folderId = await getOrCreateAppFolder(token);

  const cleanName = `${bookTitle.replace(/[/\\?%*:|"<>]/g, '_')}_${file.name}`;
  const metadata = {
    name: cleanName,
    mimeType: file.type || 'application/pdf',
    parents: [folderId],
    description: `File E-Book untuk koleksi perpustakaan: ${bookTitle}`
  };

  const metadataBlob = new Blob([JSON.stringify(metadata)], { type: 'application/json' });
  const form = new FormData();
  form.append('metadata', metadataBlob);
  form.append('file', file);

  // Upload using resumable/multipart
  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: form
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error('Gagal mengunggah file buku ke Google Drive: ' + err);
  }

  const uploaded = await res.json();

  // Make public read-only for reading so students/teachers can view
  try {
    await fetch(`https://www.googleapis.com/drive/v3/files/${uploaded.id}/permissions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        role: 'reader',
        type: 'anyone'
      })
    });
  } catch (permErr) {
    console.warn('Could not set public permission on ebook file:', permErr);
  }

  return {
    fileId: uploaded.id,
    webViewLink: uploaded.webViewLink,
    webContentLink: uploaded.webContentLink
  };
}

const MASTER_DB_FILENAME = 'eperpus_master_database.json';

/**
 * Sync entire database to designated Master Database file on Google Drive
 */
export async function syncMasterDatabaseToDrive(token: string, dbData: any): Promise<DriveFileItem> {
  const folderId = await getOrCreateAppFolder(token);

  // Search if eperpus_master_database.json exists in the folder
  const query = `'${folderId}' in parents and name='${MASTER_DB_FILENAME}' and trashed=false`;
  const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const searchData = await searchRes.json();
  const existingFile = searchData.files && searchData.files[0];

  const fileContent = JSON.stringify(dbData, null, 2);

  if (existingFile) {
    // Update existing file content
    const updateRes = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}?uploadType=media`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: fileContent
    });

    if (!updateRes.ok) {
      throw new Error('Gagal memperbarui file database master di Google Drive');
    }

    const updated = await updateRes.json();
    setLastDriveSync(new Date().toISOString());
    localStorage.setItem(MASTER_DB_FILE_ID_KEY, existingFile.id);
    return { ...existingFile, ...updated, name: MASTER_DB_FILENAME };
  } else {
    // Create new master file
    const metadata = {
      name: MASTER_DB_FILENAME,
      mimeType: 'application/json',
      parents: [folderId],
      description: 'Master Database Aktif Perpustakaan (Sinkronisasi Otomatis Cloud)'
    };

    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      fileContent +
      closeDelimiter;

    const createRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,createdTime,modifiedTime,size', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`
      },
      body: multipartRequestBody
    });

    if (!createRes.ok) {
      throw new Error('Gagal membuat file database master di Google Drive');
    }

    const created = await createRes.json();
    setLastDriveSync(new Date().toISOString());
    localStorage.setItem(MASTER_DB_FILE_ID_KEY, created.id);
    return created;
  }
}

/**
 * Fetch and load master database file from user's Google Drive
 */
export async function fetchMasterDatabaseFromDrive(token: string): Promise<any | null> {
  const folderId = await getOrCreateAppFolder(token);
  const query = `'${folderId}' in parents and name='${MASTER_DB_FILENAME}' and trashed=false`;
  
  const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,modifiedTime,size)`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!searchRes.ok) return null;
  const searchData = await searchRes.json();
  if (!searchData.files || searchData.files.length === 0) return null;

  const fileId = searchData.files[0].id;
  return await downloadDriveBackupContent(token, fileId);
}

