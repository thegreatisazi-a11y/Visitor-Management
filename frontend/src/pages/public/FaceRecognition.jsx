import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { FiCamera, FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';
import { Button, Card, Input, TextArea, CameraCapture, Spinner } from '../../components/ui';
import { minLen } from '../../utils/validators';
import { formatDate } from '../../utils/formatters';
import { recognizeFace, confirmFaceCheckin } from '../../services/publicVisitorService';
import { extractErrorMessage } from '../../services/apiClient';
import { useAuth } from '../../context/AuthContext';

const FAIL_TITLES = {
  no_face: 'Face not detected',
  multiple_faces: 'Multiple faces detected',
  low_quality: 'Image quality too low',
  invalid_image: 'Could not process image',
  low_confidence: 'Visitor not recognized confidently',
};

function DetailRow({ label, value }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-100 py-1.5 text-sm last:border-0">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-medium text-slate-800">{value || '-'}</span>
    </div>
  );
}

export default function FaceRecognition() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [photo, setPhoto] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null); // { outcome, profile?, confidence?, message }
  const [confirming, setConfirming] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const reset = () => {
    setPhoto(null);
    setResult(null);
  };

  const handleScan = async (captured) => {
    setPhoto(captured);
    setScanning(true);
    setResult(null);
    try {
      const response = await recognizeFace(captured);
      setResult({ ...response.data.data, message: response.data.message });
    } catch (error) {
      toast.error(extractErrorMessage(error));
      setPhoto(null);
    } finally {
      setScanning(false);
    }
  };

  const onConfirm = async (data) => {
    setConfirming(true);
    try {
      const response = await confirmFaceCheckin({
        visitorProfileId: result.profile.id,
        purposeOfVisit: data.purposeOfVisit,
        personToMeet: data.personToMeet,
        remarks: data.remarks,
        confidenceScore: result.confidence,
      });
      navigate('/visitor/checkin-success', { state: { entry: response.data.data } });
    } catch (error) {
      toast.error(extractErrorMessage(error));
    } finally {
      setConfirming(false);
    }
  };

  // Scanning in progress
  if (scanning) {
    return (
      <Card className="flex flex-col items-center justify-center py-16 text-center">
        <Spinner size={36} />
        <p className="mt-4 text-sm text-slate-500">Recognizing your face...</p>
      </Card>
    );
  }

  // Matched -> confirm form
  if (result?.outcome === 'matched') {
    const p = result.profile;
    return (
      <Card>
        <div className="mb-4 flex items-center gap-2 text-emerald-700">
          <FiCheckCircle size={20} />
          <h1 className="text-lg font-semibold">Visitor Recognized</h1>
        </div>
        {p.photoThumbnail && (
          <img src={p.photoThumbnail} alt={p.visitorName} className="mx-auto mb-4 h-24 w-24 rounded-full border border-slate-200 object-cover" />
        )}
        <dl className="space-y-1">
          <DetailRow label="Visitor ID" value={p.visitorId} />
          <DetailRow label="Name" value={p.visitorName} />
          <DetailRow label="Company" value={p.companyName} />
          <DetailRow label="Mobile" value={p.mobileNo} />
          <DetailRow label="Email" value={p.emailId} />
          <DetailRow label="Last Visit" value={p.lastVisitAt} />
          <DetailRow label="Match Confidence" value={`${Math.round(result.confidence * 100)}%`} />
        </dl>

        <form onSubmit={handleSubmit(onConfirm)} className="mt-5 space-y-4">
          <Input label="Purpose of Visit" required placeholder="e.g. Meeting" error={errors.purposeOfVisit?.message} {...register('purposeOfVisit', minLen(2, 'Purpose of visit'))} />
          <Input label="Person to Meet" required placeholder="Name of the person you are visiting" error={errors.personToMeet?.message} {...register('personToMeet', minLen(2, 'Person to meet'))} />
          <TextArea label="Remarks" placeholder="Optional" {...register('remarks')} />
          <Button type="submit" size="lg" loading={confirming} className="w-full">
            Confirm IN Entry
          </Button>
        </form>
        <Button type="button" variant="secondary" className="mt-3 w-full" onClick={reset}>
          Not Me / Try Again
        </Button>
      </Card>
    );
  }

  // Already checked in
  if (result?.outcome === 'already_checked_in') {
    return (
      <Card className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-600">
          <FiAlertTriangle size={26} />
        </div>
        <h1 className="mt-4 text-lg font-semibold text-slate-900">Already Checked In</h1>
        <p className="mt-2 text-sm text-slate-600">
          {result.profile?.visitorName} is already checked in. If you are leaving, please check out instead.
        </p>
        <Button className="mt-6 w-full" onClick={() => navigate('/visitor/mobile')}>
          Go to Check-Out
        </Button>
        <Button variant="secondary" className="mt-3 w-full" onClick={() => navigate('/visitor')}>
          Back to Home
        </Button>
      </Card>
    );
  }

  // Failure outcomes
  if (result) {
    return (
      <Card className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 text-rose-600">
          <FiAlertTriangle size={26} />
        </div>
        <h1 className="mt-4 text-lg font-semibold text-slate-900">{FAIL_TITLES[result.outcome] || 'Recognition failed'}</h1>
        <p className="mt-2 text-sm text-slate-600">{result.message}</p>

        <div className="mt-6 space-y-3">
          <Button className="w-full" onClick={reset}>
            <FiCamera size={16} /> Try Again
          </Button>
          <Button variant="secondary" className="w-full" onClick={() => navigate('/visitor/register')}>
            First Time Registration
          </Button>
          {isAuthenticated && (
            <Button variant="ghost" className="w-full" onClick={() => navigate('/admin/visitor-entries')}>
              Reception Manual Search
            </Button>
          )}
        </div>
      </Card>
    );
  }

  // Initial: capture screen
  return (
    <Card>
      <h1 className="text-lg font-semibold text-slate-900">Face Check-In</h1>
      <p className="mt-1 text-sm text-slate-500">Look at the camera and capture to check in.</p>
      <p className="mb-4 mt-1 text-xs text-slate-400">{formatDate(new Date())}</p>

      <CameraCapture captured={photo} onCapture={handleScan} onRetake={reset} />

      <button type="button" onClick={() => navigate('/visitor')} className="mt-4 w-full text-center text-sm font-medium text-slate-400 underline hover:text-slate-600">
        Back
      </button>
    </Card>
  );
}
