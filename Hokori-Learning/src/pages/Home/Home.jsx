import React, { useState } from "react";
import Banner from "../Home/components/Banner/banner";
import CourseLevel from "../Home/components/CourseLevels/courselevels";
import Features from "../Home/components/Features/features";
import Courses from "../Home/components/Courses/courses";
import { motion } from "framer-motion";
import { Faqs } from "../Home/components/Faqs/Faqs";
import ScrollToTopButton from "../../components/SrcollToTopButton/ScrollToTopButton";
import AiPackageIntro from "./components/AiPackageIntro/AiPackageIntro";

import AiPackageModal from "../LearnerDashboard/components/AiPackageModal";

const Home = () => {
  const [showAiModal, setShowAiModal] = useState(false);

  return (
    <div className="home-container">
      <div>
        <Banner />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 5 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 60, damping: 20 }}
        viewport={{ once: false, amount: 0.4 }}
      >
        <Features />
      </motion.div>

      <AiPackageIntro onOpenModal={() => setShowAiModal(true)} />

      <motion.div
        initial={{ opacity: 0, y: 5 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 60, damping: 20 }}
        viewport={{ once: false, amount: 0.4 }}
      >
        <CourseLevel />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 5 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 60, damping: 20 }}
        viewport={{ once: false, amount: 0.4 }}
      >
        <Courses />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 5 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 60, damping: 20 }}
        viewport={{ once: false, amount: 0.4 }}
      >
        <Faqs />
        <ScrollToTopButton />
      </motion.div>

      {/* render modal */}
      {showAiModal && (
        <AiPackageModal
          onClose={() => setShowAiModal(false)}
          onSelect={(id) => {
            console.log("Selected Package:", id);
            setShowAiModal(false);
          }}
        />
      )}
    </div>
  );
};

export default Home;
