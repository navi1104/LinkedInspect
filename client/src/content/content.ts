import type{
  ContentRequest,
  ContentResponse,
  Experience,
  Certification
} from '../types';

function scrollToBottom(callback: () => void) {
  let total = 0;
  const distance = 200;
  const timer = window.setInterval(() => {
    const scrollHeight = document.body.scrollHeight;
    window.scrollBy(0, distance);
    total += distance;
    if (total >= scrollHeight - window.innerHeight) {
      window.clearInterval(timer);
      // wait a bit for lazy content
      setTimeout(callback, 1200);
    }
  }, 120);
}

function scrapeBase(): { headline: string; about: string } {
  const headlineEl =
    document.querySelector('div.text-body-medium.break-words') ??
    document.querySelector('.pv-top-card--list .text-body-medium');
  const headline = (headlineEl as HTMLElement | null)?.innerText?.trim() ?? '';

  // About / summary variations
const aboutFallback = document.querySelector(
  'div.inline-show-more-text--is-collapsed span[aria-hidden="true"]'
) as HTMLElement | null;
const about = aboutFallback ? aboutFallback.innerText.trim() : '';

  return { headline, about };
}

function scrapeExperience(): Experience[] {
  const experiences: Experience[] = [];

  document.querySelectorAll('[data-view-name="profile-component-entity"], .pvs-list__item--with-top-padding').forEach(card => {
    const title = card.querySelector('.t-bold span[aria-hidden="true"]')?.textContent?.trim() || '';
    const company = card.querySelector('.t-14.t-normal span[aria-hidden="true"]')?.textContent?.trim() || '';
    const dateRange = card.querySelector('.t-14.t-normal.t-black--light span[aria-hidden="true"]')?.textContent?.trim() || '';

    // Capture description: any text in sub-components, including bullets and line breaks
    let description = '';
    const descContainer = card.querySelector('.pvs-entity__sub-components');
    if (descContainer) {
      description = Array.from(descContainer.querySelectorAll('span[aria-hidden="true"]'))
        .map(el => el.textContent?.trim() || '')
        .filter(Boolean)
        .join('\n');
    }

    // Fallback: Sometimes description is not in sub-components but nested deeper
    if (!description) {
      description = Array.from(card.querySelectorAll('.t-14.t-normal.t-black span[aria-hidden="true"]'))
        .map(el => el.textContent?.trim() || '')
        .filter(Boolean)
        .join('\n');
    }

    if (title) {
      experiences.push({
        title,
        company,
        date: dateRange,
        description
      });
    }
  });

  console.log('[SCRAPE_EXPERIENCE] Extracted:', experiences);
  return experiences;
}



// Usage:
expandExperienceDescriptions();
setTimeout(() => {
  const data = scrapeExperience();
  console.log(data);
}, 1500);

function expandExperienceDescriptions() {
  document.querySelectorAll('button[aria-label^="see more"], button[aria-label^="Show more"]').forEach(btn => {
    (btn as HTMLElement).click();
  });
}


function scrapeSkills(): string[] {
  const skills: string[] = [];

  document.querySelectorAll<HTMLDivElement>(
    '.display-flex.align-items-center.mr1.hoverable-link-text.t-bold span[aria-hidden="true"]'
  ).forEach((el) => {
    const text = el.textContent?.trim();
    if (text) skills.push(text);
  });

  return skills;
}


function scrapeCertifications(): Certification[] {
  const certs: Certification[] = [];

  // Find each certification block in LinkedIn's new DOM
  document.querySelectorAll('.display-flex.flex-column.full-width').forEach((el) => {
    const title = (el.querySelector('.t-bold span[aria-hidden="true"]') as HTMLElement)?.innerText?.trim() || '';
    const issuer = (el.querySelector('.t-14.t-normal span[aria-hidden="true"]') as HTMLElement)?.innerText?.trim() || '';
    const date = (el.querySelector('.t-14.t-normal.t-black--light span[aria-hidden="true"]') as HTMLElement)?.innerText?.trim() || '';

    if (title) {
      certs.push({ title, issuer, date });
    }
  });

  console.log('[SCRAPE_CERTIFICATIONS] Extracted:', certs);
  return certs;
}





/** strongly typed listener */
chrome.runtime.onMessage.addListener(
  (message: ContentRequest, _sender: chrome.runtime.MessageSender, sendResponse: (resp: ContentResponse) => void) => {
    const type = message.type;
    if (type === 'SCRAPE_BASE') {
      // base is light, small delay to let header render
      setTimeout(() => sendResponse({ data: scrapeBase() }), 400);
      return true;
    }

    // heavier scrapes -> scroll then respond
    if (type === 'SCRAPE_EXPERIENCE' || type === 'SCRAPE_SKILLS' || type === 'SCRAPE_CERTIFICATIONS') {
      scrollToBottom(() => {
        if (type === 'SCRAPE_EXPERIENCE') sendResponse({ data: scrapeExperience() });
        else if (type === 'SCRAPE_SKILLS') sendResponse({ data: scrapeSkills() });
        else sendResponse({ data: scrapeCertifications() });
      });
      return true;
    }

    return false;
  }
);
