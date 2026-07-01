import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { FiEye, FiEdit2, FiXCircle, FiLogOut, FiPrinter } from 'react-icons/fi';
import { Card, Table, Pagination, FilterBar, Modal, ConfirmDialog, Button, Input, TextArea, StatusBadge } from '../../components/ui';
import { QUICK_FILTERS, CHECKOUT_METHOD_LABELS } from '../../constants';
import { formatDate, formatTime, formatDuration } from '../../utils/formatters';
import { listEntries, updateEntry, cancelEntry, adminCloseEntry } from '../../services/visitorService';
import { extractErrorMessage } from '../../services/apiClient';

const LIMIT = 10;

function DetailRow({ label, value }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-100 py-2 text-sm last:border-0">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-medium text-slate-800">{value ?? '-'}</span>
    </div>
  );
}

function ViewModal({ entry, onClose, onPrint }) {
  if (!entry) return null;
  return (
    <Modal
      open={!!entry}
      onClose={onClose}
      title={`Visitor Entry - ${entry.visitorId}`}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button onClick={onPrint}>
            <FiPrinter size={16} /> Print
          </Button>
        </>
      }
    >
      <div id="visitor-entry-print" className="space-y-1">
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
        <DetailRow label="Out Time" value={formatTime(entry.outTime)} />
        <DetailRow label="Duration" value={formatDuration(entry.visitDurationMinutes)} />
        <DetailRow label="Status" value={<StatusBadge status={entry.status} />} />
        <DetailRow label="Checkout Method" value={CHECKOUT_METHOD_LABELS[entry.checkoutMethod] || '-'} />
        <DetailRow label="Remarks" value={entry.remarks} />
        {entry.status === 'cancelled' && <DetailRow label="Cancellation Reason" value={entry.cancellationReason} />}
      </div>
    </Modal>
  );
}

function EditModal({ entry, onClose, onSaved }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: entry || {} });

  useEffect(() => {
    if (entry) reset(entry);
  }, [entry, reset]);

  if (!entry) return null;

  const onSubmit = async (data) => {
    try {
      await updateEntry(entry._id, {
        visitorName: data.visitorName,
        companyName: data.companyName,
        address: data.address,
        mobileNo: data.mobileNo,
        emailId: data.emailId,
        purposeOfVisit: data.purposeOfVisit,
        personToMeet: data.personToMeet,
        remarks: data.remarks,
      });
      toast.success('Visitor entry updated');
      onSaved();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  };

  return (
    <Modal open={!!entry} onClose={onClose} title={`Edit Entry - ${entry.visitorId}`} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Visitor Name" required error={errors.visitorName?.message} {...register('visitorName', { required: 'Required' })} />
        <Input label="Company Name" {...register('companyName')} />
        <TextArea label="Address" {...register('address')} />
        <Input label="Mobile No." required error={errors.mobileNo?.message} {...register('mobileNo', { required: 'Required' })} />
        <Input label="Email ID" type="email" {...register('emailId')} />
        <Input label="Purpose of Visit" {...register('purposeOfVisit')} />
        <Input label="Person to Meet" {...register('personToMeet')} />
        <TextArea label="Remarks" {...register('remarks')} />
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

export default function VisitorEntries() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [quickFilter, setQuickFilter] = useState('');
  const [filters, setFilters] = useState([]);
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1, limit: LIMIT });
  const [loading, setLoading] = useState(true);

  const [viewEntry, setViewEntry] = useState(null);
  const [editEntry, setEditEntry] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [closeTarget, setCloseTarget] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchList = useCallback(() => {
    setLoading(true);
    listEntries({ page, limit: LIMIT, search: debouncedSearch, quickFilter, filters: JSON.stringify(filters) })
      .then((res) => {
        setData(res.data.data);
        setMeta(res.data.meta);
      })
      .catch((err) => toast.error(extractErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [page, debouncedSearch, quickFilter, filters]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const handleQuickFilterChange = (val) => {
    setQuickFilter(val);
    setPage(1);
  };

  const handleApplyFilters = (rows) => {
    setFilters(rows);
    setPage(1);
  };

  const handlePrint = () => window.print();

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
    { key: 'visitDate', label: 'Date', render: (r) => formatDate(r.visitDate) },
    { key: 'visitorName', label: 'Visitor Name' },
    { key: 'mobileNo', label: 'Mobile No.' },
    { key: 'emailId', label: 'Email ID' },
    { key: 'companyName', label: 'Company Name' },
    { key: 'purposeOfVisit', label: 'Purpose of Visit' },
    { key: 'personToMeet', label: 'Person to Meet' },
    { key: 'inTime', label: 'In Time', render: (r) => formatTime(r.inTime) },
    { key: 'outTime', label: 'Out Time', render: (r) => formatTime(r.outTime) },
    { key: 'visitDurationMinutes', label: 'Duration', render: (r) => formatDuration(r.visitDurationMinutes) },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'checkoutMethod', label: 'Checkout Method', render: (r) => CHECKOUT_METHOD_LABELS[r.checkoutMethod] || '-' },
    {
      key: 'actions',
      label: 'Actions',
      render: (r) => (
        <div className="flex items-center gap-2">
          <button title="View" onClick={() => setViewEntry(r)} className="text-slate-500 hover:text-brand-600">
            <FiEye size={16} />
          </button>
          <button title="Edit" onClick={() => setEditEntry(r)} className="text-slate-500 hover:text-brand-600">
            <FiEdit2 size={16} />
          </button>
          <button
            title="Cancel"
            disabled={r.status === 'cancelled'}
            onClick={() => setCancelTarget(r)}
            className="text-slate-500 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <FiXCircle size={16} />
          </button>
          <button
            title="Admin Close"
            disabled={r.status !== 'inside_premises'}
            onClick={() => setCloseTarget(r)}
            className="text-slate-500 hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <FiLogOut size={16} />
          </button>
          <button
            title="Print"
            onClick={() => {
              setViewEntry(r);
            }}
            className="text-slate-500 hover:text-brand-600"
          >
            <FiPrinter size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Visitor Entries</h1>
        <p className="mt-1 text-sm text-slate-500">Manage and review all visitor check-in/check-out records.</p>
      </div>

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        quickFilters={QUICK_FILTERS}
        activeQuickFilter={quickFilter}
        onQuickFilterChange={handleQuickFilterChange}
        filters={filters}
        onApplyFilters={handleApplyFilters}
      />

      <Card padded={false}>
        <Table columns={columns} data={data} loading={loading} emptyMessage="No visitor entries found" />
        <Pagination page={page} totalPages={meta.totalPages} total={meta.total} limit={meta.limit || LIMIT} onPageChange={setPage} />
      </Card>

      <ViewModal entry={viewEntry} onClose={() => setViewEntry(null)} onPrint={handlePrint} />
      <EditModal
        entry={editEntry}
        onClose={() => setEditEntry(null)}
        onSaved={() => {
          setEditEntry(null);
          fetchList();
        }}
      />
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
