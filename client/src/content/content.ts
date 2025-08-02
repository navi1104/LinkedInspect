function extractLinkedInProfile() {
  const nameEl = document.querySelector('[data-testid="hero-name"]') as HTMLElement;
  const headlineEl = document.querySelector('[data-testid="hero-headline"]') as HTMLElement;

  // About section: try both expanded and collapsed views
  const aboutEl = document.querySelector('section.summary div.inline-show-more-text span[aria-hidden="false"]') as HTMLElement;

  // Skills section: after scrolling down or clicking "Show all skills"
  const skillEls = Array.from(document.querySelectorAll('.pvs-list__paged-list-item span[aria-hidden="true"]'));

  const skills = skillEls.map((el) => el.textContent?.trim()).filter(Boolean);

  const profile = {
    name: nameEl?.innerText.trim() || '',
    headline: headlineEl?.innerText.trim() || '',
    about: aboutEl?.innerText.trim() || '',
    experiences: [], // we'll handle this next
    skills
  };

  return profile;
}


// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'EXTRACT_PROFILE') {
    const profileData = extractLinkedInProfile();
    sendResponse({ profileData });
  }
});
