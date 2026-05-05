from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List
from app.database import get_db
from app.models import Assignment, Context, User, RoleEnum, ContextError
from app.schemas import AssignmentCreate, AssignmentDetail, ContextOut, UserOut
from app.core.deps import require_admin

router = APIRouter(prefix="/assignments", tags=["assignments"])


@router.get("", response_model=List[AssignmentDetail])
def list_assignments(db: Session = Depends(get_db), _=Depends(require_admin)):
    assignments = (
        db.query(Assignment)
        .options(
            joinedload(Assignment.context).joinedload(Context.errors).joinedload(ContextError.error),
            joinedload(Assignment.annotator),
            joinedload(Assignment.annotation),
        )
        .order_by(Assignment.assigned_at.desc())
        .all()
    )
    result = []
    for a in assignments:
        result.append(AssignmentDetail(
            id=a.id,
            assigned_at=a.assigned_at,
            is_completed=a.annotation is not None,
            context=ContextOut.from_orm_with_errors(a.context),
            annotator=UserOut.model_validate(a.annotator),
        ))
    return result


@router.post("", status_code=status.HTTP_201_CREATED)
def create_assignment(body: AssignmentCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    ctx = db.query(Context).filter(Context.id == body.context_id).first()
    if not ctx:
        raise HTTPException(status_code=404, detail="Context not found")

    annotator = db.query(User).filter(
        User.id == body.annotator_id, User.role == RoleEnum.ANNOTATOR, User.is_active == True
    ).first()
    if not annotator:
        raise HTTPException(status_code=404, detail="Annotator not found")

    existing = db.query(Assignment).filter(
        Assignment.context_id == body.context_id,
        Assignment.annotator_id == body.annotator_id,
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Assignment already exists")

    assignment = Assignment(context_id=body.context_id, annotator_id=body.annotator_id)
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return {"id": assignment.id, "context_id": assignment.context_id, "annotator_id": assignment.annotator_id}


@router.delete("/{assignment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_assignment(assignment_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    a = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Assignment not found")
    db.delete(a)
    db.commit()
