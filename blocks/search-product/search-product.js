/**
 * search-product — Lundbeck product / category / keyword filter widget.
 *
 * Authored content (one block table, rows in order):
 *   Row 1: instructional paragraph (text shown above the controls)
 *   Row 2: a list of product options (first item is the placeholder, e.g. "Select a Product*")
 *   Row 3: a list of category options (first item is the placeholder, e.g. "Category*")
 *   Row 4 (optional): keyword field help text
 *   Row 5 (optional): confirmation text under the search button
 *
 * Renders two custom dropdowns, a keyword input and a search button. Custom
 * dropdowns (button + panel) are used instead of native <select> so the open
 * menu can be styled to match the source (white panel, bordered rows).
 */

import { decorateIcons } from '../../scripts/aem.js';

let dropdownIdCounter = 0;

/**
 * Builds a custom accessible dropdown. The first option is the placeholder.
 * @returns {{ el: HTMLElement, getValue: () => string, setError: (on: boolean) => void }}
 */
function buildDropdown(options, placeholder, errorMessage) {
  dropdownIdCounter += 1;
  const listId = `search-product-listbox-${dropdownIdCounter}`;
  const errorId = `search-product-error-${dropdownIdCounter}`;
  const values = options.slice(1); // drop the placeholder entry

  const wrap = document.createElement('div');
  wrap.className = 'search-product-select';

  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'search-product-select-trigger';
  trigger.setAttribute('aria-haspopup', 'listbox');
  trigger.setAttribute('aria-expanded', 'false');
  trigger.setAttribute('aria-label', placeholder);
  trigger.dataset.value = '';
  const triggerLabel = document.createElement('span');
  triggerLabel.className = 'search-product-select-label is-placeholder';
  triggerLabel.textContent = placeholder;
  trigger.append(triggerLabel);

  const panel = document.createElement('ul');
  panel.className = 'search-product-select-panel';
  panel.id = listId;
  panel.setAttribute('role', 'listbox');
  panel.hidden = true;
  trigger.setAttribute('aria-controls', listId);

  values.forEach((label) => {
    const item = document.createElement('li');
    item.className = 'search-product-select-option';
    item.setAttribute('role', 'option');
    item.setAttribute('aria-selected', 'false');
    item.tabIndex = -1;
    item.dataset.value = label;
    item.textContent = label;
    panel.append(item);
  });

  const error = document.createElement('p');
  error.className = 'search-product-error-message';
  error.id = errorId;
  error.textContent = errorMessage;
  error.hidden = true;

  wrap.append(trigger, panel, error);

  const close = () => {
    panel.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
  };
  const open = () => {
    document.dispatchEvent(new CustomEvent('search-product-dropdown-open', { detail: wrap }));
    panel.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    const current = panel.querySelector('[aria-selected="true"]') || panel.firstElementChild;
    current?.focus();
  };
  const toggle = () => (panel.hidden ? open() : close());

  const select = (item) => {
    panel.querySelectorAll('[aria-selected="true"]').forEach((o) => o.setAttribute('aria-selected', 'false'));
    item.setAttribute('aria-selected', 'true');
    trigger.dataset.value = item.dataset.value;
    triggerLabel.textContent = item.textContent;
    triggerLabel.classList.remove('is-placeholder');
    wrap.classList.remove('search-product-error');
    error.hidden = true;
    trigger.removeAttribute('aria-describedby');
    close();
    trigger.focus();
  };

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    toggle();
  });

  trigger.addEventListener('keydown', (e) => {
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
      e.preventDefault();
      open();
    }
  });

  panel.addEventListener('click', (e) => {
    const item = e.target.closest('.search-product-select-option');
    if (item) select(item);
  });

  panel.addEventListener('keydown', (e) => {
    const items = [...panel.children];
    const idx = items.indexOf(document.activeElement);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      (items[idx + 1] || items[0]).focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      (items[idx - 1] || items[items.length - 1]).focus();
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (document.activeElement.classList.contains('search-product-select-option')) {
        select(document.activeElement);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      close();
      trigger.focus();
    }
  });

  document.addEventListener('click', (e) => {
    if (!wrap.contains(e.target)) close();
  });

  document.addEventListener('search-product-dropdown-open', (e) => {
    if (e.detail !== wrap) close();
  });

  return {
    el: wrap,
    getValue: () => trigger.dataset.value,
    setError: (on) => {
      wrap.classList.toggle('search-product-error', on);
      error.hidden = !on;
      if (on) trigger.setAttribute('aria-describedby', errorId);
      else trigger.removeAttribute('aria-describedby');
    },
  };
}

function getListItems(row) {
  if (!row) return [];
  return [...row.querySelectorAll('li')].map((li) => li.textContent.trim()).filter(Boolean);
}

export default function decorate(block) {
  const rows = [...block.children];

  const intro = rows[0] ? rows[0].textContent.trim() : '';
  const productOptions = getListItems(rows[1]);
  const categoryOptions = getListItems(rows[2]);
  const keywordHelp = rows[3] ? rows[3].textContent.trim() : 'Separate multiple terms with a comma.';
  const confirmText = rows[4] ? rows[4].textContent.trim() : '';
  const productError = rows[5] ? rows[5].textContent.trim() : 'Product selection is required';
  const categoryError = rows[6] ? rows[6].textContent.trim() : 'Category selection is required';

  const productPlaceholder = productOptions[0] || 'Select a Product*';
  const categoryPlaceholder = categoryOptions[0] || 'Category*';

  block.textContent = '';

  const form = document.createElement('form');
  form.className = 'search-product-form';
  form.setAttribute('role', 'search');

  if (intro) {
    const introEl = document.createElement('p');
    introEl.className = 'search-product-intro';
    introEl.textContent = intro;
    form.append(introEl);
  }

  const controls = document.createElement('div');
  controls.className = 'search-product-controls';

  const productDropdown = buildDropdown(productOptions, productPlaceholder, productError);
  const categoryDropdown = buildDropdown(categoryOptions, categoryPlaceholder, categoryError);

  const keyword = document.createElement('input');
  keyword.type = 'text';
  keyword.id = 'search-product-keywords';
  keyword.className = 'search-product-keywords';
  keyword.placeholder = 'Keyword(s)';
  keyword.setAttribute('aria-label', 'Keywords');

  const keywordField = document.createElement('div');
  keywordField.className = 'search-product-field';
  keywordField.append(keyword);
  if (keywordHelp) {
    const help = document.createElement('p');
    help.className = 'search-product-help';
    help.textContent = keywordHelp;
    keywordField.append(help);
  }

  const button = document.createElement('button');
  button.type = 'submit';
  button.className = 'search-product-button';
  const icon = document.createElement('span');
  icon.className = 'icon icon-search';
  const buttonLabel = document.createElement('span');
  buttonLabel.className = 'search-product-button-label';
  buttonLabel.textContent = 'Search';
  button.append(icon, buttonLabel);

  const buttonField = document.createElement('div');
  buttonField.className = 'search-product-field';
  buttonField.append(button);
  if (confirmText) {
    const confirm = document.createElement('p');
    confirm.className = 'search-product-confirm';
    confirm.textContent = confirmText;
    buttonField.append(confirm);
  }

  controls.append(productDropdown.el, categoryDropdown.el, keywordField, buttonField);
  form.append(controls);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const productValue = productDropdown.getValue();
    const categoryValue = categoryDropdown.getValue();
    productDropdown.setError(!productValue);
    categoryDropdown.setError(!categoryValue);
    if (!productValue || !categoryValue) return;

    const resultsUrl = new URL('/us/en/hcp/products', window.location.origin);
    resultsUrl.searchParams.set('product', productValue);
    resultsUrl.searchParams.set('category', categoryValue);
    const trimmedKeyword = keyword.value.trim();
    if (trimmedKeyword) resultsUrl.searchParams.set('q', trimmedKeyword);
    window.location.href = `${resultsUrl.pathname}${resultsUrl.search}`;
  });

  block.append(form);
  decorateIcons(block);
}
