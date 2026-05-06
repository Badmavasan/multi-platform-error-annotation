import json
import os
from pathlib import Path
from sqlalchemy.orm import Session
from app.models import User, PredefinedError, PlatformEnum, RoleEnum
from app.core.security import hash_password

DATA_DIR = Path(__file__).parent / "data"

PLATFORM_FILES = {
    PlatformEnum.ALGOPYTHON: DATA_DIR / "algopython-errors.json",
    PlatformEnum.PYRATES:    DATA_DIR / "pyrates-errors.json",
    PlatformEnum.SPY:        DATA_DIR / "spy-errors.json",
}


def _load_platform_errors(path: Path) -> list[dict]:
    if not path.exists():
        return []
    with open(path) as f:
        data = json.load(f)
    return data if isinstance(data, list) else []


def run_seed(db: Session):
    # Seed admin user
    admin = db.query(User).filter(User.username == "admin").first()
    if not admin:
        password = os.environ.get("ADMIN_PASSWORD")
        if not password:
            raise RuntimeError("ADMIN_PASSWORD environment variable is required to seed the admin user.")
        db.add(User(
            username="admin",
            name="Admin",
            hashed_password=hash_password(password),
            role=RoleEnum.ADMIN,
        ))

    # Add errors from JSON that are missing in the DB. Never delete existing ones.
    for platform, json_path in PLATFORM_FILES.items():
        entries = _load_platform_errors(json_path)
        for i, entry in enumerate(entries):
            error_tag = entry.get("error_tag", "").strip()
            if not error_tag:
                continue
            description = entry.get("error_description") or entry.get("description", "")
            exists = (
                db.query(PredefinedError)
                .filter(
                    PredefinedError.error_tag == error_tag,
                    PredefinedError.platform == platform,
                )
                .first()
            )
            if not exists:
                db.add(PredefinedError(
                    platform=platform,
                    error_tag=error_tag,
                    description=description,
                    display_order=entry.get("display_order", i),
                ))
            elif not exists.description and description:
                exists.description = description

    db.commit()
