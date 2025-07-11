import React from "react";
import Navbar from "./Navbar";
import HeroSection from "./HeroSection";
import AboutSection from "./AboutSection";
import Footer from "./Footer";


function Home() {
  return (
    <div className="home">
      <Navbar />
      <HeroSection />
      <AboutSection />
      <Footer />
    </div>
  );
}

export default Home;
