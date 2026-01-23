import { useMemo, useState } from 'react';
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
  const [profile, setProfile] = useState<UserProfile>(initialProfile);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleNumberChange = (field: keyof UserProfile) => (event: ChangeEvent<HTMLInputElement>) => {
    const numericValue = Number(event.target.value);
    setSaveMessage(null);
    setProfile((prev) => ({ ...prev, [field]: Number.isNaN(numericValue) ? 0 : numericValue }));
  };

  const handlePriorityChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setSaveMessage(null);
    setProfile((prev) => ({ ...prev, priorityMode: event.target.value as PriorityMode }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    localStorage.setItem('userProfile', JSON.stringify(profile));
    setSaveMessage('Profile saved locally (no backend connected).');
    // Replace with API call once backend is available
    console.log('Profile submitted', profile);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete your profile? This action cannot be undone.')) {
      localStorage.removeItem('userProfile');
      setProfile(initialProfile);
      setSaveMessage('Profile deleted successfully.');
      setTimeout(() => {
        navigate('/');
      }, 1500);
    }
  };

  const budgetPerMonth = useMemo(() => {
    if (!profile.budget) return 0;
    return Math.round(profile.budget / 12);
  }, [profile.budget]);

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
          />
          <small>Approx. ${budgetPerMonth} per month assuming 12 months.</small>
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
          />
        </div>

        <div>
          <label htmlFor="priorityMode">Priority Mode</label>
          <select id="priorityMode" name="priorityMode" value={profile.priorityMode} onChange={handlePriorityChange}>
            {priorityModes.map((mode) => (
              <option key={mode} value={mode}>
                {mode}
              </option>
            ))}
          </select>
        </div>

        <button type="submit">Save Profile</button>
      </form>

      {saveMessage ? <p>{saveMessage}</p> : null}

      <div>
        <button type="button" onClick={handleDelete}>Delete Profile</button>
      </div>

      <div>
        <h3>Profile preview</h3>
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
