export const MOBILE_REGEX = /^[0-9]{10}$/;
export const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.com$/;
export const NAME_REGEX = /^[A-Za-z. ]+$/;

export const mobileRules = {
  required: 'Mobile number is required',
  pattern: { value: MOBILE_REGEX, message: 'Mobile number must be exactly 10 digits' },
};

export const emailRules = {
  required: 'Email ID is required',
  pattern: { value: EMAIL_REGEX, message: 'Enter a valid email address ending with .com' },
};

export const nameRules = {
  required: 'This field is required',
  minLength: { value: 2, message: 'Must be at least 2 characters' },
  pattern: { value: NAME_REGEX, message: 'Only letters, spaces and dot are allowed' },
};

export const minLen = (n, label = 'This field') => ({
  required: `${label} is required`,
  minLength: { value: n, message: `Must be at least ${n} characters` },
});
