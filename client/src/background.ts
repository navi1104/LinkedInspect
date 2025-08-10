
import type{
  // Section,
  BackgroundRequest,
  BackgroundResponse,
  ProfileData,
  ContentRequest,
  ContentResponse,
  Experience,
  Certification
} from './types';

/** Helper: wrap chrome.tabs.query into a typed Promise */
function queryActiveTab(): Promise<chrome.tabs.Tab | undefined> {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      resolve(tabs[0]);
    });
  });
}

/** Helper: typed sendMessage to tab */
function sendMessageToTab<Req extends ContentRequest, Res extends ContentResponse>(tabId: number, message: Req): Promise<Res | null> {
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, message, (response: Res | undefined) => {
      // response may be undefined if content script not present
      resolve(response ?? null);
    });
  });
}

/** Wait for the tab to report status 'complete' (best-effort) */
function waitForTabComplete(tabId: number, timeoutMs = 20000): Promise<void> {
  return new Promise((resolve) => {
    const start = Date.now();

    const listener: Parameters<typeof chrome.tabs.onUpdated.addListener>[0] =
      (updatedTabId, changeInfo) => {
        if (updatedTabId !== tabId) return;

        if (changeInfo.status === 'complete') {
          chrome.tabs.onUpdated.removeListener(listener);
          resolve();
        } else if (Date.now() - start > timeoutMs) {
          chrome.tabs.onUpdated.removeListener(listener);
          resolve();
        }
      };

    chrome.tabs.onUpdated.addListener(listener);
  });
}


/** navigate and scrape a details section */
type Section = 'experience' | 'skills' | 'certifications';

async function openAndScrapeSection<T extends string | Experience | Certification>(
  tabId: number,
  baseUrl: string,
  section: Section
): Promise<T[]> {
  const sectionUrl = `${baseUrl}/details/${section}`;
  try {
    // Navigate to the section page
    await new Promise<void>((res) =>
      chrome.tabs.update(tabId, { url: sectionUrl }, () => res())
    );

    // Wait for tab to finish loading
    await waitForTabComplete(tabId, 20000);

    // Small wait for content script to initialize
    await new Promise((r) => setTimeout(r, 700));

    // Send typed message to content script
    const resp = await sendMessageToTab<ContentRequest, ContentResponse>(
      tabId,
      { type: `SCRAPE_${section.toUpperCase()}` as ContentRequest['type'] }
    );

    if (!resp) return [];

    // Type narrowing by section
    if (section === 'skills') {
      return (resp.data as string[]) as T[];
    }
    if (section === 'experience') {
      return (resp.data as Experience[]) as T[];
    }
    return (resp.data as Certification[]) as T[];
  } catch {
    return [];
  }
}


/** Background message listener */
chrome.runtime.onMessage.addListener((message: BackgroundRequest, sender, sendResponse: (resp: BackgroundResponse) => void) => {
  if (message.type !== 'EXTRACT_FULL_PROFILE') return;

  (async () => {
    const activeTab = await queryActiveTab();
    if (!activeTab || !activeTab.id || !activeTab.url) {
      sendResponse({ error: 'No active LinkedIn profile tab.' });
      return;
    }

    const match = activeTab.url.match(/^https:\/\/www\.linkedin\.com\/in\/[^/]+/);

    const baseUrl = match ? match[0] : null;
    if (!baseUrl) {
      sendResponse({ error: 'Not a LinkedIn profile URL (must be /in/username).' });
      return;
    }

    const tabId = activeTab.id;
    // scrape base first
    const baseResp = await sendMessageToTab<ContentRequest, ContentResponse>(tabId, { type: 'SCRAPE_BASE' });
    const base = (baseResp && 'data' in baseResp && typeof baseResp.data === 'object' && 'headline' in (baseResp.data as object))
      ? (baseResp.data as { headline: string; about: string })
      : { headline: '', about: '' };

    const profile: ProfileData = {
      headline: base.headline,
      about: base.about,
      skills: [],
      experience: [],
      certifications: []
    };

 const sections: Section[] = ['experience', 'skills', 'certifications'];

for (const sec of sections) {
  if (sec === 'skills') {
    profile.skills = await openAndScrapeSection<string>(tabId, baseUrl, sec);
  } else if (sec === 'experience') {
    profile.experience = await openAndScrapeSection<Experience>(tabId, baseUrl, sec);
  } else if (sec === 'certifications') {
    profile.certifications = await openAndScrapeSection<Certification>(tabId, baseUrl, sec);
  }
}


    // go back to base and refresh base in case lazy content loaded
    await new Promise<void>((res) => chrome.tabs.update(tabId, { url: baseUrl }, () => res()));
    await waitForTabComplete(tabId, 10000);
    await new Promise((r) => setTimeout(r, 600));
    const freshBaseResp = await sendMessageToTab<ContentRequest, ContentResponse>(tabId, { type: 'SCRAPE_BASE' });
    if (freshBaseResp && 'data' in freshBaseResp && typeof freshBaseResp.data === 'object' && 'headline' in (freshBaseResp.data as object)) {
      const fresh = freshBaseResp.data as { headline: string; about: string };
      profile.headline = fresh.headline || profile.headline;
      profile.about = fresh.about || profile.about;
    }

    chrome.storage.local.set({ linkedinProfileData: profile }, () => {
      sendResponse({ profileData: profile });
    });
  })();

  return true; // indicates async response
});

