import { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Button, Card, Input, TextArea } from '../../components/ui';
import { emailRules, minLen, nameRules } from '../../utils/validators';
import { formatDate, formatTime } from '../../utils/formatters';
import { checkin, getPublicSettings } from '../../services/publicVisitorService';
import { extractErrorMessage } from '../../services/apiClient';

export default function CheckIn() {
  const location = useLocation();
  const navigate = useNavigate();
  const mobileNo = location.state?.mobileNo;
  const [policyText, setPolicyText] = useState('I agree to company visitor policy.');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { mobileNo } });

  useEffect(() => {
    getPublicSettings()
      .then((response) => {
        if (response.data.data?.visitorPolicyText) {
          setPolicyText(response.data.data.visitorPolicyText);
        }
      })
      .catch(() => {});
  }, []);

  if (!mobileNo) {
    return <Navigate to="/visitor" replace />;
  }

  const onSubmit = async (data) => {
    try {
      const response = await checkin({
        mobileNo,
        visitorName: data.visitorName,
        companyName: data.companyName,
        address: data.address,
        emailId: data.emailId,
        purposeOfVisit: data.purposeOfVisit,
        personToMeet: data.personToMeet,
        remarks: data.remarks,
        policyAgreed: data.policyAgreed,
      });
      navigate('/visitor/checkin-success', { state: { entry: response.data.data } });
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  };

  return (
    <Card>
      <h1 className="text-lg font-semibold text-slate-900">Visitor Check-In</h1>
      <p className="mt-1 text-sm text-slate-500">Please fill in your details to check in.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <Input label="Date" value={formatDate(new Date())} disabled readOnly />

        <Input label="Visitor ID" value="" placeholder="Auto-generated on submit" disabled readOnly />

        <Input
          label="Visitor Name"
          required
          placeholder="Enter your full name"
          error={errors.visitorName?.message}
          {...register('visitorName', nameRules)}
        />

        <Input
          label="Company Name"
          required
          placeholder="Enter your company name"
          error={errors.companyName?.message}
          {...register('companyName', minLen(2, 'Company name'))}
        />

        <TextArea
          label="Address"
          required
          placeholder="Enter your address"
          error={errors.address?.message}
          {...register('address', minLen(5, 'Address'))}
        />

        <Input label="Mobile No." required value={mobileNo} disabled readOnly />

        <Input
          label="Email ID"
          required
          type="email"
          placeholder="Enter your email address"
          error={errors.emailId?.message}
          {...register('emailId', emailRules)}
        />

        <Input
          label="Purpose of Visit"
          required
          placeholder="e.g. Meeting, Interview, Delivery"
          error={errors.purposeOfVisit?.message}
          {...register('purposeOfVisit', minLen(2, 'Purpose of visit'))}
        />

        <Input
          label="Person to Meet"
          required
          placeholder="Enter the name of the person you are visiting"
          error={errors.personToMeet?.message}
          {...register('personToMeet', minLen(2, 'Person to meet'))}
        />

        <Input label="In Time" value={formatTime(new Date())} disabled readOnly />

        <Input label="Out Time" value="" disabled readOnly />

        <TextArea
          label="Remarks"
          placeholder="Optional"
          {...register('remarks')}
        />

        <div className="flex items-start gap-2 pt-1">
          <input
            id="policyAgreed"
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-600"
            {...register('policyAgreed', { required: 'You must agree to the visitor policy' })}
          />
          <label htmlFor="policyAgreed" className="text-sm text-slate-600">
            {policyText}
          </label>
        </div>
        {errors.policyAgreed && (
          <p className="text-sm text-rose-600">{errors.policyAgreed.message}</p>
        )}

        <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
          Submit & Check In
        </Button>
      </form>
    </Card>
  );
}
