import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Card, Button, Input, TextArea, Skeleton } from '../../components/ui';
import { getSettings, updateSettings } from '../../services/settingsService';
import { extractErrorMessage } from '../../services/apiClient';

function SectionHeading({ title, description }) {
  return (
    <div className="mb-4">
      <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
    </div>
  );
}

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm({ defaultValues: {} });

  useEffect(() => {
    getSettings()
      .then((res) => reset(res.data.data || {}))
      .catch((err) => toast.error(extractErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [reset]);

  const onSubmit = async (data) => {
    try {
      await updateSettings(data);
      toast.success('Settings updated successfully');
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Card>
          <Skeleton className="h-64 w-full" />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">Configure company details, operational rules and appearance.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Card>
          <SectionHeading title="Company" description="Details shown on the visitor check-in screen and reports." />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Company Name" {...register('companyName')} />
            <Input label="Company Logo URL" placeholder="https://..." {...register('companyLogo')} />
            <Input label="Phone Number" {...register('phoneNumber')} />
            <Input label="Email" type="email" {...register('email')} />
            <Input label="Website" {...register('website')} />
            <TextArea label="Company Address" containerClassName="sm:col-span-2" {...register('companyAddress')} />
          </div>
        </Card>

        <Card>
          <SectionHeading
            title="Visitor ID"
            description="Read-only reference — changing these values does not currently affect the visitor ID generator."
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Visitor ID Prefix" disabled {...register('visitorIdPrefix')} />
            <Input label="Visitor ID Numbering Format" disabled {...register('visitorIdNumberingFormat')} />
          </div>
        </Card>

        <Card>
          <SectionHeading title="Operational" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Auto Close Time" placeholder="e.g. 23:59" {...register('autoCloseTime')} />
            <div className="flex items-center gap-2 pt-7">
              <input id="emailMandatory" type="checkbox" className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-600" {...register('emailMandatory')} />
              <label htmlFor="emailMandatory" className="text-sm font-medium text-slate-700">
                Email ID is mandatory at check-in
              </label>
            </div>
            <TextArea label="Visitor Policy Text" containerClassName="sm:col-span-2" rows={4} {...register('visitorPolicyText')} />
          </div>
        </Card>

        <Card>
          <SectionHeading title="Reports" description="Header and footer text shown on exported reports." />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextArea label="Report Header" {...register('reportHeader')} />
            <TextArea label="Report Footer" {...register('reportFooter')} />
          </div>
        </Card>

        <Card>
          <SectionHeading title="Appearance" description="Theme preference is saved but does not live-update the whole app yet." />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Theme Mode</label>
              <select
                className="block w-full rounded-lg border-0 px-3.5 py-2.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-brand-600"
                {...register('themeMode')}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
            <Input label="QR URL" disabled {...register('qrUrl')} />
          </div>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" loading={isSubmitting}>
            Save Settings
          </Button>
        </div>
      </form>
    </div>
  );
}
