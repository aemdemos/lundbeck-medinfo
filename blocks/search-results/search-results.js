/**
 * search-results — Lundbeck product-information results listing.
 *
 * Authored content (one block table):
 *   Row 1 (optional): a heading/label cell used as the results-count heading
 *                     (e.g. "Results:"). If omitted, "Results:" is used.
 *   Each subsequent row = one result, with up to three cells:
 *     Cell 1: title / link (the result title, optionally an <a> to the document)
 *     Cell 2: description or "Full Prescribing Information" label/link
 *     Cell 3: an access/"View" action link
 *
 * Rendering:
 *   - Shows a results-count heading reflecting the number of result rows.
 *   - Renders each result row with column headers
 *     (Full Prescribing Information / Description / Access).
 *   - When there are no result rows, shows a no-results empty-state message.
 *
 * The listing is typically populated dynamically from the product/category/keyword
 * query parameters carried over from the search-product widget. This decoration
 * renders whatever rows are present (including the empty state) and is the
 * single source of truth for the listing markup; query-driven population is
 * layered on top by reading the URL search params.
 */

const COLUMN_HEADERS = ['Full Prescribing Information', 'Description', 'Access'];
const NO_RESULTS_MESSAGE = 'No results found. Please modify your search criteria and try again.';

function buildColumnHeaders() {
  const header = document.createElement('div');
  header.className = 'search-results-headers';
  COLUMN_HEADERS.forEach((label) => {
    const cell = document.createElement('div');
    cell.className = 'search-results-header-cell';
    cell.textContent = label;
    header.append(cell);
  });
  return header;
}

function buildResultRow(row) {
  const cells = [...row.children];
  const item = document.createElement('div');
  item.className = 'search-results-row';
  cells.forEach((cell) => {
    const col = document.createElement('div');
    col.className = 'search-results-cell';
    col.append(...cell.childNodes);
    item.append(col);
  });
  return item;
}

function buildNoResults() {
  const empty = document.createElement('div');
  empty.className = 'search-results-empty';
  const p = document.createElement('p');
  p.textContent = NO_RESULTS_MESSAGE;
  empty.append(p);
  return empty;
}

export default function decorate(block) {
  const rows = [...block.children];

  // First row is treated as the count heading if it has a single cell.
  let headingText = 'Results:';
  let resultRows = rows;
  if (rows[0] && rows[0].children.length === 1) {
    headingText = rows[0].textContent.trim() || headingText;
    resultRows = rows.slice(1);
  }

  block.textContent = '';

  const section = document.createElement('div');
  section.className = 'search-results-section';

  const count = resultRows.length;
  const heading = document.createElement('h2');
  heading.className = 'search-results-count';
  // Preserve an authored "Results:" style label, prefixing with the count.
  heading.textContent = `${count} ${headingText.replace(/^\d+\s*/, '')}`.trim();
  section.append(heading);

  const list = document.createElement('div');
  list.className = 'search-results-list';

  if (count === 0) {
    list.append(buildNoResults());
  } else {
    list.append(buildColumnHeaders());
    resultRows.forEach((row) => list.append(buildResultRow(row)));
  }

  section.append(list);
  block.append(section);
}
