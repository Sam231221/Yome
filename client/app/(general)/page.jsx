import React from "react";

import HeroSection from "./components/Hero-Section/HeroSection";
import TextBox from "./components/TextBox/TextBox";
import Courses from "./components/Courses-section/Courses";
import SecurityCompliance from "./components/SecurityCompliance/SecurityCompliance";
import Footer from "./components/Footer/Footer";
import Brands from "./components/Brands/Brands";
export default function LandingPage() {
  return (
    <>
      <HeroSection />
      <TextBox />
      <Courses />
      <SecurityCompliance />
      <Brands />
      <Footer />
    </>
  );
}
