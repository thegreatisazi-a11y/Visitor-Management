import { useState } from 'react';
import Modal from './Modal';
import Button from './Button';
import TextArea from './TextArea';

export default function ConfirmDialog({
  open,
  title = 'Are you sure?',
  message,
  requireReason = false,
  confirmLabel = 'Confirm',
  confirmVariant = 'danger',
  onConfirm,
  onCancel,
}) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm(requireReason ? reason : undefined);
      setReason('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant={confirmVariant}
            loading={loading}
            disabled={requireReason && reason.trim().length < 3}
            onClick={handleConfirm}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      {message && <p className="text-sm text-slate-600">{message}</p>}
      {requireReason && (
        <TextArea
          className="mt-3"
          label="Reason"
          required
          placeholder="Enter a reason..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      )}
    </Modal>
  );
}
