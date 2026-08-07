/* medical-inquiry-form/layout.js */

import { FULL_WIDTH_FIELDS } from './constants.js';
import { resolveWrapper, getWrapperByName, getFieldWrapper } from './domutils.js';

export function setupLayout(form) {
  FULL_WIDTH_FIELDS.forEach((name) => {
    // 'submitBtn' is handled separately below
    if (name === 'submitBtn') return;
    const wrapper = resolveWrapper(form, name);
    if (wrapper) wrapper.classList.add('full-width');
  });

  // Structural lookup: every AEM form renders the submit action
  const submitButton = form.querySelector('button[type="submit"], input[type="submit"]');
  const submitWrapper = submitButton ? getFieldWrapper(form, submitButton) : null;
  if (submitWrapper) submitWrapper.classList.add('full-width', 'submit-wrapper');

  createCityStateZipRow(form);
  groupLegalText(form);
}

// moves the City, State, and ZIP wrappers into one shared row container
function createCityStateZipRow(form) {
  const cityWrapper = getWrapperByName(form, 'city');
  const stateWrapper = getWrapperByName(form, 'state');
  const zipWrapper = getWrapperByName(form, 'zip');
  if (!cityWrapper || !stateWrapper || !zipWrapper) return;

  const row = document.createElement('div');
  row.className = 'city-state-zip full-width';
  cityWrapper.before(row);

  const rightColumn = document.createElement('div');
  rightColumn.className = 'state-zip-column';
  rightColumn.append(stateWrapper, zipWrapper);

  row.append(cityWrapper, rightColumn);
}

// Merges the licText ("This form is intended...") and submitCheck
// ("By clicking SUBMIT...") paragraphs into a single wrapper so they
function groupLegalText(form) {
  const licWrapper = resolveWrapper(form, 'licText');
  const checkWrapper = resolveWrapper(form, 'submitCheck');
  if (!licWrapper || !checkWrapper || licWrapper === checkWrapper) return;

  const group = document.createElement('div');
  group.className = 'legal-text-group full-width';
  licWrapper.before(group);
  group.append(licWrapper, checkWrapper);
}
