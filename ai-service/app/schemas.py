"""Pydantic request/response models for the face-recognition service."""

from typing import Literal

from pydantic import BaseModel, Field

FailureReason = Literal["no_face", "multiple_faces", "low_quality", "invalid_image"]


class RegisterFaceRequest(BaseModel):
    visitorId: str
    imageBase64: str


class CandidateEmbedding(BaseModel):
    visitorId: str
    embedding: list[float] = Field(min_length=512, max_length=512)


class RecognizeFaceRequest(BaseModel):
    imageBase64: str
    candidateEmbeddings: list[CandidateEmbedding]


class RegisterFaceSuccess(BaseModel):
    success: Literal[True] = True
    embedding: list[float]
    qualityScore: float
    model: str = "insightface-buffalo_l"
    message: str = "Face registered successfully"


class RegisterFaceFailure(BaseModel):
    success: Literal[False] = False
    reason: FailureReason
    qualityScore: float | None
    message: str


class Match(BaseModel):
    visitorId: str
    confidence: float


class RecognizeFaceSuccess(BaseModel):
    success: Literal[True] = True
    matches: list[Match]


class RecognizeFaceFailure(BaseModel):
    success: Literal[False] = False
    reason: FailureReason
    message: str


class HealthResponse(BaseModel):
    status: str
    modelLoaded: bool
