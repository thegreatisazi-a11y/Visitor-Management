import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { FiDownload } from 'react-icons/fi';
import { Card, Button, Input, Table, Pagination } from '../../components/ui';
import { REPORT_TYPES, EXPORT_FORMATS, STATUS_LABELS } from '../../constants';
import { formatDateTime } from '../../utils/formatters';
import { getReportData, listExportHistory, exportReport } from '../../services/reportService';
import { extractErrorMessage } from '../../services/apiClient';

const HISTORY_LIMIT = 8;

export default function Reports() {
  const { register, watch, getValues } = useForm({
    defaultValues: { reportType: 'daily', fileFormat: 'excel', dateFrom: '', dateTo: '', search: '' },
  });
  const reportType = watch('reportType');
  const dateFrom = watch('dateFrom');
  const dateTo = watch('dateTo');
  const search = watch('search');

  const [previewRows, setPreviewRows] = useState([]);
  const [previewLoading, setPreviewLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const [historyPage, setHistoryPage] = useState(1);
  const [historyData, setHistoryData] = useState([]);
  const [historyMeta, setHistoryMeta] = useState({ total: 0, totalPages: 1, limit: HISTORY_LIMIT });
  const [historyLoading, setHistoryLoading] = useState(true);

  const fetchPreview = useCallback(() => {
    setPreviewLoading(true);
    getReportData({ reportType, dateFrom: reportType === 'custom' ? dateFrom : undefined, dateTo: reportType === 'custom' ? dateTo : undefined, search })
      .then((res) => setPreviewRows(res.data.data))
      .catch((err) => toast.error(extractErrorMessage(err)))
      .finally(() => setPreviewLoading(false));
  }, [reportType, dateFrom, dateTo, search]);

  useEffect(() => {
    const t = setTimeout(fetchPreview, 400);
    return () => clearTimeout(t);
  }, [fetchPreview]);

  const fetchHistory = useCallback(() => {
    setHistoryLoading(true);
    listExportHistory({ page: historyPage, limit: HISTORY_LIMIT })
      .then((res) => {
        setHistoryData(res.data.data);
        setHistoryMeta(res.data.meta);
      })
      .catch((err) => toast.error(extractErrorMessage(err)))
      .finally(() => setHistoryLoading(false));
  }, [historyPage]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleGenerate = async () => {
    const values = getValues();
    if (values.reportType === 'custom' && (!values.dateFrom || !values.dateTo)) {
      toast.error('Please select both a from and to date for a custom report');
      return;
    }
    setExporting(true);
    try {
      const response = await exportReport({
        reportType: values.reportType,
        fileFormat: values.fileFormat,
        dateFrom: values.reportType === 'custom' ? values.dateFrom : undefined,
        dateTo: values.reportType === 'custom' ? values.dateTo : undefined,
        search: values.search || undefined,
      });
      const ext = values.fileFormat === 'excel' ? 'xlsx' : values.fileFormat;
      const blobUrl = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${values.reportType}-report.${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
      toast.success('Report exported successfully');
      fetchHistory();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    } finally {
      setExporting(false);
    }
  };

  const previewColumns = [
    { key: 'visitorId', label: 'Visitor ID' },
    { key: 'visitDateFmt', label: 'Date' },
    { key: 'visitorName', label: 'Visitor Name' },
    { key: 'mobileNo', label: 'Mobile No.' },
    { key: 'status', label: 'Status', render: (r) => STATUS_LABELS[r.status] || r.status },
  ];

  const historyColumns = [
    { key: 'reportName', label: 'Report Name' },
    { key: 'reportType', label: 'Type', render: (r) => REPORT_TYPES.find((t) => t.value === r.reportType)?.label || r.reportType },
    { key: 'fileFormat', label: 'Format', render: (r) => r.fileFormat?.toUpperCase() },
    { key: 'exportedBy', label: 'Exported By', render: (r) => r.exportedBy?.fullName || '-' },
    { key: 'exportedAt', label: 'Exported At', render: (r) => formatDateTime(r.exportedAt) },
    { key: 'status', label: 'Status' },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Reports</h1>
        <p className="mt-1 text-sm text-slate-500">Generate, preview and export visitor reports.</p>
      </div>

      <Card>
        <h3 className="mb-4 text-sm font-semibold text-slate-800">Generate Report</h3>
        <form className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Report Type</label>
            <select
              className="block w-full rounded-lg border-0 px-3.5 py-2.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-brand-600"
              {...register('reportType')}
            >
              {REPORT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {reportType === 'custom' && (
            <>
              <Input label="Date From" type="date" {...register('dateFrom')} />
              <Input label="Date To" type="date" {...register('dateTo')} />
            </>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Export Format</label>
            <select
              className="block w-full rounded-lg border-0 px-3.5 py-2.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-brand-600"
              {...register('fileFormat')}
            >
              {EXPORT_FORMATS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          <Input label="Search (optional)" placeholder="Filter by name, mobile, etc." {...register('search')} />
        </form>

        <div className="mt-4 flex justify-end">
          <Button onClick={handleGenerate} loading={exporting}>
            <FiDownload size={16} /> Generate & Download
          </Button>
        </div>
      </Card>

      <Card padded={false}>
        <div className="p-5 pb-0">
          <h3 className="text-sm font-semibold text-slate-800">Report Preview</h3>
          <p className="mt-1 text-sm text-slate-500">A preview of the records that will be included in the export.</p>
        </div>
        <div className="mt-3">
          <Table columns={previewColumns} data={previewRows} loading={previewLoading} emptyMessage="No matching records" />
        </div>
      </Card>

      <Card padded={false}>
        <div className="p-5 pb-0">
          <h3 className="text-sm font-semibold text-slate-800">Export History</h3>
        </div>
        <div className="mt-3">
          <Table columns={historyColumns} data={historyData} loading={historyLoading} emptyMessage="No exports yet" />
          <Pagination
            page={historyPage}
            totalPages={historyMeta.totalPages}
            total={historyMeta.total}
            limit={historyMeta.limit || HISTORY_LIMIT}
            onPageChange={setHistoryPage}
          />
        </div>
      </Card>
    </div>
  );
}
