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
  const [expandedScoreIndices, setExpandedScoreIndices] = useState<Set<number>>(new Set());
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
      const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim();
      const keyFromParts = (a1: string, a2: string) => `${normalize(a1)},${normalize(a2)}`;
      const keyFromFullAddress = (full: string) => {
        const parts = full.split(',').map(p => p.trim()).filter(Boolean);
        if (parts.length === 0) return '';
        return keyFromParts(parts[0] || full, parts.slice(1).join(', ') || 'Unknown');
      };

      // Create a temporary profile with selected mode
      const tempProfile: UserProfile = { ...profile, priorityMode: selectedMode as import('../types').PriorityMode };

      // Convert houses to address format for backend
      const originalAddresses = userHouses.map(h => h.address);
      const addressKeyToOriginal = new Map<string, string>();
      const addresses = userHouses.map(house => {
        const parts = house.address.split(',').map(p => p.trim());
        const address1 = parts[0] || house.address;
        const address2 = parts.slice(1).join(', ') || 'Unknown';
        addressKeyToOriginal.set(keyFromParts(address1, address2), house.address);
        return { address1, address2 };
      });

      const results = await batchScoreFromAddresses(tempProfile, addresses);

      // Add addresses to results for display.
      // IMPORTANT: backend may return results sorted by score, so we must not rely on index matching.
      const resultsWithAddresses = results.map((result, index) => {
        const backendAddress = result.house?.address || '';
        const key = keyFromFullAddress(backendAddress);
        const displayAddress =
          (key ? addressKeyToOriginal.get(key) : undefined) ||
          backendAddress ||
          originalAddresses[index] ||
          'Unknown Address';

        return { ...result, displayAddress };
      });

      setScoreResults(resultsWithAddresses);
      setExpandedScoreIndices(new Set());
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
      <Header />
      <div className="page-content">
        <div className="welcome-section">
          <div className="welcome-container">
            <div className="welcome-header">
              <div className="welcome-greeting">
                <h1 className="welcome-title-typo">
                  Welcome back to <span className="brand-highlight">SmartBuy</span> 🏠
                </h1>
                <p className="welcome-subtitle-typo">
                  Find your perfect home with confidence
                </p>
              </div>
              <div className="welcome-progress">
                <div className={`progress-item ${profile ? 'completed' : ''}`}>
                  <span className={profile ? 'progress-check' : 'progress-empty'}>
                    {profile ? '✓' : '○'}
                  </span>
                  <span className="progress-label">Profile</span>
                </div>
                <div className="progress-arrow">→</div>
                <div className={`progress-item ${userHouses.length > 0 ? 'completed' : ''}`}>
                  <span className={userHouses.length > 0 ? 'progress-check' : 'progress-empty'}>
                    {userHouses.length > 0 ? '✓' : '○'}
                  </span>
                  <span className="progress-label">Properties</span>
                </div>
                <div className="progress-arrow">→</div>
                <div className={`progress-item ${scoreResults.length > 0 ? 'completed' : ''}`}>
                  <span className={scoreResults.length > 0 ? 'progress-check' : 'progress-empty'}>
                    {scoreResults.length > 0 ? '✓' : '○'}
                  </span>
                  <span className="progress-label">Score</span>
                </div>
              </div>
            </div>
            <div className="welcome-separator"></div>
          </div>
        </div>

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
                  <div className="mode-description-card">
                    {selectedMode === 'Balanced' && (
                      <>
                        <div className="mode-description-header">
                          <div className="mode-pie-chart mode-pie-balanced"></div>
                          <div>
                            <h3 className="mode-description-title">Balanced Mode</h3>
                            <div className="mode-description-content">
                              <div className="mode-weight-item">
                                <span className="mode-weight-label" style={{ color: '#10b981' }}>●</span>
                                <span className="mode-weight-label">Price</span>
                                <span>25%</span>
                              </div>
                              <div className="mode-weight-item">
                                <span className="mode-weight-label" style={{ color: '#f59e0b' }}>●</span>
                                <span className="mode-weight-label">Space</span>
                                <span>25%</span>
                              </div>
                              <div className="mode-weight-item">
                                <span className="mode-weight-label" style={{ color: '#ef4444' }}>●</span>
                                <span className="mode-weight-label">Safety</span>
                                <span>25%</span>
                              </div>
                              <div className="mode-weight-item">
                                <span className="mode-weight-label" style={{ color: '#8b5cf6' }}>●</span>
                                <span className="mode-weight-label">School</span>
                                <span>25%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="mode-summary">Equal weight across all factors for a well-rounded home buying decision.</div>
                      </>
                    )}
                    {selectedMode === 'Budget Driven' && (
                      <>
                        <div className="mode-description-header">
                          <div className="mode-pie-chart mode-pie-budget"></div>
                          <div>
                            <h3 className="mode-description-title">Budget Driven Mode</h3>
                            <div className="mode-description-content">
                              <div className="mode-weight-item">
                                <span className="mode-weight-label" style={{ color: '#10b981' }}>●</span>
                                <span className="mode-weight-label">Price</span>
                                <span>50%</span>
                              </div>
                              <div className="mode-weight-item">
                                <span className="mode-weight-label" style={{ color: '#f59e0b' }}>●</span>
                                <span className="mode-weight-label">Space</span>
                                <span>20%</span>
                              </div>
                              <div className="mode-weight-item">
                                <span className="mode-weight-label" style={{ color: '#ef4444' }}>●</span>
                                <span className="mode-weight-label">Safety</span>
                                <span>20%</span>
                              </div>
                              <div className="mode-weight-item">
                                <span className="mode-weight-label" style={{ color: '#8b5cf6' }}>●</span>
                                <span className="mode-weight-label">School</span>
                                <span>10%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="mode-summary">Prioritizes affordability and best value. Perfect for budget-conscious buyers.</div>
                      </>
                    )}
                    {selectedMode === 'Safety First' && (
                      <>
                        <div className="mode-description-header">
                          <div className="mode-pie-chart mode-pie-safety"></div>
                          <div>
                            <h3 className="mode-description-title">Safety First Mode</h3>
                            <div className="mode-description-content">
                              <div className="mode-weight-item">
                                <span className="mode-weight-label" style={{ color: '#10b981' }}>●</span>
                                <span className="mode-weight-label">Price</span>
                                <span>25%</span>
                              </div>
                              <div className="mode-weight-item">
                                <span className="mode-weight-label" style={{ color: '#f59e0b' }}>●</span>
                                <span className="mode-weight-label">Space</span>
                                <span>15%</span>
                              </div>
                              <div className="mode-weight-item">
                                <span className="mode-weight-label" style={{ color: '#ef4444' }}>●</span>
                                <span className="mode-weight-label">Safety</span>
                                <span>50%</span>
                              </div>
                              <div className="mode-weight-item">
                                <span className="mode-weight-label" style={{ color: '#8b5cf6' }}>●</span>
                                <span className="mode-weight-label">School</span>
                                <span>10%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="mode-summary">Emphasizes living in safe neighborhoods with low crime rates. Family peace of mind matters.</div>
                      </>
                    )}
                    {selectedMode === 'Education First' && (
                      <>
                        <div className="mode-description-header">
                          <div className="mode-pie-chart mode-pie-education"></div>
                          <div>
                            <h3 className="mode-description-title">Education First Mode</h3>
                            <div className="mode-description-content">
                              <div className="mode-weight-item">
                                <span className="mode-weight-label" style={{ color: '#10b981' }}>●</span>
                                <span className="mode-weight-label">Price</span>
                                <span>20%</span>
                              </div>
                              <div className="mode-weight-item">
                                <span className="mode-weight-label" style={{ color: '#f59e0b' }}>●</span>
                                <span className="mode-weight-label">Space</span>
                                <span>15%</span>
                              </div>
                              <div className="mode-weight-item">
                                <span className="mode-weight-label" style={{ color: '#ef4444' }}>●</span>
                                <span className="mode-weight-label">Safety</span>
                                <span>15%</span>
                              </div>
                              <div className="mode-weight-item">
                                <span className="mode-weight-label" style={{ color: '#8b5cf6' }}>●</span>
                                <span className="mode-weight-label">School</span>
                                <span>50%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="mode-summary">Focuses on high-quality schools and education. Ideal for families with school-age children.</div>
                      </>
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
                <div className="score-grid-container">
                  {scoreResults.slice(0, userHouses.length).map((result, index) => {
                    const isExpanded = expandedScoreIndices.has(index);

                    // Determine color based on score
                    let scoreColor = '#10b981'; // green (≥80)
                    let scoreColorClass = 'score-excellent';
                    if (result.totalScore < 60) {
                      scoreColor = '#ef4444'; // red
                      scoreColorClass = 'score-poor';
                    } else if (result.totalScore < 80) {
                      scoreColor = '#f59e0b'; // orange
                      scoreColorClass = 'score-fair';
                    }

                    return (
                      <div key={index} className={`score-card-vertical ${isExpanded ? 'score-card-expanded' : ''}`}>
                        <div className="score-card-vertical-header">
                          <div className="score-card-vertical-info">
                            <h3 className="score-card-vertical-address">
                              {result.displayAddress || result.house?.address || 'Unknown Address'}
                            </h3>
                            <p className="score-card-vertical-score-text">Score: {result.totalScore}/100</p>
                          </div>
                          <div className="circular-progress-vertical">
                            <svg className="circular-progress-svg" viewBox="0 0 120 120">
                              <circle
                                className="circular-progress-bg"
                                cx="60"
                                cy="60"
                                r="52"
                              />
                              <circle
                                className={`circular-progress-fill ${scoreColorClass}`}
                                cx="60"
                                cy="60"
                                r="52"
                                style={{
                                  strokeDasharray: `${2 * Math.PI * 52}`,
                                  strokeDashoffset: `${2 * Math.PI * 52 * (1 - result.totalScore / 100)}`,
                                  stroke: scoreColor
                                }}
                              />
                            </svg>
                            <div className="circular-progress-text">
                              <span className="circular-progress-score" style={{ color: scoreColor }}>
                                {result.totalScore}
                              </span>
                              <span className="circular-progress-label">/100</span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="show-details-btn-vertical"
                          onClick={() => {
                            setExpandedScoreIndices(prev => {
                              const newSet = new Set(prev);
                              if (newSet.has(index)) {
                                newSet.delete(index);
                              } else {
                                newSet.add(index);
                              }
                              return newSet;
                            });
                          }}
                        >
                          {isExpanded ? 'Hide Details ▲' : 'Show Details ▼'}
                        </button>

                        {isExpanded && result.dimensions && result.dimensions.length > 0 ? (
                          <div className="score-details-vertical">
                            {result.dimensions.map((dimension) => {
                              // Assign colors based on dimension name
                              let barColor = '#10b981'; // default green
                              if (dimension.name === 'Space') barColor = '#f59e0b'; // orange
                              else if (dimension.name === 'Safety') barColor = '#ef4444'; // red
                              else if (dimension.name === 'School' || dimension.name === 'Schools') barColor = '#8b5cf6'; // purple
                              else if (dimension.name === 'Price') barColor = '#10b981'; // green

                              return (
                                <div key={dimension.name} className="dimension-row-vertical">
                                  <div className="dimension-header-vertical">
                                    <span className="dimension-name-vertical">{dimension.name}</span>
                                    <span className="dimension-score-vertical">{dimension.score}/100</span>
                                  </div>
                                  <div className="dimension-bar-container-vertical">
                                    <div
                                      className="dimension-bar-fill-vertical"
                                      style={{
                                        width: `${Math.min(Math.max(dimension.score, 0), 100)}%`,
                                        backgroundColor: barColor
                                      }}
                                    />
                                  </div>
                                </div>
                              );
                            })}

                            {result.summary ? (
                              <div className="score-summary-box-vertical">
                                <strong>Summary:</strong> {result.summary}
                              </div>
                            ) : null}

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
