import { Link } from 'react-router-dom';
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

    try {
      const details = await getHouseDetails(address);
      setSelectedHouseDetails(details);
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
  };

  return (
    <div>
      <Header />
      <div className="page-content">
        <div>
          <Link to="/">
            <button type="button">← Back to Dashboard</button>
          </Link>
        </div>

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
            </div>

            {errorMessage ? <p style={{ color: 'red' }}>{errorMessage}</p> : null}
            <button type="submit" disabled={isLoading}>
              {isLoading ? 'Adding...' : 'Add Property'}
            </button>
          </form>

          {saveMessage ? <p>{saveMessage}</p> : null}
        </div>

        <div>
          <h2>Properties List</h2>
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

        {userHouses.length > 0 && (
          <div>
            <button type="button" onClick={handleDeleteAll} disabled={isLoading}>
              {isLoading ? 'Deleting...' : 'Delete All Properties'}
            </button>
          </div>
        )}

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

              <h2>Property Details</h2>

              {isLoadingDetails && <p>Loading details...</p>}

              {detailsError && (
                <div style={{ color: 'red' }}>
                  <p><strong>Error:</strong></p>
                  <p>{detailsError}</p>
                </div>
              )}

              {selectedHouseDetails && (
                <div>
                  <div style={{ marginBottom: '16px' }}>
                    <strong>Address:</strong>
                    <p>{selectedHouseDetails.address1}, {selectedHouseDetails.address2}</p>
                  </div>

                  {selectedHouseDetails.beds && (
                    <div style={{ marginBottom: '12px' }}>
                      <strong>Bedrooms:</strong> {selectedHouseDetails.beds}
                    </div>
                  )}

                  {selectedHouseDetails.bathsTotal && (
                    <div style={{ marginBottom: '12px' }}>
                      <strong>Bathrooms:</strong> {selectedHouseDetails.bathsTotal}
                    </div>
                  )}

                  {selectedHouseDetails.roomsTotal && (
                    <div style={{ marginBottom: '12px' }}>
                      <strong>Total Rooms:</strong> {selectedHouseDetails.roomsTotal}
                    </div>
                  )}

                  {selectedHouseDetails.avmValue && (
                    <div style={{ marginBottom: '12px' }}>
                      <strong>Estimated Value:</strong> ${selectedHouseDetails.avmValue.toLocaleString('en-US')}
                    </div>
                  )}

                  {selectedHouseDetails.crimeIndex !== undefined && (
                    <div style={{ marginBottom: '12px' }}>
                      <strong>Crime Index:</strong> {selectedHouseDetails.crimeIndex}
                    </div>
                  )}

                  {selectedHouseDetails.attomId && (
                    <div style={{ marginBottom: '12px' }}>
                      <strong>ATTOM ID:</strong> {selectedHouseDetails.attomId}
                    </div>
                  )}

                  {selectedHouseDetails.geoIdV4 && (
                    <div style={{ marginBottom: '12px' }}>
                      <strong>Geo ID:</strong> {selectedHouseDetails.geoIdV4}
                    </div>
                  )}

                  {selectedHouseDetails.schoolsJson && (
                    <div style={{ marginBottom: '12px' }}>
                      <strong>Schools Data:</strong>
                      <pre style={{
                        backgroundColor: '#f5f5f5',
                        padding: '12px',
                        borderRadius: '4px',
                        overflow: 'auto',
                        fontSize: '12px'
                      }}>
                        {JSON.stringify(JSON.parse(selectedHouseDetails.schoolsJson), null, 2)}
                      </pre>
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
                    fontSize: '16px'
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
