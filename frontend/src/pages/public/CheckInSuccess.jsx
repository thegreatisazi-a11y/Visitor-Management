import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Button, Card, StatusBadge } from '../../components/ui';

export default function CheckInSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const entry = location.state?.entry;

  if (!entry) {
    return <Navigate to="/visitor" replace />;
  }

  return (
    <Card className="text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
        <svg className="h-9 w-9 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h1 className="mt-4 text-lg font-semibold text-slate-900">Check-In Successful</h1>
      <div className="mt-2 flex justify-center">
        <StatusBadge status="inside_premises" />
      </div>

      <dl className="mt-6 space-y-2 text-left text-sm">
        <Row label="Visitor ID" value={entry.visitorId} />
        <Row label="Visitor Name" value={entry.visitorName} />
        <Row label="Company Name" value={entry.companyName} />
        <Row label="Mobile No." value={entry.mobileNo} />
        <Row label="Person to Meet" value={entry.personToMeet} />
        <Row label="Purpose of Visit" value={entry.purposeOfVisit} />
        <Row label="Visit Date" value={entry.visitDate} />
        <Row label="In Time" value={entry.inTime} />
      </dl>

      <Button size="lg" className="mt-6 w-full" onClick={() => navigate('/visitor')}>
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
