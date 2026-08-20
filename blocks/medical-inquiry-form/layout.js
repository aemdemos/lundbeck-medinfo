/* medical-inquiry-form/layout.js */

import { FULL_WIDTH_FIELDS } from './constants.js';
import { resolveWrapper, getWrapperByName, getFieldWrapper } from './domutils.js';


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
function groupLegalText(form) {
  const licWrapper = resolveWrapper(form, 'licText');
  const checkWrapper = resolveWrapper(form, 'submitCheck');
  if (!licWrapper || !checkWrapper || licWrapper === checkWrapper) return;

  const group = document.createElement('div');
  group.className = 'legal-text-group full-width';
  licWrapper.before(group);
  group.append(licWrapper, checkWrapper);
}

export default function setupLayout(form) {
  FULL_WIDTH_FIELDS.forEach((name) => {
    if (name === 'submitBtn') return;
    const wrapper = resolveWrapper(form, name);
    if (wrapper) wrapper.classList.add('full-width');
  });

  const submitButton = form.querySelector('button[type="submit"], input[type="submit"]');
  const submitWrapper = submitButton ? getFieldWrapper(form, submitButton) : null;
  if (submitWrapper) submitWrapper.classList.add('full-width', 'submit-wrapper');

  createCityStateZipRow(form);
  groupLegalText(form);
}
