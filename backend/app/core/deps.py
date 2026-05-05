import logging
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.security import decode_token
from app.models import User, RoleEnum

logger = logging.getLogger(__name__)
bearer = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
    db: Session = Depends(get_db),
) -> User:
    try:
        payload = decode_token(credentials.credentials)
        sub = payload.get("sub")
        if sub is None:
            raise ValueError("sub claim missing")
        user_id: int = int(sub)
    except (JWTError, ValueError) as e:
        logger.error("Token validation failed: %s | token_prefix=%s", e, credentials.credentials[:20])
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != RoleEnum.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return current_user


def require_annotator(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != RoleEnum.ANNOTATOR:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Annotator access required")
    return current_user
