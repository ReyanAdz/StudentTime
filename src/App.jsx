// src/App.jsx
import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Landing from './components/Landing';
import SignUp from './components/SignUp';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Finance from './components/Finance';
import UserInfo from './components/UserInfo';
import GetStarted from './components/GetStarted';

function App() {
  const location = useLocation();
  const hideUI = ['/', '/login', '/signup'].includes(location.pathname);

  return (
    <>
      {!hideUI && <UserInfo />}
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />
        <Route path="/calendar" element={<Dashboard />} />
        <Route path="/finance" element={<Finance />} />
        <Route path="/start" element={<GetStarted />} />
      </Routes>
    </>
  );
}

export default App;
