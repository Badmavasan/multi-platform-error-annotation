from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import User, RoleEnum
from app.schemas import UserCreate, UserOut
from app.core.security import hash_password
from app.core.deps import require_admin

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=List[UserOut])
def list_annotators(db: Session = Depends(get_db), _=Depends(require_admin)):
    return db.query(User).filter(User.role == RoleEnum.ANNOTATOR).all()


@router.post("", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_annotator(body: UserCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    if db.query(User).filter(User.username == body.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")
    user = User(
        username=body.username,
        name=body.name,
        hashed_password=hash_password(body.password),
        role=RoleEnum.ANNOTATOR,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.get("/{user_id}", response_model=UserOut)
def get_annotator(user_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    user = db.query(User).filter(User.id == user_id, User.role == RoleEnum.ANNOTATOR).first()
    if not user:
        raise HTTPException(status_code=404, detail="Annotator not found")
    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def deactivate_annotator(user_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    user = db.query(User).filter(User.id == user_id, User.role == RoleEnum.ANNOTATOR).first()
    if not user:
        raise HTTPException(status_code=404, detail="Annotator not found")
    user.is_active = False
    db.commit()
