import { useState } from 'react';
import './Popup.css';

interface Experience {
  title: string;
  company: string;
  duration: string;
  description: string;
}

interface Certification {
  title: string;
  issuer: string;
  date: string;
}

interface ProfileData {
  name: string;
  headline: string;
  about: string;
  skills: string[];
  experiences: Experience[];
  certifications: Certification[];
}

function Popup() {
  const [jobDesc, setJobDesc] = useState<string>('');
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [error, setError] = useState<string>('');

  const handleEvaluate = () => {
    if (!jobDesc.trim()) {
      setError('Please enter a job description.');
      return;
    }

    setError('');
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(
          tabs[0].id,
          { type: 'EXTRACT_PROFILE' },
          (response) => {
            if (chrome.runtime.lastError || !response?.profileData) {
              setError("Couldn't access the LinkedIn page. Are you on a profile?");
              return;
            }
            setProfile(response.profileData);
          }
        );
      }
    });
  };

  return (
    <div className="popup-container">
      <h2>LinkedIn Evaluator</h2>

      <textarea
        placeholder="Paste job description here..."
        value={jobDesc}
        onChange={(e) => setJobDesc(e.target.value)}
      />

      <button onClick={handleEvaluate}>Evaluate Profile</button>

      {error && <p className="error">{error}</p>}

      {profile && (
        <div className="profile-summary">
          <h4>Profile Summary:</h4>
          <p><strong>Name:</strong> {profile.name}</p>
          <p><strong>Headline:</strong> {profile.headline}</p>
          <p><strong>About:</strong> {profile.about}</p>

          <p><strong>Skills:</strong> {profile.skills.join(', ')}</p>

          <h4>Experiences:</h4>
          {profile.experiences.length > 0 ? (
            <ul>
              {profile.experiences.map((exp, index) => (
                <li key={index}>
                  <strong>{exp.title}</strong> at <em>{exp.company}</em><br />
                  <small>{exp.duration}</small>
                  <p>{exp.description}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p>No experience data found.</p>
          )}

          <h4>Certifications:</h4>
          {profile.certifications.length > 0 ? (
            <ul>
              {profile.certifications.map((cert, index) => (
                <li key={index}>
                  <strong>{cert.title}</strong>
                  {cert.issuer && ` — ${cert.issuer}`}<br />
                  {cert.date && <small>Issued {cert.date}</small>}
                </li>
              ))}
            </ul>
          ) : (
            <p>No certifications found.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default Popup;
