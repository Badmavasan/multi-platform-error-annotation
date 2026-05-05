import os
import uuid
import shutil
from contextlib import asynccontextmanager
from fastapi import FastAPI, UploadFile, File, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text
from app.database import engine, Base, SessionLocal
from app.seed import run_seed
from app.routers import auth, users, errors, contexts, assignments, annotations, admin_annotations
from app.core.deps import require_admin

UPLOAD_DIR = "/app/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "gif", "webp"}


def _migrate(conn):
    conn.execute(text(
        "ALTER TABLE predefined_errors ADD COLUMN IF NOT EXISTS error_tag VARCHAR(100) NOT NULL DEFAULT ''"
    ))
    conn.execute(text("ALTER TABLE predefined_errors DROP COLUMN IF EXISTS name"))
    conn.execute(text("ALTER TABLE users DROP COLUMN IF EXISTS email"))
    conn.execute(text("ALTER TABLE annotations DROP COLUMN IF EXISTS has_missing_errors"))
    conn.execute(text("ALTER TABLE annotations DROP COLUMN IF EXISTS missing_errors_text"))
    conn.execute(text(
        "ALTER TABLE annotations ADD COLUMN IF NOT EXISTS has_additional_errors BOOLEAN NOT NULL DEFAULT false"
    ))
    conn.execute(text(
        "ALTER TABLE annotations ADD COLUMN IF NOT EXISTS additional_errors_text TEXT"
    ))
    conn.commit()


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    with engine.connect() as conn:
        _migrate(conn)
    db = SessionLocal()
    try:
        run_seed(db)
    finally:
        db.close()
    yield


app = FastAPI(title="Error Annotation Platform", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

app.include_router(auth.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")
app.include_router(errors.router, prefix="/api/v1")
app.include_router(contexts.router, prefix="/api/v1")
app.include_router(assignments.router, prefix="/api/v1")
app.include_router(annotations.router, prefix="/api/v1")
app.include_router(admin_annotations.router, prefix="/api/v1")


@app.post("/api/v1/upload/image")
async def upload_image(
    file: UploadFile = File(...),
    _=Depends(require_admin),
):
    ext = (file.filename or "").rsplit(".", 1)[-1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Only JPG, PNG, GIF, WEBP images are allowed")
    filename = f"{uuid.uuid4().hex}.{ext}"
    dest = os.path.join(UPLOAD_DIR, filename)
    with open(dest, "wb") as f:
        shutil.copyfileobj(file.file, f)
    return {"url": f"/uploads/{filename}"}


@app.get("/api/v1/health")
def health():
    return {"status": "ok"}
