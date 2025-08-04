function scrollToBottom(callback: () => void) {
  let totalHeight = 0;
  const distance = 100;
  const timer = setInterval(() => {
    const scrollHeight = document.body.scrollHeight;
    window.scrollBy(0, distance);
    totalHeight += distance;

    if (totalHeight >= scrollHeight - window.innerHeight) {
      clearInterval(timer);
      setTimeout(callback, 2000); // Wait for lazy-loaded sections
    }
  }, 100);
}

function extractLinkedInProfile() {
  scrollToBottom(()=>{})
  // const nameEl = document.querySelector('h1.text-heading-xlarge') as HTMLElement;
  const headlineEl = document.querySelector('div.text-body-medium.break-words') as HTMLElement;

  // ----------- About Section ------------
const aboutFallback = document.querySelector(
  'div.inline-show-more-text--is-collapsed span[aria-hidden="true"]'
) as HTMLElement | null;

const about = aboutFallback ? aboutFallback.innerText.trim() : '';


  // ----------- Experience Section ------------
  const experienceSection = Array.from(document.querySelectorAll('section')).find(
    (sec) => sec.innerText.toLowerCase().includes('experience')
  );
  const experienceItems = experienceSection?.querySelectorAll('li') ?? [];

  const experiences: { title: string; company: string; date: string; description: string }[] = [];
  experienceItems.forEach((item) => {
    const title = item.querySelector('span[aria-hidden="true"]')?.textContent?.trim() ?? '';
    const company = item.querySelector('span.t-14.t-normal')?.textContent?.trim() ?? '';
    const date = item.querySelector('.t-14.t-normal.t-black--light')?.textContent?.trim() ?? '';

    let description = '';
    const descEl = item.querySelectorAll('span.visually-hidden');
    if (descEl.length > 1) {
      description = descEl[descEl.length - 1].textContent?.trim() ?? '';
    }

    if (title && company) {
      experiences.push({ title, company, date, description });
    }
  });

  // ----------- Skills Section ------------
const skillElements = document.querySelectorAll(
  'section.pvs-list__outer-container a[href*="/skills/"] span[aria-hidden="true"]'
);

const skills = Array.from(skillElements).map((el) => (el as HTMLElement).innerText.trim());

   // ----------- Certifications Section ------------
 const certificationElements = document.querySelectorAll('#certifications .pvs-list > li');

const certifications = Array.from(certificationElements).map((el) => {
  const spans = el.querySelectorAll('span');
  const issuer = (spans[1] as HTMLElement)?.innerText.trim() || '';
  const title = (el.querySelector('span[aria-hidden="true"]') as HTMLElement)?.innerText.trim() || '';
  const dateMatch = ((el as HTMLElement).innerText.match(/Issued.*?\d{4}/g) || [])[0]?.replace("Issued", "").trim() || '';
  return { title,issuer, date: dateMatch };
});

  // ----------- Final Profile Object ------------
  const profile = {
    // name: nameEl?.innerText?.trim() ?? '',
    headline: headlineEl?.innerText?.trim() ?? '',
    about,
    skills,
    experiences,
       certifications,
  };

  console.log('✅ Profile Extracted:', profile);
  return profile;
}

// Listener
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'EXTRACT_PROFILE') {
    const profileData = extractLinkedInProfile();
    sendResponse({ profileData });
  }
});