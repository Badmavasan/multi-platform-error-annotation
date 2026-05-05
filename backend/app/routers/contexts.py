from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List
from app.database import get_db
from app.models import Context, ContextError, PredefinedError, Assignment
from app.schemas import ContextCreate, ContextUpdate, ContextOut, ContextListItem
from app.core.deps import require_admin

router = APIRouter(prefix="/contexts", tags=["contexts"])


def _attach_errors(context: Context, error_ids: List[int], db: Session):
    db.query(ContextError).filter(ContextError.context_id == context.id).delete()
    for eid in error_ids:
        err = db.query(PredefinedError).filter(
            PredefinedError.id == eid,
            PredefinedError.platform == context.platform,
        ).first()
        if not err:
            raise HTTPException(status_code=400, detail=f"Error id {eid} not valid for platform {context.platform}")
        db.add(ContextError(context_id=context.id, error_id=eid))


@router.get("", response_model=List[ContextListItem])
def list_contexts(db: Session = Depends(get_db), _=Depends(require_admin)):
    contexts = db.query(Context).order_by(Context.created_at.desc()).all()
    result = []
    for ctx in contexts:
        count = db.query(Assignment).filter(Assignment.context_id == ctx.id).count()
        result.append(ContextListItem(
            id=ctx.id,
            platform=ctx.platform,
            title=ctx.title,
            created_at=ctx.created_at,
            assignment_count=count,
        ))
    return result


@router.post("", response_model=ContextOut, status_code=status.HTTP_201_CREATED)
def create_context(body: ContextCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    ctx = Context(
        platform=body.platform,
        title=body.title,
        description=body.description,
        image_url=body.image_url,
        student_submission=body.student_submission,
        correct_answer=body.correct_answer,
    )
    db.add(ctx)
    db.flush()
    _attach_errors(ctx, body.error_ids, db)
    db.commit()
    db.refresh(ctx)
    return _load_context(ctx.id, db)


@router.get("/{context_id}", response_model=ContextOut)
def get_context(context_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    return _load_context(context_id, db)


@router.put("/{context_id}", response_model=ContextOut)
def update_context(context_id: int, body: ContextUpdate, db: Session = Depends(get_db), _=Depends(require_admin)):
    ctx = db.query(Context).filter(Context.id == context_id).first()
    if not ctx:
        raise HTTPException(status_code=404, detail="Context not found")

    for field, value in body.model_dump(exclude_none=True, exclude={"error_ids"}).items():
        setattr(ctx, field, value)

    if body.error_ids is not None:
        _attach_errors(ctx, body.error_ids, db)

    db.commit()
    return _load_context(context_id, db)


@router.delete("/{context_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_context(context_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    ctx = db.query(Context).filter(Context.id == context_id).first()
    if not ctx:
        raise HTTPException(status_code=404, detail="Context not found")
    db.delete(ctx)
    db.commit()


def _load_context(context_id: int, db: Session) -> ContextOut:
    ctx = (
        db.query(Context)
        .options(joinedload(Context.errors).joinedload(ContextError.error))
        .filter(Context.id == context_id)
        .first()
    )
    if not ctx:
        raise HTTPException(status_code=404, detail="Context not found")
    return ContextOut.from_orm_with_errors(ctx)
