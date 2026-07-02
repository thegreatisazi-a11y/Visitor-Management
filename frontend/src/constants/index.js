export const STATUS_LABELS = {
  inside_premises: 'Inside Premises',
  completed: 'Completed',
  auto_closed: 'Auto-Closed',
  cancelled: 'Cancelled',
};

export const STATUS_BADGE_CLASSES = {
  inside_premises: 'bg-emerald-100 text-emerald-700 ring-emerald-600/20',
  completed: 'bg-blue-100 text-blue-700 ring-blue-600/20',
  auto_closed: 'bg-amber-100 text-amber-700 ring-amber-600/20',
  cancelled: 'bg-rose-100 text-rose-700 ring-rose-600/20',
};

export const CHECKOUT_METHOD_LABELS = {
  mobile_self_out: 'Self Checkout',
  auto_midnight: 'Auto (Midnight)',
  admin_close: 'Admin Closed',
  face_auto: 'Face Auto',
};

export const ENTRY_METHOD_LABELS = {
  manual: 'Manual / Mobile',
  first_registration: 'First Registration',
  face_recognition: 'Face Recognition',
};

export const QUICK_FILTERS = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'this_week', label: 'This Week' },
  { value: 'this_month', label: 'This Month' },
  { value: 'this_year', label: 'This Year' },
  { value: 'currently_inside', label: 'Currently Inside' },
  { value: 'completed', label: 'Completed' },
  { value: 'auto_closed', label: 'Auto-Closed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export const FILTERABLE_FIELDS = [
  { field: 'visitDate', label: 'Date', type: 'date' },
  { field: 'visitorId', label: 'Visitor ID', type: 'text' },
  { field: 'visitorName', label: 'Visitor Name', type: 'text' },
  { field: 'companyName', label: 'Company Name', type: 'text' },
  { field: 'address', label: 'Address', type: 'text' },
  { field: 'mobileNo', label: 'Mobile No.', type: 'text' },
  { field: 'emailId', label: 'Email ID', type: 'text' },
  { field: 'purposeOfVisit', label: 'Purpose of Visit', type: 'text' },
  { field: 'personToMeet', label: 'Person to Meet', type: 'text' },
  { field: 'inTime', label: 'In Time', type: 'datetime' },
  { field: 'outTime', label: 'Out Time', type: 'datetime' },
  { field: 'visitDurationMinutes', label: 'Duration (min)', type: 'number' },
  {
    field: 'status',
    label: 'Status',
    type: 'dropdown',
    options: Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label })),
  },
  {
    field: 'checkoutMethod',
    label: 'Checkout Method',
    type: 'dropdown',
    options: Object.entries(CHECKOUT_METHOD_LABELS).map(([value, label]) => ({ value, label })),
  },
  {
    field: 'entryMethod',
    label: 'Entry Method',
    type: 'dropdown',
    options: Object.entries(ENTRY_METHOD_LABELS).map(([value, label]) => ({ value, label })),
  },
  { field: 'confidenceScore', label: 'Confidence Score', type: 'number' },
  { field: 'createdAt', label: 'Created At', type: 'datetime' },
  { field: 'updatedAt', label: 'Updated At', type: 'datetime' },
];

export const OPERATORS_BY_TYPE = {
  text: [
    { value: 'contains', label: 'Contains' },
    { value: 'equals', label: 'Equals' },
    { value: 'starts_with', label: 'Starts with' },
    { value: 'ends_with', label: 'Ends with' },
    { value: 'empty', label: 'Is empty' },
    { value: 'not_empty', label: 'Is not empty' },
  ],
  date: [
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'this_week', label: 'This week' },
    { value: 'this_month', label: 'This month' },
    { value: 'this_year', label: 'This year' },
    { value: 'before', label: 'Before' },
    { value: 'after', label: 'After' },
    { value: 'between', label: 'Between' },
  ],
  datetime: [
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'this_week', label: 'This week' },
    { value: 'this_month', label: 'This month' },
    { value: 'this_year', label: 'This year' },
    { value: 'before', label: 'Before' },
    { value: 'after', label: 'After' },
    { value: 'between', label: 'Between' },
  ],
  dropdown: [
    { value: 'equals', label: 'Equals' },
    { value: 'not_equals', label: 'Not equals' },
    { value: 'in_list', label: 'In list' },
  ],
  number: [
    { value: 'equals', label: 'Equals' },
    { value: 'greater_than', label: 'Greater than' },
    { value: 'less_than', label: 'Less than' },
    { value: 'between', label: 'Between' },
  ],
};

export const EXPORT_FORMATS = [
  { value: 'excel', label: 'Excel' },
  { value: 'csv', label: 'CSV' },
  { value: 'pdf', label: 'PDF' },
];

export const REPORT_TYPES = [
  { value: 'daily', label: 'Daily Visitor Report' },
  { value: 'weekly', label: 'Weekly Visitor Report' },
  { value: 'monthly', label: 'Monthly Visitor Report' },
  { value: 'yearly', label: 'Yearly Visitor Report' },
  { value: 'custom', label: 'Custom Date Report' },
  { value: 'currently_inside', label: 'Currently Inside Report' },
  { value: 'completed', label: 'Completed OUT Report' },
  { value: 'auto_closed', label: 'Auto-Closed Report' },
  { value: 'cancelled', label: 'Cancelled Entry Report' },
];
