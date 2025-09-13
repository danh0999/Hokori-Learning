import React from "react";
import Banner from "../components/Banner/banner";
import CourseLevel from "../components/CourseLevels/courselevels";
import Features from "../components/Features/features";
import Courses from "../components/Courses/courses";

const Home = () => {
  return (
    <div className="home-container">
      <div>
        <Banner />
      </div>
      <div>
        <Features />
      </div>
      <div>
        <CourseLevel />
      </div>
      <div>
        <Courses />
      </div>
    </div>
  );
};

export default Home;
