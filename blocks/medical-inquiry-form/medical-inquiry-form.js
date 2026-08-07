import { enhanceAllDropdowns, organizeRadioGroups } from './dropdown-radio.js';
import { setupLayout } from './layout.js';
import { initValidationListeners } from './validation.js';
import { submitForm, getApiEndpoint } from './submission.js';
import { markFieldWrappers, linkifyMarkdownLinks } from './domutils.js';

export default async function decorate(block) {
  try {
    // Get API endpoint from da.live configuration
    const apiEndpoint = getApiEndpoint(block);

    const module = await import('../form/form.js');

    if (typeof module.default === 'function') {
      await module.default(block);
    }

    const form = block.querySelector('form');

    if (!form) return;

    // custom validation owns error display
    form.setAttribute('novalidate', '');

    markFieldWrappers(form);

    linkifyMarkdownLinks(form);

    organizeRadioGroups(form);
    enhanceAllDropdowns(form);

    const describeYouSelect = form.querySelector(
      'select[name="describeYou"]'
    );

    if (describeYouSelect) {
      describeYouSelect.parentElement.classList.add('describe-you-select');
    }

    setupLayout(form);

    initValidationListeners(
      form,
      () => submitForm(form, apiEndpoint)
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to load form block:', error);
  }
}
