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
  The entrance gate records the visitor's audience choice for the current browser
  session (session cookie, cleared when the browser closes):
  - `clickedButton=hcp|patient` records which audience was chosen. The value is
    derived from the option's href (DA strips authored id/class attributes, so we
    cannot rely on them). The external "global" option leaves the site, so it is
    not recorded.
  The gate reappears on a section's page unless the stored choice matches that
  section: choosing HCP suppresses the gate on /hcp/ pages, but a patient (or no)
  choice still shows it there — mirroring the source site.
*/
const GATE_CHOICE_COOKIE = 'clickedButton';

function currentSection() {
  const match = /\/us\/en\/(hcp|patient)\//.exec(window.location.pathname);
  return match ? match[1] : '';
}

function storedChoice() {
  const entry = document.cookie.split('; ').find((c) => c.startsWith(`${GATE_CHOICE_COOKIE}=`));
  return entry ? entry.slice(GATE_CHOICE_COOKIE.length + 1) : '';
}

/* The gate is satisfied only when the visitor's choice matches the page's section. */
function isGateSatisfied() {
  const section = currentSection();
  return !!section && storedChoice() === section;
}

function gateChoiceFromHref(href) {
  if (/\/patient\//.test(href)) return 'patient';
  if (/\/hcp\//.test(href)) return 'hcp';
  return '';
}

function rememberChoice(choice) {
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

  // remember the visitor's audience choice for this session
  if (gate) {
    dialogContent.querySelectorAll('a.button').forEach((link) => {
      link.addEventListener('click', () => {
        rememberChoice(gateChoiceFromHref(link.getAttribute('href') || ''));
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

  // suppress the gate only when the stored choice matches this page's section
  if (options.gate && isGateSatisfied()) return;

  const fragment = await loadFragment(path);
  const { showModal } = await createModal(fragment.childNodes, options);
  showModal();
}
