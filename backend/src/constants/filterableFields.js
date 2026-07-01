const VISITOR_ENTRY_FIELD_TYPES = {
  visitDate: 'date',
  visitorId: 'text',
  visitorName: 'text',
  companyName: 'text',
  address: 'text',
  mobileNo: 'text',
  emailId: 'text',
  purposeOfVisit: 'text',
  personToMeet: 'text',
  inTime: 'datetime',
  outTime: 'datetime',
  status: 'dropdown',
  checkoutMethod: 'dropdown',
  createdAt: 'datetime',
  updatedAt: 'datetime',
};

const GLOBAL_SEARCH_FIELDS = [
  'visitorId',
  'visitorName',
  'mobileNo',
  'companyName',
  'personToMeet',
  'purposeOfVisit',
  'emailId',
];

const OPERATORS_BY_TYPE = {
  text: ['contains', 'equals', 'starts_with', 'ends_with', 'empty', 'not_empty'],
  date: ['today', 'yesterday', 'this_week', 'this_month', 'this_year', 'before', 'after', 'between'],
  datetime: ['today', 'yesterday', 'this_week', 'this_month', 'this_year', 'before', 'after', 'between'],
  time: ['before', 'after', 'between'],
  dropdown: ['equals', 'not_equals', 'in_list'],
  number: ['equals', 'greater_than', 'less_than', 'between'],
};

module.exports = { VISITOR_ENTRY_FIELD_TYPES, GLOBAL_SEARCH_FIELDS, OPERATORS_BY_TYPE };
