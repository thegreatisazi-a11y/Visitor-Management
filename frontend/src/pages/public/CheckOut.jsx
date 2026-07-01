import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Button, Card, StatusBadge } from '../../components/ui';
import { formatTime } from '../../utils/formatters';
import { checkout } from '../../services/publicVisitorService';
import { extractErrorMessage } from '../../services/apiClient';

export default function CheckOut() {
  const location = useLocation();
  const navigate = useNavigate();
  const mobileNo = location.state?.mobileNo;
  const entry = location.state?.entry;
  const [submitting, setSubmitting] = useState(false);
  const [notFound, setNotFound] = useState(false);

  if (!mobileNo || !entry) {
    return <Navigate to="/visitor" replace />;
  }

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      const response = await checkout({ mobileNo });
      const data = response.data.data;
      if (data.found) {
        navigate('/visitor/checkout-success', { state: { entry: data.entry } });
      } else {
        setNotFound(true);
      }
    } catch (error) {
      toast.error(extractErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  if (notFound) {
    return (
      <Card className="text-center">
        <p className="text-sm text-slate-600">No active visit found for this mobile number.</p>
        <Button size="lg" className="mt-6 w-full" onClick={() => navigate('/visitor')}>
          Back to Home
        </Button>
      </Card>
    );
  }

  return (
    <Card>
      <h1 className="text-lg font-semibold text-slate-900">Quick Check-Out</h1>
      <div className="mt-2">
        <StatusBadge status="inside_premises" />
      </div>

      <dl className="mt-4 space-y-2 text-sm">
        <Row label="Visitor ID" value={entry.visitorId} />
        <Row label="Visitor Name" value={entry.visitorName} />
        <Row label="Mobile No." value={entry.mobileNo} />
        <Row label="Company Name" value={entry.companyName} />
        <Row label="Address" value={entry.address} />
        <Row label="Purpose of Visit" value={entry.purposeOfVisit} />
        <Row label="Person to Meet" value={entry.personToMeet} />
        <Row label="Visit Date" value={entry.visitDate} />
        <Row label="Checked in at" value={entry.inTime} />
        <Row label="Current Time" value={formatTime(new Date())} />
      </dl>

      <Button
        size="lg"
        className="mt-6 w-full"
        loading={submitting}
        onClick={handleConfirm}
      >
        Confirm OUT
      </Button>
    </Card>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 py-1.5">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-900">{value || '-'}</dd>
    </div>
  );
}
