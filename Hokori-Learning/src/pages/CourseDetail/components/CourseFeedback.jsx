import { useEffect, useState } from "react";
import api from "../../../configs/axios.js";
import "../CourseDetail.scss";

const CourseFeedback = ({ courseId }) => {
  const [reviews, setReviews] = useState([]);
  //eslint-disable-next-line
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    if (!courseId) return;

    const fetchFeedback = async () => {
      try {
        const res = await api.get(`/courses/${courseId}/feedbacks`);
        setReviews(res.data.data || []);
      } catch (e) {
        console.error("Error loading feedback", e);
      }
    };

    const fetchSummary = async () => {
      try {
        const res = await api.get(`/courses/${courseId}/feedbacks/summary`);
        setSummary(res.data.data);
      } catch (e) {
        console.error("Error loading summary", e);
      }
    };

    fetchFeedback();
    fetchSummary();
  }, [courseId]);

  return (
    <section className="feedback-section">
      <div className="container">
        <h2>Đánh giá từ học viên</h2>

        <div className="reviews">
          {reviews.length === 0 ? (
            <p>Chưa có đánh giá nào</p>
          ) : (
            reviews.map((fb) => (
              <div key={fb.id} className="review">
                <img src={fb.learnerAvatarUrl} alt="" />
                <div>
                  <p>
                    <b>{fb.learnerName}</b>
                  </p>
                  <p>⭐ {fb.rating}</p>
                  <p>{fb.comment}</p>
                  <span>{new Date(fb.createdAt).toLocaleString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
};

export default CourseFeedback;
