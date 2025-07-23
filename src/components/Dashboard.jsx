import React from "react";
import CalendarView from "./CalendarView";
import Navbar from "./Navbar";
import Footer from "./Footer";

function Dashboard({ events, setEvents }) {
  return (
    <>
    <Navbar/ >
    <div className="dashboard-container" style={{ padding: "2rem", backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
      {/* Greeting */}
      <h1 style={{ fontSize: "2rem", marginBottom: "1.5rem" }}>
        👋 Hello, Student!
      </h1>

      {/* Calendar */}
      <div style={{ marginBottom: "2rem" }}>
        <CalendarView events={events} setEvents={setEvents} />
      </div>
      
    </div>
      <Footer />
    </>
  );
}

// quick inline card style
const cardStyle = {
  backgroundColor: "white",
  padding: "1.25rem",
  borderRadius: "12px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  minWidth: "250px",
  flex: "1 1 300px",
};

const cardTitle = {
  marginBottom: "0.5rem",
  fontSize: "1.25rem",
  fontWeight: "600",
};

export default Dashboard;
