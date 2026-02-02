import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import type { UserProfile, House } from '../types';
import { getProfile } from '../services/profileService';
import { batchScoreFromAddresses, type ScoreResponse } from '../services/scoringService';

// Extended score response with display address
interface ScoreResultWithAddress extends ScoreResponse {
  displayAddress?: string;
}

function Dashboard() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userHouses, setUserHouses] = useState<House[]>([]);
  const [scoreResults, setScoreResults] = useState<ScoreResultWithAddress[]>([]);
  const [isLoadingScores, setIsLoadingScores] = useState(false);
  const [scoringError, setScoringError] = useState<string | null>(null);

  // Load profile from backend API
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await getProfile();
        setProfile(data);
      } catch (error) {
        console.error('[Dashboard] Failed to load profile:', error);
        setProfile(null);
      }
    };

    loadProfile();
  }, []);

  // Monitor localStorage for house changes
  useEffect(() => {
    const loadUserHouses = () => {
      const savedHouses = localStorage.getItem('userHouses');
      const newHouses = savedHouses ? JSON.parse(savedHouses) : [];
      
      // Only update state if data actually changed (compare by JSON string)
      setUserHouses(prevHouses => {
        const prevJson = JSON.stringify(prevHouses);
        const newJson = JSON.stringify(newHouses);
        if (prevJson !== newJson) {
          return newHouses;
        }
        return prevHouses;
      });
    };

    // Load on mount
    loadUserHouses();

    window.addEventListener('storage', loadUserHouses);

    // Setup interval to check for local changes
    const interval = setInterval(loadUserHouses, 2000);

    return () => {
      window.removeEventListener('storage', loadUserHouses);
      clearInterval(interval);
    };
  }, []);

  // Manual scoring function
  const handleCalculateScores = async () => {
    if (!profile) {
      setScoringError('Please set up your profile first.');
      return;
    }
    
    if (userHouses.length === 0) {
      setScoringError('Please add properties first.');
      return;
    }

    setIsLoadingScores(true);
    setScoringError(null);
    try {
      // Convert houses to address format for backend
      const addresses = userHouses.map(house => {
        const parts = house.address.split(',').map(p => p.trim());
        return {
          address1: parts[0] || house.address,
          address2: parts.slice(1).join(', ') || 'Unknown',
          originalAddress: house.address, // Keep original for display
        };
      });
      
      // Call backend to score all addresses
      const results = await batchScoreFromAddresses(profile, addresses);
      
      // Add original addresses to results for display
      const resultsWithAddresses = results.map((result, index) => ({
        ...result,
        displayAddress: addresses[index]?.originalAddress || result.house?.address || 'Unknown Address'
      }));
      
      setScoreResults(resultsWithAddresses);
      setScoringError(null);
    } catch (error) {
      console.error('[Dashboard.handleCalculateScores] Caught error:', error);
      setScoreResults([]);
      // Show user-friendly error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('ATTOM') || errorMessage.includes('502')) {
        setScoringError('Unable to score properties: ATTOM API has no data for these addresses. Please try adding properties with real, well-known addresses.');
      } else {
        setScoringError(`Scoring failed: ${errorMessage}`);
      }
    } finally {
      setIsLoadingScores(false);
    }
  };

  return (
    <div>
      <h1>SmartBuy Dashboard</h1>
      <p>Welcome to SmartBuy:Your Home Buying Decision Support System</p>

      {profile ? (
        <div>
          <h2>Your Profile Summary</h2>
          <ul>
            <li>Budget: ${profile.budget.toLocaleString('en-US')}</li>
            <li>
              Beds/Baths: {profile.targetBedrooms} / {profile.targetBathrooms}
            </li>
            <li>Priority Mode: {profile.priorityMode}</li>
          </ul>
          <div style={{ marginTop: '16px' }}>
            <Link to="/profile">
              <button>Edit Profile</button>
            </Link>
          </div>

          <div>
            <h3>Your Properties</h3>
            {userHouses.length === 0 ? (
              <div>
                <p>You haven't added any properties yet. Start by adding your first property to see how it scores!</p>
              </div>
            ) : (
              <ul>
                {userHouses.map((house, index) => (
                  <li key={index}>
                    <strong>{house.address}</strong>
                    {house.bedrooms && house.bathrooms && house.squareFeet ? (
                      <span> - {house.bedrooms} bed, {house.bathrooms} bath, {house.squareFeet} sqft</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
            <div style={{ marginTop: '16px' }}>
              <Link to="/houses">
                <button>{userHouses.length === 0 ? 'Add Your First Property' : 'Manage Properties'}</button>
              </Link>
            </div>
          </div>

          <div>
            <h3>SmartScore Rankings</h3>
            {userHouses.length > 0 && (
              <button 
                type="button" 
                onClick={handleCalculateScores}
                disabled={isLoadingScores || !profile}
              >
                {isLoadingScores ? 'Calculating...' : `Calculate SmartScore in ${profile.priorityMode} Mode`}
              </button>
            )}
            {isLoadingScores ? (
              <p><em>Loading scoring results...</em></p>
            ) : scoringError ? (
              <div>
                <p><strong>Unable to calculate scores:</strong></p>
                <p>{scoringError}</p>
              </div>
            ) : scoreResults.length === 0 ? (
              <p>Ready to see how your properties score? Click the button above to calculate SmartScores for all your properties.</p>
            ) : (
              <ol>
                {scoreResults.map((result, index) => (
                  <li key={index}>
                    <strong>{result.displayAddress || result.house?.address || 'Unknown Address'}</strong> - Score: <strong>{result.totalScore}/100</strong>
                    {' '}
                    <button type="button" onClick={() => {}}>Show Details</button>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      ) : (
        <div>
          <h2>Get Started</h2>
          <p>Please set up your profile to customize your home buying preferences.</p>
          <p>
            <Link to="/profile">
              <button>Set Up Profile</button>
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
