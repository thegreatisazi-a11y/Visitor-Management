import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { FiCopy, FiDownload, FiPrinter, FiRefreshCw, FiEdit2 } from 'react-icons/fi';
import { Card, Button, Input, Modal, ConfirmDialog, Skeleton, EmptyState } from '../../components/ui';
import { listQr, updateQr, regenerateToken, fetchQrImageBlob } from '../../services/qrService';
import { extractErrorMessage } from '../../services/apiClient';

function EditQrModal({ qr, onClose, onSaved }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: qr || {} });

  useEffect(() => {
    if (qr) reset(qr);
  }, [qr, reset]);

  if (!qr) return null;

  const onSubmit = async (data) => {
    try {
      await updateQr(qr._id, { qrName: data.qrName, locationName: data.locationName });
      toast.success('QR details updated');
      onSaved();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  };

  return (
    <Modal open={!!qr} onClose={onClose} title="Edit QR Details">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="QR Name" required error={errors.qrName?.message} {...register('qrName', { required: 'Required' })} />
        <Input label="Location Name" {...register('locationName')} />
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function QrCard({ qr, onChanged, onEdit }) {
  const [regenerateOpen, setRegenerateOpen] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let objectUrl;
    fetchQrImageBlob(qr._id)
      .then((res) => {
        objectUrl = URL.createObjectURL(res.data);
        setImageUrl(objectUrl);
      })
      .catch(() => setImageUrl(null));
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [qr._id, qr.qrToken]);

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(qr.qrUrl);
      toast.success('URL copied to clipboard');
    } catch {
      toast.error('Could not copy URL');
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await fetchQrImageBlob(qr._id);
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${qr.qrName.replace(/\s+/g, '_')}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(extractErrorMessage(error));
    } finally {
      setDownloading(false);
    }
  };

  const handleRegenerate = async () => {
    try {
      await regenerateToken(qr._id);
      toast.success('QR token regenerated');
      setRegenerateOpen(false);
      onChanged();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  };

  const toggleStatus = async () => {
    setTogglingStatus(true);
    try {
      await updateQr(qr._id, { status: qr.status === 'active' ? 'inactive' : 'active' });
      toast.success(`QR marked as ${qr.status === 'active' ? 'inactive' : 'active'}`);
      onChanged();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    } finally {
      setTogglingStatus(false);
    }
  };

  return (
    <Card className="flex flex-col gap-4 sm:flex-row sm:items-start">
      {imageUrl ? (
        <img src={imageUrl} alt={qr.qrName} className="h-40 w-40 shrink-0 rounded-lg border border-slate-200 object-contain" />
      ) : (
        <Skeleton className="h-40 w-40 shrink-0 rounded-lg" />
      )}
      <div className="min-w-0 flex-1 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900">{qr.qrName}</h3>
            <p className="text-sm text-slate-500">{qr.locationName || 'No location set'}</p>
          </div>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset whitespace-nowrap ${
              qr.status === 'active'
                ? 'bg-emerald-100 text-emerald-700 ring-emerald-600/20'
                : 'bg-rose-100 text-rose-700 ring-rose-600/20'
            }`}
          >
            {qr.status === 'active' ? 'Active' : 'Inactive'}
          </span>
        </div>

        <p className="text-sm text-slate-500">
          Usage Count: <span className="font-medium text-slate-800">{qr.usageCount ?? 0}</span>
        </p>

        <div className="flex items-center gap-2">
          <Input value={qr.qrUrl} readOnly className="flex-1 text-xs" />
          <Button variant="secondary" size="sm" onClick={copyUrl} title="Copy URL">
            <FiCopy size={14} />
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" loading={downloading} onClick={handleDownload}>
            <FiDownload size={14} /> Download
          </Button>
          <Button variant="secondary" size="sm" onClick={() => window.print()}>
            <FiPrinter size={14} /> Print
          </Button>
          <Button variant="secondary" size="sm" onClick={() => onEdit(qr)}>
            <FiEdit2 size={14} /> Edit
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setRegenerateOpen(true)}>
            <FiRefreshCw size={14} /> Regenerate Token
          </Button>
          <Button
            variant={qr.status === 'active' ? 'danger' : 'success'}
            size="sm"
            loading={togglingStatus}
            onClick={toggleStatus}
          >
            {qr.status === 'active' ? 'Deactivate' : 'Activate'}
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={regenerateOpen}
        title="Regenerate QR Token"
        message="This will invalidate the current QR code image and URL. Any printed copies of this QR code will stop working. Continue?"
        confirmLabel="Regenerate"
        confirmVariant="danger"
        onConfirm={handleRegenerate}
        onCancel={() => setRegenerateOpen(false)}
      />
    </Card>
  );
}

export default function QrManagement() {
  const [qrCodes, setQrCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editTarget, setEditTarget] = useState(null);

  const fetchQrCodes = () => {
    setLoading(true);
    listQr()
      .then((res) => setQrCodes(res.data.data))
      .catch((err) => toast.error(extractErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchQrCodes();
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">QR Code Management</h1>
        <p className="mt-1 text-sm text-slate-500">View, download, print and manage the visitor portal QR code.</p>
      </div>

      {loading ? (
        <Card>
          <Skeleton className="h-40 w-full" />
        </Card>
      ) : qrCodes.length === 0 ? (
        <Card>
          <EmptyState title="No QR codes found" description="No visitor portal QR code has been generated yet." />
        </Card>
      ) : (
        <div className="space-y-4">
          {qrCodes.map((qr) => (
            <QrCard key={qr._id} qr={qr} onChanged={fetchQrCodes} onEdit={setEditTarget} />
          ))}
        </div>
      )}

      <EditQrModal
        qr={editTarget}
        onClose={() => setEditTarget(null)}
        onSaved={() => {
          setEditTarget(null);
          fetchQrCodes();
        }}
      />
    </div>
  );
}
