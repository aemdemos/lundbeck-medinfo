/* medical-inquiry-form/validation.js */

import { ERROR_MESSAGES, VALIDATION_RULES, RADIO_GROUPS, SELECTORS, MESSAGE_MAX_LENGTH } from './constants.js';

import { getFieldWrapper } from './domutils.js';

const ERROR_MESSAGES_MAP = new Map(Object.entries(ERROR_MESSAGES));

const ERROR_CLASS = 'field-error';
const INVALID_CLASS = 'field-invalid';
const SUBMIT_ATTEMPTED_ATTR = 'submitAttempted';

// ERROR_MESSAGES is a fixed, internally-defined lookup table (never
function getErrorMessage(key) {
  return ERROR_MESSAGES_MAP.get(key);
}

function hasAttemptedSubmit(form) {
  return form.dataset[SUBMIT_ATTEMPTED_ATTR] === 'true';
}

// custom dropdowns hide the native <select>; the trigger div is what's
function getVisibleControl(field) {
  if (field.tagName === 'SELECT') {
    return field.closest('.custom-select')?.querySelector('.custom-select-trigger') || field;
  }
  return field;
}

function clearFieldError(wrapper, field) {
  wrapper?.querySelectorAll(`.${ERROR_CLASS}`).forEach((el) => el.remove());

  if (field) {
    const control = getVisibleControl(field);
    control.classList.remove(INVALID_CLASS);
  }
}

function showFieldError(wrapper, field, message) {
  if (!wrapper) return;
  clearFieldError(wrapper, field);
  const error = document.createElement('div');
  error.className = ERROR_CLASS;
  error.textContent = message;
  wrapper.append(error);

  if (field && field.name === 'product') {
    getVisibleControl(field).classList.add(INVALID_CLASS);
  }
}

// checks one field's value against its rule. skipRequired=true means
function getFieldErrorMessage(name, rule, value, { skipRequired = false } = {}) {
  if (!skipRequired && rule.required && !value) {
    return getErrorMessage(name);
  }
  if (value && rule.minLength && value.length < rule.minLength) {
    return getErrorMessage(`${name}MinLength`);
  }
  if (
  value &&
  ((rule.pattern && !rule.pattern.test(value)) ||
    (rule.validate && !rule.validate(value)))
) {
  return getErrorMessage(name);
}
  return null;
}

function validateField(form, name, rule) {
  const field = form.querySelector(rule.selector);
  if (!field) return true;

  const wrapper = getFieldWrapper(form, field);
  const value = field.value.trim();
  const message = getFieldErrorMessage(name, rule, value);

  if (message) {
    showFieldError(wrapper, field, message);
    return false;
  }

  clearFieldError(wrapper, field);
  return true;
}

// pre-submit live check for liveFormatValidation fields: silent when
function validateFieldFormatOnly(form, name, rule) {
  const field = form.querySelector(rule.selector);
  if (!field) return;

  const wrapper = getFieldWrapper(form, field);
  const value = field.value.trim();

  if (!value) {
    clearFieldError(wrapper, field);
    return;
  }

  const message = getFieldErrorMessage(name, rule, value, { skipRequired: true });
  if (message) {
    showFieldError(wrapper, field, message);
  } else {
    clearFieldError(wrapper, field);
  }
}

function validateRadioGroups(form) {
  let valid = true;

  RADIO_GROUPS.forEach(({ groupName, required, messageKey }) => {
    if (!required) return;

    const anyRadio = form.querySelector(`input[name="${groupName}"]`);
    if (!anyRadio) return;
    const wrapper = getFieldWrapper(form, anyRadio);

    const checked = form.querySelector(`input[name="${groupName}"]:checked`);
    if (checked) {
      clearFieldError(wrapper);
      return;
    }

    valid = false;
    showFieldError(wrapper, null, getErrorMessage(messageKey));
  });

  return valid;
}

export function validateForm(form) {
  let valid = true;

  Object.entries(VALIDATION_RULES).forEach(([name, rule]) => {
    if (!validateField(form, name, rule)) valid = false;
  });

  if (!validateRadioGroups(form)) valid = false;

  return valid;
}



/* ---------------------------------------------------------------------
 * Live validation events
 * ------------------------------------------------------------------- */
function attachFieldValidationEvents(form) {
  Object.entries(VALIDATION_RULES).forEach(([name, rule]) => {
    const field = form.querySelector(rule.selector);
    if (!field) return;
    const wrapper = getFieldWrapper(form, field);

field.addEventListener('input', () => clearFieldError(wrapper, field));
field.addEventListener('change', () => clearFieldError(wrapper, field));

    field.addEventListener('blur', () => {
      if (hasAttemptedSubmit(form)) {
        validateField(form, name, rule);
        return;
      }

      if (rule.liveFormatValidation) {
        validateFieldFormatOnly(form, name, rule);
      }
    });
  });

  RADIO_GROUPS.forEach(({ groupName }) => {
    form.querySelectorAll(`input[name="${groupName}"]`).forEach((radio) => {
      radio.addEventListener('change', () => {
        clearFieldError(getFieldWrapper(form, radio));
        if (hasAttemptedSubmit(form)) validateRadioGroups(form);
      });
    });
  });
}

/* ---------------------------------------------------------------------
 * Live input masking — telephone (212) 432-3252 and zip (5 digits only)
 * ------------------------------------------------------------------- */

function formatPhone(digits) {
  const d = digits.slice(0, 10);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6, 10)}`;
}

function applyPhoneMask(field) {
  field.setAttribute('maxlength', '14'); // "(212) 432-3252"
  field.setAttribute('inputmode', 'numeric');

  field.addEventListener('input', () => {
    const atEnd = field.selectionEnd === field.value.length;
    const digits = field.value.replace(/\D/g, '').slice(0, 10);
    field.value = formatPhone(digits);
    if (atEnd) field.setSelectionRange(field.value.length, field.value.length);
  });

  field.addEventListener('paste', (event) => {
    event.preventDefault();
    const pasted = (event.clipboardData || window.clipboardData).getData('text');
    field.value = formatPhone(pasted.replace(/\D/g, '').slice(0, 10));
  });
}

function attachFieldMasks(form) {
  const phoneField = form.querySelector(SELECTORS.telephone);
  if (phoneField) applyPhoneMask(phoneField);

  const zipField = form.querySelector(SELECTORS.zip);
  if (zipField) zipField.setAttribute('maxlength', '10'); // "12345-6789"

  const messageField = form.querySelector(SELECTORS.message);
  if (messageField) messageField.setAttribute('maxlength', String(MESSAGE_MAX_LENGTH));
}

export function initValidationListeners(form, onValid) {
  attachFieldValidationEvents(form);
  attachFieldMasks(form);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    form.dataset[SUBMIT_ATTEMPTED_ATTR] = 'true';

    if (validateForm(form)) {
      onValid?.();
      return;
    }

    const firstInvalid = form.querySelector(`.${INVALID_CLASS}`) || form.querySelector(`.${ERROR_CLASS}`);
    if (firstInvalid) {
      firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (typeof firstInvalid.focus === 'function') firstInvalid.focus({ preventScroll: true });
    } else {
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
}
