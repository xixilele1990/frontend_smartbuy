import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import type { House } from '../types';
import { addHouse } from '../services/houseService';

const initialHouseForm: House = {
  address: ''
};

function Houses() {
  const [formData, setFormData] = useState<House>(initialHouseForm);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [userHouses, setUserHouses] = useState<House[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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
    if (window.confirm('Are you sure you want to delete this property?')) {
      const updatedHouses = userHouses.filter((_, i) => i !== index);
      setUserHouses(updatedHouses);
      setSaveMessage('Property deleted successfully.');
    }
  };

  const handleDeleteAll = () => {
    if (window.confirm('Are you sure you want to delete all properties? This action cannot be undone.')) {
      setUserHouses([]);
      setSaveMessage('All properties deleted successfully.');
      setFormData(initialHouseForm);
    }
  };

  return (
    <div>
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
    </div>
  );
}

export default Houses;
