import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Button, Card, StatusBadge } from '../../components/ui';
import { formatDuration } from '../../utils/formatters';

export default function CheckOutSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const entry = location.state?.entry;

  if (!entry) {
    return <Navigate to="/visitor" replace />;
  }

  return (
    <Card className="text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
        <svg className="h-9 w-9 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h1 className="mt-4 text-lg font-semibold text-slate-900">Check-Out Successful</h1>
      <div className="mt-2 flex justify-center">
        <StatusBadge status="completed" />
      </div>

      <dl className="mt-6 space-y-2 text-left text-sm">
        <Row label="Visitor ID" value={entry.visitorId} />
        <Row label="Visitor Name" value={entry.visitorName} />
        <Row label="Company Name" value={entry.companyName} />
        <Row label="Person to Meet" value={entry.personToMeet} />
        <Row label="Visit Date" value={entry.visitDate} />
        <Row label="In Time" value={entry.inTime} />
        <Row label="Out Time" value={entry.outTime} />
        <Row label="Visit Duration" value={formatDuration(entry.visitDurationMinutes)} />
      </dl>

      <p className="mt-6 text-sm font-medium text-slate-600">Thank you for visiting</p>

      <Button size="lg" className="mt-4 w-full" onClick={() => navigate('/visitor')}>
        Done
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
