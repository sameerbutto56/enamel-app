import os
import uuid
import shutil
from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import List

router = APIRouter(prefix="/upload", tags=["Upload"])

# Ensure uploads directory exists
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

@router.post("/")
async def upload_files(files: List[UploadFile] = File(...)):
    uploaded_urls = []
    
    for file in files:
        # Check file extension
        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in [".jpg", ".jpeg", ".png", ".gif", ".webp", ".mp4", ".mov", ".avi"]:
            continue
            
        # Determine type
        media_type = "video" if ext in [".mp4", ".mov", ".avi"] else "image"
        
        # Generate unique filename
        filename = f"{uuid.uuid4()}{ext}"
        file_path = os.path.join(UPLOAD_DIR, filename)
        
        # Save file
        try:
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            
            # Return relative URL (assuming server is on port 8000)
            uploaded_urls.append({
                "url": f"http://192.168.10.3:8000/uploads/{filename}",
                "type": media_type,
                "filename": filename
            })
        except Exception as e:
            print(f"Error saving file: {e}")
            continue
            
    if not uploaded_urls:
        raise HTTPException(status_code=400, detail="No valid files uploaded")
        
    return uploaded_urls
