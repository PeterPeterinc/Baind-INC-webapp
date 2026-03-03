import React, { useState } from 'react';
import Image from 'next/image';
import './Login.css';

interface LoginProps {
  onLogin: (username: string, password: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Vul alle velden in');
      return;
    }
    setError('');
    onLogin(username, password);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <Image src="/inc-logo.png" alt="INC Logo" width={64} height={64} className="login-logo" />
          <h1>Welkom bij je INC chat</h1>
          <p className="login-subtitle">Baind</p>
        </div>
        <form className="login-form" onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}
          <div className="form-group">
            <label htmlFor="username">Gebruikersnaam</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Voer je gebruikersnaam in"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Wachtwoord</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Voer je wachtwoord in"
            />
          </div>
          <button type="submit" className="login-button">
            Inloggen
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;