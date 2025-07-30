// src/components/UserInfo.jsx
import { auth } from '../firebase/firebase-config';
import { useEffect, useState } from 'react';

function UserInfo() {
  const [userEmail, setUserEmail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserEmail(user.email);
      } else {
        setUserEmail(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      alert("Logged out!");
      window.location.href = '/';
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  if (loading || !userEmail) return null;

  return (
    <div className="user-info-box">
      <p>{auth.currentUser?.displayName || "Anonymous"}</p>
      <button onClick={handleLogout} style={{ marginTop: '5px' }}>Log Out</button>
    </div>
  );
}

export default UserInfo;
