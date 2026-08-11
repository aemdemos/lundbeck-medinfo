/* medical-inquiry-form/dropdown-radio.js */

import { RADIO_GROUPS } from './constants.js';
import { getFieldWrapper, resolveWrapper } from './domutils.js';

/* ---------------------------------------------------------------------
 * Custom dropdown
 * ------------------------------------------------------------------- */

const CLICK_FLASH_MS = 250;

function enhanceCustomDropdown(select) {
  select.classList.add('native-select');

  const wrapper = document.createElement('div');
  wrapper.className = 'custom-select';

  if (select.name === 'product') {
  wrapper.classList.add('product-dropdown');
}

  const trigger = document.createElement('div');
  trigger.className = 'custom-select-trigger placeholder';
  trigger.setAttribute('role', 'button');
  trigger.setAttribute('tabindex', '0');
  trigger.setAttribute('aria-haspopup', 'listbox');
  trigger.setAttribute('aria-expanded', 'false');

  const triggerLabel = document.createElement('span');
  triggerLabel.className = 'trigger-label';

  const arrowIcon = document.createElement('span');
  arrowIcon.className = 'arrow-icon';
  arrowIcon.setAttribute('aria-hidden', 'true');

  trigger.append(triggerLabel, arrowIcon);

  const menu = document.createElement('ul');
  menu.className = 'custom-select-menu';
  menu.setAttribute('role', 'listbox');

  const options = [...select.options];
  const filteredOptions = options.filter((option) => option.textContent.trim() !== 'Select');

  function openDropdown() {
    wrapper.classList.add('open');
    trigger.setAttribute('aria-expanded', 'true');
  }

  function closeDropdown() {
    wrapper.classList.remove('open');
    trigger.setAttribute('aria-expanded', 'false');
  }

  function setSelected(option, item, { closeMenu = true, focusTrigger = false } = {}) {
    select.value = option.value;
    select.dispatchEvent(new Event('change', { bubbles: true }));

    triggerLabel.textContent = option.textContent;
    trigger.classList.toggle('placeholder', !option.value);

    if (item) {
      item.classList.add('flash');
      setTimeout(() => {
        item.classList.remove('flash');
        if (closeMenu) closeDropdown();
        if (focusTrigger) trigger.focus();
      }, CLICK_FLASH_MS);
      return;
    }

    if (closeMenu) closeDropdown();
    if (focusTrigger) trigger.focus();
  }

  const placeholderOption = options.find((option) => option.textContent.trim() === 'Select');

  filteredOptions.forEach((option) => {
    const item = document.createElement('li');
    item.className = 'custom-select-item';
    item.textContent = option.textContent;
    item.dataset.value = option.value;
    item.setAttribute('role', 'option');

    item.addEventListener('click', () => setSelected(option, item, { focusTrigger: true }));
    menu.append(item);
  });

  // eslint-disable-next-line secure-coding/detect-object-injection
  const initiallySelected = select.options[select.selectedIndex];
  if (initiallySelected && initiallySelected.value) {
    triggerLabel.textContent = initiallySelected.textContent;
    trigger.classList.remove('placeholder');
  } else {
    triggerLabel.textContent = placeholderOption ? placeholderOption.textContent : (filteredOptions[0]?.textContent || '');
    trigger.classList.add('placeholder');
  }

  // ---- Interactions ----
  const supportsHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (supportsHover) {
    wrapper.addEventListener('mouseenter', openDropdown);
    wrapper.addEventListener('mouseleave', closeDropdown);
  }

  trigger.addEventListener('click', () => {
    if (wrapper.classList.contains('open')) closeDropdown();
    else openDropdown();
  });

  trigger.addEventListener('keydown', (e) => {
    // eslint-disable-next-line secure-coding/no-insecure-comparison
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (wrapper.classList.contains('open')) closeDropdown();
      else openDropdown();
      // eslint-disable-next-line secure-coding/no-insecure-comparison
    } else if (e.key === 'Escape') {
      closeDropdown();
    }
  });

  document.addEventListener('click', (e) => {
    if (!wrapper.contains(e.target)) closeDropdown();
  });

  select.before(wrapper);
  wrapper.append(trigger, menu, select);
}

// applies the custom dropdown to every <select> on the form
export function enhanceAllDropdowns(form) {
  form.querySelectorAll('select').forEach((select) => enhanceCustomDropdown(select));
}

/* ---------------------------------------------------------------------
 * Radio grouping
 * ------------------------------------------------------------------- */

export function organizeRadioGroups(form) {
  RADIO_GROUPS.forEach(({ groupName, legendField, radioFields, fullWidth }) => {

    let target = resolveWrapper(form, legendField);

    const radioRow = document.createElement('div');
    radioRow.className = 'radio-group-wrapper';
    radioRow.dataset.group = groupName;

    const wrappersToRemove = [];

    radioFields.forEach((radioName) => {
      const radio = form.querySelector(`[name="${radioName}"]`);
      if (!radio) return;

      const originalWrapper = getFieldWrapper(form, radio);
      if (!target) target = originalWrapper; // fallback: host inside the first radio's own wrapper

      radio.name = groupName;
      radio.value = radio.value || radio.id || radioName;

      const option = document.createElement('div');
      const label = form.querySelector(`label[for="${radio.id}"]`);
      option.append(radio);
      if (label) option.append(label);

      radioRow.append(option);

      if (originalWrapper && originalWrapper !== target) {
        wrappersToRemove.push(originalWrapper);
      }
    });

    if (!target) return;

    wrappersToRemove.forEach((w) => w.remove());

    target.classList.add('radio-question-wrapper');
    if (fullWidth) target.classList.add('full-width');
    target.append(radioRow);
  });
}
