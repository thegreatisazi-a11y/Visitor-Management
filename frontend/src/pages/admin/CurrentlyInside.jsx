import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiEye, FiXCircle, FiLogOut } from 'react-icons/fi';
import { Card, Table, Pagination, FilterBar, Modal, ConfirmDialog, Button, StatusBadge } from '../../components/ui';
import { formatDate, formatTime, liveDuration } from '../../utils/formatters';
import { listCurrentlyInside, cancelEntry, adminCloseEntry } from '../../services/visitorService';
import { extractErrorMessage } from '../../services/apiClient';
import { subscribe } from '../../services/socket';

const LIMIT = 10;

function DetailRow({ label, value }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-100 py-2 text-sm last:border-0">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-medium text-slate-800">{value ?? '-'}</span>
    </div>
  );
}

function ViewModal({ entry, onClose }) {
  if (!entry) return null;
  return (
    <Modal open={!!entry} onClose={onClose} title={`Visitor Entry - ${entry.visitorId}`} size="lg" footer={<Button onClick={onClose}>Close</Button>}>
      <div className="space-y-1">
        <DetailRow label="Visitor ID" value={entry.visitorId} />
        <DetailRow label="Date" value={formatDate(entry.visitDate)} />
        <DetailRow label="Visitor Name" value={entry.visitorName} />
        <DetailRow label="Company Name" value={entry.companyName} />
        <DetailRow label="Address" value={entry.address} />
        <DetailRow label="Mobile No." value={entry.mobileNo} />
        <DetailRow label="Email ID" value={entry.emailId} />
        <DetailRow label="Purpose of Visit" value={entry.purposeOfVisit} />
        <DetailRow label="Person to Meet" value={entry.personToMeet} />
        <DetailRow label="In Time" value={formatTime(entry.inTime)} />
        <DetailRow label="Current Duration" value={liveDuration(entry.inTime)} />
        <DetailRow label="Status" value={<StatusBadge status={entry.status} />} />
        <DetailRow label="Remarks" value={entry.remarks} />
      </div>
    </Modal>
  );
}

export default function CurrentlyInside() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filters, setFilters] = useState([]);
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1, limit: LIMIT });
  const [loading, setLoading] = useState(true);
  const [, setTick] = useState(0);

  const [viewEntry, setViewEntry] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [closeTarget, setCloseTarget] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchList = useCallback(() => {
    setLoading(true);
    listCurrentlyInside({ page, limit: LIMIT, search: debouncedSearch, filters: JSON.stringify(filters) })
      .then((res) => {
        setData(res.data.data);
        setMeta(res.data.meta);
      })
      .catch((err) => toast.error(extractErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [page, debouncedSearch, filters]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  useEffect(() => subscribe(['visitorCheckedIn', 'visitorCheckedOut'], () => fetchList()), [fetchList]);

  const handleApplyFilters = (rows) => {
    setFilters(rows);
    setPage(1);
  };

  const handleCancel = async (reason) => {
    try {
      await cancelEntry(cancelTarget._id, reason);
      toast.success('Visitor entry cancelled');
      setCancelTarget(null);
      fetchList();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  };

  const handleAdminClose = async () => {
    try {
      await adminCloseEntry(closeTarget._id);
      toast.success('Visitor entry closed');
      setCloseTarget(null);
      fetchList();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  };

  const columns = [
    { key: 'visitorId', label: 'Visitor ID' },
    { key: 'visitorName', label: 'Visitor Name' },
    { key: 'mobileNo', label: 'Mobile No.' },
    { key: 'companyName', label: 'Company Name' },
    { key: 'personToMeet', label: 'Person to Meet' },
    { key: 'purposeOfVisit', label: 'Purpose of Visit' },
    { key: 'inTime', label: 'In Time', render: (r) => formatTime(r.inTime) },
    { key: 'duration', label: 'Current Duration', render: (r) => liveDuration(r.inTime) },
    {
      key: 'actions',
      label: 'Actions',
      render: (r) => (
        <div className="flex items-center gap-2">
          <button title="View" onClick={() => setViewEntry(r)} className="text-slate-500 hover:text-brand-600">
            <FiEye size={16} />
          </button>
          <button title="Cancel" onClick={() => setCancelTarget(r)} className="text-slate-500 hover:text-rose-600">
            <FiXCircle size={16} />
          </button>
          <button title="Admin Close" onClick={() => setCloseTarget(r)} className="text-slate-500 hover:text-emerald-600">
            <FiLogOut size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Currently Inside</h1>
        <p className="mt-1 text-sm text-slate-500">Visitors who are currently on the premises.</p>
      </div>

      <FilterBar search={search} onSearchChange={setSearch} quickFilters={[]} filters={filters} onApplyFilters={handleApplyFilters} />

      <Card padded={false}>
        <Table columns={columns} data={data} loading={loading} emptyMessage="No visitors currently inside" />
        <Pagination page={page} totalPages={meta.totalPages} total={meta.total} limit={meta.limit || LIMIT} onPageChange={setPage} />
      </Card>

      <ViewModal entry={viewEntry} onClose={() => setViewEntry(null)} />
      <ConfirmDialog
        open={!!cancelTarget}
        title="Cancel Visitor Entry"
        message={`Are you sure you want to cancel the entry for "${cancelTarget?.visitorName}"? This cannot be undone.`}
        requireReason
        confirmLabel="Cancel Entry"
        confirmVariant="danger"
        onConfirm={handleCancel}
        onCancel={() => setCancelTarget(null)}
      />
      <ConfirmDialog
        open={!!closeTarget}
        title="Admin Close Entry"
        message={`Force close the visit for "${closeTarget?.visitorName}"? This will mark them as checked out.`}
        confirmLabel="Close Entry"
        confirmVariant="primary"
        onConfirm={handleAdminClose}
        onCancel={() => setCloseTarget(null)}
      />
    </div>
  );
}
