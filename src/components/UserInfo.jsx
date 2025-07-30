// src/components/UserInfo.jsx
import { auth } from '../firebase/firebase-config';
import { useEffect, useState } from 'react';

function UserInfo() {
  const [userEmail, setUserEmail] = useState(null);
  const [loading, setLoading] = useState(true); // track if auth is still loading

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserEmail(user.email);
      } else {
        setUserEmail(null);
      }
      setLoading(false); // done loading after this fires
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      alert("Logged out!");
      window.location.href = '/'; // Optional: go to login screen after logout
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  // 🔒 Don't show anything if we're loading or not logged in
  if (loading || !userEmail) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 10,
      right: 10,
      backgroundColor: '#f3f4f6',
      padding: '10px 15px',
      borderRadius: '10px',
      boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
      zIndex: 1000
    }}>
      <p style={{ margin: 0 }}>👤 {userEmail}</p>
      <button onClick={handleLogout} style={{ marginTop: '5px' }}>Log Out</button>
    </div>
  );
}

export default UserInfo;
