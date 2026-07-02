import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Button, Card, Input, Spinner } from '../../components/ui';
import { mobileRules } from '../../utils/validators';
import { checkMobile, getPublicSettings } from '../../services/publicVisitorService';
import { extractErrorMessage } from '../../services/apiClient';

// Fallback flow: the original mobile-number-first check-in, reached via the
// "Use Mobile Number Instead" link on the registration-choice screen.
export default function MobileCheckIn() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  useEffect(() => {
    let active = true;
    getPublicSettings()
      .then((response) => {
        if (active) setSettings(response.data.data);
      })
      .catch((error) => {
        if (active) toast.error(extractErrorMessage(error));
      })
      .finally(() => {
        if (active) setLoadingSettings(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const onSubmit = async ({ mobileNo }) => {
    try {
      const response = await checkMobile(mobileNo);
      const { action, entry } = response.data.data;
      if (action === 'checkin') {
        navigate('/visitor/checkin', { state: { mobileNo } });
      } else {
        navigate('/visitor/checkout', { state: { mobileNo, entry } });
      }
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  };

  if (loadingSettings) {
    return (
      <Card className="flex items-center justify-center py-16">
        <Spinner size={32} />
      </Card>
    );
  }

  const companyName = settings?.companyName || '';

  return (
    <Card className="text-center">
      {settings?.companyLogo && (
        <img src={settings.companyLogo} alt={companyName} className="mx-auto mb-4 h-16 w-auto object-contain" />
      )}
      <h1 className="text-lg font-semibold text-slate-900">{companyName}</h1>
      <p className="mt-1 text-sm text-slate-500">Enter your mobile number to continue.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 text-left">
        <Input
          label="Mobile No."
          required
          type="tel"
          inputMode="numeric"
          maxLength={10}
          placeholder="Enter 10 digit mobile number"
          error={errors.mobileNo?.message}
          {...register('mobileNo', mobileRules)}
        />
        <Button type="submit" size="lg" loading={isSubmitting} className="mt-6 w-full">
          Continue
        </Button>
      </form>

      <button
        type="button"
        onClick={() => navigate('/visitor')}
        className="mt-4 text-sm font-medium text-slate-400 underline hover:text-slate-600"
      >
        Back
      </button>
    </Card>
  );
}
