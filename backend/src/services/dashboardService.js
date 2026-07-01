const VisitorEntry = require('../models/VisitorEntry');
const { startOfDay, endOfDay, startOfWeek, startOfMonth, startOfYear, addDays } = require('../utils/dateHelpers');

async function getSummary() {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const weekStart = startOfWeek(now);
  const monthStart = startOfMonth(now);
  const yearStart = startOfYear(now);

  const [
    todayTotalInEntries,
    currentlyInside,
    completedOutToday,
    autoClosedToday,
    cancelledToday,
    totalVisitors,
    weeklyVisitors,
    monthlyVisitors,
    yearlyVisitors,
    mobileGroups,
  ] = await Promise.all([
    VisitorEntry.countDocuments({ visitDate: { $gte: todayStart, $lte: todayEnd } }),
    VisitorEntry.countDocuments({ status: 'inside_premises', outTime: null }),
    VisitorEntry.countDocuments({ status: 'completed', outTime: { $gte: todayStart, $lte: todayEnd } }),
    VisitorEntry.countDocuments({ status: 'auto_closed', autoClosedAt: { $gte: todayStart, $lte: todayEnd } }),
    VisitorEntry.countDocuments({ status: 'cancelled', cancelledAt: { $gte: todayStart, $lte: todayEnd } }),
    VisitorEntry.countDocuments({}),
    VisitorEntry.countDocuments({ visitDate: { $gte: weekStart, $lte: todayEnd } }),
    VisitorEntry.countDocuments({ visitDate: { $gte: monthStart, $lte: todayEnd } }),
    VisitorEntry.countDocuments({ visitDate: { $gte: yearStart, $lte: todayEnd } }),
    VisitorEntry.aggregate([{ $group: { _id: '$mobileNo', count: { $sum: 1 } } }]),
  ]);

  const uniqueMobileNumbers = mobileGroups.length;
  const repeatMobileNumbers = mobileGroups.filter((m) => m.count > 1).length;

  return {
    todayTotalInEntries,
    currentlyInside,
    completedOutToday,
    autoClosedToday,
    cancelledToday,
    uniqueMobileNumbers,
    repeatMobileNumbers,
    weeklyVisitors,
    monthlyVisitors,
    yearlyVisitors,
    totalVisitors,
  };
}

async function getAnalytics() {
  const [distinctDays, distinctWeeks, distinctMonths, distinctYears, totalVisitors, avgDurationAgg, peakDayAgg, peakHourAgg] =
    await Promise.all([
      VisitorEntry.aggregate([{ $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$visitDate' } } } }]),
      VisitorEntry.aggregate([{ $group: { _id: { $dateToString: { format: '%G-%V', date: '$visitDate' } } } }]),
      VisitorEntry.aggregate([{ $group: { _id: { $dateToString: { format: '%Y-%m', date: '$visitDate' } } } }]),
      VisitorEntry.aggregate([{ $group: { _id: { $year: '$visitDate' } } }]),
      VisitorEntry.countDocuments({}),
      VisitorEntry.aggregate([
        { $match: { visitDurationMinutes: { $ne: null } } },
        { $group: { _id: null, avg: { $avg: '$visitDurationMinutes' } } },
      ]),
      VisitorEntry.aggregate([
        { $group: { _id: { $dayOfWeek: '$visitDate' }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 1 },
      ]),
      VisitorEntry.aggregate([
        { $group: { _id: { $hour: '$inTime' }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 1 },
      ]),
    ]);

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const peakVisitDay = peakDayAgg.length ? dayNames[peakDayAgg[0]._id - 1] : null;
  const peakVisitHour = peakHourAgg.length ? peakHourAgg[0]._id : null;

  const safeDiv = (a, b) => (b > 0 ? Math.round((a / b) * 100) / 100 : 0);

  return {
    averageVisitsPerDay: safeDiv(totalVisitors, distinctDays.length),
    averageVisitsPerWeek: safeDiv(totalVisitors, distinctWeeks.length),
    averageVisitsPerMonth: safeDiv(totalVisitors, distinctMonths.length),
    averageVisitsPerYear: safeDiv(totalVisitors, distinctYears.length),
    averageVisitDurationMinutes: avgDurationAgg.length ? Math.round(avgDurationAgg[0].avg) : 0,
    peakVisitDay,
    peakVisitHour,
  };
}

async function getCharts({ days = 30 } = {}) {
  const now = new Date();
  const from = addDays(startOfDay(now), -(days - 1));

  const [visitsPerDay, statusWise, autoClosedTrend, peakHourAnalysis, avgDurationTrend, inOutTrend, visitsPerWeek, visitsPerMonth, visitsPerYear] =
    await Promise.all([
      VisitorEntry.aggregate([
        { $match: { visitDate: { $gte: from } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$visitDate' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      VisitorEntry.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      VisitorEntry.aggregate([
        { $match: { status: 'auto_closed', autoClosedAt: { $gte: from } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$autoClosedAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      VisitorEntry.aggregate([
        { $group: { _id: { $hour: '$inTime' }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      VisitorEntry.aggregate([
        { $match: { visitDurationMinutes: { $ne: null }, visitDate: { $gte: from } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$visitDate' } }, avgDuration: { $avg: '$visitDurationMinutes' } } },
        { $sort: { _id: 1 } },
      ]),
      VisitorEntry.aggregate([
        { $match: { visitDate: { $gte: from } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$visitDate' } },
            inCount: { $sum: 1 },
            outCount: { $sum: { $cond: [{ $in: ['$status', ['completed', 'auto_closed']] }, 1, 0] } },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      VisitorEntry.aggregate([
        { $group: { _id: { $dateToString: { format: '%G-W%V', date: '$visitDate' } }, count: { $sum: 1 } } },
        { $sort: { _id: -1 } },
        { $limit: 12 },
        { $sort: { _id: 1 } },
      ]),
      VisitorEntry.aggregate([
        { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$visitDate' } }, count: { $sum: 1 } } },
        { $sort: { _id: -1 } },
        { $limit: 12 },
        { $sort: { _id: 1 } },
      ]),
      VisitorEntry.aggregate([
        { $group: { _id: { $year: '$visitDate' }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
    ]);

  return {
    visitsPerDay: visitsPerDay.map((d) => ({ label: d._id, count: d.count })),
    visitsPerWeek: visitsPerWeek.map((d) => ({ label: d._id, count: d.count })),
    visitsPerMonth: visitsPerMonth.map((d) => ({ label: d._id, count: d.count })),
    visitsPerYear: visitsPerYear.map((d) => ({ label: String(d._id), count: d.count })),
    statusWise: statusWise.map((d) => ({ label: d._id, count: d.count })),
    inOutTrend: inOutTrend.map((d) => ({ label: d._id, inCount: d.inCount, outCount: d.outCount })),
    autoClosedTrend: autoClosedTrend.map((d) => ({ label: d._id, count: d.count })),
    peakHourAnalysis: peakHourAnalysis.map((d) => ({ hour: d._id, count: d.count })),
    averageVisitDurationTrend: avgDurationTrend.map((d) => ({ label: d._id, avgDuration: Math.round(d.avgDuration) })),
  };
}

module.exports = { getSummary, getAnalytics, getCharts };
