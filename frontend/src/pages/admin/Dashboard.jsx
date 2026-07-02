import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  LineChart,
  BarChart,
  PieChart,
  Line,
  Bar,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  FiLogIn,
  FiUsers,
  FiLogOut,
  FiClock,
  FiXCircle,
  FiPhone,
  FiRepeat,
  FiBarChart2,
  FiCalendar,
  FiTrendingUp,
  FiSun,
  FiUserCheck,
} from 'react-icons/fi';
import { Card, StatCard, Skeleton } from '../../components/ui';
import { STATUS_LABELS } from '../../constants';
import { formatDuration } from '../../utils/formatters';
import { getSummary, getAnalytics, getCharts } from '../../services/dashboardService';
import { extractErrorMessage } from '../../services/apiClient';
import { subscribe } from '../../services/socket';

const PIE_COLORS = ['#059669', '#2563eb', '#d97706', '#e11d48'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

function ChartCard({ title, children, height = 280 }) {
  return (
    <Card>
      <h3 className="mb-4 text-sm font-semibold text-slate-800">{title}</h3>
      <div style={{ width: '100%', height }}>{children}</div>
    </Card>
  );
}

function ChartSkeleton() {
  return <Skeleton className="h-full w-full" />;
}

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [charts, setCharts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    Promise.all([getSummary(), getAnalytics(), getCharts(30)])
      .then(([summaryRes, analyticsRes, chartsRes]) => {
        if (!mounted) return;
        setSummary(summaryRes.data.data);
        setAnalytics(analyticsRes.data.data);
        setCharts(chartsRes.data.data);
        setError('');
      })
      .catch((err) => {
        if (!mounted) return;
        setError(extractErrorMessage(err));
        toast.error(extractErrorMessage(err));
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [refreshKey]);

  // Refresh KPIs/charts live on any visitor status change.
  useEffect(
    () => subscribe(['visitorCheckedIn', 'visitorCheckedOut'], () => setRefreshKey((k) => k + 1)),
    []
  );

  const statCards = [
    { label: "Today's Total IN Entries", value: summary?.todayTotalInEntries, icon: <FiLogIn size={20} />, accent: 'brand' },
    { label: 'Currently Inside', value: summary?.currentlyInside, icon: <FiUsers size={20} />, accent: 'emerald' },
    { label: 'Completed OUT Today', value: summary?.completedOutToday, icon: <FiLogOut size={20} />, accent: 'brand' },
    { label: 'Auto-Closed Entries', value: summary?.autoClosedToday, icon: <FiClock size={20} />, accent: 'amber' },
    { label: 'Cancelled Entries', value: summary?.cancelledToday, icon: <FiXCircle size={20} />, accent: 'rose' },
    { label: 'Unique Mobile Numbers', value: summary?.uniqueMobileNumbers, icon: <FiPhone size={20} />, accent: 'slate' },
    { label: 'Repeat Mobile Numbers', value: summary?.repeatMobileNumbers, icon: <FiRepeat size={20} />, accent: 'slate' },
    { label: 'Average Visits / Day', value: analytics?.averageVisitsPerDay, icon: <FiBarChart2 size={20} />, accent: 'brand' },
    { label: 'Average Visits / Week', value: analytics?.averageVisitsPerWeek, icon: <FiCalendar size={20} />, accent: 'brand' },
    { label: 'Average Visits / Month', value: analytics?.averageVisitsPerMonth, icon: <FiCalendar size={20} />, accent: 'brand' },
    { label: 'Average Visits / Year', value: analytics?.averageVisitsPerYear, icon: <FiCalendar size={20} />, accent: 'brand' },
    {
      label: 'Average Visit Duration',
      value: analytics ? formatDuration(analytics.averageVisitDurationMinutes) : undefined,
      icon: <FiClock size={20} />,
      accent: 'emerald',
    },
    { label: 'Peak Visit Day', value: analytics?.peakVisitDay, icon: <FiTrendingUp size={20} />, accent: 'amber' },
    {
      label: 'Peak Visit Hour',
      value: analytics ? `${String(analytics.peakVisitHour).padStart(2, '0')}:00` : undefined,
      icon: <FiSun size={20} />,
      accent: 'amber',
    },
    { label: 'Weekly Visitors', value: summary?.weeklyVisitors, icon: <FiUserCheck size={20} />, accent: 'emerald' },
    { label: 'Monthly Visitors', value: summary?.monthlyVisitors, icon: <FiUserCheck size={20} />, accent: 'emerald' },
    { label: 'Total Visitors', value: summary?.totalVisitors, icon: <FiUsers size={20} />, accent: 'slate' },
  ];

  const statusWiseData = (charts?.statusWise || []).map((d) => ({ ...d, name: STATUS_LABELS[d.label] || d.label }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">Overview of visitor activity and key metrics.</p>
      </div>

      {error && !loading && (
        <Card className="border border-rose-200 bg-rose-50 text-sm text-rose-700">{error}</Card>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {statCards.map((card) => (
          <StatCard
            key={card.label}
            label={card.label}
            value={card.value ?? 0}
            icon={card.icon}
            accent={card.accent}
            loading={loading}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Visits Per Day (last 30 days)">
          {loading || !charts ? (
            <ChartSkeleton />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts.visitsPerDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="count" name="Visits" stroke="#4f46e5" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Status-wise Visits">
          {loading || !charts ? (
            <ChartSkeleton />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusWiseData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                  {statusWiseData.map((entry, idx) => (
                    <Cell key={entry.name} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="IN vs OUT Trend">
          {loading || !charts ? (
            <ChartSkeleton />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.inOutTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="inCount" name="IN" fill="#059669" />
                <Bar dataKey="outCount" name="OUT" fill="#2563eb" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Auto-Closed Trend">
          {loading || !charts ? (
            <ChartSkeleton />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts.autoClosedTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="count" name="Auto-Closed" stroke="#d97706" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Peak Hour Analysis">
          {loading || !charts ? (
            <ChartSkeleton />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={HOURS.map((h) => ({ hour: h, count: charts.peakHourAnalysis.find((p) => p.hour === h)?.count || 0 }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="hour" tick={{ fontSize: 11 }} tickFormatter={(h) => `${h}:00`} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip labelFormatter={(h) => `${h}:00`} />
                <Bar dataKey="count" name="Visits" fill="#4f46e5" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Average Visit Duration Trend">
          {loading || !charts ? (
            <ChartSkeleton />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts.averageVisitDurationTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value) => formatDuration(value)} />
                <Line type="monotone" dataKey="avgDuration" name="Avg Duration (min)" stroke="#e11d48" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>
    </div>
  );
}
