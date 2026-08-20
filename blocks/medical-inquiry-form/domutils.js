/* medical-inquiry-form/domutils.js */

import { FIELD_TEXT_HINTS } from './constants.js';

const FIELD_TEXT_HINTS_MAP = new Map(Object.entries(FIELD_TEXT_HINTS));

/* Tags every current top-level child of `form` as its field's wrapper */
export function markFieldWrappers(form) {
  [...form.children].forEach((child) => {
    child.dataset.fieldWrapper = '';
  });
}

/* Walk up from `el` */
export function getFieldWrapper(form, el) {
  let node = el;
  while (node && node !== form) {
    if (node.hasAttribute?.('data-field-wrapper')) return node;
    node = node.parentElement;
  }
  return null;
}

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

export function getWrapperByText(form, text) {
  if (!text) return null;

  const all = [...form.querySelectorAll('*')];
  const match = all.find((el) => {
    const onlyAnchorChildren = [...el.children].every((child) => child.tagName === 'A');
    return onlyAnchorChildren && el.textContent && el.textContent.trim().startsWith(text);
  });

  if (!match) return null;
  return getFieldWrapper(form, match) || match;
}

export function resolveWrapper(form, name) {
  const hint = FIELD_TEXT_HINTS_MAP.get(name);

  return getWrapperByName(form, name) || getWrapperByText(form, hint);
}

/* ---------------------------------------------------------------------
 * Markdown link parsing
 * ------------------------------------------------------------------- */
const MARKDOWN_LINK = /\[([^\]]{1,300})\]\(([^)]{1,2000})\)/g;

export function linkifyMarkdownLinks(form) {
  const walker = document.createTreeWalker(form, NodeFilter.SHOW_TEXT);
  const targets = [];


  let node = walker.nextNode();
  while (node) {
    MARKDOWN_LINK.lastIndex = 0;
    if (MARKDOWN_LINK.test(node.textContent)) targets.push(node);
    node = walker.nextNode();
  }

  targets.forEach((textNode) => {
    const fragment = document.createDocumentFragment();
    let lastIndex = 0;

    MARKDOWN_LINK.lastIndex = 0;
    let match = MARKDOWN_LINK.exec(textNode.textContent);
    while (match !== null) {
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
      match = MARKDOWN_LINK.exec(textNode.textContent);
    }

    if (lastIndex < textNode.textContent.length) {
      fragment.append(document.createTextNode(textNode.textContent.slice(lastIndex)));
    }

    textNode.replaceWith(fragment);
  });
}
