import React from "react";
import { auth } from "../firebase/firebase-config";
import CalendarView from "./CalendarView";
import Navbar from "./Navbar";
import Footer from "./Footer";

function Dashboard({ events, setEvents }) {
  const rawName = auth.currentUser?.displayName || "Student";
  const displayName = rawName.charAt(0).toUpperCase() + rawName.slice(1);

  return (
    <>
      <Navbar />
      <div className="calendar-page">
        <div className="dashboard-container">
          {/* Greeting Header Section */}
          <div className="dashboard-header">
            <h1>Welcome, {displayName}!</h1>
          </div>

          {/* Calendar */}
          <div style={{ marginBottom: "2rem" }}>
            <CalendarView events={events} setEvents={setEvents} />
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default Dashboard;
