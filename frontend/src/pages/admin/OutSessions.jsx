import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiSearch } from 'react-icons/fi';
import { Card, Table, Pagination, Input, StatusBadge } from '../../components/ui';
import { formatDateTime } from '../../utils/formatters';
import { listOutSessions } from '../../services/visitorService';
import { extractErrorMessage } from '../../services/apiClient';

const LIMIT = 10;

export default function OutSessions() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1, limit: LIMIT });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchList = useCallback(() => {
    setLoading(true);
    listOutSessions({ page, limit: LIMIT, search: debouncedSearch })
      .then((res) => {
        setData(res.data.data);
        setMeta(res.data.meta);
      })
      .catch((err) => toast.error(extractErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [page, debouncedSearch]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const columns = [
    { key: 'visitorId', label: 'Visitor ID' },
    { key: 'visitorName', label: 'Visitor Name' },
    { key: 'mobileEntered', label: 'Mobile Entered' },
    { key: 'outTime', label: 'Out Time', render: (r) => formatDateTime(r.outTime) },
    { key: 'ipAddress', label: 'IP Address' },
    { key: 'deviceInfo', label: 'Device Info' },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Out Sessions</h1>
        <p className="mt-1 text-sm text-slate-500">Log of visitor checkout sessions.</p>
      </div>

      <div className="relative max-w-md">
        <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        <Input placeholder="Search visitor ID or mobile..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Card padded={false}>
        <Table columns={columns} data={data} loading={loading} emptyMessage="No out sessions found" />
        <Pagination page={page} totalPages={meta.totalPages} total={meta.total} limit={meta.limit || LIMIT} onPageChange={setPage} />
      </Card>
    </div>
  );
}
