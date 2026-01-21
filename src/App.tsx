// No styles imported for minimal Day1 setup

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>🏠 SmartBuy</h1>
        <p>Home Buyer Decision Support System</p>
      </header>
      
      <main className="app-main">
        <div className="welcome-card">
          <h2>Welcome to SmartBuy!</h2>
          <p>This is the frontend starter template for the SmartBuy project.</p>
          
          <div className="next-steps">
            <h3>Next Steps:</h3>
            <ol>
              <li>Set up routing with React Router</li>
              <li>Create the Profile Setup page</li>
              <li>Build the Houses List page</li>
              <li>Implement the House Detail view</li>
              <li>Connect to the backend API</li>
            </ol>
          </div>
          
          <div className="resources">
            <h3>Resources:</h3>
            <ul>
              <li>📁 Types defined in <code>src/types/</code></li>
              <li>🔌 API service in <code>src/services/api.ts</code></li>
              <li>📋 Project proposal in team docs</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
