
import React, { useEffect, useState } from "react";
import type{
  ProfileData,
  BackgroundRequest,
  BackgroundResponse,
  Experience,
  Certification,
} from "./types";
import "./Popup.css";

const Popup: React.FC = () => {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [status, setStatus] = useState<string>("");

  useEffect(() => {
    chrome.storage.local.get("linkedinProfileData", (result) => {
      if (result?.linkedinProfileData) {
        setProfile(result.linkedinProfileData as ProfileData);
      }
    });
  }, []);

  const handleExtractClick = () => {
    setStatus("Extracting profile...");
    const request: BackgroundRequest = { type: "EXTRACT_FULL_PROFILE" };

    chrome.runtime.sendMessage(
      request,
      (response: BackgroundResponse | undefined) => {
        if (!response) {
          setStatus("No response from background script.");
          return;
        }
        if (response.error) {
          setStatus(`Error: ${response.error}`);
          return;
        }
        if (response.profileData) {
          setProfile(response.profileData);
          setStatus("Profile extraction complete.");
        } else {
          setStatus("Extraction finished, no data found.");
        }
      }
    );
  };

  return (
    <div className="popup-container">
      <h2 className="popup-title">LinkedInSpect</h2>

      <div className="popup-actions">
        <button onClick={handleExtractClick} className="popup-button">
          Extract Profile
        </button>
        {status && <span className="popup-status">{status}</span>}
      </div>

      {profile ? (
        <div className="popup-content">
          <Section title="Headline">{profile.headline}</Section>
          <Section title="About">{profile.about}</Section>
           <Section title="Skills">
            <ul>
              {profile.skills.map((skill: string, idx: number) => (
                <li key={idx}>{skill}</li>
              ))}
            </ul>
          </Section>
          <Section title="Experience">
            <ul>
              {profile.experience.map((exp: Experience, idx: React.Key | null | undefined) => (
                <li key={idx}>
                  <strong>{exp.title}</strong> — {exp.company}
                  <div className="date">{exp.date}</div>
                </li>
              ))}
            </ul>
          </Section>
          <Section title="Certifications">
            <ul>
              {profile.certifications.map((cert: Certification, idx: React.Key | null | undefined) => (
                <li key={idx}>
                  {cert.title} — {cert.issuer}{" "}
                  <span className="date">{cert.date}</span>
                </li>
              ))}
            </ul>
          </Section>
        </div>
      ) : (
        <p className="popup-empty">No profile data yet.</p>
      )}
    </div>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <div className="section">
    <h3>{title}</h3>
    <div className="section-content">{children}</div>
  </div>
);

export default Popup;

