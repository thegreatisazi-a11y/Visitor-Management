const { VISITOR_ENTRY_FIELD_TYPES, GLOBAL_SEARCH_FIELDS } = require('../constants/filterableFields');
const { startOfDay, endOfDay, startOfWeek, startOfMonth, startOfYear, addDays } = require('./dateHelpers');

function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function dateRangeForOperator(operator) {
  const now = new Date();
  switch (operator) {
    case 'today':
      return { $gte: startOfDay(now), $lte: endOfDay(now) };
    case 'yesterday': {
      const y = addDays(now, -1);
      return { $gte: startOfDay(y), $lte: endOfDay(y) };
    }
    case 'this_week':
      return { $gte: startOfWeek(now), $lte: endOfDay(now) };
    case 'this_month':
      return { $gte: startOfMonth(now), $lte: endOfDay(now) };
    case 'this_year':
      return { $gte: startOfYear(now), $lte: endOfDay(now) };
    default:
      return undefined;
  }
}

function buildCondition(type, operator, value, value2) {
  if (['today', 'yesterday', 'this_week', 'this_month', 'this_year'].includes(operator)) {
    return dateRangeForOperator(operator);
  }

  // Excel-style "select values" filter: works the same way for any field type,
  // matching exactly against the distinct values the column filter menu offered.
  if (operator === 'in_list') {
    const list = Array.isArray(value) ? value : String(value).split(',').map((v) => v.trim());
    return list.length ? { $in: list } : undefined;
  }

  switch (type) {
    case 'text':
      switch (operator) {
        case 'contains':
          return { $regex: escapeRegex(value), $options: 'i' };
        case 'equals':
          return { $regex: `^${escapeRegex(value)}$`, $options: 'i' };
        case 'starts_with':
          return { $regex: `^${escapeRegex(value)}`, $options: 'i' };
        case 'ends_with':
          return { $regex: `${escapeRegex(value)}$`, $options: 'i' };
        case 'empty':
          return { $in: [null, ''] };
        case 'not_empty':
          return { $nin: [null, ''] };
        default:
          return undefined;
      }
    case 'date':
    case 'datetime':
    case 'time':
      switch (operator) {
        case 'before':
          return { $lt: new Date(value) };
        case 'after':
          return { $gt: new Date(value) };
        case 'between':
          return { $gte: new Date(value), $lte: new Date(value2) };
        default:
          return undefined;
      }
    case 'dropdown':
      switch (operator) {
        case 'equals':
          return value;
        case 'not_equals':
          return { $ne: value };
        default:
          return undefined;
      }
    case 'number':
      switch (operator) {
        case 'equals':
          return Number(value);
        case 'greater_than':
          return { $gt: Number(value) };
        case 'less_than':
          return { $lt: Number(value) };
        case 'between':
          return { $gte: Number(value), $lte: Number(value2) };
        default:
          return undefined;
      }
    default:
      return undefined;
  }
}

function parseFilters(rawFilters) {
  if (!rawFilters) return [];
  if (Array.isArray(rawFilters)) return rawFilters;
  try {
    const parsed = JSON.parse(rawFilters);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function buildFilterQuery(rawFilters, fieldTypeMap = VISITOR_ENTRY_FIELD_TYPES) {
  const filters = parseFilters(rawFilters);
  const query = {};

  for (const filter of filters) {
    const { field, operator, value, value2 } = filter || {};
    const type = fieldTypeMap[field];
    if (!type || !operator) continue;

    const condition = buildCondition(type, operator, value, value2);
    if (condition === undefined) continue;

    query[field] = query[field] && typeof query[field] === 'object' && typeof condition === 'object'
      ? { ...query[field], ...condition }
      : condition;
  }

  return query;
}

function buildGlobalSearchQuery(search, fields = GLOBAL_SEARCH_FIELDS) {
  if (!search) return {};
  const regex = { $regex: escapeRegex(search), $options: 'i' };
  return { $or: fields.map((field) => ({ [field]: regex })) };
}

function buildQuickFilterQuery(quickFilter) {
  const now = new Date();
  switch (quickFilter) {
    case 'today':
      return { visitDate: { $gte: startOfDay(now), $lte: endOfDay(now) } };
    case 'yesterday': {
      const y = addDays(now, -1);
      return { visitDate: { $gte: startOfDay(y), $lte: endOfDay(y) } };
    }
    case 'this_week':
      return { visitDate: { $gte: startOfWeek(now), $lte: endOfDay(now) } };
    case 'this_month':
      return { visitDate: { $gte: startOfMonth(now), $lte: endOfDay(now) } };
    case 'this_year':
      return { visitDate: { $gte: startOfYear(now), $lte: endOfDay(now) } };
    case 'currently_inside':
      return { status: 'inside_premises' };
    case 'completed':
      return { status: 'completed' };
    case 'auto_closed':
      return { status: 'auto_closed' };
    case 'cancelled':
      return { status: 'cancelled' };
    default:
      return {};
  }
}

module.exports = { buildFilterQuery, buildGlobalSearchQuery, buildQuickFilterQuery, parseFilters, escapeRegex };
