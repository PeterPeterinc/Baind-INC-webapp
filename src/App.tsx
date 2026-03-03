import React, { useState } from 'react';
import Login from './Login';
import './App.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const colleagues = ['Dennis', 'Jasper', 'Sander', 'Peter'];

  const handleLogin = (username: string, password: string) => {
    // Simple authentication - replace with real authentication later
    if (username && password) {
      setIsLoggedIn(true);
    }
  };

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }
  
  return (
    <div className="App">
      <header className="App-header">
        <h1>INC Beschikbaarheid Dashboard</h1>
      </header>
      <section className="App-section">
        <h2>Colleagues</h2>
        <ul>
          {colleagues.map(colleague => (
            <li key={colleague}>{colleague}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export default App;