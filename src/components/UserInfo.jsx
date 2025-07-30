// src/components/UserInfo.jsx
import { auth } from '../firebase/firebase-config';
import { useEffect, useState } from 'react';

function UserInfo() {
  const [userEmail, setUserEmail] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserEmail(user.email);
      } else {
        setUserEmail(null);
      }
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

  return (
    <div style={{
      position: 'absolute',
      top: 10,
      right: 10,
      backgroundColor: '#f3f4f6',
      padding: '10px 15px',
      borderRadius: '10px',
      boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
      zIndex: 1000
    }}>
      {userEmail ? (
        <>
          <p style={{ margin: 0 }}>👤 {userEmail}</p>
          <button onClick={handleLogout} style={{ marginTop: '5px' }}>Log Out</button>
        </>
      ) : (
        <p style={{ margin: 0 }}>Not logged in</p>
      )}
    </div>
  );
}

export default UserInfo;
