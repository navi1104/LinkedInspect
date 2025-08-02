import { useState } from 'react';
import './Popup.css';

function Popup() {
  const [jobDesc, setJobDesc] = useState('');
  const [profile, setProfile] = useState<any>(null);
  const [error, setError] = useState('');

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
            if (chrome.runtime.lastError) {
              setError("Couldn't access the LinkedIn page. Are you on a profile?");
              return;
            }
           
            setProfile(response?.profileData);
             console.log(profile);
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
          <p><strong>Name:</strong> <pre>{JSON.stringify(profile, null, 2)}</pre></p>
          <p><strong>Headline:</strong> {profile.name}</p>
          <p><strong>About:</strong> {profile.about}</p>
          <p><strong>Skills:</strong> {profile.skills?.join(', ')}</p>
        </div>
      )}
    </div>
  );
}

export default Popup;
