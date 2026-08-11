/* medical-inquiry-form/submission.js */

import { SELECTORS } from './constants.js';

const THANK_YOU_PAGE = '/medical-inquiry-thank-you';

export function collectFormData(form) {
  return {
    product: form.querySelector(SELECTORS.product)?.value || '',
    describeYou: form.querySelector(SELECTORS.describeYou)?.value || '',
    firstName: form.querySelector(SELECTORS.firstName)?.value || '',
    lastName: form.querySelector(SELECTORS.lastName)?.value || '',
    facility: form.querySelector(SELECTORS.facility)?.value || '',
    address: form.querySelector(SELECTORS.address)?.value || '',
    city: form.querySelector(SELECTORS.city)?.value || '',
    state: form.querySelector(SELECTORS.state)?.value || '',
    zip: form.querySelector(SELECTORS.zip)?.value || '',
    email: form.querySelector(SELECTORS.email)?.value || '',
    telephone: form.querySelector(SELECTORS.telephone)?.value || '',
    message: form.querySelector(SELECTORS.message)?.value || '',
    responseMethod:
      form.querySelector(`${SELECTORS.responseGroup}:checked`)?.value || '',
    takenProduct:
      form.querySelector(`${SELECTORS.patientProductGroup}:checked`)?.value || '',
  };
}

/* Reads the API endpoint from the medical-inquiry-form block */
export function getApiEndpoint(block) {
  if (!block) return '';

  const row = [...block.children].find((candidate) => {
    const cells = [...candidate.children];

    return (
      cells.length >= 2 &&
      cells[0].textContent.trim().toLowerCase() === 'api endpoint'
    );
  });

  if (!row) return '';

  const cells = [...row.children];
  const link = cells[1].querySelector('a');

  return (
    link?.href ||
    cells[1].textContent.trim() ||
    ''
  );
}

function getSubmitButton(form) {
  return form.querySelector('button[type="submit"], input[type="submit"]');
}

function showSubmissionError(form, message) {
  let error = form.querySelector('.submit-error');

  if (!error) {
    error = document.createElement('div');
    error.className = 'submit-error';

    const submitButton = getSubmitButton(form);
    const submitWrapper = submitButton?.closest('.submit-wrapper');

    if (submitWrapper) {
      submitWrapper.before(error);
    } else {
      form.append(error);
    }
  }

  error.textContent = message;
  error.hidden = false;
}

function clearSubmissionError(form) {
  const error = form.querySelector('.submit-error');

  if (error) {
    error.textContent = '';
    error.hidden = true;
  }
}

function setSubmitting(form, submitting) {
  const button = getSubmitButton(form);

  if (!button) return;

  button.disabled = submitting;

  if (submitting) {
    button.dataset.originalText = button.textContent;
    button.textContent = 'SUBMITTING...';
  } else if (button.dataset.originalText) {
    button.textContent = button.dataset.originalText;
    delete button.dataset.originalText;
  }
}

export async function submitForm(form, apiEndpoint) {
  clearSubmissionError(form);

  if (!apiEndpoint) {
    showSubmissionError(
      form,
      'Unable to submit the form. The API endpoint is not configured.'
    );
    return;
  }

  const payload = collectFormData(form);

  setSubmitting(form, true);

  try {
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const thankYouUrl = new URL(THANK_YOU_PAGE, window.location.origin);

   if (thankYouUrl.origin === window.location.origin) {
  // eslint-disable-next-line browser-security/no-insecure-redirects
  window.location.assign(thankYouUrl.href);
  }
} catch (error) {
    // eslint-disable-next-line no-console
    console.error('Medical inquiry form submission failed:', error);

    showSubmissionError(
      form,
      'We were unable to submit your inquiry. Please try again.'
    );

    setSubmitting(form, false);
  }
}
