/**
 * Shared data-access helpers for the Medical Information document search.
 *
 * The catalog is an author-maintained spreadsheet published by Edge Delivery as
 * a multi-sheet JSON (`products`, `categories`, `documents`). This module hides
 * the fetch/parse details so search-product and search-results share one source
 * of truth.
 */

const DEFAULT_CATALOG = '/medinfo-catalog.json';
const MAX_QUERY_LENGTH = 500;

let catalogPromise;

/**
 * True when `path` is a same-origin JSON path (not a URL or traversal).
 * @param {string} path
 * @returns {boolean}
 */
function isSafeCatalogPath(path) {
  return typeof path === 'string'
    && path.startsWith('/')
    && !path.startsWith('//')
    && path.endsWith('.json')
    && !path.includes('\\')
    && !path.includes('..')
    && !path.includes(':');
}

/**
 * @param {unknown} value
 * @returns {string}
 */
function asString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

/**
 * @param {unknown} row
 * @returns {{Key: string, Name: string, Anchor: string, PITitle: string, PIUrl: string}|null}
 */
function normalizeProduct(row) {
  if (!row || typeof row !== 'object') return null;
  const Key = asString(row.Key);
  const Name = asString(row.Name);
  if (!Key || !Name) return null;
  return {
    Key,
    Name,
    Anchor: asString(row.Anchor),
    PITitle: asString(row.PITitle),
    PIUrl: asString(row.PIUrl),
  };
}

/**
 * @param {unknown} row
 * @returns {{Name: string}|null}
 */
function normalizeCategory(row) {
  if (!row || typeof row !== 'object') return null;
  const Name = asString(row.Name);
  if (!Name) return null;
  return { Name };
}

/**
 * @param {unknown} row
 * @returns {{Product: string, Category: string, Title: string, Url: string}|null}
 */
function normalizeDocument(row) {
  if (!row || typeof row !== 'object') return null;
  const Product = asString(row.Product);
  const Category = asString(row.Category);
  const Title = asString(row.Title);
  const Url = asString(row.Url);
  if (!Product || !Category || !Title) return null;
  return {
    Product, Category, Title, Url,
  };
}

/**
 * @param {unknown} sheet
 * @returns {object[]}
 */
function sheetData(sheet) {
  if (!sheet || typeof sheet !== 'object' || !Array.isArray(sheet.data)) return [];
  return sheet.data;
}

/**
 * Fetches and caches the catalog for the lifetime of the page.
 * @param {string} [path] Path to the published catalog JSON
 * @returns {Promise<{products: object[], categories: object[], documents: object[]}>}
 */
export async function loadCatalog(path = DEFAULT_CATALOG) {
  const catalogPath = isSafeCatalogPath(path) ? path : DEFAULT_CATALOG;
  if (!catalogPromise) {
    catalogPromise = (async () => {
      const resp = await fetch(catalogPath);
      if (!resp.ok) throw new Error(`Unable to load catalog: ${resp.status}`);
      const json = await resp.json();
      if (!json || typeof json !== 'object') throw new Error('Invalid catalog');
      let documentsSheet = [];
      if (json.documents) {
        documentsSheet = sheetData(json.documents);
      } else if (Array.isArray(json.data)) {
        documentsSheet = json.data;
      }
      return {
        products: sheetData(json.products).map(normalizeProduct).filter(Boolean),
        categories: sheetData(json.categories).map(normalizeCategory).filter(Boolean),
        documents: documentsSheet.map(normalizeDocument).filter(Boolean),
      };
    })().catch((error) => {
      catalogPromise = undefined;
      throw error;
    });
  }
  return catalogPromise;
}

/**
 * Splits a raw keyword string ("a, b c") into normalised terms.
 * @param {string} keyword
 * @returns {string[]}
 */
export function parseKeywords(keyword) {
  // eslint-disable-next-line secure-coding/no-insecure-comparison -- keyword is a search term, not a secret
  if (typeof keyword !== 'string' || !keyword) return [];
  return keyword
    .slice(0, MAX_QUERY_LENGTH)
    .split(',')
    .map((term) => term.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Filters documents by product, category, and optional keyword terms.
 * A document matches when its title contains ANY of the supplied terms,
 * mirroring the legacy behaviour where more terms broaden the result set.
 * @param {object[]} documents
 * @param {{product: string, category: string, keyword?: string}} query
 * @returns {object[]}
 */
export function filterDocuments(documents, { product, category, keyword }) {
  if (!Array.isArray(documents)) return [];
  const productKey = asString(product).slice(0, MAX_QUERY_LENGTH);
  const categoryName = asString(category).slice(0, MAX_QUERY_LENGTH);
  const terms = parseKeywords(keyword);
  return documents.filter((doc) => {
    // eslint-disable-next-line secure-coding/no-insecure-comparison -- catalog field match, not a secret
    if (productKey && doc.Product !== productKey) return false;
    if (categoryName && doc.Category !== categoryName) return false;
    if (terms.length) {
      const haystack = (doc.Title || '').toLowerCase();
      return terms.some((term) => haystack.includes(term));
    }
    return true;
  });
}

/**
 * Builds an http(s) href from a catalog or authored URL. Rejects other protocols.
 * @param {string} href
 * @returns {string} Absolute http(s) URL, or empty string when unsafe/invalid
 */
export function toSafeHref(href) {
  if (typeof href !== 'string' || !href.trim()) return '';
  try {
    const url = new URL(href.trim(), window.location.origin);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return '';
    return url.href;
  } catch {
    return '';
  }
}
