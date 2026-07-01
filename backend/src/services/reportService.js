const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const { createObjectCsvWriter } = require('csv-writer');
const VisitorEntry = require('../models/VisitorEntry');
const ReportExport = require('../models/ReportExport');
const env = require('../config/env');
const AppError = require('../utils/AppError');
const { startOfDay, endOfDay, startOfWeek, startOfMonth, startOfYear, formatDateDDMMYYYY, formatTimeHHMM } = require('../utils/dateHelpers');
const { buildFilterQuery, buildGlobalSearchQuery } = require('../utils/queryBuilder');

const REPORTS_DIR = path.join(process.cwd(), env.UPLOAD_DIR, 'reports');

function ensureReportsDir() {
  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
  }
}

const COLUMNS = [
  { key: 'visitorId', label: 'Visitor ID' },
  { key: 'visitDateFmt', label: 'Date' },
  { key: 'visitorName', label: 'Visitor Name' },
  { key: 'mobileNo', label: 'Mobile No.' },
  { key: 'emailId', label: 'Email ID' },
  { key: 'companyName', label: 'Company Name' },
  { key: 'address', label: 'Address' },
  { key: 'purposeOfVisit', label: 'Purpose of Visit' },
  { key: 'personToMeet', label: 'Person to Meet' },
  { key: 'inTimeFmt', label: 'In Time' },
  { key: 'outTimeFmt', label: 'Out Time' },
  { key: 'visitDurationMinutes', label: 'Duration (min)' },
  { key: 'status', label: 'Status' },
  { key: 'checkoutMethod', label: 'Checkout Method' },
];

function buildDateRangeForReportType(reportType, dateFrom, dateTo) {
  const now = new Date();
  switch (reportType) {
    case 'daily':
      return { $gte: startOfDay(now), $lte: endOfDay(now) };
    case 'weekly':
      return { $gte: startOfWeek(now), $lte: endOfDay(now) };
    case 'monthly':
      return { $gte: startOfMonth(now), $lte: endOfDay(now) };
    case 'yearly':
      return { $gte: startOfYear(now), $lte: endOfDay(now) };
    case 'custom':
      // Visitor Entries exports reuse this report type for "export whatever is
      // currently filtered" - dates are optional there, so only constrain by
      // visitDate when both bounds are actually supplied.
      if (!dateFrom && !dateTo) return undefined;
      if (!dateFrom || !dateTo) throw new AppError('dateFrom and dateTo are required together for a custom report', 400);
      return { $gte: startOfDay(dateFrom), $lte: endOfDay(dateTo) };
    default:
      return undefined;
  }
}

const STATUS_REPORT_TYPES = {
  currently_inside: 'inside_premises',
  completed: 'completed',
  auto_closed: 'auto_closed',
  cancelled: 'cancelled',
};

async function getReportRows({ reportType, dateFrom, dateTo, filters, search }) {
  const query = { ...buildFilterQuery(filters), ...buildGlobalSearchQuery(search) };

  if (STATUS_REPORT_TYPES[reportType]) {
    query.status = STATUS_REPORT_TYPES[reportType];
  } else if (reportType !== 'average_visit' && reportType !== 'average_duration') {
    const dateRange = buildDateRangeForReportType(reportType, dateFrom, dateTo);
    if (dateRange) query.visitDate = dateRange;
  }

  const entries = await VisitorEntry.find(query).sort({ visitDate: -1, inTime: -1 }).lean();

  return entries.map((e) => ({
    ...e,
    visitDateFmt: formatDateDDMMYYYY(e.visitDate),
    inTimeFmt: e.inTime ? formatTimeHHMM(e.inTime) : '',
    outTimeFmt: e.outTime ? formatTimeHHMM(e.outTime) : '',
  }));
}

async function writeCsv(rows, filePath) {
  const writer = createObjectCsvWriter({
    path: filePath,
    header: COLUMNS.map((c) => ({ id: c.key, title: c.label })),
  });
  await writer.writeRecords(rows);
}

async function writeExcel(rows, filePath, reportName) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(reportName.slice(0, 31) || 'Report');
  sheet.columns = COLUMNS.map((c) => ({ header: c.label, key: c.key, width: 18 }));
  sheet.getRow(1).font = { bold: true };
  rows.forEach((row) => sheet.addRow(row));
  await workbook.xlsx.writeFile(filePath);
}

function writePdf(rows, filePath, reportName) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    doc.fontSize(16).text(env.COMPANY_NAME, { align: 'center' });
    doc.fontSize(12).text(reportName, { align: 'center' });
    doc.moveDown();

    const headers = COLUMNS.map((c) => c.label);
    const colWidth = (doc.page.width - 60) / headers.length;

    doc.fontSize(8).font('Helvetica-Bold');
    headers.forEach((h, i) => doc.text(h, 30 + i * colWidth, doc.y, { width: colWidth, continued: i !== headers.length - 1 }));
    doc.moveDown();
    doc.font('Helvetica');

    rows.forEach((row) => {
      const y = doc.y;
      COLUMNS.forEach((c, i) => {
        doc.text(String(row[c.key] ?? ''), 30 + i * colWidth, y, { width: colWidth });
      });
      doc.moveDown();
      if (doc.y > doc.page.height - 60) doc.addPage({ margin: 30, size: 'A4', layout: 'landscape' });
    });

    doc.fontSize(8).text(`Generated by ISAZI Visitor Portal on ${formatDateDDMMYYYY(new Date())}`, 30, doc.page.height - 40);

    doc.end();
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

async function exportReport({ reportType, fileFormat, dateFrom, dateTo, filters, search, exportedBy }) {
  ensureReportsDir();

  const rows = await getReportRows({ reportType, dateFrom, dateTo, filters, search });
  const reportName = `${reportType}_report_${Date.now()}`;
  const ext = fileFormat === 'excel' ? 'xlsx' : fileFormat;
  const fileName = `${reportName}.${ext}`;
  const filePath = path.join(REPORTS_DIR, fileName);

  let status = 'generated';
  try {
    if (fileFormat === 'csv') {
      await writeCsv(rows, filePath);
    } else if (fileFormat === 'excel') {
      await writeExcel(rows, filePath, reportName);
    } else if (fileFormat === 'pdf') {
      await writePdf(rows, filePath, reportName);
    } else {
      throw new AppError('Unsupported file format', 400);
    }
  } catch (err) {
    status = 'failed';
    throw err;
  } finally {
    await ReportExport.create({
      exportedBy,
      reportName,
      reportType,
      dateFrom: dateFrom || null,
      dateTo: dateTo || null,
      filtersUsed: filters || {},
      fileFormat,
      filePath: path.relative(process.cwd(), filePath),
      exportedAt: new Date(),
      status,
    });
  }

  return { filePath, fileName, rowCount: rows.length };
}

module.exports = { getReportRows, exportReport, COLUMNS };
