"""
drive_service.py
Modul Layanan Backend Google Drive API dengan Service Account (Python)
untuk Pengelolaan Rekaman Suara & Video Wawancara Logbook Penelitian.

Dependensi:
    pip install google-api-python-client google-auth firebase-admin
"""

import os
import mimetypes
from datetime import datetime
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload, MediaFileUpload

try:
    import firebase_admin
    from firebase_admin import firestore
except ImportError:
    firebase_admin = None
    firestore = None


class GoogleDriveMediaService:
    def __init__(self, credentials_path=None, parent_folder_id=None):
        self.credentials_path = credentials_path or os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "credentials.json")
        self.parent_folder_id = parent_folder_id or os.getenv("GOOGLE_DRIVE_PARENT_FOLDER_ID")
        self.root_folder_name = "Logbook_Penelitian_App"
        self._drive_service = None

    def get_drive_service(self):
        """Inisialisasi klien Google Drive API v3 (Mendukung OAuth 2.0 Refresh Token & Service Account)."""
        if self._drive_service:
            return self._drive_service

        scopes = ["https://www.googleapis.com/auth/drive"]

        # 1. Prioritaskan OAuth 2.0 Refresh Token (Akun Google One 5 TB)
        client_id = os.getenv("GOOGLE_DRIVE_CLIENT_ID")
        client_secret = os.getenv("GOOGLE_DRIVE_CLIENT_SECRET")
        refresh_token = os.getenv("GOOGLE_DRIVE_REFRESH_TOKEN")

        if client_id and client_secret and refresh_token:
            from google.oauth2.credentials import Credentials
            creds = Credentials(
                token=None,
                refresh_token=refresh_token,
                token_uri="https://oauth2.googleapis.com/token",
                client_id=client_id,
                client_secret=client_secret,
                scopes=scopes
            )
            self._drive_service = build("drive", "v3", credentials=creds)
            return self._drive_service

        # 2. Fallback Service Account
        if not os.path.exists(self.credentials_path):
            raise FileNotFoundError(f"Kredensial Google Drive tidak ditemukan di: {self.credentials_path}")

        creds = service_account.Credentials.from_service_account_file(
            self.credentials_path, scopes=scopes
        )
        self._drive_service = build("drive", "v3", credentials=creds)
        return self._drive_service

    def get_or_create_folder(self, folder_name: str, parent_id: str = None) -> str:
        """Memastikan folder ada di Google Drive (Idempotent)."""
        drive = self.get_drive_service()
        safe_name = folder_name.replace("'", "\\'")
        query = f"mimeType = 'application/vnd.google-apps.folder' and name = '{safe_name}' and trashed = false"
        if parent_id:
            query += f" and '{parent_id}' in parents"

        results = drive.files().list(
            q=query, spaces="drive", fields="files(id, name)", pageSize=1
        ).execute()
        files = results.get("files", [])
        if files:
            return files[0]["id"]

        # Buat folder baru jika belum ada
        metadata = {
            "name": folder_name,
            "mimeType": "application/vnd.google-apps.folder"
        }
        if parent_id:
            metadata["parents"] = [parent_id]

        folder = drive.files().create(body=metadata, fields="id, name").execute()
        return folder["id"]

    def ensure_interview_folder_hierarchy(self, user_id: str, logbook_id: str) -> str:
        """
        Memastikan struktur hierarki folder 3 tingkat:
        [Logbook_Penelitian_App] -> [User_[User_ID]] -> [Wawancara_[Logbook_ID]]
        """
        if not user_id:
            raise ValueError("user_id wajib diisi")
        if not logbook_id:
            raise ValueError("logbook_id wajib diisi")

        # 1. Folder Induk
        root_folder_id = self.parent_folder_id
        if not root_folder_id:
            root_folder_id = self.get_or_create_folder(self.root_folder_name)

        # 2. Folder User: User_[User_ID]
        user_folder_name = f"User_{user_id}"
        user_folder_id = self.get_or_create_folder(user_folder_name, root_folder_id)

        # 3. Folder Sesi Wawancara: Wawancara_[Logbook_ID]
        interview_folder_name = f"Wawancara_{logbook_id}"
        interview_folder_id = self.get_or_create_folder(interview_folder_name, user_folder_id)

        return interview_folder_id

    def detect_media_type(self, file_name: str, mime_type: str = "") -> str:
        """Menentukan apakah file audio atau video."""
        mt = (mime_type or "").lower()
        ext = os.path.splitext(file_name)[1].lower()

        if mt.startswith("audio/") or ext in [".mp3", ".m4a", ".wav", ".aac", ".ogg", ".weba", ".flac"]:
            return "audio"
        if mt.startswith("video/") or ext in [".mp4", ".mov", ".avi", ".mkv", ".webm", ".3gp"]:
            return "video"
        return "audio"

    def upload_interview_media(
        self,
        user_id: str,
        logbook_id: str,
        file_path_or_stream,
        file_name: str,
        mime_type: str = None,
        make_public: bool = True
    ) -> dict:
        """
        Mengunggah berkas rekaman ke sub-folder wawancara yang tepat.
        """
        drive = self.get_drive_service()
        target_folder_id = self.ensure_interview_folder_hierarchy(user_id, logbook_id)

        if not mime_type:
            mime_type, _ = mimetypes.guess_type(file_name)
            mime_type = mime_type or "application/octet-stream"

        if isinstance(file_path_or_stream, str) and os.path.exists(file_path_or_stream):
            media = MediaFileUpload(file_path_or_stream, mimetype=mime_type, resumable=True)
        else:
            media = MediaIoBaseUpload(file_path_or_stream, mimetype=mime_type, resumable=True)

        file_metadata = {
            "name": file_name,
            "parents": [target_folder_id]
        }

        created_file = drive.files().create(
            body=file_metadata,
            media_body=media,
            fields="id, name, webViewLink, webContentLink, mimeType"
        ).execute()

        file_id = created_file.get("id")
        web_view_link = created_file.get("webViewLink") or f"https://drive.google.com/file/d/{file_id}/view"

        # Berikan izin baca publik reader jika diinginkan
        if make_public:
            try:
                drive.permissions().create(
                    fileId=file_id,
                    body={"role": "reader", "type": "anyone"}
                ).execute()
            except Exception as perm_err:
                print(f"[WARN] Gagal menyetel reader permission: {perm_err}")

        media_type = self.detect_media_type(file_name, mime_type)

        return {
            "file_id": file_id,
            "file_name": file_name,
            "file_type": media_type,
            "web_view_link": web_view_link
        }

    def save_media_to_firestore(self, user_id: str, logbook_id: str, media_metadata: dict, db=None) -> None:
        """
        Menyimpan metadata media ke subkoleksi users/{user_id}/logbooks/{logbook_id}
        pada field array wawancara_media.
        """
        if db is None:
            if firestore is None:
                raise ImportError("Pustaka firebase_admin belum diinstal.")
            db = firestore.client()

        doc_ref = db.collection("users").document(user_id).collection("logbooks").document(logbook_id)
        doc_ref.set({
            "wawancara_media": firestore.ArrayUnion([media_metadata]),
            "updatedAt": datetime.utcnow().isoformat() + "Z"
        }, merge=True)
