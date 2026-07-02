"""Image decoding and face quality checks (count, size, blur, composite score)."""

import base64
import os
import re

import cv2
import numpy as np

MIN_BLUR_VARIANCE: float = float(os.environ.get("MIN_BLUR_VARIANCE", "60"))
MIN_FACE_RATIO: float = float(os.environ.get("MIN_FACE_RATIO", "0.12"))

_DATA_URL_PREFIX = re.compile(r"^data:image/(?:jpeg|jpg|png);base64,", re.IGNORECASE)


def decode_image(image_base64: str) -> np.ndarray | None:
    """Decode a base64 data URL (or bare base64 string) into a BGR image.

    Returns None if the payload is not valid base64 or not a decodable image.
    """
    payload = _DATA_URL_PREFIX.sub("", image_base64.strip())
    payload = re.sub(r"\s+", "", payload)
    try:
        raw = base64.b64decode(payload, validate=True)
    except (ValueError, TypeError):
        return None
    if not raw:
        return None
    return cv2.imdecode(np.frombuffer(raw, dtype=np.uint8), cv2.IMREAD_COLOR)


def bbox_width_ratio(bbox: np.ndarray, image: np.ndarray) -> float:
    """Face bbox width as a fraction of image width."""
    width = float(bbox[2] - bbox[0])
    return width / float(image.shape[1])


def blur_variance(image: np.ndarray, bbox: np.ndarray) -> float:
    """Laplacian variance of the grayscale face crop; low values mean blur."""
    h, w = image.shape[:2]
    x1 = max(0, int(bbox[0]))
    y1 = max(0, int(bbox[1]))
    x2 = min(w, int(bbox[2]))
    y2 = min(h, int(bbox[3]))
    if x2 <= x1 or y2 <= y1:
        return 0.0
    crop = cv2.cvtColor(image[y1:y2, x1:x2], cv2.COLOR_BGR2GRAY)
    return float(cv2.Laplacian(crop, cv2.CV_64F).var())


def quality_score(det_score: float, size_ratio: float, blur_var: float) -> float:
    """Composite quality in 0..1.

    Blend of: detector confidence (50%), face size (25%, full marks when the
    face spans >= 50% of the image width), and sharpness (25%, full marks when
    Laplacian variance reaches 4x the minimum blur threshold).
    """
    size_factor = min(1.0, size_ratio / 0.5)
    blur_factor = min(1.0, blur_var / (MIN_BLUR_VARIANCE * 4.0))
    score = 0.5 * float(det_score) + 0.25 * size_factor + 0.25 * blur_factor
    return round(max(0.0, min(1.0, score)), 4)
