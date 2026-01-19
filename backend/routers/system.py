from fastapi import APIRouter, HTTPException
import os

router = APIRouter(
    prefix="/api/system",
    tags=["system"]
)

# Define allowed files for security
ALLOWED_DOCS = {
    "master": "WOC_MASTER_DOCUMENT.md",
    "readme": "README.md"
}

@router.get("/docs/{doc_id}")
async def get_documentation(doc_id: str):
    """
    Get system documentation content (Master Spec or README)
    """
    if doc_id not in ALLOWED_DOCS:
        raise HTTPException(status_code=404, detail="Document not found")
    
    filename = ALLOWED_DOCS[doc_id]
    
    # Assuming the backend is running in /app/backend or similar, 
    # and docs are in the project root (one level up)
    # Adjust path logic based on deployment. 
    # For local dev: c:\Users\Personal\Documents\code\web-unspec\backend Is where main.py is.
    # The files are in c:\Users\Personal\Documents\code\web-unspec\
    
    base_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) # Go up one level from routers/ to backend/, then one more to root?
    # Wait, __file__ is backend/routers/system.py
    # os.path.dirname(__file__) -> backend/routers
    # os.path.dirname(...) -> backend
    # os.path.dirname(...) -> web-unspec (ROOT)
    
    project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    
    file_path = os.path.join(project_root, filename)
    
    if not os.path.exists(file_path):
        # Fallback: Try current directory or parent directory
        # In Docker, it might be different.
        # Let's try flexible resolution
        file_path = os.path.abspath(os.path.join(os.getcwd(), "..", filename))
        if not os.path.exists(file_path):
             file_path = os.path.abspath(filename) # Try current dir
             if not os.path.exists(file_path):
                 # Last resort: Try system root (Docker mount point)
                 file_path = os.path.abspath(os.path.join("/", filename))
                 if not os.path.exists(file_path):
                    raise HTTPException(status_code=404, detail=f"File {filename} not found on server at {file_path}")

    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
        return {"content": content, "filename": filename}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
