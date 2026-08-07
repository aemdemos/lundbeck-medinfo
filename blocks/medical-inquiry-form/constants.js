/* medical-inquiry-form/constants.js*/

export const SELECTORS = {
  product: 'select[name="product"]',
  describeYou: 'select[name="describeYou"]',
  firstName: 'input[name="firstName"]',
  lastName: 'input[name="lastName"]',
  facility: 'input[name="facility"]',
  address: 'input[name="address"]',
  city: 'input[name="city"]',
  state: 'select[name="state"]',
  zip: 'input[name="zip"]',
  email: 'input[name="email"]',
  telephone: 'input[name="phone"]',
  message: 'textarea[name="message"]',
  responseGroup: 'input[name="responseQuestion"]',
  patientProductGroup: 'input[name="patientProduct"]',
};

/* EDITABLE ERROR COPY*/
export const ERROR_MESSAGES = {
  product: 'Product selection is required',
  describeYou: 'The Option that best describes you is required',
  firstName: 'First Name is required',
  lastName: 'Last Name is required',
  address: 'An Address in a valid format is required',
  city: 'City is required',
  state: 'State is required',
  zip: 'A ZIP Code in a valid format is required',
  email: 'An Email Address in a valid format is required',
  telephone: 'A Telephone Number in a valid format is required',
  message: 'Your Question is required',
  messageMinLength: 'Please enter at least 20 characters.',
  responseMethod: 'How you would like your response delivered is required',
  takenProduct: 'Please select Yes or No',
};

// fields that should span the full grid width on their own row
export const FULL_WIDTH_FIELDS = [
  'formText',
  'formTitle',
  'message',
  'infoTitle',
  'describeYou',
  'facility',
  'address',
  'licText',
  'submitCheck',
  'submitBtn',
];

// declarative config for the two radio groups on this form
export const RADIO_GROUPS = [
  {
    groupName: 'responseQuestion',
    legendField: 'responseMethod',
    radioFields: ['radioEmail', 'radioTelephone', 'radioMail'],
    fullWidth: false, // sits side-by-side with "product" at tablet/desktop
    required: true,
    messageKey: 'responseMethod',
  },
  {
    groupName: 'patientProduct',
    legendField: 'takenProduct',
    radioFields: ['radioYes', 'radioNo'],
    fullWidth: true,
    required: false, // no asterisk in the design — flip to true if that changes
    messageKey: 'takenProduct',
  },
];

// text fallbacks for rows that never get a `name` attribute (headings/plaintext)
export const FIELD_TEXT_HINTS = {
  formText: 'Required fields are marked',
  formTitle: 'Your Inquiry',
  responseMethod: 'Please indicate how you would like',
  takenProduct: 'Has patient taken Lundbeck product',
  infoTitle: 'Your Contact Information',
  licText: 'This form is intended to be used',
  submitCheck: 'By clicking SUBMIT',
};

/* VALIDATION RULES */
export const VALIDATION_RULES = {
  product: { selector: SELECTORS.product, required: true },
  describeYou: { selector: SELECTORS.describeYou, required: true },
  firstName: { selector: SELECTORS.firstName, required: true },
  lastName: { selector: SELECTORS.lastName, required: true },
  address: { selector: SELECTORS.address, required: true },
  city: { selector: SELECTORS.city, required: true },
  state: { selector: SELECTORS.state, required: true },

  // these three validate their FORMAT live on blur even before the
  // first submit attempt — required-ness still waits for submit
  zip: { selector: SELECTORS.zip, required: true, pattern: /^\d{5}$/, liveFormatValidation: true },
  email: {
    selector: SELECTORS.email,
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
    liveFormatValidation: true,
  },
  telephone: {
    selector: SELECTORS.telephone,
    required: true,
    pattern: /^\(\d{3}\) \d{3}-\d{4}$/,
    liveFormatValidation: true,
  },

  message: { selector: SELECTORS.message, required: true, minLength: 20, liveFormatValidation: true },
};
