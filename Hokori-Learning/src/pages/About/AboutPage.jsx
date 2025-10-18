import React from "react";
import HeroBanner from "./components/HeroBanner";
import Introduction from "./components/Introduction";
import CoreValues from "./components/CoreValues";
import MissionVision from "./components/MissionVision";

import CTASection from "./components/CTASection";

const AboutPage = () => {
  return (
    <>
      {/* <HeroBanner /> */}
      <Introduction />
      <CoreValues />
      <MissionVision />
    
      <CTASection />
    </>
  );
};

export default AboutPage;
