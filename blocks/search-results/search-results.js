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

import { filterDocuments, loadCatalog, toSafeHref } from '../../scripts/medinfo-catalog.js';

const COLUMN_HEADERS = ['Description', 'Access'];
const NO_RESULTS_MESSAGE = 'No results found. Please modify your search criteria and try again.';
const MISSING_QUERY_MESSAGE = 'Please select a product and a category to search.';
const UNAVAILABLE_MESSAGE = 'Search is temporarily unavailable';
const VIEW_LABEL = 'View';
const MAX_PARAM_LENGTH = 500;

/**
 * Creates a "View" link styled as a button. Only http(s) hrefs are applied.
 * @param {string} href
 * @returns {HTMLAnchorElement}
 */
function viewLink(href) {
  const a = document.createElement('a');
  a.className = 'results-button';
  a.textContent = VIEW_LABEL;
  const safe = toSafeHref(href);
  if (safe) {
    a.href = safe;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
  } else {
    a.setAttribute('aria-disabled', 'true');
  }
  return a;
}

function buildColumnHeaders() {
  const header = document.createElement('div');
  header.className = 'search-results-headers search-results-doc-headers';
  COLUMN_HEADERS.forEach((label) => {
    const cell = document.createElement('div');
    cell.className = 'search-results-header-cell';
    cell.textContent = label;
    header.append(cell);
  });
  return header;
}

function buildNoResults() {
  const empty = document.createElement('div');
  empty.className = 'search-results-empty';
  const p = document.createElement('p');
  p.textContent = NO_RESULTS_MESSAGE;
  empty.append(p);
  return empty;
}

function buildMessage(text) {
  const empty = document.createElement('div');
  empty.className = 'search-results-empty';
  const p = document.createElement('p');
  p.textContent = text;
  empty.append(p);
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
  header.className = 'search-results-row search-results-product';

  const titleCell = document.createElement('div');
  titleCell.className = 'search-results-cell';
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
  titleCell.append(title);

  const piCell = document.createElement('div');
  piCell.className = 'search-results-cell';
  const piTitle = document.createElement('h5');
  piTitle.textContent = product.PITitle || 'Full Prescribing Information';
  piCell.append(piTitle);

  const accessCell = document.createElement('div');
  accessCell.className = 'search-results-cell';
  if (product.PIUrl) accessCell.append(viewLink(product.PIUrl));

  header.append(titleCell, piCell, accessCell);
  group.append(header);

  if (!docs.length) {
    group.append(buildNoResults());
  }

  group.append(buildColumnHeaders());

  if (docs.length) {
    const list = document.createElement('div');
    list.className = 'search-results-list';
    docs.forEach((doc) => {
      const row = document.createElement('div');
      row.className = 'search-results-row search-results-doc';
      const desc = document.createElement('div');
      desc.className = 'search-results-cell';
      desc.textContent = doc.Title;
      const access = document.createElement('div');
      access.className = 'search-results-cell';
      if (doc.Url) access.append(viewLink(doc.Url));
      row.append(desc, access);
      list.append(row);
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

  const list = document.createElement('div');
  list.className = 'search-results-body';
  section.append(list);
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
    list.append(buildMessage(MISSING_QUERY_MESSAGE));
    return;
  }

  list.append(renderProductGroup(productRow, docs));
}
