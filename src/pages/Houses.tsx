import { useState, useEffect } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import type { House } from '../types';
import { addHouse, getHouseDetails, type HouseFromAttom } from '../services/houseService';
import ConfirmDialog from '../components/ConfirmDialog';
import Header from '../components/Header';

const initialHouseForm: House = {
  address: ''
};

// Common styles
const STYLES = {
  sectionLabel: {
    fontSize: '17px' as const,
    fontWeight: '600' as const,
    color: '#666',
    marginBottom: '12px',
    textTransform: 'uppercase' as const
  }
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
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}&limit=1`
        );
        const results = await response.json();

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
              <p className="form-hint"> Example:1600 Amphitheatre Pkwy, Mountain View, CA 94043</p>
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
                    <div className="house-details-main">
                      {/* Hero / Address */}
                      <div className="card house-details-hero">
                        <p className="card-kicker">ADDRESS</p>
                        <p className="house-details-address1">{selectedHouseDetails.address1}</p>
                        <p className="house-details-address2">{selectedHouseDetails.address2}</p>
                      </div>

                      {/* Property Features */}
                      <div className="section">
                        <p className="section-title">PROPERTY FEATURES</p>
                        <div className="house-details-metrics">
                          {selectedHouseDetails.avmValue != null && (
                            <div className="metric-card metric-card--span-2">
                              <p className="metric-value metric-value-currency">
                                ${selectedHouseDetails.avmValue.toLocaleString('en-US')}
                              </p>
                              <p className="metric-label">Estimated Value</p>
                            </div>
                          )}

                          {selectedHouseDetails.beds != null && (
                            <div className="metric-card">
                              <p className="metric-value">{selectedHouseDetails.beds}</p>
                              <p className="metric-label">Bedrooms</p>
                            </div>
                          )}

                          {selectedHouseDetails.bathsTotal != null && (
                            <div className="metric-card">
                              <p className="metric-value">{selectedHouseDetails.bathsTotal}</p>
                              <p className="metric-label">Bathrooms</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Schools Information */}
                      {selectedHouseDetails.schoolsJson && (
                        <div className="section">
                          <p style={STYLES.sectionLabel}>NEARBY SCHOOLS</p>
                          <div className="card house-details-list-card">
                            {(() => {
                              try {
                                const schools = JSON.parse(selectedHouseDetails.schoolsJson);
                                const schoolList = Array.isArray(schools) ? schools : [schools];

                                if (schoolList.length === 0) {
                                  return <p className="muted">No school data available</p>;
                                }

                                return (
                                  <div>
                                    {schoolList.map((school: any, index: number) => (
                                      <div
                                        key={index}
                                        className="house-details-list-row"
                                        style={{
                                          borderBottom: index < schoolList.length - 1 ? '1px solid #e8e8e8' : 'none'
                                        }}
                                      >
                                        {(() => {
                                          if (import.meta.env.DEV && index === 0) {
                                            // Helpful for debugging when backend field names differ (Rating vs rating etc.)
                                            console.debug('[Houses] School sample keys:', Object.keys(school || {}));
                                          }
                                          return null;
                                        })()}
                                        <div className="house-details-school-row">
                                          <p className="house-details-school-name">
                                            {school.InstitutionName || 'School'}
                                          </p>
                                          <div className="house-details-school-rating">
                                            <span className="muted">Rating</span>
                                            <span className="house-details-school-rating-value">
                                              {(() => {
                                                const rawRating =
                                                  // Backend sample: { schoolRating: "A ", GSTestRating: 0, ... }
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

                                                if (rawRating == null) return 'N/A';
                                                if (typeof rawRating === 'object') return JSON.stringify(rawRating);
                                                const text = String(rawRating).trim();
                                                return text.length > 0 ? text : 'N/A';
                                              })()}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                );
                              } catch (error) {
                                return (
                                  <div>
                                    <p className="muted">Error parsing schools data</p>
                                  </div>
                                );
                              }
                            })()}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="house-details-side">
                      {/* Location Map */}
                      {(() => {
                        // Keep the existing map layout/logic unchanged
                        if (isLoadingMap) {
                          return (
                            <div style={{ marginBottom: '20px', textAlign: 'center', color: '#999', padding: '20px' }}>
                              Loading map...
                            </div>
                          );
                        }

                        if (mapCoordinates) {
                          const bbox = `${mapCoordinates.lng - 0.01},${mapCoordinates.lat - 0.01},${mapCoordinates.lng + 0.01},${mapCoordinates.lat + 0.01}`;
                          return (
                            <div style={{ marginBottom: '20px' }}>
                              <p style={{ fontSize: '17px', fontWeight: '600', color: '#666', marginBottom: '12px', textTransform: 'uppercase' }}>LOCATION</p>
                              <div style={{
                                borderRadius: '8px',
                                overflow: 'hidden',
                                border: '1px solid #ddd',
                                height: '300px'
                              }}>
                                <iframe
                                  title="Property Location Map"
                                  width="100%"
                                  height="100%"
                                  style={{ border: 'none' }}
                                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${mapCoordinates.lat},${mapCoordinates.lng}`}
                                />
                              </div>
                            </div>
                          );
                        }

                        return null;
                      })()}

                      {/* Community Information */}
                      {selectedHouseDetails.crimeIndex !== undefined && (
                        <div className="section">
                          <p className="section-title">COMMUNITY</p>
                          <div className="card house-details-community-card">
                            <p className="house-details-community-title">Crime Index</p>
                            <p className="house-details-community-hint">
                              US average: 100. The higher index, more dangerous, typcally from 80 to 200.
                            </p>
                            <p className="house-details-community-value">
                              {selectedHouseDetails.crimeIndex}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" onClick={handleCloseDetails}>
                  Back to Properties
                </button>
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
