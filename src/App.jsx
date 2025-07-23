import React, { useState } from "react";
import Dashboard from "./components/Dashboard"; // ✅ use Dashboard, NOT Home

function App() {
  const [events, setEvents] = useState([]);
  return <Dashboard events={events} setEvents={setEvents} />;
}

export default App;
