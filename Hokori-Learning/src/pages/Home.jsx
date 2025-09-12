import React from "react";
import Banner from "../layouts/components/Banner/banner";
import CourseLevel from "../layouts/components/CourseLevels/courselevels";

const Home = () => {
  return (
    <div className="home-container">
      <div>
        <Banner />
      </div>
      <div>
        <CourseLevel />
      </div>
    </div>
  );
};

export default Home;
