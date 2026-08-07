/* medical-inquiry-form/domutils.js */

import { FIELD_TEXT_HINTS } from './constants.js';

/* Tags every current top-level child of `form` as its field's wrapper */
export function markFieldWrappers(form) {
  [...form.children].forEach((child) => {
    child.dataset.fieldWrapper = '';
  });
}

/* Walk up from `el`*/
export function getFieldWrapper(form, el) {
  let node = el;
  while (node && node !== form) {
    if (node.hasAttribute?.('data-field-wrapper')) return node;
    node = node.parentElement;
  }
  return null;
}

// resolves a field wrapper by its sheet `name`, via the control or fallback attrs
export function getWrapperByName(form, name) {
  if (!name) return null;

  const control = form.querySelector(`[name="${CSS.escape(name)}"]`);
  if (control) return getFieldWrapper(form, control);

  const byOther = form.querySelector(`.${CSS.escape(name)}-wrapper`)
    || form.querySelector(`[data-name="${CSS.escape(name)}"]`)
    || form.querySelector(`#${CSS.escape(name)}-wrapper`)
    || form.querySelector(`#${CSS.escape(name)}`);
  if (byOther) return getFieldWrapper(form, byOther) || byOther;

  return null;
}

/* Last-resort lookup: find the element whose own text starts with a known phrase */
export function getWrapperByText(form, text) {
  if (!text) return null;
  const all = form.querySelectorAll('*');
  for (const el of all) {
    const onlyAnchorChildren = [...el.children].every((child) => child.tagName === 'A');
    if (onlyAnchorChildren && el.textContent && el.textContent.trim().startsWith(text)) {
      return getFieldWrapper(form, el) || el;
    }
  }
  return null;
}

// tries name-based lookup first, then falls back to text-based lookup
export function resolveWrapper(form, name) {
  return getWrapperByName(form, name) || getWrapperByText(form, FIELD_TEXT_HINTS[name]);
}

/* ---------------------------------------------------------------------
 * Markdown link parsing
 * ------------------------------------------------------------------- */

const MARKDOWN_LINK = /\[([^\]]+)\]\(([^)]+)\)/g;

export function linkifyMarkdownLinks(form) {
  const walker = document.createTreeWalker(form, NodeFilter.SHOW_TEXT);
  const targets = [];

  // Collect matching text nodes first — mutating the tree while the
  // walker is still iterating the live DOM can skip or duplicate nodes.
  let node = walker.nextNode();
  while (node) {
    MARKDOWN_LINK.lastIndex = 0;
    if (MARKDOWN_LINK.test(node.textContent)) targets.push(node);
    node = walker.nextNode();
  }

  targets.forEach((textNode) => {
    const fragment = document.createDocumentFragment();
    let lastIndex = 0;
    let match;

    MARKDOWN_LINK.lastIndex = 0;
    while ((match = MARKDOWN_LINK.exec(textNode.textContent)) !== null) {
      const [full, label, url] = match;

      if (match.index > lastIndex) {
        fragment.append(document.createTextNode(textNode.textContent.slice(lastIndex, match.index)));
      }

      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.textContent = label;
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
      fragment.append(anchor);

      lastIndex = match.index + full.length;
    }

    if (lastIndex < textNode.textContent.length) {
      fragment.append(document.createTextNode(textNode.textContent.slice(lastIndex)));
    }

    textNode.replaceWith(fragment);
  });
}
