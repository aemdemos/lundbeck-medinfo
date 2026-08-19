/**
 * search-results — Lundbeck product-information results listing.
 *
 * Authored content (one block table):
 *   Row 1 (optional): a heading/label cell used as the results-count heading
 *                     (e.g. "Results:"). If omitted, "Results:" is used.
 *
 * Reads `product`, `category`, and `keyword` from the URL query string,
 * fetches the author-maintained catalog, filters client-side, and renders the
 * results grouped by product (Full Prescribing Information row + document list).
 */

import { decorateIcons } from '../../scripts/aem.js';
import { filterDocuments, loadCatalog, toSafeHref } from '../../scripts/medinfo-catalog.js';

const COLUMN_HEADERS = ['Description', 'Access'];
const NO_RESULTS_MESSAGE = 'No results found. Please modify your search criteria and try again.';
const MISSING_QUERY_MESSAGE = 'Please select a product and a category to search.';
const UNAVAILABLE_MESSAGE = 'Search is temporarily unavailable';
const VIEW_LABEL = 'View';
const MAX_PARAM_LENGTH = 500;

/**
 * Creates a "View" control. The PI row uses a filled button; document rows use
 * a text link with an arrow, matching the source site.
 * @param {string} href
 * @param {{ button?: boolean }} [options]
 * @returns {HTMLAnchorElement}
 */
function viewLink(href, { button = false } = {}) {
  const a = document.createElement('a');
  a.className = button ? 'results-button' : 'search-results-access';
  const safe = toSafeHref(href);
  if (safe) {
    a.href = safe;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
  } else {
    a.setAttribute('aria-disabled', 'true');
  }
  a.append(VIEW_LABEL);
  if (!button) {
    const icon = document.createElement('span');
    icon.className = 'icon icon-arrow-right';
    a.append(icon);
  }
  return a;
}

function buildColumnHeaders() {
  const header = document.createElement('div');
  header.className = 'search-results-headers';
  COLUMN_HEADERS.forEach((label) => {
    const cell = document.createElement('h6');
    cell.className = 'search-results-header-cell';
    cell.textContent = label;
    header.append(cell);
  });
  return header;
}

function buildMessage(text) {
  const empty = document.createElement('p');
  empty.className = 'search-results-empty';
  empty.textContent = text;
  return empty;
}

/**
 * Renders one product group: the Full Prescribing Information row, a
 * Description/Access header, and the list of matching documents.
 * @param {object} product Catalog product row
 * @param {object[]} docs Matching documents for this product
 * @returns {HTMLElement}
 */
function renderProductGroup(product, docs) {
  const group = document.createElement('div');
  group.className = 'search-results-group';

  const header = document.createElement('div');
  header.className = 'search-results-product';

  const title = document.createElement('h4');
  const titleHref = toSafeHref(product.Anchor || '');
  if (titleHref) {
    const titleLink = document.createElement('a');
    titleLink.href = titleHref;
    titleLink.textContent = product.Name;
    title.append(titleLink);
  } else {
    title.textContent = product.Name;
  }

  const piTitle = document.createElement('h5');
  piTitle.textContent = product.PITitle || 'Full Prescribing Information';

  header.append(title, piTitle);
  if (product.PIUrl) header.append(viewLink(product.PIUrl, { button: true }));
  group.append(header);

  if (!docs.length) {
    group.append(buildMessage(NO_RESULTS_MESSAGE));
  }

  group.append(buildColumnHeaders());

  if (docs.length) {
    const list = document.createElement('ul');
    list.className = 'search-results-list';
    docs.forEach((doc) => {
      const item = document.createElement('li');
      const titleEl = document.createElement('p');
      titleEl.textContent = doc.Title;
      item.append(titleEl);
      if (doc.Url) item.append(viewLink(doc.Url));
      list.append(item);
    });
    group.append(list);
  }

  return group;
}

function readParam(params, name) {
  return (params.get(name) || '').slice(0, MAX_PARAM_LENGTH);
}

export default async function decorate(block) {
  const rows = [...block.children];

  let headingText = 'Results:';
  if (rows[0] && rows[0].children.length === 1) {
    headingText = rows[0].textContent.trim() || headingText;
  }

  block.textContent = '';

  const section = document.createElement('div');
  section.className = 'search-results-section';

  const heading = document.createElement('h2');
  heading.className = 'search-results-count';
  section.append(heading);

  const body = document.createElement('div');
  body.className = 'search-results-body';
  section.append(body);
  block.append(section);

  const params = new URLSearchParams(window.location.search);
  const product = readParam(params, 'product');
  const category = readParam(params, 'category');
  const keyword = readParam(params, 'keyword') || readParam(params, 'q');

  let catalog;
  try {
    catalog = await loadCatalog();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('search-results: catalog unavailable', error);
    heading.textContent = UNAVAILABLE_MESSAGE;
    return;
  }

  // eslint-disable-next-line secure-coding/no-insecure-comparison -- catalog product key match, not a secret
  const productRow = catalog.products.find((p) => p.Key === product);
  const docs = filterDocuments(catalog.documents, { product, category, keyword });

  const label = headingText.replace(/^\d+\s*/, '').replace(/:$/, '').trim() || 'Results';
  heading.textContent = category ? `${docs.length} ${label}: ${category}` : `${docs.length} ${label}:`;

  if (!productRow) {
    body.append(buildMessage(MISSING_QUERY_MESSAGE));
    decorateIcons(block);
    return;
  }

  body.append(renderProductGroup(productRow, docs));
  decorateIcons(block);
}
