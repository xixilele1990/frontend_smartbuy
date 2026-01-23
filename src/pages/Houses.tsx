import { Link } from 'react-router-dom';
import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import type { House } from '../types';

// Example properties for demonstration
const exampleHouses: House[] = [
  { address: '123 Oak Street', bedrooms: 3, bathrooms: 2, squareFeet: 1800 },
  { address: '456 Maple Avenue', bedrooms: 4, bathrooms: 2.5, squareFeet: 2200 },
  { address: '789 Pine Road', bedrooms: 3, bathrooms: 1.5, squareFeet: 1600 }
];

const initialHouseForm: House = {
  address: '',
  bedrooms: 3,
  bathrooms: 2,
  squareFeet: 1800
};

function Houses() {
  const [formData, setFormData] = useState<House>(initialHouseForm);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const savedData = localStorage.getItem('userHouses');
  const userHouses: House[] = savedData ? JSON.parse(savedData) : [];
  const houses = userHouses.length > 0 ? userHouses : exampleHouses;

  const handleTextChange = (field: keyof House) => (event: ChangeEvent<HTMLInputElement>) => {
    setSaveMessage(null);
    setFormData((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleNumberChange = (field: keyof House) => (event: ChangeEvent<HTMLInputElement>) => {
    const numericValue = Number(event.target.value);
    setSaveMessage(null);
    setFormData((prev) => ({ ...prev, [field]: Number.isNaN(numericValue) ? 0 : numericValue }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formData.address.trim()) {
      setSaveMessage('Please enter a property address.');
      return;
    }
    const updatedHouses = [...userHouses, formData];
    localStorage.setItem('userHouses', JSON.stringify(updatedHouses));
    setSaveMessage('Property added successfully.');
    setFormData(initialHouseForm);
    // Force re-render by reading fresh data
    window.dispatchEvent(new Event('storage'));
  };

  const handleDeleteHouse = (index: number) => {
    if (window.confirm('Are you sure you want to delete this property?')) {
      const updatedHouses = userHouses.filter((_, i) => i !== index);
      localStorage.setItem('userHouses', JSON.stringify(updatedHouses));
      setSaveMessage('Property deleted successfully.');
      window.dispatchEvent(new Event('storage'));
    }
  };

  const handleDeleteAll = () => {
    if (window.confirm('Are you sure you want to delete all properties? This action cannot be undone.')) {
      localStorage.removeItem('userHouses');
      setSaveMessage('All properties deleted successfully.');
      setFormData(initialHouseForm);
      window.dispatchEvent(new Event('storage'));
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
            />
          </div>

          <div>
            <label htmlFor="bedrooms">Bedrooms</label>
            <input
              id="bedrooms"
              name="bedrooms"
              type="number"
              min={0}
              step={1}
              value={formData.bedrooms}
              onChange={handleNumberChange('bedrooms')}
            />
          </div>

          <div>
            <label htmlFor="bathrooms">Bathrooms</label>
            <input
              id="bathrooms"
              name="bathrooms"
              type="number"
              min={0}
              step={0.5}
              value={formData.bathrooms}
              onChange={handleNumberChange('bathrooms')}
            />
          </div>

          <div>
            <label htmlFor="squareFeet">Square Feet</label>
            <input
              id="squareFeet"
              name="squareFeet"
              type="number"
              min={0}
              step={100}
              value={formData.squareFeet}
              onChange={handleNumberChange('squareFeet')}
            />
          </div>

          <button type="submit">Add Property</button>
        </form>

        {saveMessage ? <p>{saveMessage}</p> : null}
      </div>

      <div>
        <h2>Properties List</h2>
        {userHouses.length === 0 ? (
          <p><em>Example data</em></p>
        ) : null}
        <ul>
          {houses.map((house, index) => (
            <li key={index}>
              <strong>{house.address}</strong> - {house.bedrooms} bed, {house.bathrooms} bath, {house.squareFeet} sqft
              {userHouses.length > 0 && (
                <button type="button" onClick={() => handleDeleteHouse(index)} style={{ marginLeft: '10px' }}>
                  Delete
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>

      {userHouses.length > 0 && (
        <div>
          <button type="button" onClick={handleDeleteAll}>Delete All Properties</button>
        </div>
      )}
    </div>
  );
}

export default Houses;
