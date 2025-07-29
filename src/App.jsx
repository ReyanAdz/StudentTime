// src/App.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Landing from './components/Landing';
import SignUp from './components/SignUp';
import Login from './components/Login';
import CalendarView from './components/CalendarView';
import Finance from './components/Finance';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/login" element={<Login />} />
      <Route path="/calendar" element={<CalendarView />} />
      <Route path="/finance" element={<Finance />} />
    </Routes>
  );
}

export default App;
