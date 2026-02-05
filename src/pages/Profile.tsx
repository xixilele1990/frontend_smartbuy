import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ChangeEvent, FormEvent } from 'react';
import type { PriorityMode, UserProfile } from '../types';
import { saveProfile, getProfile, deleteProfile } from '../services/profileService';
import { ApiError } from '../services/api';
import ConfirmDialog from '../components/ConfirmDialog';
import Header from '../components/Header';

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
  const [isExampleData, setIsExampleData] = useState<boolean>(true);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFetching, setIsFetching] = useState<boolean>(true);
  const navigate = useNavigate();

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { }
  });

  // Load profile from API on mount
  useEffect(() => {
    const loadProfile = async () => {
      setIsFetching(true);
      try {
        const data = await getProfile();
        if (data) {
          setProfile(data);
          setIsExampleData(false);
        } else {
          setIsExampleData(true);
        }
      } catch (error) {
        console.error('Failed to load profile:', error);
        setErrorMessage('Failed to load profile from server.');
        setIsExampleData(true);
      } finally {
        setIsFetching(false);
      }
    };

    loadProfile();
  }, []);

  const handleNumberChange = (field: keyof UserProfile) => (event: ChangeEvent<HTMLInputElement>) => {
    const inputValue = event.target.value;
    setErrorMessage(null);
    setSaveMessage(null);

    if (inputValue === '') {
      // Allow empty input
      setProfile((prev) => ({ ...prev, [field]: '' as any }));
      return;
    }

    const numericValue = Number(inputValue);
    if (Number.isNaN(numericValue) || numericValue < 0) {
      setProfile((prev) => ({ ...prev, [field]: '' as any }));
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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setSaveMessage(null);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const savedProfile = await saveProfile(profile);
      setProfile(savedProfile);
      setIsExampleData(false);
      setSaveMessage(' Profile saved successfully.');
      console.log('Profile submitted', savedProfile);
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.errors) {
          const errorMessages = Object.entries(error.errors)
            .map(([field, message]) => `${field}: ${message}`)
            .join(', ');
          setErrorMessage(`Validation failed: ${errorMessages}`);
        } else {
          setErrorMessage(error.message || 'Failed to save profile.');
        }
      } else {
        setErrorMessage('Network error. Please try again.');
      }
      console.error('Failed to save profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Profile',
      message: 'Are you sure you want to delete your profile? This action cannot be undone.',
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false });
        setIsLoading(true);

        try {
          await deleteProfile();
          setProfile(initialProfile);
          setIsExampleData(true);
          setSaveMessage('Profile deleted successfully.');
          setTimeout(() => {
            navigate('/');
          }, 1500);
        } catch (error) {
          if (error instanceof ApiError) {
            setErrorMessage(error.message || 'Failed to delete profile.');
          } else {
            setErrorMessage('Network error. Please try again.');
          }
          console.error('Failed to delete profile:', error);
        } finally {
          setIsLoading(false);
        }
      }
    });
  };

  if (isFetching) {
    return (
      <div>
        <h1>Loading Profile...</h1>
        <p>Please wait while we fetch your data from the server.</p>
      </div>
    );
  }

  return (
    <div>
      <Header />
      <div className="page-content">
        <h1>Buyer Profile</h1>
        <p>Configure your home buying preferences. Data is saved to the server.</p>

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
              disabled={isLoading}
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
              disabled={isLoading}
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
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="priorityMode">Priority Mode</label>
            <select
              id="priorityMode"
              name="priorityMode"
              value={profile.priorityMode}
              onChange={handlePriorityChange}
              required
              disabled={isLoading}
            >
              {priorityModes.map((mode) => (
                <option key={mode} value={mode}>
                  {mode}
                </option>
              ))}
            </select>
          </div>

          {errorMessage ? <p style={{ color: 'red' }}>❌ {errorMessage}</p> : null}
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Profile'}
          </button>
        </form>

        {saveMessage ? <p style={{ color: 'green' }}>{saveMessage}</p> : null}

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0 }}>Profile preview</h3>
            <button className="action-btn-premium" onClick={handleDelete} disabled={isLoading}>
              {isLoading ? 'Deleting...' : 'Delete Profile'}
            </button>
          </div>
          {isExampleData && <p><em>Example data (not saved to server)</em></p>}
          <div className="profile-preview-grid">
            <div className="preview-item">
              <span className="preview-label">Budget</span>
              <span className="preview-value">${profile.budget.toLocaleString('en-US')}</span>
            </div>
            <div className="preview-item">
              <span className="preview-label">Beds / Baths</span>
              <span className="preview-value">{profile.targetBedrooms} / {profile.targetBathrooms}</span>
            </div>
            <div className="preview-item">
              <span className="preview-label">Priority</span>
              <span className="preview-value">{profile.priorityMode}</span>
            </div>
          </div>
        </div>

        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          title={confirmDialog.title}
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        />
      </div>
    </div>
  );
}

export default Profile;
