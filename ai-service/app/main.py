"""FastAPI app for the stateless face-recognition microservice.

Called server-to-server by the Node.js backend only, so no CORS middleware.
Quality failures are returned as HTTP 200 with success=false so Node can
branch on the JSON body; 4xx/5xx is reserved for malformed requests and
genuine server errors.
"""

import os
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

import numpy as np
from fastapi import FastAPI
from insightface.app.common import Face

from app import face_engine, quality_checks
from app.schemas import (
    FailureReason,
    HealthResponse,
    Match,
    RecognizeFaceFailure,
    RecognizeFaceRequest,
    RecognizeFaceSuccess,
    RegisterFaceFailure,
    RegisterFaceRequest,
    RegisterFaceSuccess,
)


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    face_engine.load_model()
    yield


app = FastAPI(title="Visitor Portal Face Recognition Service", lifespan=lifespan)


def _evaluate_image(
    image_base64: str,
) -> tuple[Face | None, float | None, tuple[FailureReason, str] | None]:
    """Run the quality pipeline. Returns (face, quality_score, failure).

    Exactly one of face / failure is set. quality_score is available for
    low_quality failures as well as successes.
    """
    image = quality_checks.decode_image(image_base64)
    if image is None:
        return None, None, (
            "invalid_image",
            "Could not decode the image. Send a valid base64-encoded JPEG or PNG.",
        )

    faces = face_engine.detect_faces(image)
    if len(faces) == 0:
        return None, None, (
            "no_face",
            "No face detected. Ensure the face is clearly visible and well lit.",
        )
    if len(faces) > 1:
        return None, None, (
            "multiple_faces",
            "Multiple faces detected. Ensure only one person is in the frame.",
        )

    face = faces[0]
    size_ratio = quality_checks.bbox_width_ratio(face.bbox, image)
    blur_var = quality_checks.blur_variance(image, face.bbox)
    score = quality_checks.quality_score(face.det_score, size_ratio, blur_var)

    if size_ratio < quality_checks.MIN_FACE_RATIO:
        return None, score, (
            "low_quality",
            "Face is too small in the frame. Please move closer to the camera.",
        )
    if blur_var < quality_checks.MIN_BLUR_VARIANCE:
        return None, score, (
            "low_quality",
            "Image is too blurry. Hold the camera steady and improve the lighting.",
        )

    return face, score, None


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="ok", modelLoaded=face_engine.is_loaded())


@app.post("/ai/register-face", response_model=RegisterFaceSuccess | RegisterFaceFailure)
def register_face(req: RegisterFaceRequest) -> RegisterFaceSuccess | RegisterFaceFailure:
    face, score, failure = _evaluate_image(req.imageBase64)
    if failure is not None or face is None:
        reason, message = failure if failure is not None else ("invalid_image", "Unknown error")
        return RegisterFaceFailure(reason=reason, qualityScore=score, message=message)
    return RegisterFaceSuccess(
        embedding=face_engine.extract_embedding(face),
        qualityScore=score if score is not None else 0.0,
    )


@app.post("/ai/recognize-face", response_model=RecognizeFaceSuccess | RecognizeFaceFailure)
def recognize_face(req: RecognizeFaceRequest) -> RecognizeFaceSuccess | RecognizeFaceFailure:
    face, _, failure = _evaluate_image(req.imageBase64)
    if failure is not None or face is None:
        reason, message = failure if failure is not None else ("invalid_image", "Unknown error")
        return RecognizeFaceFailure(reason=reason, message=message)

    probe = np.asarray(face.normed_embedding, dtype=np.float32)
    matches = [
        Match(
            visitorId=candidate.visitorId,
            confidence=face_engine.confidence(
                probe, np.asarray(candidate.embedding, dtype=np.float32)
            ),
        )
        for candidate in req.candidateEmbeddings
    ]
    matches.sort(key=lambda m: m.confidence, reverse=True)
    return RecognizeFaceSuccess(matches=matches)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=os.environ.get("HOST", "127.0.0.1"),
        port=int(os.environ.get("PORT", "8001")),
    )
