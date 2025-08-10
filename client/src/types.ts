export type Section = 'experience' | 'skills' | 'certifications';

export type ScrapeMessageType =
  | 'SCRAPE_BASE'
  | 'SCRAPE_EXPERIENCE'
  | 'SCRAPE_SKILLS'
  | 'SCRAPE_CERTIFICATIONS'
  | 'EXTRACT_FULL_PROFILE';

export interface Experience {
  title: string;
  company: string;
  date: string;
  description: string;
}

export interface Certification {
  title: string;
  issuer: string;
  date: string;
}

export interface ProfileData {
  headline: string;
  about: string;
  skills: string[];
  experience: Experience[];
  certifications: Certification[];
}

/** Message payloads sent *to* content script */
export type ContentRequest =
  | { type: 'SCRAPE_BASE' }
  | { type: 'SCRAPE_EXPERIENCE' }
  | { type: 'SCRAPE_SKILLS' }
  | { type: 'SCRAPE_CERTIFICATIONS' };

/** Response payloads *from* content script */
export type ContentResponse =
  | { data: { headline: string; about: string } }
  | { data: string[] } // skills
  | { data: Experience[] } // experience
  | { data: Certification[] }; // certifications

/** Background <-> popup message for extracting full profile */
export type BackgroundRequest = { type: 'EXTRACT_FULL_PROFILE' };
export type BackgroundResponse = { profileData?: ProfileData; error?: string };
