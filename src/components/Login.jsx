// src/components/Login.jsx
import React, { useState } from 'react';
import { auth } from '../firebase/firebase-config';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate, Link } from 'react-router-dom';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/calendar');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-side">
          <h2>Welcome Back 👋</h2>
          <p>Log in to manage your schedule and budget with ease.</p>
        </div>
        <div className="auth-form">
          <h2>Log In</h2>
          <form onSubmit={handleLogin}>
            <input 
              type="email" 
              placeholder="E-mail" 
              onChange={(e) => setEmail(e.target.value)} 
              value={email}
              required 
            />
            <input 
              type="password" 
              placeholder="Password" 
              onChange={(e) => setPassword(e.target.value)} 
              value={password}
              required 
            />
            <button type="submit">Log In →</button>
            {error && <p className="error-text">{error}</p>}
          </form>
          <p className="auth-switch">
            Don’t have an account? <Link to="/signup">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
