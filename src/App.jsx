import React, { useState } from "react";
import Home from "./components/home";

function App() {
  const [events, setEvents] = useState([]);
  return <Home events={events} setEvents={setEvents} />;
}

export default App;
