from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from app.models import PlatformEnum, RoleEnum


# ── Auth ──────────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: int
    name: str


# ── Users ─────────────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    username: str
    name: str
    password: str


class UserOut(BaseModel):
    id: int
    username: str
    name: str
    role: RoleEnum
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ── Predefined Errors ─────────────────────────────────────────────────────────

class PredefinedErrorOut(BaseModel):
    id: int
    platform: PlatformEnum
    error_tag: str
    description: str

    class Config:
        from_attributes = True


class PredefinedErrorCreate(BaseModel):
    platform: PlatformEnum
    error_tag: str
    description: str


class PredefinedErrorUpdate(BaseModel):
    description: Optional[str] = None


# ── Contexts ──────────────────────────────────────────────────────────────────

class ContextCreate(BaseModel):
    platform: PlatformEnum
    title: str
    description: str
    image_url: Optional[str] = None
    student_submission: str
    correct_answer: str
    error_ids: List[int] = []


class ContextUpdate(BaseModel):
    platform: Optional[PlatformEnum] = None
    title: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    student_submission: Optional[str] = None
    correct_answer: Optional[str] = None
    error_ids: Optional[List[int]] = None


class ContextOut(BaseModel):
    id: int
    platform: PlatformEnum
    title: str
    description: str
    image_url: Optional[str]
    student_submission: str
    correct_answer: str
    created_at: datetime
    errors: List[PredefinedErrorOut] = []

    class Config:
        from_attributes = True

    @classmethod
    def from_orm_with_errors(cls, ctx):
        return cls(
            id=ctx.id,
            platform=ctx.platform,
            title=ctx.title,
            description=ctx.description,
            image_url=ctx.image_url,
            student_submission=ctx.student_submission,
            correct_answer=ctx.correct_answer,
            created_at=ctx.created_at,
            errors=[ce.error for ce in ctx.errors],
        )


class ContextListItem(BaseModel):
    id: int
    platform: PlatformEnum
    title: str
    created_at: datetime
    assignment_count: int = 0

    class Config:
        from_attributes = True


# ── Assignments ───────────────────────────────────────────────────────────────

class AssignmentCreate(BaseModel):
    context_id: int
    annotator_id: int


class AssignmentOut(BaseModel):
    id: int
    context_id: int
    annotator_id: int
    assigned_at: datetime
    is_completed: bool = False

    class Config:
        from_attributes = True


class AssignmentDetail(BaseModel):
    id: int
    assigned_at: datetime
    is_completed: bool
    context: ContextOut
    annotator: UserOut

    class Config:
        from_attributes = True


# ── Annotations ───────────────────────────────────────────────────────────────

class ErrorReviewItem(BaseModel):
    error_id: int
    is_agreed: bool


class ErrorReviewOut(BaseModel):
    error: PredefinedErrorOut
    is_agreed: bool

    class Config:
        from_attributes = True


class AnnotationSubmit(BaseModel):
    error_reviews: List[ErrorReviewItem] = []
    has_additional_errors: bool = False
    additional_errors_text: Optional[str] = None


class AnnotationOut(BaseModel):
    id: int
    assignment_id: int
    error_reviews: List[ErrorReviewOut] = []
    has_additional_errors: bool = False
    additional_errors_text: Optional[str] = None
    submitted_at: datetime

    class Config:
        from_attributes = True

    @classmethod
    def from_orm_full(cls, ann):
        return cls(
            id=ann.id,
            assignment_id=ann.assignment_id,
            error_reviews=[
                ErrorReviewOut(error=r.error, is_agreed=r.is_agreed)
                for r in ann.error_reviews
            ],
            has_additional_errors=ann.has_additional_errors,
            additional_errors_text=ann.additional_errors_text,
            submitted_at=ann.submitted_at,
        )


class QueueItem(BaseModel):
    assignment_id: int
    context: ContextOut
    is_completed: bool
    annotation: Optional[AnnotationOut] = None

    class Config:
        from_attributes = True


# ── Admin export ───────────────────────────────────────────────────────────────

class ErrorReviewExport(BaseModel):
    error_id: int
    error_tag: str
    is_agreed: bool


class AssignmentExport(BaseModel):
    assignment_id: int
    annotator_username: str
    annotator_name: str
    submitted_at: datetime
    error_reviews: List[ErrorReviewExport]
    has_additional_errors: bool
    additional_errors_text: Optional[str]


class ContextExport(BaseModel):
    context_id: int
    context_title: str
    platform: str
    context_errors: List[PredefinedErrorOut]
    annotations: List[AssignmentExport]
