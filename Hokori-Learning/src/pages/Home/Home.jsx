// src/pages/Home/Home.jsx
import React from "react";
import Banner from "../Home/components/Banner/banner";
import CourseLevel from "../Home/components/CourseLevels/courselevels";
import Features from "../Home/components/Features/features";
import Courses from "../Home/components/Courses/courses";
import { motion } from "framer-motion";
import { Faqs } from "../Home/components/Faqs/Faqs";
import ScrollToTopButton from "../../components/SrcollToTopButton/ScrollToTopButton";
import AiPackageIntro from "./components/AiPackageIntro/AiPackageIntro";

import { useDispatch } from "react-redux";
import { openModal } from "../../redux/features/aiPackageSlice";

import AiPackageModal from "../AiPackage/components/AiPackageModal";

const Home = () => {
  const dispatch = useDispatch();

  const handleOpenModal = () => {
    dispatch(openModal());
  };

  const anim = {
    initial: { opacity: 0, y: 5 },
    whileInView: { opacity: 1, y: 0 },
    transition: { type: "spring", stiffness: 60, damping: 20 },
    viewport: { once: false, amount: 0.4 },
  };

  return (
    <div className="home-container">
      <Banner />

      <motion.div {...anim}>
        <Features />
      </motion.div>

      {/* Nút KHÁM PHÁ AI → mở modal qua Redux */}
      <AiPackageIntro onOpenModal={handleOpenModal} />

      <motion.div {...anim}>
        <CourseLevel />
      </motion.div>

      <motion.div {...anim}>
        <Courses />
      </motion.div>

      <motion.div {...anim}>
        <Faqs />
        <ScrollToTopButton />
      </motion.div>

      {/* luôn render modal để Redux điều khiển show/hide */}
      <AiPackageModal />
    </div>
  );
};

export default Home;
