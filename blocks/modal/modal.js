import { loadFragment } from '../fragment/fragment.js';
import {
  buildBlock, decorateBlock, loadBlock, loadCSS,
} from '../../scripts/aem.js';

/*
  This is not a traditional block, so there is no decorate function.
  Instead, links to a /modals/ path are automatically transformed into a modal.
  Other blocks can also use the createModal() and openModal() functions.
*/

/*
  A gate remembers the visitor's choice for the current browser session, matching
  the source site's cookies (session cookies, cleared when the browser closes):
  - `showModal=1` marks the gate as answered so it does not reappear this session
  - `clickedButton=hcp|patient|lundbeck` records which audience was chosen, which
    downstream pages use to redirect. The value is derived from the option's href
    (DA strips authored id/class attributes, so we cannot rely on them).
  Reloads and navigation within the session skip the gate; a new session shows it.
*/
const GATE_DISMISS_COOKIE = 'showModal';
const GATE_CHOICE_COOKIE = 'clickedButton';

function isGateDismissed() {
  return document.cookie.split('; ').some((c) => c === `${GATE_DISMISS_COOKIE}=1`);
}

function gateChoiceFromHref(href) {
  if (/\/patient\//.test(href)) return 'patient';
  if (/lundbeck\.com/.test(href)) return 'lundbeck';
  if (/\/hcp\//.test(href)) return 'hcp';
  return '';
}

function dismissGate(choice) {
  document.cookie = `${GATE_DISMISS_COOKIE}=1; path=/; SameSite=Lax; Secure`;
  if (choice) document.cookie = `${GATE_CHOICE_COOKIE}=${choice}; path=/; SameSite=Lax; Secure`;
}

/*
  Enhances a gate modal (e.g. the entrance interstitial) so its styling does not
  depend on authored classes/spans, which Document Authoring strips on publish:
  - tags the paragraph that holds the logo + title so CSS can lay it out as a header
  - splits each option button into a bold label + lighter sub-text line, using the
    link's `title` (the short label) to find where the descriptive text begins
*/
function decorateGateContent(root) {
  const header = [...root.querySelectorAll('p')].find((p) => p.querySelector('picture'));
  if (header) header.classList.add('gate-header');

  root.querySelectorAll('a.button').forEach((link) => {
    const label = link.getAttribute('title');
    const text = link.textContent;
    if (label && text.startsWith(label) && text.length > label.length) {
      link.textContent = label;
      const sub = document.createElement('span');
      sub.textContent = text.slice(label.length);
      link.append(sub);
      link.classList.add('has-subtext');
    }
  });
}

export async function createModal(contentNodes, { staticBackdrop = false, gate = false } = {}) {
  await loadCSS(`${window.hlx.codeBasePath}/blocks/modal/modal.css`);
  const dialog = document.createElement('dialog');
  if (staticBackdrop) dialog.classList.add('modal-static-backdrop');
  const dialogContent = document.createElement('div');
  dialogContent.classList.add('modal-content');
  dialogContent.append(...contentNodes);
  if (staticBackdrop) decorateGateContent(dialogContent);
  dialog.append(dialogContent);

  // remember the visitor's choice for this session so the gate does not reappear
  if (gate) {
    dialogContent.querySelectorAll('a.button').forEach((link) => {
      link.addEventListener('click', () => {
        dismissGate(gateChoiceFromHref(link.getAttribute('href') || ''));
        dialog.close();
      });
    });
  }

  // a static-backdrop modal is a gate (e.g. entrance interstitial): no close button
  if (!staticBackdrop) {
    const closeButton = document.createElement('button');
    closeButton.classList.add('close-button');
    closeButton.setAttribute('aria-label', 'Close');
    closeButton.type = 'button';
    const closeIcon = document.createElement('span');
    closeIcon.className = 'icon icon-close';
    closeButton.appendChild(closeIcon);
    closeButton.addEventListener('click', () => dialog.close());
    dialog.prepend(closeButton);
  }

  const block = buildBlock('modal', '');
  document.querySelector('main').append(block);
  decorateBlock(block);
  await loadBlock(block);

  // click outside the dialog: close, or "bounce" when the backdrop is static
  dialog.addEventListener('click', (e) => {
    const {
      left, right, top, bottom,
    } = dialog.getBoundingClientRect();
    const { clientX, clientY } = e;
    if (clientX < left || clientX > right || clientY < top || clientY > bottom) {
      if (staticBackdrop) {
        dialog.classList.remove('bounce');
        // force reflow so the animation can retrigger on repeated clicks
        dialog.getBoundingClientRect();
        dialog.classList.add('bounce');
      } else {
        dialog.close();
      }
    }
  });

  if (staticBackdrop) {
    dialog.addEventListener('animationend', () => dialog.classList.remove('bounce'));
    // prevent Escape from dismissing a static-backdrop modal
    dialog.addEventListener('cancel', (e) => e.preventDefault());
  }

  dialog.addEventListener('close', () => {
    document.body.classList.remove('modal-open');
    block.remove();
  });

  block.innerHTML = '';
  block.append(dialog);

  return {
    block,
    showModal: () => {
      dialog.showModal();
      // reset scroll position
      setTimeout(() => { dialogContent.scrollTop = 0; }, 0);
      document.body.classList.add('modal-open');
    },
  };
}

export async function openModal(fragmentUrl, options = {}) {
  const path = fragmentUrl.startsWith('http')
    ? new URL(fragmentUrl, window.location).pathname
    : fragmentUrl;

  // a remembered gate choice suppresses the modal for the rest of the session
  if (options.gate && isGateDismissed()) return;

  const fragment = await loadFragment(path);
  const { showModal } = await createModal(fragment.childNodes, options);
  showModal();
}
