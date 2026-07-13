/**
 * search-product — Lundbeck product / category / keyword filter widget.
 *
 * Authored content (one block table, rows in order):
 *   Row 1: instructional paragraph (text shown above the controls)
 *   Row 2: a list of product options (first item is the placeholder, e.g. "Select a Product*")
 *   Row 3: a list of category options (first item is the placeholder, e.g. "Category*")
 *   Row 4 (optional): keyword field help text
 *
 * The block renders two dropdowns, a keyword input and a search button.
 * On submit it composes a query and navigates to the results path.
 */

import { decorateIcons } from '../../scripts/aem.js';

function buildSelect(id, options, placeholder) {
  const select = document.createElement('select');
  select.id = id;
  select.className = 'search-product-select';
  select.setAttribute('aria-label', placeholder);

  const items = [...options];
  // first item is treated as the placeholder
  items.forEach((label, i) => {
    const opt = document.createElement('option');
    opt.textContent = label;
    if (i === 0) {
      opt.value = '';
      opt.disabled = true;
      opt.selected = true;
    } else {
      opt.value = label;
    }
    select.append(opt);
  });
  return select;
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

  const productSelect = buildSelect('search-product-product', productOptions, productPlaceholder);
  const categorySelect = buildSelect('search-product-category', categoryOptions, categoryPlaceholder);

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

  controls.append(productSelect, categorySelect, keywordField, buttonField);
  form.append(controls);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    productSelect.classList.toggle('search-product-error', !productSelect.value);
    categorySelect.classList.toggle('search-product-error', !categorySelect.value);
    if (!productSelect.value || !categorySelect.value) return;

    const resultsUrl = new URL('/us/en/hcp/products', window.location.origin);
    resultsUrl.searchParams.set('product', productSelect.value);
    resultsUrl.searchParams.set('category', categorySelect.value);
    const trimmedKeyword = keyword.value.trim();
    if (trimmedKeyword) resultsUrl.searchParams.set('q', trimmedKeyword);
    window.location.href = `${resultsUrl.pathname}${resultsUrl.search}`;
  });

  block.append(form);
  decorateIcons(block);
}
