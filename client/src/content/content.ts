// // function extractLinkedInProfile() {
// //   // Try generic selectors with fallbacks
// //   const nameEl = document.querySelector('.text-heading-xlarge') as HTMLElement;
// //   const headlineEl = document.querySelector('.text-body-medium.break-words') as HTMLElement;

// //   // About section - works when expanded
// //   const aboutEl = document.querySelector('section.pv-about-section span.visually-hidden') as HTMLElement 
// //                || document.querySelector('section.pv-about-section p') as HTMLElement;

// //   // Skills - fallback to visible span elements under skills section
// //   const skillEls = Array.from(document.querySelectorAll('.pvs-list__paged-list-item span.visually-hidden'));

// //   const skills = skillEls.map((el) => el.textContent?.trim()).filter(Boolean);

// //   const profile = {
// //     name: nameEl?.innerText.trim() || '',
// //     headline: headlineEl?.innerText.trim() || '',
// //     about: aboutEl?.innerText.trim() || '',
// //     experiences: [], // Future: handle this too
// //     skills
// //   };

// //   return profile;
// // }

// function scrollToBottom(callback: () => void) {
//   let totalHeight = 0;
//   const distance = 100;
//   const timer = setInterval(() => {
//     const scrollHeight = document.body.scrollHeight;
//     window.scrollBy(0, distance);
//     totalHeight += distance;

//     if (totalHeight >= scrollHeight - window.innerHeight) {
//       clearInterval(timer);
//       setTimeout(callback, 2000); // Wait extra to let lazy sections load
//     }
//   }, 100);
// }

// function extractLinkedInProfile() {

//   // Scroll to load everything first
// scrollToBottom(() => {
//   // const profile = extractLinkedInProfile();
//   // chrome.runtime.sendMessage({ action: 'profileData', data: profile });
// });
//   const nameEl = document.querySelector('h1.text-heading-xlarge, h1.top-card-layout__title') as HTMLElement;

//   const headlineEl = document.querySelector('div.text-body-medium.break-words') as HTMLElement;

//   const aboutSection = Array.from(document.querySelectorAll('section')).find(
//     sec => sec.innerText.toLowerCase().includes('about')
//   );
// const aboutEl = aboutSection?.querySelector('div.inline-show-more-text span:not([aria-hidden="true"])') as HTMLElement 
//               ?? aboutSection?.querySelector('span[dir="ltr"]') as HTMLElement;

//  const experienceSection = Array.from(document.querySelectorAll('section')).find(
//     sec => sec.innerText.toLowerCase().includes('experience')
//   );
//   const experienceItems = experienceSection?.querySelectorAll('li') ?? [];

//   const experiences: { title: string; company: string; date: string; description: string }[] = [];
//   experienceItems.forEach(item => {
//     const title = item.querySelector('span[aria-hidden="true"]')?.textContent?.trim() ?? '';
//     const company = item.querySelector('span.t-14.t-normal')?.textContent?.trim() ?? '';
//     const date = item.querySelector('.t-14.t-normal.t-black--light')?.textContent?.trim() ?? '';

//     // Get description
//     let description = '';
//     const descEl = item.querySelectorAll('span.visually-hidden');
//     if (descEl.length > 1) {
//       // Heuristic: last one is usually the description
//       description = descEl[descEl.length - 1].textContent?.trim() ?? '';
//     }

//     if (title && company) {
//       experiences.push({ title, company, date, description });
//     }
//   });

//   const skillSection = Array.from(document.querySelectorAll('section')).find(
//     sec => sec.innerText.toLowerCase().includes('skills')
//   );
//   const skillItems = skillSection?.querySelectorAll('span.visually-hidden') ?? [];

//   const skills: string[] = [];
//   skillItems.forEach(item => {
//     const text = item.textContent?.trim();
//     if (text && !skills.includes(text)) skills.push(text);
//   });

//   const profile = {
//     name: nameEl?.innerText?.trim() ?? '',
//     headline: headlineEl?.innerText?.trim() ?? '',
//     about: aboutEl?.innerText?.trim() ?? '',
//     skills,
//     experiences
//   };

//   console.log('✅ Profile Extracted:', profile);
//   return profile;
// }






// // Listen for messages from popup
// chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
//   if (message.type === 'EXTRACT_PROFILE') {
//     const profileData = extractLinkedInProfile();
//     sendResponse({ profileData });
//   }
// });
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
  const nameEl = document.querySelector('h1.text-heading-xlarge') as HTMLElement;
  const headlineEl = document.querySelector('div.text-body-medium.break-words') as HTMLElement;

  // ----------- About Section ------------
 
  let about = '';
  const aboutSection = Array.from(document.querySelectorAll('section')).find((sec) =>
    sec.innerText.toLowerCase().includes('about')
  );

  if (aboutSection) {
    const spanEls = aboutSection.querySelectorAll('span');
    for (const span of spanEls) {
      if (span.getAttribute('aria-hidden') === 'false' || span.getAttribute('dir') === 'ltr') {
        about = span.textContent?.trim() ?? '';
        break;
      }
    }
  }
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
  const skillSection = Array.from(document.querySelectorAll('section')).find((sec) =>
    sec.innerText.toLowerCase().includes('skills')
  );
  const skillItems = skillSection?.querySelectorAll('span.visually-hidden') ?? [];

  const skills: string[] = [];
  skillItems.forEach((item) => {
    const text = item.textContent?.trim();
    if (text && !skills.includes(text)) skills.push(text);
  });

  // ----------- Final Profile Object ------------
  const profile = {
    name: nameEl?.innerText?.trim() ?? '',
    headline: headlineEl?.innerText?.trim() ?? '',
    about,
    skills,
    experiences,
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

