/* medical-inquiry-thank-you */

export default function decorate(block) {
  const rows = [...block.children];
  if (rows.length === 0) return;

  const cols = [...rows[0].children];
  const [imageCol, textCol] = cols;

  const img = imageCol?.querySelector('img');
  const link = textCol?.querySelector('a');

  // Every text-bearing element in the text column that isn't the link

  const textEls = textCol
    ? [...textCol.children].filter((el) => el.tagName !== 'A' && el.textContent.trim())
    : [];

  const headingText = textEls[0]?.textContent.trim() || '';
  const subheadingText = textEls[1]?.textContent.trim() || '';

  const wrapper = document.createElement('div');
  wrapper.className = 'thank-you-content';

  const iconWrap = document.createElement('div');
  iconWrap.className = 'thank-you-icon';
  if (img) {
    img.removeAttribute('width');
    img.removeAttribute('height');
    iconWrap.append(img);
  }

  const heading = document.createElement('h1');
  heading.className = 'thank-you-heading';
  heading.textContent = headingText;

  const subheading = document.createElement('h2');
  subheading.className = 'thank-you-subheading';
  subheading.textContent = subheadingText;

  wrapper.append(iconWrap, heading, subheading);

  if (link) {
    link.className = 'thank-you-button';
    wrapper.append(link);
  }

  block.textContent = '';
  block.append(wrapper);
}
