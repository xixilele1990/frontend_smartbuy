import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import type { UserProfile, House } from '../types';
import { getProfile } from '../services/profileService';
import { batchScoreFromAddresses, type ScoreResponse } from '../services/scoringService';
import Header from '../components/Header';

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
  const [expandedScoreIndex, setExpandedScoreIndex] = useState<number | null>(null);
  const [selectedMode, setSelectedMode] = useState<string>('Balanced');
  const modeOptions = ['Balanced', 'Budget Driven', 'Safety First', 'Education First'];

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

  // Sync selectedMode with profile's priorityMode
  useEffect(() => {
    if (profile) {
      setSelectedMode(profile.priorityMode);
    }
  }, [profile]);

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
      // Create a temporary profile with selected mode
      const tempProfile: UserProfile = { ...profile, priorityMode: selectedMode as import('../types').PriorityMode };

      // Convert houses to address format for backend
      const addresses = userHouses.map(house => {
        const parts = house.address.split(',').map(p => p.trim());
        return {
          address1: parts[0] || house.address,
          address2: parts.slice(1).join(', ') || 'Unknown',
          originalAddress: house.address, // Keep original for display
        };
      });

      // Call backend to score all addresses using selected mode
      const results = await batchScoreFromAddresses(tempProfile, addresses);

      // Add original addresses to results for display
      const resultsWithAddresses = results.map((result, index) => ({
        ...result,
        displayAddress: addresses[index]?.originalAddress || result.house?.address || 'Unknown Address'
      }));

      setScoreResults(resultsWithAddresses);
      setExpandedScoreIndex(null);
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

  const comparisonDimensions = Array.from(
    new Set(
      scoreResults.flatMap(result => result.dimensions?.map(dimension => dimension.name) ?? [])
    )
  );

  const getDimensionScore = (result: ScoreResultWithAddress, name: string) =>
    result.dimensions?.find(dimension => dimension.name === name)?.score;

  return (
    <div>
      <Header />
      <div className="page-content">
        <h1>SmartBuy Dashboard</h1>
        <p>Welcome to SmartBuy:Your Home Buying Decision Support System</p>

        {profile ? (
          <div>
            <div className="profile-summary-card-premium">
              <div className="profile-header-premium">
                <span className="card-label">USER PROFILE </span>
                <Link to="/profile" className="edit-profile-btn-premium">
                  Edit Profile
                </Link>
              </div>

              <div className="budget-display">
                ${profile.budget.toLocaleString('en-US')}
              </div>

              <div className="profile-stats-grid">
                <div className="stat-item">
                  <img src="/icons/bedroom.png" alt="Bedroom" className="stat-icon" />
                  <span className="stat-text">{profile.targetBedrooms} Bedrooms</span>
                </div>

                <div className="stat-item">
                  <img src="/icons/bath.png" alt="Bathroom" className="stat-icon" />
                  <span className="stat-text">{profile.targetBathrooms} Bathrooms</span>
                </div>

                <div className="stat-item">
                  <img src="/icons/budget.png" alt="Budget" className="stat-icon" />
                  <span className="stat-text">{profile.priorityMode}</span>
                </div>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0 }}>Your Properties</h3>
                <Link to="/houses">
                  <button className="action-btn-premium">{userHouses.length === 0 ? 'Add Your First Property' : 'Manage Properties'}</button>
                </Link>
              </div>
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
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <h3 style={{ margin: 0 }}>SmartScore Rankings</h3>
                {userHouses.length > 0 && (
                  <button
                    className="action-btn-premium"
                    onClick={handleCalculateScores}
                    disabled={isLoadingScores || !profile}
                  >
                    {isLoadingScores ? 'Calculating...' : 'Calculate'}
                  </button>
                )}
              </div>
              {userHouses.length > 0 && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <label style={{ fontWeight: '500', fontSize: '17px' }}>Select Mode:</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {modeOptions.map(mode => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => {
                            setSelectedMode(mode);
                            setScoreResults([]);
                          }}
                          disabled={isLoadingScores}
                          style={{
                            padding: '10px 16px',
                            fontSize: '17px',
                            fontWeight: '500',
                            borderRadius: '6px',
                            border: selectedMode === mode ? '2px solid #004182' : '1px solid #d2d2d7',
                            backgroundColor: selectedMode === mode ? '#004182' : 'white',
                            color: selectedMode === mode ? 'white' : '#333',
                            cursor: isLoadingScores ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s ease',
                            minWidth: 'auto',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={{
                    backgroundColor: '#f0f4f9',
                    padding: '12px 16px',
                    borderRadius: '6px',
                    marginBottom: '16px',
                    fontSize: '14px',
                    color: '#607d8b'
                  }}>
                    {selectedMode === 'Balanced' && (
                      <p style={{ margin: 0 }}>
                        <strong style={{ color: '#004182' }}>Balanced Mode:</strong> Equal weight across all factors — Price: 25%, Space: 25%, Safety: 25%, School: 25%
                      </p>
                    )}
                    {selectedMode === 'Budget Driven' && (
                      <p style={{ margin: 0 }}>
                        <strong style={{ color: '#004182' }}>Budget Driven Mode:</strong> Prioritizes affordability — Price: 50%, Space: 20%, Safety: 20%, School: 10%
                      </p>
                    )}
                    {selectedMode === 'Safety First' && (
                      <p style={{ margin: 0 }}>
                        <strong style={{ color: '#004182' }}>Safety First Mode:</strong> Emphasizes low crime areas — Price: 25%, Space: 15%, Safety: 50%, School: 10%
                      </p>
                    )}
                    {selectedMode === 'Education First' && (
                      <p style={{ margin: 0 }}>
                        <strong style={{ color: '#004182' }}>Education First Mode:</strong> Focuses on school quality — Price: 20%, Space: 15%, Safety: 15%, School: 50%
                      </p>
                    )}
                  </div>
                </>
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
                <div className="score-section">
                  {scoreResults.slice(0, userHouses.length).map((result, index) => {
                    const isExpanded = expandedScoreIndex === index;
                    return (
                      <div key={index} className={`score-card ${isExpanded ? 'score-card-expanded' : ''}`}>
                        <div className="score-card-header">
                          <div className="score-card-rank">
                            <span className={`rank-pill rank-${index + 1}`}>#{index + 1}</span>
                            <div className="score-card-title">
                              <strong>{result.displayAddress || result.house?.address || 'Unknown Address'}</strong>
                              <span className="score-card-subtitle">Mode: {selectedMode}</span>
                            </div>
                          </div>
                          <div className="score-card-score">
                            <span className="score-score-label">Total</span>
                            <span className="score-score-pill">{result.totalScore}/100</span>
                          </div>
                        </div>

                        <div className="score-card-bar">
                          <div
                            className="score-bar-fill"
                            style={{ width: `${Math.min(Math.max(result.totalScore, 0), 100)}%` }}
                          />
                        </div>

                        {result.summary ? (
                          <p className="score-card-summary">{result.summary}</p>
                        ) : null}

                        <div className="score-card-actions">
                          <button
                            type="button"
                            className="score-detail-toggle"
                            onClick={() => {
                              setExpandedScoreIndex(prev => (prev === index ? null : index));
                            }}
                          >
                            {isExpanded ? 'Hide Breakdown' : 'View Breakdown'}
                          </button>
                        </div>

                        {isExpanded ? (
                          <div className="score-details">
                            {result.dimensions && result.dimensions.length > 0 ? (
                              <div className="score-dimensions">
                                {result.dimensions.map((dimension) => (
                                  <div key={dimension.name} className="score-dimension-card">
                                    <div className="score-dimension-label">
                                      <span>{dimension.name}</span>
                                      <strong>{dimension.score}</strong>
                                    </div>
                                    <div className="score-bar score-bar-compact">
                                      <div
                                        className="score-bar-fill score-bar-fill-muted"
                                        style={{ width: `${Math.min(Math.max(dimension.score, 0), 100)}%` }}
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="score-summary">
                                Score breakdown isn’t available from the backend yet.
                              </p>
                            )}
                            {result.warnings && result.warnings.length > 0 ? (
                              <div className="score-warnings">
                                {result.warnings.map((warning, warningIndex) => (
                                  <div key={warningIndex}>{warning}</div>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}

                  <div className="score-comparison">
                    <div className="score-comparison-header">
                      <div>
                        <h4>Score Overview</h4>
                        <p>Compare total scores and key dimensions at a glance.</p>
                      </div>
                      <div className="score-comparison-legend">
                        <span className="legend-dot" /> 0–100 scale
                      </div>
                    </div>

                    {scoreResults.map((result, index) => (
                      <div key={`${result.displayAddress || 'score'}-${index}`} className="score-comparison-row">
                        <div className="score-comparison-title">
                          <strong>{result.displayAddress || result.house?.address || 'Unknown Address'}</strong>
                          <span>{result.totalScore}/100</span>
                        </div>
                        <div className="score-bar">
                          <div
                            className="score-bar-fill"
                            style={{ width: `${Math.min(Math.max(result.totalScore, 0), 100)}%` }}
                          />
                        </div>

                        {comparisonDimensions.length > 0 && (
                          <div className="score-dimension-grid">
                            {comparisonDimensions.map(dimensionName => {
                              const dimensionScore = getDimensionScore(result, dimensionName);
                              if (dimensionScore === undefined) {
                                return null;
                              }

                              return (
                                <div key={`${dimensionName}-${index}`} className="score-dimension-item">
                                  <span>{dimensionName}</span>
                                  <div className="score-bar score-bar-compact">
                                    <div
                                      className="score-bar-fill score-bar-fill-muted"
                                      style={{ width: `${Math.min(Math.max(dimensionScore, 0), 100)}%` }}
                                    />
                                  </div>
                                  <span className="score-dimension-value">{dimensionScore}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
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
    </div>
  );
}

export default Dashboard;
