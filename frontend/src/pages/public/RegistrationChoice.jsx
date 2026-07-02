import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUserPlus, FiCamera } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { Button, Card, Spinner } from '../../components/ui';
import { getPublicSettings } from '../../services/publicVisitorService';
import { extractErrorMessage } from '../../services/apiClient';

export default function RegistrationChoice() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getPublicSettings()
      .then((res) => active && setSettings(res.data.data))
      .catch((err) => active && toast.error(extractErrorMessage(err)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
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
      <p className="mt-1 text-sm text-slate-500">Is this your first registration?</p>

      <div className="mt-6 space-y-3">
        <Button size="lg" className="w-full" onClick={() => navigate('/visitor/register')}>
          <FiUserPlus size={18} /> Yes, First Time Registration
        </Button>
        <Button size="lg" variant="secondary" className="w-full" onClick={() => navigate('/visitor/recognize')}>
          <FiCamera size={18} /> No, Already Registered
        </Button>
      </div>

      <button
        type="button"
        onClick={() => navigate('/visitor/mobile')}
        className="mt-6 text-sm font-medium text-slate-400 underline hover:text-slate-600"
      >
        Use Mobile Number Instead
      </button>
    </Card>
  );
}
