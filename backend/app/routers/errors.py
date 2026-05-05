from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import func
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models import PredefinedError, PlatformEnum
from app.schemas import PredefinedErrorOut, PredefinedErrorCreate, PredefinedErrorUpdate
from app.core.deps import get_current_user, require_admin

router = APIRouter(prefix="/errors", tags=["errors"])


@router.get("", response_model=List[PredefinedErrorOut])
def list_errors(
    platform: Optional[PlatformEnum] = Query(None),
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    q = db.query(PredefinedError)
    if platform:
        q = q.filter(PredefinedError.platform == platform)
    return q.order_by(PredefinedError.display_order, PredefinedError.id).all()


@router.post("", response_model=PredefinedErrorOut, status_code=status.HTTP_201_CREATED)
def create_error(
    body: PredefinedErrorCreate,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    max_order = (
        db.query(func.max(PredefinedError.display_order))
        .filter(PredefinedError.platform == body.platform)
        .scalar()
    )
    err = PredefinedError(
        platform=body.platform,
        error_tag=body.error_tag,
        description=body.description,
        display_order=(max_order + 1) if max_order is not None else 0,
    )
    db.add(err)
    db.commit()
    db.refresh(err)
    return err


@router.put("/{error_id}", response_model=PredefinedErrorOut)
def update_error(
    error_id: int,
    body: PredefinedErrorUpdate,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    err = db.query(PredefinedError).filter(PredefinedError.id == error_id).first()
    if not err:
        raise HTTPException(status_code=404, detail="Error not found")
    if body.description is not None:
        err.description = body.description
    db.commit()
    db.refresh(err)
    return err


@router.delete("/{error_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_error(
    error_id: int,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    err = db.query(PredefinedError).filter(PredefinedError.id == error_id).first()
    if not err:
        raise HTTPException(status_code=404, detail="Error not found")
    db.delete(err)
    db.commit()
