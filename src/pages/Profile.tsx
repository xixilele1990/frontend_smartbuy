import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { ChangeEvent, FormEvent } from 'react';
import type { PriorityMode, UserProfile } from '../types';

const priorityModes: PriorityMode[] = ['Balanced', 'Budget Driven', 'Safety First', 'Education First'];

const initialProfile: UserProfile = {
  budget: 450000,
  targetBedrooms: 3,
  targetBathrooms: 2,
  hasSchoolNeed: false,
  priorityMode: 'Balanced'
};

function Profile() {
  const savedProfileString = localStorage.getItem('userProfile');
  const savedProfile: UserProfile | null = savedProfileString ? JSON.parse(savedProfileString) : null;
  const [profile, setProfile] = useState<UserProfile>(savedProfile ?? initialProfile);
  const [isExampleData, setIsExampleData] = useState<boolean>(!savedProfile);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleNumberChange = (field: keyof UserProfile) => (event: ChangeEvent<HTMLInputElement>) => {
    const inputValue = event.target.value;
    setErrorMessage(null);
    setSaveMessage(null);
    
    if (inputValue === '') {
      setProfile((prev) => ({ ...prev, [field]: 0 }));
      return;
    }
    
    // Convert string to number, automatically handles leading zeros (e.g., "02000" → 2000)
    const numericValue = Number(inputValue);
    if (Number.isNaN(numericValue) || numericValue < 0) {
      setProfile((prev) => ({ ...prev, [field]: 0 }));
    } else {
      setProfile((prev) => ({ ...prev, [field]: numericValue }));
    }
  };

  const handlePriorityChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setErrorMessage(null);
    setSaveMessage(null);
    setProfile((prev) => ({ ...prev, priorityMode: event.target.value as PriorityMode }));
  };

  const validateForm = (): boolean => {
    if (!profile.priorityMode || !priorityModes.includes(profile.priorityMode)) {
      setErrorMessage('Please select a valid Priority Mode.');
      return false;
    }
    
    if (profile.budget < 0) {
      setErrorMessage('Budget cannot be negative.');
      return false;
    }
    
    if (profile.targetBedrooms < 0) {
      setErrorMessage('Target Bedrooms cannot be negative.');
      return false;
    }
    
    if (profile.targetBathrooms < 0) {
      setErrorMessage('Target Bathrooms cannot be negative.');
      return false;
    }
    
    if (profile.budget === 0 && profile.targetBedrooms === 0 && profile.targetBathrooms === 0) {
      setErrorMessage('Please fill in at least some profile information.');
      return false;
    }
    
    return true;
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    
    if (!validateForm()) {
      return;
    }
    
    localStorage.setItem('userProfile', JSON.stringify(profile));
    setIsExampleData(false);
    setSaveMessage('Profile saved locally (no backend connected).');
    // Replace with API call once backend is available
    console.log('Profile submitted', profile);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete your profile? This action cannot be undone.')) {
      localStorage.removeItem('userProfile');
      setProfile(initialProfile);
      setIsExampleData(true);
      setSaveMessage('Profile deleted successfully.');
      setTimeout(() => {
        navigate('/');
      }, 1500);
    }
  };

  return (
    <div>
      <div>
        <Link to="/">
          <button type="button">← Back to Dashboard</button>
        </Link>
      </div>

      <h1>Buyer Profile</h1>
      <p>Configure your home buying preferences. Data stays in memory until an API is added.</p>

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="budget">Max Home Budget ($)</label>
          <input
            id="budget"
            name="budget"
            type="number"
            min={0}
            step={1000}
            value={profile.budget}
            onChange={handleNumberChange('budget')}
            required
          />
        </div>

        <div>
          <label htmlFor="targetBedrooms">Target Bedrooms</label>
          <input
            id="targetBedrooms"
            name="targetBedrooms"
            type="number"
            min={0}
            step={1}
            value={profile.targetBedrooms}
            onChange={handleNumberChange('targetBedrooms')}
            placeholder="e.g. 3"
            required
          />
        </div>

        <div>
          <label htmlFor="targetBathrooms">Target Bathrooms</label>
          <input
            id="targetBathrooms"
            name="targetBathrooms"
            type="number"
            min={0}
            step={0.5}
            value={profile.targetBathrooms}
            onChange={handleNumberChange('targetBathrooms')}
            placeholder="e.g. 2"
            required
          />
        </div>

        <div>
          <label htmlFor="priorityMode">Priority Mode</label>
          <select id="priorityMode" name="priorityMode" value={profile.priorityMode} onChange={handlePriorityChange} required>
            {priorityModes.map((mode) => (
              <option key={mode} value={mode}>
                {mode}
              </option>
            ))}
          </select>
        </div>

        {errorMessage ? <p style={{ color: 'red' }}>{errorMessage}</p> : null}
        <button type="submit">Save Profile</button>
      </form>

      {saveMessage ? <p>{saveMessage}</p> : null}

      <div>
        <button type="button" onClick={handleDelete}>Delete Profile</button>
      </div>

      <div>
        <h3>Profile preview</h3>
        {isExampleData ? <p><em>Example data</em></p> : null}
        <ul>
          <li>Budget: ${profile.budget.toLocaleString('en-US')}</li>
          <li>
            Beds/Baths: {profile.targetBedrooms} / {profile.targetBathrooms}
          </li>
          <li>Priority: {profile.priorityMode}</li>
        </ul>
      </div>
    </div>
  );
}

export default Profile;
