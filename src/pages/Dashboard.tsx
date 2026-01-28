import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import type { UserProfile, House } from '../types';
import { getProfile } from '../services/profileService';

function Dashboard() {
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // Load profile from backend API
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await getProfile();
        setProfile(data);
      } catch (error) {
        console.error('Failed to load profile:', error);
        setProfile(null);
      }
    };

    loadProfile();
  }, []);

  const exampleHouses: House[] = [
    { address: '123 Oak Street', bedrooms: 3, bathrooms: 2, squareFeet: 1800 },
    { address: '456 Maple Avenue', bedrooms: 4, bathrooms: 2.5, squareFeet: 2200 },
    { address: '789 Pine Road', bedrooms: 3, bathrooms: 1.5, squareFeet: 1600 }
  ];

  const savedHouses = localStorage.getItem('userHouses');
  const userHouses: House[] = savedHouses ? JSON.parse(savedHouses) : [];
  const houses = userHouses.length > 0 ? userHouses : exampleHouses;

  const exampleProperties = [
    { address: '123 Oak Street', score: 85 },
    { address: '456 Maple Avenue', score: 92 },
    { address: '789 Pine Road', score: 78 }
  ].sort((a, b) => b.score - a.score); // Sort by score descending

  return (
    <div>
      <h1>SmartBuy Dashboard</h1>
      <p>Welcome to SmartBuy ： Your Home Buying Decision Support System</p>

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
          <p>
            <Link to="/profile">
              <button>Edit Profile</button>
            </Link>
          </p>

          <div>
            <h3>Your Properties</h3>
            {userHouses.length === 0 ? (
              <p><em>Example data</em></p>
            ) : null}
            <ul>
              {houses.map((house, index) => (
                <li key={index}>
                  <strong>{house.address}</strong> - {house.bedrooms} bed, {house.bathrooms} bath, {house.squareFeet} sqft
                </li>
              ))}
            </ul>
            <Link to="/houses">
              <button>Go to Houses</button>
            </Link>
          </div>

          <div>
            <h3>Example SmartScore Rankings</h3>
            <ol>
              {exampleProperties.map((property, index) => (
                <li key={index}>
                  <strong>{property.address}</strong> - Score: <strong>{property.score}/100</strong>
                  {' '}
                  <button type="button" onClick={() => {}}>Show Details</button>
                </li>
              ))}
            </ol>
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
