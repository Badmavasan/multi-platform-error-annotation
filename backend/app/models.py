from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Text, Boolean, DateTime,
    ForeignKey, Enum as SAEnum, UniqueConstraint
)
from sqlalchemy.orm import relationship
import enum
from app.database import Base


class PlatformEnum(str, enum.Enum):
    ALGOPYTHON = "Algopython"
    PYRATES = "Pyrates"
    SPY = "SPY"


class RoleEnum(str, enum.Enum):
    ADMIN = "admin"
    ANNOTATOR = "annotator"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(80), unique=True, nullable=False, index=True)
    name = Column(String(120), nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(SAEnum(RoleEnum), nullable=False, default=RoleEnum.ANNOTATOR)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    assignments = relationship("Assignment", back_populates="annotator")


class PredefinedError(Base):
    __tablename__ = "predefined_errors"

    id = Column(Integer, primary_key=True, index=True)
    platform = Column(SAEnum(PlatformEnum), nullable=False)
    error_tag = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    display_order = Column(Integer, default=0)

    __table_args__ = (UniqueConstraint("error_tag", "platform", name="uq_error_tag_platform"),)


class Context(Base):
    __tablename__ = "contexts"

    id = Column(Integer, primary_key=True, index=True)
    platform = Column(SAEnum(PlatformEnum), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    image_url = Column(String(500), nullable=True)
    student_submission = Column(Text, nullable=False)
    correct_answer = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    errors = relationship("ContextError", back_populates="context", cascade="all, delete-orphan")
    assignments = relationship("Assignment", back_populates="context", cascade="all, delete-orphan")


class ContextError(Base):
    __tablename__ = "context_errors"

    context_id = Column(Integer, ForeignKey("contexts.id"), primary_key=True)
    error_id = Column(Integer, ForeignKey("predefined_errors.id"), primary_key=True)

    context = relationship("Context", back_populates="errors")
    error = relationship("PredefinedError")


class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True, index=True)
    context_id = Column(Integer, ForeignKey("contexts.id"), nullable=False)
    annotator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    assigned_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (UniqueConstraint("context_id", "annotator_id", name="uq_assignment"),)

    context = relationship("Context", back_populates="assignments")
    annotator = relationship("User", back_populates="assignments")
    annotation = relationship("Annotation", back_populates="assignment", uselist=False, cascade="all, delete-orphan")


class Annotation(Base):
    __tablename__ = "annotations"

    id = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(Integer, ForeignKey("assignments.id"), unique=True, nullable=False)
    has_additional_errors = Column(Boolean, nullable=False, default=False)
    additional_error_ids = Column(Text, nullable=True)
    additional_errors_text = Column(Text, nullable=True)
    submitted_at = Column(DateTime, default=datetime.utcnow)

    assignment = relationship("Assignment", back_populates="annotation")
    error_reviews = relationship(
        "AnnotationErrorReview", back_populates="annotation", cascade="all, delete-orphan"
    )


class AnnotationErrorReview(Base):
    __tablename__ = "annotation_error_reviews"

    annotation_id = Column(Integer, ForeignKey("annotations.id"), primary_key=True)
    error_id = Column(Integer, ForeignKey("predefined_errors.id"), primary_key=True)
    is_agreed = Column(Boolean, nullable=False)

    annotation = relationship("Annotation", back_populates="error_reviews")
    error = relationship("PredefinedError")


