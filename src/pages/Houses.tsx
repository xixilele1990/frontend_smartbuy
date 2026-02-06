import { useState, useEffect } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import type { House } from '../types';
import { addHouse, getHouseDetails, type HouseFromAttom } from '../services/houseService';
import ConfirmDialog from '../components/ConfirmDialog';
import Header from '../components/Header';

const initialHouseForm: House = {
  address: ''
};



function Houses() {
  const [formData, setFormData] = useState<House>(initialHouseForm);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [userHouses, setUserHouses] = useState<House[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedHouseDetails, setSelectedHouseDetails] = useState<HouseFromAttom | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [mapCoordinates, setMapCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoadingMap, setIsLoadingMap] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; type: 'single' | 'all' | null; index?: number }>({ isOpen: false, type: null });

  // Load houses from localStorage on mount
  useEffect(() => {
    const savedHouses = localStorage.getItem('userHouses');
    if (savedHouses) {
      try {
        const parsedHouses = JSON.parse(savedHouses);
        setUserHouses(parsedHouses);
        console.log('[Houses] Loaded houses from localStorage:', parsedHouses);
      } catch (error) {
        console.error('[Houses] Failed to parse userHouses from localStorage:', error);
      }
    }
  }, []);

  // Save houses to localStorage whenever userHouses changes
  useEffect(() => {
    if (userHouses.length > 0) {
      localStorage.setItem('userHouses', JSON.stringify(userHouses));
      console.log('[Houses] Saved houses to localStorage:', userHouses);
    } else {
      localStorage.removeItem('userHouses');
      console.log('[Houses] Removed userHouses from localStorage');
    }
  }, [userHouses]);

  const handleTextChange = (field: keyof House) => (event: ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    setSaveMessage(null);
    setFormData((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const validateForm = (): boolean => {
    if (!formData.address || !formData.address.trim()) {
      setErrorMessage('Please enter a property address.');
      return false;
    }

    if (formData.address.trim().length < 3) {
      setErrorMessage('Property address must be at least 3 characters long.');
      return false;
    }

    return true;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const newHouse = await addHouse(formData);
      setUserHouses([...userHouses, newHouse]);
      setSaveMessage('Property added successfully.');
      setFormData(initialHouseForm);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to add property. Please try again.';
      setErrorMessage(errorMsg);
      console.error('Failed to add house:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteHouse = (index: number) => {
    setConfirmDialog({ isOpen: true, type: 'single', index });
  };

  const handleDeleteAll = () => {
    setConfirmDialog({ isOpen: true, type: 'all' });
  };

  const handleConfirmDelete = () => {
    if (confirmDialog.type === 'single' && confirmDialog.index !== undefined) {
      const updatedHouses = userHouses.filter((_, i) => i !== confirmDialog.index);
      setUserHouses(updatedHouses);
      setSaveMessage('Property deleted successfully.');
    } else if (confirmDialog.type === 'all') {
      setUserHouses([]);
      setSaveMessage('All properties deleted successfully.');
      setFormData(initialHouseForm);
    }
    setConfirmDialog({ isOpen: false, type: null });
  };

  const handleViewDetails = async (address: string) => {
    setIsLoadingDetails(true);
    setDetailsError(null);
    setSelectedHouseDetails(null);
    setMapCoordinates(null);

    try {
      const details = await getHouseDetails(address);
      setSelectedHouseDetails(details);

      // Get coordinates from Nominatim
      setIsLoadingMap(true);
      const fullAddress = `${details.address1}, ${details.address2}`;

      const fetchCoordinates = async (queryAddress: string) => {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryAddress)}&limit=1`
        );
        return await response.json();
      };

      try {
        let results = await fetchCoordinates(fullAddress);

        // Retry without Unit/Apt if no results
        if (results.length === 0) {
          // Remove Unit, Apt, Suite, #, Building and following content
          const cleanAddress1 = details.address1.replace(/\s+(?:Unit|Apt|Suite|#|Building).*$/i, '');
          if (cleanAddress1 !== details.address1) {
            const retryAddress = `${cleanAddress1}, ${details.address2}`;
            console.log('Retrying map search with:', retryAddress);
            results = await fetchCoordinates(retryAddress);
          }
        }

        if (results.length > 0) {
          setMapCoordinates({
            lat: parseFloat(results[0].lat),
            lng: parseFloat(results[0].lon)
          });
        }
      } catch (mapError) {
        console.error('Failed to get map coordinates:', mapError);
      } finally {
        setIsLoadingMap(false);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to load details';
      setDetailsError(errorMsg);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleCloseDetails = () => {
    setSelectedHouseDetails(null);
    setDetailsError(null);
    setMapCoordinates(null);
  };

  // Estimate square footage based on bedrooms and bathrooms
  const estimateSquareFeet = (beds?: number, baths?: number): number => {
    if (!beds && !baths) return 0;
    
    const bedrooms = beds ?? 2;
    const bathrooms = baths ?? 1;
    
    // Base square footage by bedrooms
    let baseSqFt = 0;
    if (bedrooms === 1) baseSqFt = 700;
    else if (bedrooms === 2) baseSqFt = 1050;
    else if (bedrooms === 3) baseSqFt = 1600;
    else if (bedrooms === 4) baseSqFt = 2100;
    else baseSqFt = 2100 + (bedrooms - 4) * 400;
    
    // Add square footage for bathrooms (75 sqft per bath)
    const bathroomSqFt = Math.floor(bathrooms * 75);
    
    return baseSqFt + bathroomSqFt;
  };

  return (
    <div>
      <Header />
      <div className="page-content">
        <h1>My Properties</h1>
        <p>View and compare all your saved properties.</p>

        <div>
          <h2>Add New Property</h2>
          <form onSubmit={handleSubmit}>
            <div>
              <label htmlFor="address">Address</label>
              <input
                id="address"
                name="address"
                type="text"
                value={formData.address}
                onChange={handleTextChange('address')}
                placeholder="e.g. 123 Main Street"
                required
              />
              <p className="form-hint"> Example:845 Julian ter unit1,Sunnyvale,CA, 94086</p>
            </div>

            {errorMessage ? <p style={{ color: 'red' }}>{errorMessage}</p> : null}
            <button type="submit" disabled={isLoading}>
              {isLoading ? 'Adding...' : 'Add Property'}
            </button>
          </form>

          {saveMessage ? <p>{saveMessage}</p> : null}
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ margin: 0 }}>Properties List</h2>
            {userHouses.length > 0 && (
              <button className="action-btn-premium" onClick={handleDeleteAll} disabled={isLoading}>
                {isLoading ? 'Deleting...' : 'Delete All Properties'}
              </button>
            )}
          </div>
          {userHouses.length === 0 ? (
            <p>No properties yet. Add your first property above to get started.</p>
          ) : (
            <ul>
              {userHouses.map((house, index) => (
                <li key={index}>
                  <strong>{house.address}</strong>
                  <button type="button" className="list-btn-details" onClick={() => handleViewDetails(house.address)}>
                    Details
                  </button>
                  <button type="button" className="list-btn-delete" onClick={() => handleDeleteHouse(index)}>
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>


        {/* House Details Modal */}
        {(isLoadingDetails || selectedHouseDetails || detailsError) && (
          <div
            className="modal-overlay"
            onClick={handleCloseDetails}
          >
            <div
              className="modal-window house-details-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2 className="modal-title">Property Details</h2>
                <button
                  type="button"
                  className="modal-close"
                  onClick={handleCloseDetails}
                  aria-label="Close"
                >
                  ×
                </button>
              </div>

              <div className="modal-body">

                {isLoadingDetails && (
                  <div className="modal-empty-state">
                    <p>Loading property details...</p>
                  </div>
                )}

                {detailsError && (
                  <div className="modal-error">
                    <p className="modal-error-title">Unable to Load Details</p>
                    <p className="modal-error-message">{detailsError}</p>
                  </div>
                )}

                {selectedHouseDetails && (
                  <div className="house-details-grid">
                    {/* Left Column: Hero, Metrics, Schools */}
                    <div className="house-details-main">
                      {/* Hero / Address */}
                      <div className="house-details-hero">
                        <p className="card-kicker">Address</p>
                        <p className="house-details-address1">{selectedHouseDetails.address1}</p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                          <p className="house-details-address2">{selectedHouseDetails.address2}</p>
                          {(selectedHouseDetails.beds != null || selectedHouseDetails.bathsTotal != null) && (
                            <p className="house-details-address2" style={{ fontSize: '14px', opacity: 0.8, marginLeft: '16px' }}>
                              {estimateSquareFeet(selectedHouseDetails.beds, selectedHouseDetails.bathsTotal).toLocaleString('en-US')} sq ft
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Key Property Metrics */}
                      <p className="section-title">Key Property Metrics</p>
                      <div className="details-metrics-grid">
                        {selectedHouseDetails.avmValue != null && (
                          <div className="detail-metric-card">
                            <div className="metric-icon-circle">
                              <img src="/icons/money.png" alt="Estimated Value" className="metric-icon-img" />
                            </div>
                            <span className="detail-metric-value price-text">
                              {(() => {
                                const k = Math.round(selectedHouseDetails.avmValue / 1000);
                                return `$${k.toLocaleString('en-US')}k`;
                              })()}
                            </span>
                            <span className="detail-metric-label">Est. Value</span>
                          </div>
                        )}

                        {selectedHouseDetails.beds != null && (
                          <div className="detail-metric-card">
                            <div className="metric-icon-circle">
                              <img src="/icons/bed.png" alt="Bedrooms" className="metric-icon-img" />
                            </div>
                            <span className="detail-metric-value">{selectedHouseDetails.beds}</span>
                            <span className="detail-metric-label">Bedrooms</span>
                          </div>
                        )}

                        {selectedHouseDetails.bathsTotal != null && (
                          <div className="detail-metric-card">
                            <div className="metric-icon-circle">
                              <img src="/icons/bathcolor.png" alt="Bathrooms" className="metric-icon-img" />
                            </div>
                            <span className="detail-metric-value">{selectedHouseDetails.bathsTotal}</span>
                            <span className="detail-metric-label">Bathrooms</span>
                          </div>
                        )}
                      </div>

                      {/* Schools Information */}
                      {selectedHouseDetails.schoolsJson && (
                        <div className="section">
                          <p className="section-title">Nearby Schools</p>
                          <div className="details-school-list">
                            {(() => {
                              try {
                                const schools = JSON.parse(selectedHouseDetails.schoolsJson);
                                const schoolList = Array.isArray(schools) ? schools : [schools];

                                if (schoolList.length === 0) {
                                  return <div className="school-item"><p className="school-meta">No school data available</p></div>;
                                }

                                return (
                                  <div>
                                    {schoolList.map((school: any, index: number) => {
                                      // Determine rating text
                                      const rawRating =
                                        school?.schoolRating ??
                                        school?.SchoolRating ??
                                        school?.Rating ??
                                        school?.rating ??
                                        school?.GSTestRating ??
                                        school?.gsTestRating ??
                                        school?.OverallRating ??
                                        school?.overallRating ??
                                        school?.RatingScore ??
                                        school?.ratingScore;

                                      let ratingText = 'N/A';
                                      let badgeClass = 'school-badge'; // default gray

                                      if (rawRating != null) {
                                        const text = String(rawRating).trim();
                                        if (text.length > 0) ratingText = text;
                                      }

                                      // Determine badge color
                                      const ratingUpper = ratingText.toUpperCase();
                                      const ratingNum = parseFloat(ratingText);

                                      if (['A', 'A+', 'A-', '9', '10', '8'].some(r => ratingUpper.includes(r)) || (!isNaN(ratingNum) && ratingNum >= 8)) {
                                        badgeClass += ' badge-grade-a';
                                      } else if (['B', 'B+', 'B-', '6', '7'].some(r => ratingUpper.includes(r)) || (!isNaN(ratingNum) && ratingNum >= 6 && ratingNum < 8)) {
                                        badgeClass += ' badge-grade-b';
                                      } else if (['C', 'D', 'F', '1', '2', '3', '4', '5'].some(r => ratingUpper.includes(r)) || (!isNaN(ratingNum) && ratingNum > 0 && ratingNum < 6)) {
                                        badgeClass += ' badge-grade-c';
                                      }

                                      return (
                                        <div key={school.InstitutionName + index} className="school-item">
                                          <div className="school-info">
                                            <span className="school-name">{school.InstitutionName || 'Unknown School'}</span>
                                            <span className="school-meta">
                                              {school?.gradeRange || school?.GradeRange || 'Grades K-12'} • {school?.distance ? `${school.distance} mi` : 'Nearby'}
                                            </span>
                                          </div>
                                          <div className={badgeClass}>
                                            {ratingText}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                );
                              } catch (error) {
                                return <div className="school-item"><p className="school-meta">Error parsing schools data</p></div>;
                              }
                            })()}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right Column: Map, Community */}
                    <div className="house-details-side">
                      {/* Location Map */}
                      {(() => {
                        if (isLoadingMap) {
                          return (
                            <div className="details-map-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <p style={{ color: '#94a3b8' }}>Loading map...</p>
                            </div>
                          );
                        }

                        if (mapCoordinates) {
                          const bbox = `${mapCoordinates.lng - 0.01},${mapCoordinates.lat - 0.01},${mapCoordinates.lng + 0.01},${mapCoordinates.lat + 0.01}`;
                          return (
                            <div className="section">
                              <p className="section-title">Location</p>
                              <div className="details-map-card">
                                <div className="details-map-frame">
                                  <iframe
                                    title="Property Location Map"
                                    width="100%"
                                    height="100%"
                                    style={{ border: 'none' }}
                                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${mapCoordinates.lat},${mapCoordinates.lng}`}
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })()}

                      {/* Community Information */}
                      {selectedHouseDetails.crimeIndex !== undefined && (
                        <div className="section">
                          <p className="section-title">Community Safety</p>
                          <div className="details-community-card">
                            <div className="crime-score-container">
                              <span className="crime-score-label">Crime Index:</span>
                              <span
                                className="crime-score-value"
                                style={{ color: selectedHouseDetails.crimeIndex > 130 ? '#ef4444' : selectedHouseDetails.crimeIndex > 100 ? '#f59e0b' : '#10b981' }}
                              >
                                {selectedHouseDetails.crimeIndex}
                              </span>
                            </div>

                            <div className="crime-visual-container">
                              <div className="crime-progress-track">
                                <div
                                  className="crime-progress-marker"
                                  style={{ left: `${Math.min(Math.max((selectedHouseDetails.crimeIndex / 200) * 100, 0), 100)}%` }}
                                ></div>
                              </div>
                              <div className="crime-scale-labels">
                                <span>Low Crime</span>
                                <span>Avg (100)</span>
                                <span>High Crime</span>
                              </div>
                            </div>

                            <div className="crime-context-text">
                              US Average: 100. <br />
                              {selectedHouseDetails.crimeIndex > 100
                                ? "Higher index indicates higher crime rate than national average."
                                : "This area has a lower crime rate than the national average."}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>


            </div>
          </div>
        )}

        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          title={confirmDialog.type === 'all' ? 'Delete All Properties' : 'Delete Property'}
          message={confirmDialog.type === 'all' ? 'Are you sure you want to delete all properties? This action cannot be undone.' : 'Are you sure you want to delete this property?'}
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirmDialog({ isOpen: false, type: null })}
          confirmText="Delete"
          cancelText="Cancel"
        />
      </div>
    </div>
  );
}

export default Houses;
