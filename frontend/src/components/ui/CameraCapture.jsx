import { useCallback, useEffect, useRef, useState } from 'react';
import { FiCamera, FiRefreshCw, FiAlertTriangle } from 'react-icons/fi';
import Button from './Button';
import Spinner from './Spinner';

// Zero-dependency live camera capture. Streams getUserMedia into a <video>, and on
// capture draws the current frame to a <canvas> -> JPEG data URL. Live capture only:
// there is deliberately no file input, so a static photo cannot be uploaded.
export default function CameraCapture({ onCapture, facingMode = 'user', captured, onRetake }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [status, setStatus] = useState('loading'); // loading | ready | denied | unavailable
  const [errorMsg, setErrorMsg] = useState('');

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const startStream = useCallback(async () => {
    setStatus('loading');
    setErrorMsg('');
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus('unavailable');
        setErrorMsg('Camera is not available on this device or browser.');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setStatus('ready');
    } catch (err) {
      if (err?.name === 'NotAllowedError' || err?.name === 'SecurityError') {
        setStatus('denied');
        setErrorMsg('Camera permission was denied. Please allow camera access and try again.');
      } else if (err?.name === 'NotFoundError' || err?.name === 'DevicesNotFoundError') {
        setStatus('unavailable');
        setErrorMsg('No camera was found on this device.');
      } else {
        setStatus('unavailable');
        setErrorMsg('Could not start the camera. Please try again.');
      }
    }
  }, [facingMode]);

  // Start when there's no captured image; stop the stream once a photo is held.
  useEffect(() => {
    if (!captured) {
      startStream();
    } else {
      stopStream();
    }
    return stopStream;
  }, [captured, startStream, stopStream]);

  const handleCapture = () => {
    const video = videoRef.current;
    if (!video || status !== 'ready') return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    onCapture(canvas.toDataURL('image/jpeg', 0.85));
  };

  if (captured) {
    return (
      <div className="space-y-3">
        <img src={captured} alt="Captured selfie" className="mx-auto w-full max-w-xs rounded-lg border border-slate-200" />
        <Button type="button" variant="secondary" className="w-full" onClick={onRetake}>
          <FiRefreshCw size={16} /> Retake Photo
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-lg bg-slate-900">
        <video ref={videoRef} playsInline muted className="mx-auto aspect-[4/3] w-full max-w-xs object-cover" />
        {status === 'loading' && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/70">
            <Spinner size={28} className="text-white" />
          </div>
        )}
      </div>

      {(status === 'denied' || status === 'unavailable') && (
        <div className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
          <FiAlertTriangle size={16} className="mt-0.5 shrink-0" />
          <div>
            <p>{errorMsg}</p>
            <button type="button" onClick={startStream} className="mt-1 font-medium text-amber-800 underline">
              Retry
            </button>
          </div>
        </div>
      )}

      <Button type="button" className="w-full" disabled={status !== 'ready'} onClick={handleCapture}>
        <FiCamera size={16} /> Capture Photo
      </Button>
    </div>
  );
}
