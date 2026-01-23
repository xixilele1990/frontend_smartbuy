import { Link } from 'react-router-dom';
import type { UserProfile } from '../types';

function Dashboard() {
  const savedData = localStorage.getItem('userProfile');
  const profile: UserProfile | null = savedData ? JSON.parse(savedData) : null;

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
            <Link to="/profile">Edit Profile</Link>
          </p>
        </div>
      ) : (
        <div>
          <h2>Get Started</h2>
          <p>
            <Link to="/profile">Set up your profile</Link> to customize your home buying preferences.
          </p>
        </div>
      )}

      <div>
        <h2>Next Steps:</h2>
        <ol>
          <li>Set up your buyer profile (budget, bedrooms, priorities)</li>
          <li>Add properties you're considering</li>
          <li>View SmartScore rankings</li>
          <li>Compare properties side-by-side</li>
        </ol>
      </div>
    </div>
  );
}

export default Dashboard;
