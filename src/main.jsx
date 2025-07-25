import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import App from './App'; // Home dashboard
import Finance from './components/Finance'; 
import Landing from './components/Landing';
import './styles/main.css';
import CalendarView from './components/CalendarView';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<Landing />}/>
        <Route path="/calendar" element={<CalendarView />} />
        <Route path="/finance" element={<Finance />} />
      </Routes>
    </Router>
  </React.StrictMode>
);
