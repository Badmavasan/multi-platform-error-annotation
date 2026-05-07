import json
import os
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List
from app.database import get_db
from app.models import (
    Assignment, Context, ContextError, Annotation,
    AnnotationErrorReview, PredefinedError, User
)
from app.schemas import AnnotationSubmit, AnnotationOut, QueueItem, ContextOut
from app.core.deps import require_annotator

router = APIRouter(prefix="/annotator", tags=["annotator"])

_DESCRIPTIONS_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "platform_descriptions.json")

def _load_platform_descriptions() -> dict:
    try:
        with open(_DESCRIPTIONS_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}


def _load_assignment(assignment_id: int, annotator_id: int, db: Session) -> Assignment:
    a = (
        db.query(Assignment)
        .options(
            joinedload(Assignment.context).joinedload(Context.errors).joinedload(ContextError.error),
            joinedload(Assignment.annotation).joinedload(Annotation.error_reviews)
            .joinedload(AnnotationErrorReview.error),
        )
        .filter(Assignment.id == assignment_id, Assignment.annotator_id == annotator_id)
        .first()
    )
    if not a:
        raise HTTPException(status_code=404, detail="Assignment not found")
    return a


@router.get("/queue", response_model=List[QueueItem])
def get_queue(db: Session = Depends(get_db), current_user: User = Depends(require_annotator)):
    assignments = (
        db.query(Assignment)
        .options(
            joinedload(Assignment.context).joinedload(Context.errors).joinedload(ContextError.error),
            joinedload(Assignment.annotation).joinedload(Annotation.error_reviews)
            .joinedload(AnnotationErrorReview.error),
        )
        .filter(Assignment.annotator_id == current_user.id)
        .order_by(Assignment.assigned_at)
        .all()
    )
    platform_descriptions = _load_platform_descriptions()
    result = []
    for a in assignments:
        ann = a.annotation
        result.append(QueueItem(
            assignment_id=a.id,
            context=ContextOut.from_orm_with_errors(a.context, platform_descriptions),
            is_completed=ann is not None,
            annotation=AnnotationOut.from_orm_full(ann) if ann else None,
        ))
    return result


@router.get("/queue/{assignment_id}", response_model=QueueItem)
def get_queue_item(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_annotator),
):
    a = _load_assignment(assignment_id, current_user.id, db)
    ann = a.annotation
    platform_descriptions = _load_platform_descriptions()
    return QueueItem(
        assignment_id=a.id,
        context=ContextOut.from_orm_with_errors(a.context, platform_descriptions),
        is_completed=ann is not None,
        annotation=AnnotationOut.from_orm_full(ann) if ann else None,
    )


@router.post("/queue/{assignment_id}/annotate", response_model=AnnotationOut)
def submit_annotation(
    assignment_id: int,
    body: AnnotationSubmit,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_annotator),
):
    a = _load_assignment(assignment_id, current_user.id, db)

    if body.has_additional_errors and not (body.additional_errors_text or "").strip():
        raise HTTPException(status_code=400, detail="Veuillez décrire les erreurs supplémentaires identifiées.")

    ann = a.annotation
    if ann:
        ann.submitted_at = datetime.utcnow()
        ann.has_additional_errors = body.has_additional_errors
        ann.additional_errors_text = body.additional_errors_text if body.has_additional_errors else None
        db.query(AnnotationErrorReview).filter(AnnotationErrorReview.annotation_id == ann.id).delete()
    else:
        ann = Annotation(
            assignment_id=assignment_id,
            has_additional_errors=body.has_additional_errors,
            additional_errors_text=body.additional_errors_text if body.has_additional_errors else None,
        )
        db.add(ann)
        db.flush()

    for review in body.error_reviews:
        db.add(AnnotationErrorReview(
            annotation_id=ann.id,
            error_id=review.error_id,
            is_agreed=review.is_agreed,
        ))

    db.commit()

    ann = (
        db.query(Annotation)
        .options(joinedload(Annotation.error_reviews).joinedload(AnnotationErrorReview.error))
        .filter(Annotation.id == ann.id)
        .first()
    )
    return AnnotationOut.from_orm_full(ann)
