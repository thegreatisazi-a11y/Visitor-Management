import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Button, Card, Input, TextArea, CameraCapture } from '../../components/ui';
import { emailRules, minLen, mobileRules, nameRules } from '../../utils/validators';
import { formatDate, formatTime } from '../../utils/formatters';
import { registerWithFace, getPublicSettings } from '../../services/publicVisitorService';
import { extractErrorMessage } from '../../services/apiClient';

const CONSENT_TEXT = 'I consent to the use of my photo for visitor identification and entry management.';

export default function FirstTimeRegistration() {
  const navigate = useNavigate();
  const [policyText, setPolicyText] = useState('I agree to company visitor policy.');
  const [photo, setPhoto] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    getPublicSettings()
      .then((res) => {
        if (res.data.data?.visitorPolicyText) setPolicyText(res.data.data.visitorPolicyText);
      })
      .catch(() => {});
  }, []);

  const onSubmit = async (data) => {
    if (!photo) {
      toast.error('Please capture your photo before submitting.');
      return;
    }
    setSubmitting(true);
    try {
      const response = await registerWithFace({
        visitorName: data.visitorName,
        companyName: data.companyName,
        address: data.address,
        mobileNo: data.mobileNo,
        emailId: data.emailId,
        purposeOfVisit: data.purposeOfVisit,
        personToMeet: data.personToMeet,
        remarks: data.remarks,
        imageBase64: photo,
        policyAgreed: data.policyAgreed === true,
        consentGiven: data.consentGiven === true,
      });
      navigate('/visitor/checkin-success', { state: { entry: response.data.data } });
    } catch (error) {
      toast.error(extractErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <h1 className="text-lg font-semibold text-slate-900">First Time Registration</h1>
      <p className="mt-1 text-sm text-slate-500">Fill your details and capture a live photo to register.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <Input label="Date" value={formatDate(new Date())} disabled readOnly />
        <Input label="Visitor ID" value="" placeholder="Auto-generated on submit" disabled readOnly />

        <Input label="Visitor Name" required placeholder="Enter your full name" error={errors.visitorName?.message} {...register('visitorName', nameRules)} />
        <Input label="Company Name" required placeholder="Enter your company name" error={errors.companyName?.message} {...register('companyName', minLen(2, 'Company name'))} />
        <TextArea label="Address" required placeholder="Enter your address" error={errors.address?.message} {...register('address', minLen(5, 'Address'))} />
        <Input label="Mobile No." required type="tel" inputMode="numeric" maxLength={10} placeholder="10 digit mobile number" error={errors.mobileNo?.message} {...register('mobileNo', mobileRules)} />
        <Input label="Email ID" required type="email" placeholder="Enter your email address" error={errors.emailId?.message} {...register('emailId', emailRules)} />
        <Input label="Purpose of Visit" required placeholder="e.g. Meeting, Interview, Delivery" error={errors.purposeOfVisit?.message} {...register('purposeOfVisit', minLen(2, 'Purpose of visit'))} />
        <Input label="Person to Meet" required placeholder="Name of the person you are visiting" error={errors.personToMeet?.message} {...register('personToMeet', minLen(2, 'Person to meet'))} />
        <Input label="In Time" value={formatTime(new Date())} disabled readOnly />
        <TextArea label="Remarks" placeholder="Optional" {...register('remarks')} />

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Live Photo <span className="text-rose-500">*</span>
          </label>
          <CameraCapture captured={photo} onCapture={setPhoto} onRetake={() => setPhoto(null)} />
          {!photo && <p className="mt-1 text-xs text-slate-400">A live photo is required to complete registration.</p>}
        </div>

        <div className="flex items-start gap-2 pt-1">
          <input id="policyAgreed" type="checkbox" className="mt-1 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-600" {...register('policyAgreed', { required: 'You must agree to the visitor policy' })} />
          <label htmlFor="policyAgreed" className="text-sm text-slate-600">{policyText}</label>
        </div>
        {errors.policyAgreed && <p className="text-sm text-rose-600">{errors.policyAgreed.message}</p>}

        <div className="flex items-start gap-2">
          <input id="consentGiven" type="checkbox" className="mt-1 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-600" {...register('consentGiven', { required: 'Photo consent is required to register' })} />
          <label htmlFor="consentGiven" className="text-sm text-slate-600">{CONSENT_TEXT}</label>
        </div>
        {errors.consentGiven && <p className="text-sm text-rose-600">{errors.consentGiven.message}</p>}

        <Button type="submit" size="lg" loading={submitting} disabled={!photo} className="w-full">
          Register &amp; Check In
        </Button>
      </form>

      <button type="button" onClick={() => navigate('/visitor')} className="mt-4 w-full text-center text-sm font-medium text-slate-400 underline hover:text-slate-600">
        Back
      </button>
    </Card>
  );
}
