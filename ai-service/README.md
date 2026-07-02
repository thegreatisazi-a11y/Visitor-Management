# AI Face Recognition Service

Stateless Python/FastAPI microservice for the Visitor Portal. It performs face
detection, embedding extraction (InsightFace `buffalo_l`, 512-dim ArcFace), and
similarity comparison — per request, with no storage. The Node.js backend calls
it server-to-server on localhost and owns all persistence (MongoDB).

## Setup (Windows)

Requires Python 3.10+ (tested on 3.14). From this `ai-service` directory:

```
python -m venv venv
venv\Scripts\python.exe -m pip install -r requirements.txt
```

The first startup downloads the `buffalo_l` model pack (~300 MB) to
`%USERPROFILE%\.insightface\models\buffalo_l`. Subsequent startups load it from
disk (a few seconds).

## Run

```
venv\Scripts\python.exe -m uvicorn app.main:app --port 8001
```

or, honoring the `PORT` / `HOST` environment variables:

```
venv\Scripts\python.exe -m app.main
```

### Environment variables (see `.env.example`)

| Variable            | Default | Meaning                                                     |
| ------------------- | ------- | ----------------------------------------------------------- |
| `PORT`              | `8001`  | Listen port (only used by `python -m app.main`)             |
| `MIN_BLUR_VARIANCE` | `60`    | Minimum Laplacian variance of the face crop (blur check)    |
| `MIN_FACE_RATIO`    | `0.12`  | Minimum face bbox width as a fraction of image width        |

Variables are read from the process environment; `.env.example` documents them
but is not auto-loaded — set them in the shell or service manager.

## API

All endpoints accept/return JSON. Quality failures are returned as **HTTP 200
with `success: false`** so the Node side can branch on the body without
status-code handling; 4xx/5xx only occurs for malformed requests (Pydantic 422)
or genuine server errors.

`imageBase64` may be a data URL (`data:image/jpeg;base64,...`,
`data:image/jpg;...`, `data:image/png;...`) or a bare base64 string.

### `GET /health`

```json
{ "status": "ok", "modelLoaded": true }
```

### `POST /ai/register-face`

Request:

```json
{ "visitorId": "VIS-2026-000123", "imageBase64": "data:image/jpeg;base64,..." }
```

Success:

```json
{
  "success": true,
  "embedding": [512 floats],
  "qualityScore": 0.87,
  "model": "insightface-buffalo_l",
  "message": "Face registered successfully"
}
```

Failure:

```json
{
  "success": false,
  "reason": "no_face | multiple_faces | low_quality | invalid_image",
  "qualityScore": 0.42,
  "message": "human-readable explanation"
}
```

`qualityScore` is `null` for `invalid_image`, `no_face`, and `multiple_faces`
failures; it is populated for `low_quality`.

### `POST /ai/recognize-face`

Request:

```json
{
  "imageBase64": "data:image/jpeg;base64,...",
  "candidateEmbeddings": [
    { "visitorId": "VIS-2026-000123", "embedding": [512 floats] }
  ]
}
```

Success (all candidates scored, sorted by confidence descending — Node applies
its own threshold):

```json
{
  "success": true,
  "matches": [{ "visitorId": "VIS-2026-000123", "confidence": 0.93 }]
}
```

An empty `candidateEmbeddings` array returns `{ "success": true, "matches": [] }`.

Failure (probe-image quality problems) uses the same `reason` values as
register, without `qualityScore`.

## Confidence scaling — read before picking a threshold

Embeddings are L2-normalized, so their dot product is the cosine similarity in
[-1, 1]. The service rescales it to 0..1:

```
confidence = (cosine_similarity + 1) / 2
```

With `buffalo_l` on this scale:

- **Same person** typically scores **0.75–0.9** (raw cosine ~0.5–0.8).
- **Different people** typically score ~**0.5–0.6** (raw cosine ~0.0–0.2).

Recommended production threshold: **0.80–0.85**. The Node default of 0.85 is
slightly strict but sane — expect occasional false rejections of true matches
(poor lighting, angle); lower toward 0.80 if that happens too often. Do not use
thresholds below ~0.7 on this scale, as different-person pairs cluster around
0.5–0.6.

## Quality checks

Applied to the incoming image on both endpoints, in order:

1. **Decode** — invalid base64 / undecodable image → `invalid_image`.
2. **Face count** — 0 faces → `no_face`; 2+ → `multiple_faces`.
3. **Face size** — bbox width must be ≥ `MIN_FACE_RATIO` (12%) of image width,
   else `low_quality` ("move closer").
4. **Blur** — Laplacian variance of the grayscale face crop must be ≥
   `MIN_BLUR_VARIANCE` (60), else `low_quality` ("blur/lighting").

`qualityScore` (0..1) is a simple documented blend: 50% detector confidence
(`det_score`), 25% face size (full marks at ≥50% of image width), 25% sharpness
(full marks at 4x the blur threshold).
