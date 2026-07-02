import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { FiEye, FiEdit2, FiXCircle, FiLogOut, FiPrinter, FiDownload, FiRotateCcw, FiChevronDown, FiChevronUp, FiImage } from 'react-icons/fi';
import { Card, Table, Pagination, FilterBar, Modal, ConfirmDialog, Button, Input, TextArea, StatusBadge, Spinner } from '../../components/ui';
import { QUICK_FILTERS, CHECKOUT_METHOD_LABELS, STATUS_LABELS, ENTRY_METHOD_LABELS, EXPORT_FORMATS } from '../../constants';
import { formatDate, formatTime, formatDuration, formatDateTime } from '../../utils/formatters';
import { listEntries, updateEntry, cancelEntry, adminCloseEntry, logPrint, getDistinctValues } from '../../services/visitorService';
import { getProfilePhoto } from '../../services/visitorProfileService';
import { exportReport, listExportHistory } from '../../services/reportService';
import { extractErrorMessage } from '../../services/apiClient';
import { subscribe } from '../../services/socket';

const LIMIT = 10;
const HISTORY_LIMIT = 5;

// Every one of these gets an Excel-style "select values" header filter.
// Each value is an array of currently-checked values (empty = no filter on that column).
const BLANK_COLUMN_FILTERS = {
  visitorId: [],
  visitorName: [],
  mobileNo: [],
  emailId: [],
  companyName: [],
  personToMeet: [],
  purposeOfVisit: [],
  status: [],
  checkoutMethod: [],
  entryMethod: [],
};

const LABEL_MAPS = {
  status: STATUS_LABELS,
  checkoutMethod: CHECKOUT_METHOD_LABELS,
  entryMethod: ENTRY_METHOD_LABELS,
};

// Date/time/duration columns get an operator+range filter instead of a values
// checklist - nearly every row has its own unique timestamp/duration, so "select
// from the distinct values" isn't a useful filter there (see ColumnRangeFilter).
const BLANK_RANGE = { operator: '', value: '', value2: '' };
const BLANK_RANGE_FILTERS = {
  visitDate: BLANK_RANGE,
  inTime: BLANK_RANGE,
  outTime: BLANK_RANGE,
  visitDurationMinutes: BLANK_RANGE,
  confidenceScore: BLANK_RANGE,
};
const RANGE_FIELD_TYPES = {
  visitDate: 'date',
  inTime: 'datetime',
  outTime: 'datetime',
  visitDurationMinutes: 'number',
  confidenceScore: 'number',
};

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
        <DetailRow label="Entry Method" value={ENTRY_METHOD_LABELS[entry.entryMethod] || '-'} />
        <DetailRow
          label="Match Confidence"
          value={entry.confidenceScore != null ? `${Math.round(entry.confidenceScore * 100)}%` : '-'}
        />
        <DetailRow label="Remarks" value={entry.remarks} />
        {entry.status === 'cancelled' && <DetailRow label="Cancellation Reason" value={entry.cancellationReason} />}
      </div>
    </Modal>
  );
}

// Photo lives on the linked VisitorProfile (populated onto the entry). Fetched
// through the authed client as a blob, shown in a modal.
function PhotoModal({ entry, onClose }) {
  const [url, setUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  const profileId = entry?.visitorProfileId?._id;

  useEffect(() => {
    if (!entry) return undefined;
    if (!profileId) {
      setLoading(false);
      return undefined;
    }
    let objectUrl;
    setLoading(true);
    getProfilePhoto(profileId)
      .then((res) => {
        objectUrl = URL.createObjectURL(res.data);
        setUrl(objectUrl);
      })
      .catch(() => setUrl(null))
      .finally(() => setLoading(false));
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [entry, profileId]);

  if (!entry) return null;

  return (
    <Modal open={!!entry} onClose={onClose} title={`Photo - ${entry.visitorName}`}>
      <div className="flex min-h-[240px] items-center justify-center">
        {loading ? (
          <Spinner size={32} />
        ) : url ? (
          <img src={url} alt={entry.visitorName} className="max-h-80 rounded-lg" />
        ) : (
          <p className="text-sm text-slate-500">No photo on file for this visitor.</p>
        )}
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

function ExportHistoryPanel({ open }) {
  const [page, setPage] = useState(1);
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1, limit: HISTORY_LIMIT });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    listExportHistory({ page, limit: HISTORY_LIMIT })
      .then((res) => {
        setData(res.data.data);
        setMeta(res.data.meta);
      })
      .catch((err) => toast.error(extractErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [open, page]);

  if (!open) return null;

  const columns = [
    { key: 'reportName', label: 'Export Name' },
    { key: 'fileFormat', label: 'Format', render: (r) => r.fileFormat?.toUpperCase() },
    { key: 'exportedBy', label: 'Exported By', render: (r) => r.exportedBy?.fullName || '-' },
    { key: 'exportedAt', label: 'Exported At', render: (r) => formatDateTime(r.exportedAt) },
    { key: 'status', label: 'Status' },
  ];

  return (
    <Card padded={false} className="no-print">
      <div className="p-5 pb-0">
        <h3 className="text-sm font-semibold text-slate-800">Export History</h3>
      </div>
      <div className="mt-3">
        <Table columns={columns} data={data} loading={loading} emptyMessage="No exports yet" />
        <Pagination page={page} totalPages={meta.totalPages} total={meta.total} limit={meta.limit || HISTORY_LIMIT} onPageChange={setPage} />
      </div>
    </Card>
  );
}

export default function VisitorEntries() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [quickFilter, setQuickFilter] = useState('');
  const [advancedFilters, setAdvancedFilters] = useState([]);
  const [columnFilters, setColumnFilters] = useState(BLANK_COLUMN_FILTERS);
  const [rangeFilters, setRangeFilters] = useState(BLANK_RANGE_FILTERS);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [debouncedDateRange, setDebouncedDateRange] = useState({ dateFrom: '', dateTo: '' });

  const [data, setData] = useState([]);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1, limit: LIMIT });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(null);
  const [showHistory, setShowHistory] = useState(false);

  const [viewEntry, setViewEntry] = useState(null);
  const [editEntry, setEditEntry] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [closeTarget, setCloseTarget] = useState(null);
  const [photoEntry, setPhotoEntry] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedDateRange({ dateFrom, dateTo });
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [dateFrom, dateTo]);

  // Column header filters translate to the same {field, operator, value} shape the
  // advanced FilterBar produces (operator "in_list" = Excel-style "match any of these
  // checked values"), so both sources merge into one query to the backend.
  const columnFilterRows = useMemo(() => {
    return Object.entries(columnFilters)
      .filter(([, values]) => values.length > 0)
      .map(([field, values]) => ({ field, operator: 'in_list', value: values }));
  }, [columnFilters]);

  const rangeFilterRows = useMemo(() => {
    return Object.entries(rangeFilters)
      .filter(([, r]) => r.operator)
      .map(([field, r]) => ({ field, operator: r.operator, value: r.value, value2: r.value2 }));
  }, [rangeFilters]);

  const combinedFilters = useMemo(
    () => [...advancedFilters, ...columnFilterRows, ...rangeFilterRows],
    [advancedFilters, columnFilterRows, rangeFilterRows]
  );

  const fetchList = useCallback(() => {
    setLoading(true);
    listEntries({
      page,
      limit: LIMIT,
      search: debouncedSearch,
      quickFilter,
      filters: JSON.stringify(combinedFilters),
      dateFrom: debouncedDateRange.dateFrom || undefined,
      dateTo: debouncedDateRange.dateTo || undefined,
    })
      .then((res) => {
        setData(res.data.data);
        setMeta(res.data.meta);
      })
      .catch((err) => toast.error(extractErrorMessage(err)))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedSearch, quickFilter, combinedFilters, debouncedDateRange]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  // Live-refresh the grid when a visitor checks in/out anywhere (mobile, face, admin).
  useEffect(() => subscribe(['visitorCheckedIn', 'visitorCheckedOut'], () => fetchList()), [fetchList]);

  const handleQuickFilterChange = (val) => {
    setQuickFilter(val);
    setPage(1);
  };

  const handleApplyFilters = (rows) => {
    setAdvancedFilters(rows);
    setPage(1);
  };

  const handleColumnFilterChange = (field, values) => {
    setColumnFilters((prev) => ({ ...prev, [field]: values }));
    setPage(1);
  };

  const handleRangeFilterChange = (field, rangeValue) => {
    setRangeFilters((prev) => ({ ...prev, [field]: rangeValue }));
    setPage(1);
  };

  const handleResetAllFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setQuickFilter('');
    setAdvancedFilters([]);
    setColumnFilters(BLANK_COLUMN_FILTERS);
    setRangeFilters(BLANK_RANGE_FILTERS);
    setDateFrom('');
    setDateTo('');
    setDebouncedDateRange({ dateFrom: '', dateTo: '' });
    setPage(1);
  };

  const hasActiveFilters =
    debouncedSearch ||
    quickFilter ||
    advancedFilters.length > 0 ||
    columnFilterRows.length > 0 ||
    rangeFilterRows.length > 0 ||
    dateFrom ||
    dateTo;

  const handlePrintEntry = () => {
    logPrint({ search: debouncedSearch, quickFilter, filters: [{ field: 'visitorId', operator: 'equals', value: viewEntry?.visitorId }] }).catch(() => {});
    window.print();
  };

  const handlePrintList = () => {
    logPrint({ search: debouncedSearch, quickFilter, filters: combinedFilters }).catch(() => {});
    window.print();
  };

  const handleExport = async (fileFormat) => {
    setExporting(fileFormat);
    try {
      const response = await exportReport({
        reportType: 'custom',
        fileFormat,
        dateFrom: debouncedDateRange.dateFrom || undefined,
        dateTo: debouncedDateRange.dateTo || undefined,
        filters: JSON.stringify(combinedFilters),
        search: debouncedSearch || undefined,
      });
      const ext = fileFormat === 'excel' ? 'xlsx' : fileFormat;
      const blobUrl = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `visitor-entries.${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
      toast.success('Export ready and downloaded');
    } catch (error) {
      toast.error(extractErrorMessage(error));
    } finally {
      setExporting(null);
    }
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

  // Excel-style header filter: the option list is fetched fresh each time the menu
  // opens, scoped by every OTHER currently active filter (search/quick/date-range/
  // other columns) - the backend strips this column's own filter before computing it.
  const distinctFilter = (field) => ({
    selectedValues: columnFilters[field],
    fetchOptions: async () => {
      const res = await getDistinctValues(field, {
        search: debouncedSearch,
        quickFilter,
        filters: JSON.stringify(combinedFilters),
        dateFrom: debouncedDateRange.dateFrom || undefined,
        dateTo: debouncedDateRange.dateTo || undefined,
      });
      const labelMap = LABEL_MAPS[field];
      return labelMap ? res.data.data.map((v) => ({ value: v, label: labelMap[v] || v })) : res.data.data;
    },
    onApply: (values) => handleColumnFilterChange(field, values),
  });

  const rangeFilter = (field) => ({
    kind: 'range',
    fieldType: RANGE_FIELD_TYPES[field],
    value: rangeFilters[field],
    onApply: (rangeValue) => handleRangeFilterChange(field, rangeValue),
  });

  const columns = [
    { key: 'visitorId', label: 'Visitor ID', filter: distinctFilter('visitorId') },
    { key: 'visitDate', label: 'Date', render: (r) => formatDate(r.visitDate), filter: rangeFilter('visitDate') },
    { key: 'visitorName', label: 'Visitor Name', filter: distinctFilter('visitorName') },
    { key: 'mobileNo', label: 'Mobile No.', filter: distinctFilter('mobileNo') },
    { key: 'emailId', label: 'Email ID', filter: distinctFilter('emailId') },
    { key: 'companyName', label: 'Company Name', filter: distinctFilter('companyName') },
    { key: 'purposeOfVisit', label: 'Purpose of Visit', filter: distinctFilter('purposeOfVisit') },
    { key: 'personToMeet', label: 'Person to Meet', filter: distinctFilter('personToMeet') },
    { key: 'inTime', label: 'In Time', render: (r) => formatTime(r.inTime), filter: rangeFilter('inTime') },
    { key: 'outTime', label: 'Out Time', render: (r) => formatTime(r.outTime), filter: rangeFilter('outTime') },
    {
      key: 'visitDurationMinutes',
      label: 'Duration',
      render: (r) => formatDuration(r.visitDurationMinutes),
      filter: rangeFilter('visitDurationMinutes'),
    },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} />, filter: distinctFilter('status') },
    {
      key: 'checkoutMethod',
      label: 'Checkout Method',
      render: (r) => CHECKOUT_METHOD_LABELS[r.checkoutMethod] || '-',
      filter: distinctFilter('checkoutMethod'),
    },
    {
      key: 'entryMethod',
      label: 'Entry Method',
      render: (r) => ENTRY_METHOD_LABELS[r.entryMethod] || '-',
      filter: distinctFilter('entryMethod'),
    },
    {
      key: 'confidenceScore',
      label: 'Confidence',
      render: (r) => (r.confidenceScore != null ? `${Math.round(r.confidenceScore * 100)}%` : '-'),
      filter: rangeFilter('confidenceScore'),
    },
    {
      key: 'photo',
      label: 'Photo',
      render: (r) =>
        r.visitorProfileId ? (
          <button title="View Photo" onClick={() => setPhotoEntry(r)} className="text-slate-500 hover:text-brand-600">
            <FiImage size={16} />
          </button>
        ) : (
          <span className="text-slate-300">-</span>
        ),
    },
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
    <div className="w-full max-w-full space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Visitor Entries</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage, filter, export and print all visitor check-in/check-out records.
          </p>
        </div>
        <div className="no-print flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setShowHistory((s) => !s)}>
            {showHistory ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />} Export History
          </Button>
          <Button variant="secondary" size="sm" onClick={handlePrintList}>
            <FiPrinter size={16} /> Print List
          </Button>
          {EXPORT_FORMATS.map((f) => (
            <Button
              key={f.value}
              variant="secondary"
              size="sm"
              loading={exporting === f.value}
              onClick={() => handleExport(f.value)}
            >
              <FiDownload size={16} /> {f.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="no-print flex flex-wrap items-end gap-3">
        <Input label="Date From" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} containerClassName="w-40" />
        <Input label="Date To" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} containerClassName="w-40" />
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={handleResetAllFilters}>
            <FiRotateCcw size={14} /> Reset All Filters
          </Button>
        )}
        <span className="ml-auto text-sm text-slate-500">
          <span className="font-semibold text-slate-800">{meta.total}</span> matching record{meta.total === 1 ? '' : 's'}
        </span>
      </div>

      <div className="no-print">
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          quickFilters={QUICK_FILTERS}
          activeQuickFilter={quickFilter}
          onQuickFilterChange={handleQuickFilterChange}
          filters={advancedFilters}
          onApplyFilters={handleApplyFilters}
        />
      </div>

      <Card padded={false} className="w-full max-w-full">
        <Table columns={columns} data={data} loading={loading} emptyMessage="No visitor entries found" />
        <div className="no-print">
          <Pagination page={page} totalPages={meta.totalPages} total={meta.total} limit={meta.limit || LIMIT} onPageChange={setPage} />
        </div>
      </Card>

      <ExportHistoryPanel open={showHistory} />

      <ViewModal entry={viewEntry} onClose={() => setViewEntry(null)} onPrint={handlePrintEntry} />
      <PhotoModal entry={photoEntry} onClose={() => setPhotoEntry(null)} />
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
