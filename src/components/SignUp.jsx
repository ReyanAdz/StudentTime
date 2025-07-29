import React, { useState } from 'react';
import { auth } from '../firebase/firebase-config';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useNavigate, Link } from 'react-router-dom';

function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      // (Optional) store name in Firestore here later
      navigate('/calendar');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-page">
    <div className="auth-card signup">
      <h2><i className="fa fa-user-circle" /> Create account!</h2>
      <form onSubmit={handleSignup}>
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
        <button type="submit">Create →</button>
        {error && <p className="error-text">{error}</p>}
      </form>
      <div className="social-login">
        <p>Alternate Sign In Methods: TO BE ADDED</p>
        <div className="social-icons">
          <i className="fa fa-facebook" />
          <i className="fa fa-twitter" />
          <i className="fa fa-pinterest" />
        </div>
      </div>
      <p className="auth-switch">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </div>
    </div>
  );
}

export default Signup;
