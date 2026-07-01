import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Card, Table, Pagination, Input, Modal, Button } from '../../components/ui';
import { formatDateTime } from '../../utils/formatters';
import { listAuditLogs } from '../../services/auditService';
import { extractErrorMessage } from '../../services/apiClient';

const LIMIT = 15;

const ACTIONS = [
  'in_submitted',
  'out_completed',
  'auto_closed',
  'edited',
  'cancelled',
  'admin_closed',
  'exported',
  'qr_created',
  'qr_updated',
  'settings_updated',
  'login',
];

function humanize(value) {
  if (!value) return '-';
  return value
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function DetailModal({ log, onClose }) {
  if (!log) return null;
  return (
    <Modal open={!!log} onClose={onClose} title="Audit Log Detail" size="lg" footer={<Button onClick={onClose}>Close</Button>}>
      <div className="space-y-4 text-sm">
        <div className="grid grid-cols-2 gap-3">
          <p>
            <span className="text-slate-500">Date/Time: </span>
            {formatDateTime(log.actionAt)}
          </p>
          <p>
            <span className="text-slate-500">Admin: </span>
            {log.adminUserId?.fullName || 'System'}
          </p>
          <p>
            <span className="text-slate-500">Module: </span>
            {log.moduleName}
          </p>
          <p>
            <span className="text-slate-500">Action: </span>
            {humanize(log.action)}
          </p>
          <p>
            <span className="text-slate-500">Visitor ID: </span>
            {log.visitorId || '-'}
          </p>
          <p>
            <span className="text-slate-500">IP Address: </span>
            {log.ipAddress || '-'}
          </p>
        </div>
        <div>
          <p className="mb-1 font-medium text-slate-700">Old Value</p>
          <pre className="max-h-48 overflow-auto rounded-lg bg-slate-50 p-3 text-xs text-slate-700">
            {log.oldValue ? JSON.stringify(log.oldValue, null, 2) : '-'}
          </pre>
        </div>
        <div>
          <p className="mb-1 font-medium text-slate-700">New Value</p>
          <pre className="max-h-48 overflow-auto rounded-lg bg-slate-50 p-3 text-xs text-slate-700">
            {log.newValue ? JSON.stringify(log.newValue, null, 2) : '-'}
          </pre>
        </div>
      </div>
    </Modal>
  );
}

export default function AuditTrail() {
  const [page, setPage] = useState(1);
  const [action, setAction] = useState('');
  const [visitorId, setVisitorId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1, limit: LIMIT });
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = useCallback(() => {
    setLoading(true);
    listAuditLogs({ page, limit: LIMIT, action: action || undefined, visitorId: visitorId || undefined, dateFrom: dateFrom || undefined, dateTo: dateTo || undefined })
      .then((res) => {
        setData(res.data.data);
        setMeta(res.data.meta);
      })
      .catch((err) => toast.error(extractErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [page, action, visitorId, dateFrom, dateTo]);

  useEffect(() => {
    const t = setTimeout(fetchLogs, visitorId ? 400 : 0);
    return () => clearTimeout(t);
  }, [fetchLogs, visitorId]);

  const handleFilterChange = (setter) => (value) => {
    setter(value);
    setPage(1);
  };

  const columns = [
    { key: 'actionAt', label: 'Date/Time', render: (r) => formatDateTime(r.actionAt) },
    { key: 'admin', label: 'Admin', render: (r) => r.adminUserId?.fullName || 'System' },
    { key: 'moduleName', label: 'Module' },
    { key: 'action', label: 'Action', render: (r) => humanize(r.action) },
    { key: 'visitorId', label: 'Visitor ID', render: (r) => r.visitorId || '-' },
    { key: 'ipAddress', label: 'IP Address', render: (r) => r.ipAddress || '-' },
    {
      key: 'view',
      label: '',
      render: (r) => (
        <button onClick={() => setSelectedLog(r)} className="text-sm font-medium text-brand-600 hover:text-brand-700">
          Details
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Audit Trail</h1>
        <p className="mt-1 text-sm text-slate-500">A record of every admin and system action performed.</p>
      </div>

      <Card>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Action</label>
            <select
              className="block w-full rounded-lg border-0 px-3.5 py-2.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-brand-600"
              value={action}
              onChange={(e) => handleFilterChange(setAction)(e.target.value)}
            >
              <option value="">All Actions</option>
              {ACTIONS.map((a) => (
                <option key={a} value={a}>
                  {humanize(a)}
                </option>
              ))}
            </select>
          </div>
          <Input label="Visitor ID" placeholder="e.g. VP-0001" value={visitorId} onChange={(e) => handleFilterChange(setVisitorId)(e.target.value)} />
          <Input label="Date From" type="date" value={dateFrom} onChange={(e) => handleFilterChange(setDateFrom)(e.target.value)} />
          <Input label="Date To" type="date" value={dateTo} onChange={(e) => handleFilterChange(setDateTo)(e.target.value)} />
        </div>
      </Card>

      <Card padded={false}>
        <Table columns={columns} data={data} loading={loading} emptyMessage="No audit logs found" />
        <Pagination page={page} totalPages={meta.totalPages} total={meta.total} limit={meta.limit || LIMIT} onPageChange={setPage} />
      </Card>

      <DetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />
    </div>
  );
}
