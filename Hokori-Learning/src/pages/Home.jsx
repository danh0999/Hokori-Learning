import React from "react";
import Banner from "../components/Banner/banner";
import CourseLevel from "../components/CourseLevels/courselevels";
import Features from "../components/Features/features";
import Courses from "../components/Courses/courses";
// eslint-disable-next-line no-unused-vars
import { motion, useAnimation } from "framer-motion";
import { Faqs } from "../components/Faqs/Faqs";

const Home = () => {
  return (
    <div className="home-container">
      <div>
        <Banner />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{
          opacity: 1,
          y: 0,
          transition: {
            type: "spring",
            stiffness: 60,
            damping: 20,
          },
        }}
        viewport={{ once: false, amount: 0.4 }}
      >
        <Features />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{
          opacity: 1,
          y: 0,
          transition: {
            type: "spring",
            stiffness: 60,
            damping: 20,
          },
        }}
        viewport={{ once: false, amount: 0.4 }}
      >
        <CourseLevel />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{
          opacity: 1,
          y: 0,
          transition: {
            type: "spring",
            stiffness: 60,
            damping: 20,
          },
        }}
        viewport={{ once: false, amount: 0.4 }}
      >
        <Courses />
        <Faqs />
      </motion.div>

    </div>
  );
};

export default Home;
