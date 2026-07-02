"""InsightFace model singleton, embedding extraction, and similarity scoring."""

import numpy as np
from insightface.app import FaceAnalysis
from insightface.app.common import Face

MODEL_NAME = "insightface-buffalo_l"

_analyzer: FaceAnalysis | None = None


def load_model() -> None:
    """Load the buffalo_l model once. Called at startup via the FastAPI lifespan."""
    global _analyzer
    if _analyzer is not None:
        return
    analyzer = FaceAnalysis(name="buffalo_l", providers=["CPUExecutionProvider"])
    analyzer.prepare(ctx_id=0, det_size=(640, 640))
    _analyzer = analyzer


def is_loaded() -> bool:
    return _analyzer is not None


def detect_faces(image: np.ndarray) -> list[Face]:
    if _analyzer is None:
        raise RuntimeError("Face model is not loaded")
    return _analyzer.get(image)


def extract_embedding(face: Face) -> list[float]:
    """512-dim L2-normalized ArcFace embedding."""
    return [float(v) for v in face.normed_embedding]


def confidence(probe: np.ndarray, candidate: np.ndarray) -> float:
    """Similarity of two embeddings, rescaled to 0..1.

    Both vectors are L2-normalized (defensively re-normalized here), so their
    dot product is the cosine similarity in [-1, 1]. We rescale with
    confidence = (cos_sim + 1) / 2 so the Node-side threshold operates on a
    0..1 range: with buffalo_l, same-person pairs typically score 0.75-0.9 and
    different-person pairs ~0.5-0.6 on this scale. The recommended production
    threshold is 0.80-0.85 (the Node default of 0.85 is slightly strict but sane).
    """
    p = _normalize(probe)
    c = _normalize(candidate)
    cos_sim = float(np.dot(p, c))
    return round((cos_sim + 1.0) / 2.0, 4)


def _normalize(vec: np.ndarray) -> np.ndarray:
    norm = float(np.linalg.norm(vec))
    if norm == 0.0:
        return vec
    return vec / norm
