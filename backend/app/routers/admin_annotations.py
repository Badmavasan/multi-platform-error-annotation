from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session, joinedload
from typing import List
from app.database import get_db
from app.models import (
    Assignment, Context, ContextError, Annotation,
    AnnotationErrorReview, User
)
from app.schemas import ContextExport, AssignmentExport, ErrorReviewExport, PredefinedErrorOut
from app.core.deps import require_admin

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/annotations/export", response_model=List[ContextExport])
def export_annotations(
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    contexts = (
        db.query(Context)
        .options(
            joinedload(Context.errors).joinedload(ContextError.error),
            joinedload(Context.assignments)
            .joinedload(Assignment.annotator),
            joinedload(Context.assignments)
            .joinedload(Assignment.annotation)
            .joinedload(Annotation.error_reviews)
            .joinedload(AnnotationErrorReview.error),
        )
        .all()
    )

    result = []
    for ctx in contexts:
        annotations = []
        for a in ctx.assignments:
            ann = a.annotation
            if ann is None:
                continue
            annotations.append(AssignmentExport(
                assignment_id=a.id,
                annotator_username=a.annotator.username,
                annotator_name=a.annotator.name,
                submitted_at=ann.submitted_at,
                error_reviews=[
                    ErrorReviewExport(
                        error_id=r.error.id,
                        error_tag=r.error.error_tag,
                        is_agreed=r.is_agreed,
                    )
                    for r in ann.error_reviews
                ],
                has_additional_errors=ann.has_additional_errors,
                additional_errors_text=ann.additional_errors_text,
            ))

        if not annotations:
            continue

        result.append(ContextExport(
            context_id=ctx.id,
            context_title=ctx.title,
            platform=ctx.platform,
            context_errors=[PredefinedErrorOut.from_orm(ce.error) for ce in ctx.errors],
            annotations=annotations,
        ))

    return result
