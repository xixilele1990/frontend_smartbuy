import { useState, useEffect } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import type { House } from '../types';
import { addHouse, getHouseDetails, type HouseFromAttom } from '../services/houseService';
import ConfirmDialog from '../components/ConfirmDialog';
import Header from '../components/Header';

const initialHouseForm: House = {
  address: ''
};

// School field formatting
const FIELD_NAME_MAP: { [key: string]: string } = {
  'InstitutionName': 'School Name',
  'InstitutionType': 'Type',
  'GradeRange': 'Grades',
  'Distance': 'Distance',
  'Rating': 'Rating',
  'StudentCount': 'Students',
  'TeacherCount': 'Teachers',
  'TeacherStudentRatio': 'Teacher-Student Ratio',
  'District': 'District',
  'Address': 'Address',
  'Phone': 'Phone',
  'Website': 'Website',
};

const formatFieldName = (key: string): string => FIELD_NAME_MAP[key] || key;

// Common styles
const STYLES = {
  cardBox: (borderColor = '#e0e0e0'): React.CSSProperties => ({
    backgroundColor: '#fff',
    padding: '10px',
    borderRadius: '6px',
    border: `1px solid ${borderColor}`,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  }),
  sectionLabel: {
    fontSize: '17px' as const,
    fontWeight: '600' as const,
    color: '#666',
    marginBottom: '12px',
    textTransform: 'uppercase' as const
  },
  fieldLabel: {
    fontSize: '17px' as const,
    fontWeight: '500' as const,
    color: '#666'
  },
  fieldValue: {
    fontSize: '17px' as const,
    fontWeight: '600' as const,
    color: '#333',
    wordBreak: 'break-word' as const
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
                  <button type="button" onClick={() => handleViewDetails(house.address)}>
                    Details
                  </button>
                  <button type="button" onClick={() => handleDeleteHouse(index)}>
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
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 1000
            }}
            onClick={handleCloseDetails}
          >
            <div
              style={{
                backgroundColor: 'white',
                padding: '24px',
                borderRadius: '8px',
                maxWidth: '600px',
                maxHeight: '80vh',
                overflow: 'auto',
                position: 'relative'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={handleCloseDetails}
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  fontSize: '24px',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  color: '#333',
                  padding: '4px 8px',
                  lineHeight: '1'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#000')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#333')}
              >
                ×
              </button>

              <h2 style={{ marginBottom: '20px', color: '#333' }}>Property Details</h2>

              {isLoadingDetails && (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#666' }}>
                  <p style={{ fontSize: '18px' }}>Loading property details...</p>
                </div>
              )}

              {detailsError && (
                <div style={{
                  backgroundColor: '#fee',
                  border: '1px solid #fcc',
                  borderRadius: '6px',
                  padding: '16px',
                  marginBottom: '20px',
                  color: '#c33'
                }}>
                  <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>Unable to Load Details</p>
                  <p>{detailsError}</p>
                </div>
              )}

              {selectedHouseDetails && (
                <div>
                  {/* Address Section */}
                  <div style={{
                    backgroundColor: '#f8f8f8',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    padding: '16px',
                    marginBottom: '20px'
                  }}>
                    <p style={{ fontSize: '17px', color: '#999', marginBottom: '4px' }}>ADDRESS</p>
                    <p style={{ fontSize: '18px', fontWeight: '600', color: '#333' }}>
                      {selectedHouseDetails.address1}
                    </p>
                    <p style={{ fontSize: '17px', color: '#666' }}>
                      {selectedHouseDetails.address2}
                    </p>
                  </div>

                  {/* Location Map */}
                  {(() => {
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

                  {/* Property Features */}
                  <div style={{ marginBottom: '20px' }}>
                    <p style={{ fontSize: '17px', fontWeight: '600', color: '#666', marginBottom: '12px', textTransform: 'uppercase' }}>PROPERTY FEATURES</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      {selectedHouseDetails.beds && (
                        <div style={{
                          backgroundColor: '#f5f5f5',
                          padding: '12px',
                          borderRadius: '6px',
                          textAlign: 'center'
                        }}>
                          <p style={{ fontSize: '24px', fontWeight: '600', color: '#007AFF' }}>
                            {selectedHouseDetails.beds}
                          </p>
                          <p style={{ fontSize: '17px', color: '#666' }}>Bedrooms</p>
                        </div>
                      )}

                      {selectedHouseDetails.bathsTotal && (
                        <div style={{
                          backgroundColor: '#f5f5f5',
                          padding: '12px',
                          borderRadius: '6px',
                          textAlign: 'center'
                        }}>
                          <p style={{ fontSize: '24px', fontWeight: '600', color: '#007AFF' }}>
                            {selectedHouseDetails.bathsTotal}
                          </p>
                          <p style={{ fontSize: '17px', color: '#666' }}>Bathrooms</p>
                        </div>
                      )}

                      {selectedHouseDetails.roomsTotal && (
                        <div style={{
                          backgroundColor: '#f5f5f5',
                          padding: '12px',
                          borderRadius: '6px',
                          textAlign: 'center'
                        }}>
                          <p style={{ fontSize: '24px', fontWeight: '600', color: '#007AFF' }}>
                            {selectedHouseDetails.roomsTotal}
                          </p>
                          <p style={{ fontSize: '17px', color: '#666' }}>Total Rooms</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Financial Information */}
                  {selectedHouseDetails.avmValue && (
                    <div style={{
                      backgroundColor: '#f0f8ff',
                      border: '1px solid #d0e8ff',
                      borderRadius: '8px',
                      padding: '16px',
                      marginBottom: '20px'
                    }}>
                      <p style={{ fontSize: '17px', color: '#666', marginBottom: '4px' }}>ESTIMATED VALUE</p>
                      <p style={{ fontSize: '24px', fontWeight: '600', color: '#007AFF' }}>
                        ${selectedHouseDetails.avmValue.toLocaleString('en-US')}
                      </p>
                    </div>
                  )}

                  {/* Community Information */}
                  {(selectedHouseDetails.crimeIndex !== undefined || selectedHouseDetails.geoIdV4) && (
                    <div style={{ marginBottom: '20px' }}>
                      <p style={{ fontSize: '17px', fontWeight: '600', color: '#666', marginBottom: '12px', textTransform: 'uppercase' }}>COMMUNITY</p>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        {selectedHouseDetails.crimeIndex !== undefined && (
                          <div style={{
                            backgroundColor: '#fff3cd',
                            border: '1px solid #ffc107',
                            padding: '12px',
                            borderRadius: '6px',
                            textAlign: 'center'
                          }}>
                            <p style={{ fontSize: '18px', fontWeight: '600', color: '#ff9800' }}>
                              {selectedHouseDetails.crimeIndex}
                            </p>
                            <p style={{ fontSize: '17px', color: '#666' }}>Crime Index</p>
                          </div>
                        )}

                        {selectedHouseDetails.geoIdV4 && (
                          <div style={{
                            backgroundColor: '#f5f5f5',
                            padding: '12px',
                            borderRadius: '6px',
                            textAlign: 'center'
                          }}>
                            <p style={{ fontSize: '17px', color: '#999', wordBreak: 'break-all' }}>
                              {selectedHouseDetails.geoIdV4}
                            </p>
                            <p style={{ fontSize: '17px', color: '#666', marginTop: '4px' }}>Geo ID</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Schools Information */}
                  {selectedHouseDetails.schoolsJson && (
                    <div style={{ marginBottom: '20px' }}>
                      <p style={STYLES.sectionLabel}>NEARBY SCHOOLS</p>
                      <div style={{
                        backgroundColor: '#f9f9f9',
                        borderRadius: '8px',
                        overflow: 'hidden'
                      }}>
                        {(() => {
                          try {
                            const schools = JSON.parse(selectedHouseDetails.schoolsJson);
                            const schoolList = Array.isArray(schools) ? schools : [schools];

                            if (schoolList.length === 0) {
                              return <p style={{ padding: '12px', color: '#999' }}>No school data available</p>;
                            }

                            return (
                              <div>
                                {schoolList.map((school: any, index: number) => (
                                  <div
                                    key={index}
                                    style={{
                                      padding: '16px',
                                      borderBottom: index < schoolList.length - 1 ? '1px solid #e8e8e8' : 'none'
                                    }}
                                  >
                                    <p style={{
                                      fontSize: '17px',
                                      fontWeight: '700',
                                      color: '#1a1a1a',
                                      margin: '0 0 14px 0'
                                    }}>
                                      {school.InstitutionName || 'School'}
                                    </p>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                      {Object.entries(school).map(([key, value]: [string, any]) => {
                                        if (key === 'InstitutionName' || !value) return null;

                                        return (
                                          <div key={key} style={STYLES.cardBox()}>
                                            <span style={STYLES.fieldLabel}>
                                              {formatFieldName(key)}
                                            </span>
                                            <span style={STYLES.fieldValue}>
                                              {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                            </span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            );
                          } catch (error) {
                            return (
                              <div style={{ padding: '12px' }}>
                                <p style={{ fontSize: '17px', color: '#999', margin: '0 0 8px 0' }}>Error parsing schools data</p>
                              </div>
                            );
                          }
                        })()}
                      </div>
                    </div>
                  )}

                  {/* ATTOM ID */}
                  {selectedHouseDetails.attomId && (
                    <div style={{
                      backgroundColor: '#f5f5f5',
                      padding: '12px',
                      borderRadius: '6px',
                      marginBottom: '20px'
                    }}>
                      <p style={{ fontSize: '17px', color: '#999', marginBottom: '4px' }}>ATTOM ID</p>
                      <p style={{ fontSize: '17px', color: '#666', fontFamily: 'monospace' }}>
                        {selectedHouseDetails.attomId}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div style={{ marginTop: '24px', borderTop: '1px solid #e0e0e0', paddingTop: '16px' }}>
                <button
                  type="button"
                  onClick={handleCloseDetails}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#007AFF',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '17px'
                  }}
                >
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
