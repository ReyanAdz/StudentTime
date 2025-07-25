import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Landing from "./components/Landing";
import Dashboard from "./components/Dashboard";

function App() {
  const [events, setEvents] = useState([]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route
          path="/calendar"
          element={<Dashboard events={events} setEvents={setEvents} />}
        />
      </Routes>
    </Router>
  );
}

export default App;
